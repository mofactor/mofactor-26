#!/usr/bin/env node
/**
 * Editor annotation server — entry point.
 *
 * Usage:
 *   npx tsx src/editor/server/index.ts              # HTTP + MCP + agents
 *   npx tsx src/editor/server/index.ts --mcp-only   # MCP only (for Claude config)
 *   npx tsx src/editor/server/index.ts --no-agents  # HTTP + MCP, no auto-spawn
 *   npx tsx src/editor/server/index.ts --port 5000  # Custom port
 */

import { startHttpServer, lastActivityAt, touchActivity } from "./http.js";
import { startMcpServer } from "./mcp.js";
import { initOrchestrator, abortAllAgents } from "./orchestrator.js";

const args = process.argv.slice(2);
const mcpOnly = args.includes("--mcp-only");
const noAgents = args.includes("--no-agents");
const portIdx = args.indexOf("--port");
const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 4747;
const httpUrl = (() => {
  const idx = args.indexOf("--http-url");
  return idx !== -1 ? args[idx + 1] : `http://localhost:${port}`;
})();

// =============================================================================
// Graceful shutdown
// =============================================================================

const IDLE_TTL_MS = 5 * 60 * 1000; // 5 minutes with no activity → auto-exit
let httpServer: import("node:http").Server | null = null;
let ttlInterval: ReturnType<typeof setInterval> | null = null;
let shuttingDown = false;

function shutdown(reason: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`[editor] Shutting down: ${reason}`);

  // 1. Abort all running agents + clean worktrees
  abortAllAgents();

  // 2. Close HTTP server
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }

  // 3. Clear TTL check
  if (ttlInterval) {
    clearInterval(ttlInterval);
    ttlInterval = null;
  }

  // 4. Exit
  setTimeout(() => process.exit(0), 500);
}

async function main(): Promise<void> {
  if (!mcpOnly) {
    httpServer = await startHttpServer(port);

    if (!noAgents) {
      initOrchestrator({ projectCwd: process.cwd() });
      console.error(`[editor] Agent orchestrator initialized`);
    }

    console.error(`[editor] Endpoints:`);
    console.error(`[editor]   POST   /sessions              Create session`);
    console.error(`[editor]   POST   /sessions/:id/annotations  Add annotation`);
    console.error(`[editor]   GET    /pending               All pending annotations`);
    console.error(`[editor]   GET    /agents                List agents`);
    console.error(`[editor]   GET    /events                SSE stream`);
    console.error(`[editor]   GET    /health                Health check`);
  }

  await startMcpServer(httpUrl);

  // --- Layer 1: stdin close detection ---
  process.stdin.on("end", () => shutdown("stdin closed (parent process exited)"));
  process.stdin.on("close", () => shutdown("stdin closed (parent process exited)"));

  // --- Layer 2: idle TTL (dead man's switch) ---
  touchActivity(); // reset timer at boot
  ttlInterval = setInterval(() => {
    if (Date.now() - lastActivityAt > IDLE_TTL_MS) {
      shutdown(`idle for ${IDLE_TTL_MS / 1000}s with no activity`);
    }
  }, 30_000); // check every 30s
}

main().catch((err) => {
  console.error("[editor] Fatal:", err);
  process.exit(1);
});
