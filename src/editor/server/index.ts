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

import { startHttpServer } from "./http.js";
import { startMcpServer } from "./mcp.js";
import { initOrchestrator } from "./orchestrator.js";

const args = process.argv.slice(2);
const mcpOnly = args.includes("--mcp-only");
const noAgents = args.includes("--no-agents");
const portIdx = args.indexOf("--port");
const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 4747;
const httpUrl = (() => {
  const idx = args.indexOf("--http-url");
  return idx !== -1 ? args[idx + 1] : `http://localhost:${port}`;
})();

async function main(): Promise<void> {
  if (!mcpOnly) {
    await startHttpServer(port);

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
}

main().catch((err) => {
  console.error("[editor] Fatal:", err);
  process.exit(1);
});
