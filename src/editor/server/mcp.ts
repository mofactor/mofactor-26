/**
 * MCP protocol server on stdio for Claude Code integration.
 * Fetches annotation data from the HTTP server (single source of truth).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// =============================================================================
// HTTP client helpers (talks to our HTTP server)
// =============================================================================

let BASE_URL = "http://localhost:4747";

export function setHttpBaseUrl(url: string): void {
  BASE_URL = url;
}

async function httpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function httpPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function httpPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// =============================================================================
// Annotation formatting (for tool responses)
// =============================================================================

interface Annotation {
  id: string;
  comment: string;
  element: string;
  elementPath: string;
  sourceFile?: string;
  reactComponents?: string;
  intent?: string;
  status: string;
  cssClasses?: string;
  computedStyles?: string;
  nearbyText?: string;
  thread?: { role: string; content: string; timestamp: number }[];
  agentId?: string;
  agentStatus?: string;
  timestamp?: number;
}

/** True when orchestrator has NOT claimed this annotation (or agent failed/aborted). */
function isUnclaimed(a: Annotation): boolean {
  return !a.agentId || a.agentStatus === "failed" || a.agentStatus === "aborted";
}

function formatAnnotation(a: Annotation): string {
  const parts = [`## [${a.intent || "feedback"}] ${a.comment}`];
  parts.push(`- **Element:** ${a.element}`);
  parts.push(`- **Path:** ${a.elementPath}`);
  if (a.sourceFile) parts.push(`- **Source:** ${a.sourceFile}`);
  if (a.reactComponents) parts.push(`- **React:** ${a.reactComponents}`);
  if (a.cssClasses) parts.push(`- **Classes:** ${a.cssClasses}`);
  if (a.nearbyText) parts.push(`- **Context:** ${a.nearbyText}`);
  parts.push(`- **Status:** ${a.status}`);
  parts.push(`- **ID:** \`${a.id}\``);
  if (a.thread && a.thread.length > 0) {
    parts.push(`\n**Thread:**`);
    for (const msg of a.thread) {
      parts.push(`- [${msg.role}] ${msg.content}`);
    }
  }
  return parts.join("\n");
}

function formatReply(a: Annotation, replyContent: string): string {
  const parts = [`## [REPLY] Re: "${a.comment}"`];
  parts.push(`- **New message from user:** ${replyContent}`);
  parts.push(`- **Element:** ${a.element}`);
  parts.push(`- **Path:** ${a.elementPath}`);
  if (a.sourceFile) parts.push(`- **Source:** ${a.sourceFile}`);
  parts.push(`- **Status:** ${a.status}`);
  parts.push(`- **ID:** \`${a.id}\``);
  if (a.thread && a.thread.length > 0) {
    parts.push(`\n**Full thread:**`);
    for (const msg of a.thread) {
      parts.push(`- [${msg.role}] ${msg.content}`);
    }
  }
  return parts.join("\n");
}

interface WatchItem {
  annotation: Annotation;
  isReply: boolean;
  replyContent?: string;
}

// =============================================================================
// MCP Server
// =============================================================================

