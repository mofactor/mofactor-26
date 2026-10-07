// Dynamic share card: /og?title=…&subtitle=… (same URL and design as the Next route,
// so existing og:image links keep working).
//
// next/og wraps @vercel/og, which (like satori's own ESM build) bundles harfbuzz with
// CommonJS globals (require, __dirname) and fails under Astro's ESM runtime. This calls
// the same engine (satori → SVG, resvg → PNG) through satori's CommonJS build, where
// those globals exist, with the font Next 16's bundled og renderer uses: Noto Sans
// Regular (SIL OFL 1.1), so cards look exactly like the ones Next served.
import type { APIRoute } from "astro";
import { createRequire } from "node:module";
import type satoriType from "satori";
import type { Resvg as ResvgType } from "@resvg/resvg-js";
import notoSansDataUrl from "@/lib/og/noto-sans-v27-latin-regular.ttf?inline";
import { OgTemplate } from "@/lib/og-template";

const require = createRequire(import.meta.url);
const satori: typeof satoriType = require("satori").default;
const { Resvg }: { Resvg: typeof ResvgType } = require("@resvg/resvg-js");

export const prerender = false;

const WIDTH = 1200;
const HEIGHT = 630;
const notoSans = Buffer.from(notoSansDataUrl.slice(notoSansDataUrl.indexOf(",") + 1), "base64");

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get("title") || "Monofactor";
  const subtitle = url.searchParams.get("subtitle") || "Portfolio of Onur Oztaskiran";

  const svg = await satori(OgTemplate({ title, subtitle }), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: "Noto Sans", data: notoSans, weight: 400, style: "normal" }],
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      // Same query → same image; let browsers, crawlers and Cloudflare keep it
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
};
