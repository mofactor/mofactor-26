/**
 * Multi-agent orchestrator.
 * Spawns a Claude Agent SDK agent per annotation, each in its own git worktree.
 */

import { execSync } from "node:child_process";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { AgentInfo, AgentStatus } from "./agent-types.js";
import { buildAgentPrompt, buildFollowUpPrompt } from "./prompt.js";
import {
  eventBus,
  getAnnotation,
  updateAnnotation,
  updateAnnotationAgent,
  addThreadMessage,
  type ServerAnnotation,
  type StoreEvent,
} from "./store.js";

// =============================================================================
// Agent handle (internal, extends public AgentInfo with runtime objects)
// =============================================================================

interface AgentHandle extends AgentInfo {
  abortController: AbortController;
}

// =============================================================================
// Registry
// =============================================================================

const agents = new Map<string, AgentHandle>();
const annotationToAgent = new Map<string, string>(); // annotationId → agentId

let projectCwd = process.cwd();
let startedAt = 0;
const MAX_CONCURRENT = 6;
const MAX_TURNS = 50;

// =============================================================================
// Public accessors
// =============================================================================

export function getAllAgents(): AgentInfo[] {
  return Array.from(agents.values()).map(toPublic);
}

export function getAgent(agentId: string): AgentInfo | null {
  const h = agents.get(agentId);
  return h ? toPublic(h) : null;
}

export function getAgentForAnnotation(annotationId: string): AgentInfo | null {
  const agentId = annotationToAgent.get(annotationId);
  if (!agentId) return null;
  return getAgent(agentId);
}

function toPublic(h: AgentHandle): AgentInfo {
  const { abortController: _, ...info } = h;
  return info;
}

// =============================================================================
// Worktree helpers
// =============================================================================