export async function startMcpServer(baseUrl?: string): Promise<void> {
  if (baseUrl) setHttpBaseUrl(baseUrl);

  const server = new McpServer({
    name: "editor-annotations",
    version: "1.0.0",
  });

  // -- List Sessions --
  server.tool(
    "editor_list_sessions",
    "List all active annotation sessions. Each session represents a page being reviewed.",
    {},
    async () => {
      const sessions = await httpGet<any[]>("/sessions");
      if (sessions.length === 0) {
        return { content: [{ type: "text", text: "No active sessions. The user hasn't started annotating yet." }] };
      }
      const text = sessions.map((s) =>
        `- **${s.url}** (${s.status}) — ID: \`${s.id}\``
      ).join("\n");
      return { content: [{ type: "text", text: `# Active Sessions\n\n${text}` }] };
    }
  );

  // -- Get Pending Annotations --
  server.tool(
    "editor_get_pending",
    "Get unresolved annotations. If sessionId is provided, scopes to that session. Otherwise returns all pending across all sessions.",
    { sessionId: z.string().optional().describe("Session ID to scope to (optional)") },
    async ({ sessionId }) => {
      const path = sessionId ? `/sessions/${sessionId}/pending` : "/pending";
      const all = await httpGet<Annotation[]>(path);
      const annotations = all.filter(isUnclaimed);
      if (annotations.length === 0) {
        return { content: [{ type: "text", text: "No pending annotations." }] };
      }
      const text = annotations.map(formatAnnotation).join("\n\n---\n\n");
      return { content: [{ type: "text", text: `# Pending Annotations (${annotations.length})\n\n${text}` }] };
    }
  );

  // -- Acknowledge --
  server.tool(
    "editor_acknowledge",
    "Mark an annotation as acknowledged (seen by agent). Use this before starting work on the feedback.",
    { annotationId: z.string().describe("The annotation ID to acknowledge") },
    async ({ annotationId }) => {
      const updated = await httpPatch<Annotation>(`/annotations/${annotationId}`, { status: "acknowledged" });
      return { content: [{ type: "text", text: `Acknowledged: "${updated.comment}" on ${updated.element}` }] };
    }
  );

  // -- Resolve --
  server.tool(
    "editor_resolve",
    "Mark an annotation as resolved after implementing the requested change.",
    {
      annotationId: z.string().describe("The annotation ID to resolve"),
      summary: z.string().optional().describe("Brief summary of what was done"),
    },
    async ({ annotationId, summary }) => {
      await httpPatch(`/annotations/${annotationId}`, { status: "resolved", resolvedBy: summary || "agent" });
      return { content: [{ type: "text", text: `Resolved annotation \`${annotationId}\`${summary ? `: ${summary}` : ""}` }] };
    }
  );

  // -- Dismiss --
  server.tool(
    "editor_dismiss",
    "Dismiss an annotation that cannot or should not be addressed.",
    {
      annotationId: z.string().describe("The annotation ID to dismiss"),
      reason: z.string().describe("Why this annotation is being dismissed"),
    },
    async ({ annotationId, reason }) => {
      await httpPatch(`/annotations/${annotationId}`, { status: "dismissed" });
      await httpPost(`/annotations/${annotationId}/thread`, { role: "agent", content: `Dismissed: ${reason}` });
      return { content: [{ type: "text", text: `Dismissed annotation \`${annotationId}\`: ${reason}` }] };
    }
  );

  // -- Reply --
  server.tool(
    "editor_reply",
    "Add a reply to an annotation's thread. Use this to ask clarifying questions or provide status updates.",
    {
      annotationId: z.string().describe("The annotation ID to reply to"),
      message: z.string().describe("The reply message"),
    },
    async ({ annotationId, message }) => {
      await httpPost(`/annotations/${annotationId}/thread`, { role: "agent", content: message });
      return { content: [{ type: "text", text: `Replied to \`${annotationId}\`: ${message}` }] };
    }
  );

  // -- Watch Annotations (blocking) --
  server.tool(
    "editor_watch",
    "Watch for new annotations and thread replies in real-time. Blocks until activity appears or timeout. Picks up both new annotations and user replies to existing threads. IMPORTANT: You MUST call this tool in a loop — after processing results, ALWAYS call editor_watch again immediately to keep listening. Never stop the watch loop unless the user explicitly asks you to stop watching.",
    {
      sessionId: z.string().optional().describe("Session ID to watch (optional, watches all if omitted)"),
      timeoutSeconds: z.number().optional().describe("How long to wait before returning empty (default: 120)"),
    },
    async ({ sessionId, timeoutSeconds }) => {
      const timeout = (timeoutSeconds || 120) * 1000;

      // First check for existing pending (skip orchestrator-claimed + fresh annotations)
      const path = sessionId ? `/sessions/${sessionId}/pending` : "/pending";
      const now = Date.now();
      const existing = (await httpGet<Annotation[]>(path)).filter(
        (a) => isUnclaimed(a) && (now - (a.timestamp || 0)) > 2000
      );
      if (existing.length > 0) {
        const text = existing.map(formatAnnotation).join("\n\n---\n\n");
        return { content: [{ type: "text", text: `# Pending Annotations (${existing.length})\n\n${text}` }] };
      }

      // Otherwise block and wait for SSE events
      return new Promise((resolve) => {
        const sseUrl = sessionId
          ? `${BASE_URL}/sessions/${sessionId}/events`
          : `${BASE_URL}/events`;

        const collected: WatchItem[] = [];
        let batchTimer: ReturnType<typeof setTimeout> | null = null;
        let controller: AbortController | null = new AbortController();

        const finish = () => {
          if (controller) { controller.abort(); controller = null; }
          if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
          if (timeoutHandle) clearTimeout(timeoutHandle);

          if (collected.length === 0) {
            resolve({ content: [{ type: "text", text: "No new annotations within timeout period. Call editor_watch again to keep listening." }] });
          } else {
            const text = collected.map((item) =>
              item.isReply
                ? formatReply(item.annotation, item.replyContent!)
                : formatAnnotation(item.annotation)
            ).join("\n\n---\n\n");
            const newCount = collected.filter((i) => !i.isReply).length;
            const replyCount = collected.filter((i) => i.isReply).length;
            const label = [
              newCount > 0 ? `${newCount} new` : "",
              replyCount > 0 ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "",
            ].filter(Boolean).join(", ");
            resolve({ content: [{ type: "text", text: `# Incoming (${label})\n\n${text}\n\n---\n_After processing, call editor_watch again to keep listening._` }] });
          }
        };

        const timeoutHandle = setTimeout(finish, timeout);

        // Connect to SSE
        fetch(sseUrl, { signal: controller!.signal, headers: { Accept: "text/event-stream" } })
          .then(async (response) => {
            if (!response.body) { finish(); return; }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (controller) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              // Parse SSE events from buffer
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const event = JSON.parse(line.slice(6));
                    if (event.type === "annotation.created" && event.payload) {
                      // Delay to let orchestrator claim, then re-fetch
                      await new Promise((r) => setTimeout(r, 500));
                      let ann: Annotation = event.payload;
                      try {
                        const fresh = await httpGet<Annotation>(`/annotations/${event.payload.id}`);
                        if (!isUnclaimed(fresh)) continue; // orchestrator owns it
                        ann = fresh;
                      } catch { /* use original payload */ }
                      collected.push({ annotation: ann, isReply: false });
                      if (!batchTimer) batchTimer = setTimeout(finish, 10_000);
                    } else if (
                      event.type === "thread.message" &&
                      event.payload?.message?.role === "user"
                    ) {
                      // User replied in a thread — fetch full annotation for context
                      try {
                        const ann = await httpGet<Annotation>(
                          `/annotations/${event.payload.annotationId}`
                        );
                        collected.push({
                          annotation: ann,
                          isReply: true,
                          replyContent: event.payload.message.content,
                        });
                        if (!batchTimer) batchTimer = setTimeout(finish, 10_000);
                      } catch { /* annotation may have been deleted */ }
                    }
                  } catch { /* skip malformed */ }
                }
              }
            }
          })
          .catch(() => { /* connection closed or aborted */ });
      });
    }
  );

  // -- Connect transport --
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[editor] MCP server running on stdio");
}
