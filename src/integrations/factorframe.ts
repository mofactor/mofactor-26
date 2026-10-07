// factorframe (the visual editor) as an Astro integration. Dev only: in builds it adds
// nothing — no client script, no API routes.
//   • injects the editor UI into every page (src/editor/mount.tsx)
//   • serves the patch API (/api/editor-patches, /commit) as dev-server middleware
// The annotation server (port 4747, MCP + orchestrator) stays a separate process:
// `npm run dev` starts both, as it did on Next.
import type { AstroIntegration } from "astro";
import type { IncomingMessage, ServerResponse } from "node:http";

/** Element → { file, loc } for every element Astro stamped; read by src/editor/engine/fiber.ts */
const CAPTURE_ASTRO_SOURCES = `(() => {
  const sources = (window.__factorframeSources = new WeakMap());
  const grab = (el) => {
    const file = el.getAttribute && el.getAttribute("data-astro-source-file");
    if (file) sources.set(el, { file, loc: el.getAttribute("data-astro-source-loc") });
  };
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        grab(node);
        node.querySelectorAll("[data-astro-source-file]").forEach(grab);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();`;

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
  }
  return new Request(new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`), {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
  });
}

async function sendResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export default function factorframe(): AstroIntegration {
  return {
    name: "factorframe",
    hooks: {
      "astro:config:setup": ({ command, injectScript }) => {
        if (command !== "dev") return;
        // Astro stamps .astro elements with data-astro-source-file/-loc in dev, but its
        // dev-toolbar audit app strips them after load. Record them first: this runs in
        // <head> before the body is parsed and keeps watching (server islands, etc.).
        injectScript("head-inline", CAPTURE_ASTRO_SOURCES);
        injectScript("page", `import "/src/editor/mount.tsx";`);
      },
      "astro:server:setup": async ({ server }) => {
        // Loaded lazily: ts-morph is heavy and only the dev server needs it
        const { handleEditorPatches } = await import("../editor/server/patches-api.ts");
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith("/api/editor-patches")) return next();
          try {
            await sendResponse(res, await handleEditorPatches(await toRequest(req)));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      },
    },
  };
}