function createWorktree(branchName: string): string {
  const worktreeDir = path.join(projectCwd, ".claude", "worktrees", branchName);
  execSync(`git worktree add -b "${branchName}" "${worktreeDir}" HEAD`, {
    cwd: projectCwd,
    stdio: "pipe",
  });

  // Copy uncommitted changes from main working directory into the worktree
  // so agents see the current state, not the last commit
  try {
    const modified = execSync("git diff --name-only", {
      cwd: projectCwd,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
    if (modified) {
      for (const file of modified.split("\n").filter(Boolean)) {
        const src = path.join(projectCwd, file);
        const dest = path.join(worktreeDir, file);
        if (existsSync(src)) {
          mkdirSync(path.dirname(dest), { recursive: true });
          copyFileSync(src, dest);
        }
      }
      console.error(`[orchestrator] Synced ${modified.split("\n").filter(Boolean).length} modified file(s) into worktree`);
    }
  } catch { /* non-critical — agent will work from HEAD */ }

  return worktreeDir;
}

function removeWorktree(worktreePath: string, branchName: string): void {
  try {
    execSync(`git worktree remove "${worktreePath}" --force`, {
      cwd: projectCwd,
      stdio: "pipe",
    });
  } catch { /* may already be removed */ }
  try {
    execSync(`git branch -D "${branchName}"`, {
      cwd: projectCwd,
      stdio: "pipe",
    });
  } catch { /* may already be removed */ }
}

/**
 * Copy changed files from the agent worktree back to the main project directory.
 * Returns list of files applied, or null if nothing changed.
 */
function applyWorktreeChanges(worktreePath: string): string[] | null {
  if (!existsSync(worktreePath)) {
    console.error(`[orchestrator] Worktree already removed: ${worktreePath}`);
    return null;
  }

  // Get list of files changed relative to HEAD (the base commit)
  let changed: string;
  try {
    changed = execSync("git diff HEAD --name-only", {
      cwd: worktreePath,
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
  } catch {
    console.error(`[orchestrator] Could not diff worktree (may be gone): ${worktreePath}`);
    return null;
  }

  if (!changed) return null;

  const files = changed.split("\n").filter(Boolean);
  for (const file of files) {
    const src = path.join(worktreePath, file);
    const dest = path.join(projectCwd, file);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }

  console.error(`[orchestrator] Applied ${files.length} file(s) to working directory: ${files.join(", ")}`);
  return files;
}

// =============================================================================
// Agent spawning
// =============================================================================

function generateAgentId(): string {
  return `agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function activeCount(): number {
  let count = 0;
  for (const h of agents.values()) {
    if (h.status === "spawning" || h.status === "working") count++;
  }
  return count;
}

export function spawnAgent(
  annotationId: string,
  sessionId: string,
  annotation: ServerAnnotation,
  mode: "initial" | "followup" = "initial",
  followUpContent?: string
): string {
  if (activeCount() >= MAX_CONCURRENT) {
    console.error(`[orchestrator] Max concurrent agents (${MAX_CONCURRENT}) reached, skipping`);
    return "";
  }

  const agentId = generateAgentId();
  const branchName = `agent/${annotationId.replace(/[^a-zA-Z0-9-]/g, "-")}`;
  const abortController = new AbortController();

  // Remove previous worktree if re-spawning
  const prevAgentId = annotationToAgent.get(annotationId);
  if (prevAgentId) {
    const prev = agents.get(prevAgentId);
    if (prev) {
      try { removeWorktree(prev.worktreePath, prev.branchName); } catch { /* ok */ }
      agents.delete(prevAgentId);
    }
  }

  let worktreePath: string;
  try {
    worktreePath = createWorktree(branchName);
  } catch (err) {
    // Branch/worktree may already exist from a previous run — clean and retry
    try {
      const fallbackPath = path.join(projectCwd, ".claude", "worktrees", branchName);
      removeWorktree(fallbackPath, branchName);
      worktreePath = createWorktree(branchName);
    } catch (retryErr) {
      console.error(`[orchestrator] Failed to create worktree:`, retryErr);
      return "";
    }
  }

  const handle: AgentHandle = {
    agentId,
    annotationId,
    sessionId,
    status: "spawning",
    branchName,
    worktreePath,
    model: "claude-sonnet-4-6",
    startedAt: Date.now(),
    turnsUsed: 0,
    lastActivity: Date.now(),
    abortController,
  };

  agents.set(agentId, handle);
  annotationToAgent.set(annotationId, agentId);

  // Update store
  updateAnnotationAgent(annotationId, {
    agentId,
    agentStatus: "spawning",
    agentBranch: branchName,
  });

  console.error(`[orchestrator] Spawning agent ${agentId} for annotation ${annotationId} (${mode})`);

  // Build prompt
  const prompt =
    mode === "followup" && followUpContent
      ? buildFollowUpPrompt(annotation, followUpContent)
      : buildAgentPrompt(annotation);

  // Spawn the SDK query
  const q = query({
    prompt,
    options: {
      cwd: worktreePath,
      model: "claude-sonnet-4-6",
      maxTurns: MAX_TURNS,
      abortController,
      permissionMode: "acceptEdits",
      allowDangerouslySkipPermissions: true,
      tools: { type: "preset", preset: "claude_code" },
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: `You are an autonomous agent working on a specific annotation. Work silently — read the source, edit the file, then stop. Do not ask questions — just implement what was requested.

CRITICAL: Do NOT run any git commands (git add, git commit, git push, etc). Do NOT use any editor-annotations MCP tools. Your ONLY job is to read the code, edit the file, and stop. The orchestrator handles everything else.`,
      },
      settingSources: [],
      persistSession: false,
    },
  });

  // Process in background
  processAgentStream(handle, q).catch((err) => {
    console.error(`[orchestrator] Agent ${agentId} stream error:`, err);
  });

  return agentId;
}

// =============================================================================
// Stream processor
// =============================================================================

async function processAgentStream(
  handle: AgentHandle,
  generator: AsyncGenerator<SDKMessage, void>
): Promise<void> {
  try {
    handle.status = "working";
    handle.lastActivity = Date.now();
    updateAnnotationAgent(handle.annotationId, { agentStatus: "working" });
    updateAnnotation(handle.annotationId, { status: "acknowledged" });
    addThreadMessage(handle.annotationId, "agent", "Looking at the code...");

    for await (const message of generator) {
      handle.lastActivity = Date.now();

      if (message.type === "assistant") {
        handle.turnsUsed++;
        // Extract text from assistant message — post to thread for live feedback
        const textBlocks = (message.message.content as Array<{ type: string; text?: string }>)
          .filter((b) => b.type === "text" && b.text)
          .map((b) => b.text!);
        if (textBlocks.length > 0) {
          const snippet = textBlocks.join(" ").slice(0, 200);
          addThreadMessage(handle.annotationId, "agent", snippet);
        }
      } else if (message.type === "tool_use_summary") {
        // Emit progress event (no thread message — assistant messages already cover it)
        eventBus.emit("agent.progress", handle.sessionId, {
          agentId: handle.agentId,
          annotationId: handle.annotationId,
          type: "tool_use",
          snippet: message.summary.slice(0, 200),
          turnNumber: handle.turnsUsed,
          timestamp: Date.now(),
        });
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          handle.status = "done";
          handle.completedAt = Date.now();
          handle.summary = message.result.slice(0, 500);

          // Apply file changes from worktree back to the main project
          try {
            const applied = applyWorktreeChanges(handle.worktreePath);
            if (applied) {
              console.error(`[orchestrator] Applied changes: ${applied.join(", ")}`);
            }
          } catch (applyErr) {
            console.error(`[orchestrator] Could not apply worktree changes (may already be cleaned up):`, applyErr);
          }

          // Clean up worktree
          try { removeWorktree(handle.worktreePath, handle.branchName); } catch { /* ok */ }

          updateAnnotationAgent(handle.annotationId, {
            agentStatus: "done",
            agentSummary: handle.summary,
            agentBranch: handle.branchName,
          });

          // Resolve annotation
          updateAnnotation(handle.annotationId, {
            status: "resolved",
            resolvedBy: `agent:${handle.agentId}`,
          });

          console.error(
            `[orchestrator] Agent ${handle.agentId} completed (${handle.turnsUsed} turns, ${message.total_cost_usd?.toFixed(4) ?? "?"} USD)`
          );
        } else {
          // Error result
          handle.status = "failed";
          handle.completedAt = Date.now();
          handle.error = message.subtype === "error_max_turns"
            ? "Max turns reached"
            : "is_error" in message && message.is_error
              ? "Agent error"
              : message.subtype;

          updateAnnotationAgent(handle.annotationId, { agentStatus: "failed" });

          console.error(`[orchestrator] Agent ${handle.agentId} failed: ${handle.error}`);
        }
      }
    }

    // If we exited the loop without a result message, mark as done
    if (handle.status === "working") {
      handle.status = "done";
      handle.completedAt = Date.now();
      updateAnnotationAgent(handle.annotationId, { agentStatus: "done" });
    }
  } catch (err: unknown) {
    if (handle.abortController.signal.aborted) {
      handle.status = "aborted";
      handle.completedAt = Date.now();
      updateAnnotationAgent(handle.annotationId, { agentStatus: "aborted" });
      console.error(`[orchestrator] Agent ${handle.agentId} aborted`);
    } else {
      handle.status = "failed";
      handle.completedAt = Date.now();
      handle.error = String(err);
      updateAnnotationAgent(handle.annotationId, { agentStatus: "failed" });
      console.error(`[orchestrator] Agent ${handle.agentId} error:`, err);
    }
  }
}

// =============================================================================
// Abort
// =============================================================================

export function abortAgent(agentId: string): boolean {
  const handle = agents.get(agentId);
  if (!handle || (handle.status !== "spawning" && handle.status !== "working")) {
    return false;
  }
  handle.abortController.abort();
  return true;
}

/** Abort all active agents and clean up worktrees. Called during shutdown. */
export function abortAllAgents(): void {
  for (const [id, handle] of agents) {
    if (handle.status === "spawning" || handle.status === "working") {
      handle.abortController.abort();
      handle.status = "aborted";
      handle.completedAt = Date.now();
      console.error(`[orchestrator] Shutdown: aborted agent ${id}`);
    }
    try { removeWorktree(handle.worktreePath, handle.branchName); } catch { /* ok */ }
  }
  agents.clear();
  annotationToAgent.clear();
}

// =============================================================================
// Follow-up reply handling
// =============================================================================

function feedReply(annotationId: string, content: string): void {
  const annotation = getAnnotation(annotationId);
  if (!annotation) return;

  const existingAgentId = annotationToAgent.get(annotationId);
  if (existingAgentId) {
    const existing = agents.get(existingAgentId);
    if (existing && (existing.status === "spawning" || existing.status === "working")) {
      // Abort current agent, respawn with follow-up context
      existing.abortController.abort();
      setTimeout(() => {
        spawnAgent(annotationId, annotation.sessionId, annotation, "followup", content);
      }, 500);
      return;
    }
  }

  // No active agent — spawn fresh with follow-up prompt
  spawnAgent(annotationId, annotation.sessionId, annotation, "followup", content);
}

// =============================================================================
// Initialization
// =============================================================================

export function initOrchestrator(config: { projectCwd: string }): void {
  projectCwd = config.projectCwd;
  startedAt = Date.now();

  // Auto-spawn on new annotations (skip stale re-synced ones)
  eventBus.subscribe((event: StoreEvent) => {
    if (event.type === "annotation.created") {
      const annotation = event.payload as ServerAnnotation;
      if (annotation.timestamp < startedAt) {
        console.error(`[orchestrator] Skipping stale annotation ${annotation.id} (created before server start)`);
        return;
      }
      if (annotation.status === "resolved" || annotation.status === "dismissed") {
        console.error(`[orchestrator] Skipping already-resolved annotation ${annotation.id}`);
        return;
      }
      spawnAgent(annotation.id, event.sessionId, annotation);
    } else if (event.type === "thread.message") {
      const payload = event.payload as { annotationId: string; message: { role: string; content: string } };
      if (payload.message.role === "user") {
        feedReply(payload.annotationId, payload.message.content);
      }
    }
  });

  console.error(`[orchestrator] Initialized (max ${MAX_CONCURRENT} concurrent agents)`);
}
