/**
 * HTTP REST API + SSE server for browser ↔ server annotation sync.
 * Native Node.js http module, no framework. Port 4747.
 */

import http from "node:http";
import {
  eventBus,
  createSession,
  getSession,
  listSessions,
  addAnnotation,
  getAnnotation,
  updateAnnotation,
  deleteAnnotation,
  addThreadMessage,
  getPendingAnnotations,
  getAllPending,
  type StoreEvent,
} from "./store.js";
import { getHistory, clearHistory } from "./history.js";
import {
  getAllAgents,
  getAgent,
  getAgentForAnnotation,
  abortAgent,
  spawnAgent,
} from "./orchestrator.js";

// =============================================================================
// Activity tracking (for dead-man's-switch shutdown)
// =============================================================================

export let lastActivityAt = Date.now();

export function touchActivity(): void {
  lastActivityAt = Date.now();
}

// =============================================================================
// Helpers
// =============================================================================

function cors(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Last-Event-ID");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type");
}

function json(res: http.ServerResponse, data: unknown, status = 200): void {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function error(res: http.ServerResponse, message: string, status = 400): void {
  json(res, { error: message }, status);
}

async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf-8");
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// =============================================================================
// Route matching
// =============================================================================

type RouteHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
) => void | Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

function addRoute(method: string, path: string, handler: RouteHandler): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" + path.replace(/:(\w+)/g, (_, key) => { keys.push(key); return "([^/]+)"; }) + "$"
  );
  routes.push({ method, pattern, keys, handler });
}

function matchRoute(method: string, pathname: string): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => { params[key] = match[i + 1]; });
      return { handler: route.handler, params };
    }
  }
  return null;
}

// =============================================================================
// Routes
// =============================================================================

// Health check
addRoute("GET", "/health", (_req, res) => {
  json(res, { ok: true, timestamp: Date.now() });
});

// -- Sessions --

addRoute("POST", "/sessions", async (req, res) => {
  const body = await parseBody(req) as { url?: string };
  if (!body.url) return error(res, "url is required");
  const session = createSession(body.url);
  json(res, session, 201);
});

addRoute("GET", "/sessions", (_req, res) => {
  json(res, listSessions());
});

addRoute("GET", "/sessions/:id", (_req, res, params) => {
  const session = getSession(params.id);
  if (!session) return error(res, "Session not found", 404);
  json(res, session);
});

// -- Annotations --

addRoute("POST", "/sessions/:id/annotations", async (req, res, params) => {
  const body = await parseBody(req) as Record<string, unknown>;
  if (!body.id || !body.comment) return error(res, "id and comment are required");
  const annotation = addAnnotation(params.id, body as any);
  json(res, annotation, 201);
});

addRoute("PATCH", "/annotations/:id", async (req, res, params) => {
  const body = await parseBody(req) as Record<string, unknown>;
  const updated = updateAnnotation(params.id, body as any);
  if (!updated) return error(res, "Annotation not found", 404);
  json(res, updated);
});

addRoute("GET", "/annotations/:id", (_req, res, params) => {
  const ann = getAnnotation(params.id);
  if (!ann) return error(res, "Annotation not found", 404);
  json(res, ann);
});

addRoute("DELETE", "/annotations/:id", (_req, res, params) => {
  const ok = deleteAnnotation(params.id);
  if (!ok) return error(res, "Annotation not found", 404);
  json(res, { ok: true });
});

addRoute("GET", "/sessions/:id/pending", (_req, res, params) => {
  json(res, getPendingAnnotations(params.id));
});

addRoute("GET", "/pending", (_req, res) => {
  json(res, getAllPending());
});

// -- History --

addRoute("GET", "/history", (_req, res) => {
  json(res, getHistory());
});

addRoute("DELETE", "/history", (_req, res) => {
  clearHistory();
  json(res, { ok: true });
});

// -- Thread --

addRoute("POST", "/annotations/:id/thread", async (req, res, params) => {
  const body = await parseBody(req) as { role?: string; content?: string };
  if (!body.role || !body.content) return error(res, "role and content are required");
  const updated = addThreadMessage(params.id, body.role as "user" | "agent", body.content);
  if (!updated) return error(res, "Annotation not found", 404);
  json(res, updated);
});

// -- Agents --

addRoute("GET", "/agents", (_req, res) => {
  json(res, getAllAgents());
});

addRoute("GET", "/agents/:id", (_req, res, params) => {
  const agent = getAgent(params.id);
  if (!agent) return error(res, "Agent not found", 404);
  json(res, agent);
});

addRoute("GET", "/annotations/:id/agent", (_req, res, params) => {
  const agent = getAgentForAnnotation(params.id);
  if (!agent) return error(res, "No agent for this annotation", 404);
  json(res, agent);
});

addRoute("POST", "/agents/:id/abort", (_req, res, params) => {
  const ok = abortAgent(params.id);
  if (!ok) return error(res, "Agent not found or already finished", 404);
  json(res, { ok: true });
});

addRoute("POST", "/annotations/:id/respawn", (_req, res, params) => {
  const ann = getAnnotation(params.id);
  if (!ann) return error(res, "Annotation not found", 404);
  const agentId = spawnAgent(ann.id, ann.sessionId, ann);
  if (!agentId) return error(res, "Could not spawn agent (max concurrent reached)", 429);
  json(res, { ok: true, agentId });
});

// -- SSE Streams --

addRoute("GET", "/sessions/:id/events", (req, res, params) => {
  cors(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Replay events since last seen
  const lastId = req.headers["last-event-id"];
  if (lastId) {
    const seq = parseInt(lastId as string, 10);
    if (!isNaN(seq)) {
      const missed = eventBus.getEventsSince(seq, params.id);
      for (const event of missed) {
        res.write(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }
    }
  }

  // Send keepalive
  const keepalive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15_000);

  // Subscribe to session events
  const unsubscribe = eventBus.subscribeToSession(params.id, (event) => {
    res.write(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  });

  req.on("close", () => {
    clearInterval(keepalive);
    unsubscribe();
  });
});

addRoute("GET", "/events", (req, res) => {
  cors(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const lastId = req.headers["last-event-id"];
  if (lastId) {
    const seq = parseInt(lastId as string, 10);
    if (!isNaN(seq)) {
      const missed = eventBus.getEventsSince(seq);
      for (const event of missed) {
        res.write(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      }
    }
  }

  const keepalive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15_000);

  const unsubscribe = eventBus.subscribe((event: StoreEvent) => {
    res.write(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  });

  req.on("close", () => {
    clearInterval(keepalive);
    unsubscribe();
  });
});

// =============================================================================
// Server
// =============================================================================

export function startHttpServer(port = 4747): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      const method = req.method?.toUpperCase() || "GET";
      const pathname = url.pathname;

      touchActivity();

      // CORS preflight
      if (method === "OPTIONS") {
        cors(res);
        res.writeHead(204);
        res.end();
        return;
      }

      const matched = matchRoute(method, pathname);
      if (matched) {
        try {
          await matched.handler(req, res, matched.params);
        } catch (e) {
          error(res, (e as Error).message, 500);
        }
      } else {
        error(res, "Not found", 404);
      }
    });

    server.listen(port, () => {
      console.error(`[editor] HTTP server listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}
