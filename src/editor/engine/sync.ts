/**
 * Browser-side sync — sends annotations to the local MCP HTTP server.
 * Falls back gracefully when server is not running.
 */

import type { Annotation, ThreadMessage } from "../types";

const ENDPOINT = "http://localhost:4747";

export async function checkServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createSession(url: string): Promise<{ id: string } | null> {
  try {
    const res = await fetch(`${ENDPOINT}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function syncAnnotation(sessionId: string, annotation: Annotation): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/sessions/${sessionId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annotation),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncUpdateAnnotation(
  annotationId: string,
  updates: Partial<Annotation>
): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/annotations/${annotationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncDeleteAnnotation(annotationId: string): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/annotations/${annotationId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncAddThreadMessage(
  annotationId: string,
  message: { role: "user" | "agent"; content: string }
): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}/annotations/${annotationId}/thread`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── SSE Event Subscription ──

export interface SseEvent {
  type: string;
  sessionId: string;
  payload: {
    id?: string;
    status?: string;
    thread?: ThreadMessage[];
    [key: string]: unknown;
  };
  sequence: number;
}

/**
 * Subscribe to server-sent events for a session.
 * Returns an unsubscribe function. Silently fails if server is down.
 */
export function subscribeToEvents(
  sessionId: string,
  onEvent: (event: SseEvent) => void
): () => void {
  let controller: AbortController | null = new AbortController();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastEventId = "";
  let stopped = false;

  const connect = () => {
    if (stopped || !controller) return;

    const headers: Record<string, string> = { Accept: "text/event-stream" };
    if (lastEventId) headers["Last-Event-ID"] = lastEventId;

    fetch(`${ENDPOINT}/sessions/${sessionId}/events`, {
      signal: controller.signal,
      headers,
    })
      .then(async (response) => {
        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentId = "";

        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("id: ")) {
              currentId = line.slice(4).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6)) as SseEvent;
                if (currentId) lastEventId = currentId;
                onEvent(event);
              } catch { /* skip malformed */ }
            }
          }
        }
      })
      .catch(() => { /* connection closed or aborted */ })
      .finally(() => {
        // Reconnect after 3s if not explicitly stopped
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      });
  };

  connect();

  return () => {
    stopped = true;
    if (controller) { controller.abort(); controller = null; }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };
}
