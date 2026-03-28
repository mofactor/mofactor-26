/**
 * Multi-agent orchestrator.
 * Spawns a Claude Agent SDK agent per annotation, each in its own git worktree.
 */

import { execSync } from "node:child_process";
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
        append: `You are an autonomous agent working on a specific annotation. Work silently and commit your changes when done. Do not ask questions — just implement what was requested.

IMPORTANT: Do NOT use any editor-annotations MCP tools (editor_watch, editor_acknowledge, editor_reply, editor_resolve, editor_dismiss, editor_list_sessions, editor_get_pending). You must NOT run an annotation feedback loop. Your only job is to read the code, implement the change, and commit. The orchestrator will handle all annotation status updates.`,
      },
      settingSources: ["project"],
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

    for await (const message of generator) {
      handle.lastActivity = Date.now();

      if (message.type === "assistant") {
        handle.turnsUsed++;
        // Extract text from assistant message
        const textBlocks = (message.message.content as Array<{ type: string; text?: string }>)
          .filter((b) => b.type === "text" && b.text)
          .map((b) => b.text!);
        if (textBlocks.length > 0) {
          const snippet = textBlocks.join(" ").slice(0, 200);
          eventBus.emit("agent.progress", handle.sessionId, {
            agentId: handle.agentId,
            annotationId: handle.annotationId,
            type: "assistant",
            snippet,
            turnNumber: handle.turnsUsed,
            timestamp: Date.now(),
          });
        }
      } else if (message.type === "tool_use_summary") {
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

          updateAnnotationAgent(handle.annotationId, {
            agentStatus: "done",
            agentSummary: handle.summary,
            agentBranch: handle.branchName,
          });

          // Resolve annotation + post summary
          updateAnnotation(handle.annotationId, {
            status: "resolved",
            resolvedBy: `agent:${handle.agentId}`,
          });
          addThreadMessage(handle.annotationId, "agent", handle.summary || "Done.");

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
