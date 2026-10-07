import type { AstroIntegration } from "astro";
import { readdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RASTER = /\.(png|jpe?g|webp|avif)$/i;
const TEXT = /\.(html|m?js|css|json|xml|txt)$/i;

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
}

/**
 * lib/images.ts imports every raster under public/ so astro:assets can optimize them
 * in place. Vite then copies each original into _astro/, duplicating public/.
 * After the build, delete the copies nothing references (optimized variants and any
 * original actually used by the client or server output stay).
 */
export default function pruneImageOriginals(): AstroIntegration {
  let clientDir = "";
  let serverDir = "";

  return {
    name: "prune-image-originals",
    hooks: {
      "astro:config:done": ({ config }) => {
        clientDir = fileURLToPath(config.build.client);
        serverDir = fileURLToPath(config.build.server);
      },
      "astro:build:done": async ({ logger }) => {
        const assetsDir = join(clientDir, "_astro");
        const rasters = (await listFiles(assetsDir)).filter((f) => RASTER.test(f));
        if (!rasters.length) return;

        const textFiles = [...(await listFiles(clientDir)), ...(await listFiles(serverDir))].filter(
          (f) => TEXT.test(f),
        );
        const corpus = (await Promise.all(textFiles.map((f) => readFile(f, "utf8"))))
          .join("\n")
          // The server manifest lists every emitted file ("assets":[...]); that's an inventory,
          // not a use. If Astro changes this format the regex stops matching and nothing is pruned.
          .replace(/\\?"assets\\?":\s*\[[^\]]*\]/g, "");

        let removed = 0;
        for (const file of rasters) {
          const name = file.slice(file.lastIndexOf("/") + 1);
          if (!corpus.includes(name)) {
            await unlink(file);
            removed++;
          }
        }
        logger.info(`Removed ${removed} unreferenced original image(s) from _astro/`);
      },
    },
  };
}
