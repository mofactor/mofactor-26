import type { MetadataRoute } from "next";
import { convexHttp } from "@/lib/convex";
import { api } from "../../convex/_generated/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://monofactor.com", lastModified: new Date(), priority: 1 },
    {
      url: "https://monofactor.com/work/flux",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://monofactor.com/work/solitonic",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://monofactor.com/work/airbit",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://monofactor.com/work/postlight",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://monofactor.com/work/wadi-grocery",
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: "https://monofactor.com/blog",
      lastModified: new Date(),
      priority: 0.7,
    },
  ];

  // Fetch published blog posts for sitemap
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    if (convexHttp) {
      const posts = await convexHttp.query(api.posts.list);
      blogRoutes = posts.map((post) => ({
        url: `https://monofactor.com/blog/${post.slug}`,
        lastModified: post.publishedAt
          ? new Date(post.publishedAt)
          : new Date(),
        priority: 0.6,
      }));
    }
  } catch {
    // Convex unavailable — skip blog posts in sitemap
  }

  return [...staticRoutes, ...blogRoutes];
}
