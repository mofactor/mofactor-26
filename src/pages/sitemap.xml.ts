// Same entries and format as the Next sitemap (app/sitemap.ts): static routes plus
// published posts from Convex, generated per request so new posts appear immediately.
import type { APIRoute } from "astro";
import { convex } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

export const prerender = false;

const SITE = "https://monofactor.com";

const staticRoutes: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/work/flux", priority: 0.8 },
  { path: "/work/fountible", priority: 0.8 },
  { path: "/work/nickai", priority: 0.8 },
  { path: "/work/gbo-vision", priority: 0.8 },
  { path: "/work/hastam", priority: 0.8 },
  { path: "/work/kollektor", priority: 0.8 },
  { path: "/work/solitonic", priority: 0.8 },
  { path: "/work/airbit", priority: 0.8 },
  { path: "/work/postlight", priority: 0.8 },
  { path: "/work/wadi-grocery", priority: 0.8 },
  { path: "/blog", priority: 0.7 },
];

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();
  const entries = staticRoutes.map(({ path, priority }) => ({ loc: `${SITE}${path}`, lastmod: now, priority }));

  try {
    if (convex) {
      const posts = await convex.query(api.posts.list, {});
      for (const post of posts) {
        entries.push({
          loc: `${SITE}/blog/${post.slug}`,
          lastmod: post.publishedAt ? new Date(post.publishedAt).toISOString() : now,
          priority: 0.6,
        });
      }
    }
  } catch {
    // Convex unavailable: skip blog posts, as the Next version did
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => `<url>
<loc>${escapeXml(e.loc)}</loc>
<lastmod>${e.lastmod}</lastmod>
<priority>${e.priority}</priority>
</url>`)
  .join("\n")}
</urlset>
`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
