import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAuth } from "./helpers";

// --- Build-time helpers ---

/** Walk a Tiptap JSON tree and collect every className value. */
function collectClasses(node: any, out: Set<string>) {
  if (node.attrs?.className) {
    for (const cls of node.attrs.className.split(/\s+/)) {
      if (cls) out.add(cls);
    }
  }
  if (node.attrs?.gap) out.add(node.attrs.gap);
  if (node.content) {
    for (const child of node.content) {
      collectClasses(child, out);
    }
  }
}

/**
 * Returns every Tailwind class used across all published posts.
 * Called by the build script to generate the CSS safelist.
 * Only exposes class names, not post content.
 */
export const allUsedClasses = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const classes = new Set<string>();
    for (const post of posts) {
      try {
        const doc = JSON.parse(post.content);
        collectClasses(doc, classes);
      } catch {
        // skip unparseable content
      }
    }
    return [...classes];
  },
});

// --- Public queries ---

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.string(),
      coverImageUrl: v.union(v.string(), v.null()),
      publishedAt: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_and_published", (q) =>
        q.eq("status", "published")
      )
      .order("desc")
      .collect();

    return Promise.all(
      posts.map(async (post) => ({
        _id: post._id,
        _creationTime: post._creationTime,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageId
          ? await ctx.storage.getUrl(post.coverImageId)
          : null,
        publishedAt: post.publishedAt,
        tags: post.tags,
      }))
    );
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      title: v.string(),
      slug: v.string(),
      excerpt: v.string(),
      coverImageUrl: v.union(v.string(), v.null()),
      publishedAt: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_and_published", (q) =>
        q.eq("status", "published")
      )
      .order("desc")
      .take(limit);

    return Promise.all(
      posts.map(async (post) => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageId
          ? await ctx.storage.getUrl(post.coverImageId)
          : null,
        publishedAt: post.publishedAt,
        tags: post.tags,
      }))
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.string(),
      content: v.string(),
      coverImageUrl: v.union(v.string(), v.null()),
      seoTitle: v.optional(v.string()),
      seoMetaDescription: v.optional(v.string()),
      status: v.union(v.literal("draft"), v.literal("published")),
      publishedAt: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!post || post.status !== "published") return null;

    return {
      _id: post._id,
      _creationTime: post._creationTime,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageUrl: post.coverImageId
        ? await ctx.storage.getUrl(post.coverImageId)
        : null,
      seoTitle: post.seoTitle,
      seoMetaDescription: post.seoMetaDescription,
      status: post.status,
      publishedAt: post.publishedAt,
      tags: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  },
});

// --- Admin queries (require auth) ---

export const listAll = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.string(),
      status: v.union(v.literal("draft"), v.literal("published")),
      publishedAt: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const posts = await ctx.db.query("posts").order("desc").collect();

    return posts.map((post) => ({
      _id: post._id,
      _creationTime: post._creationTime,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      status: post.status,
      publishedAt: post.publishedAt,
      tags: post.tags,
      updatedAt: post.updatedAt,
    }));
  },
});

export const getById = query({
  args: { id: v.id("posts"), token: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      excerpt: v.string(),
      content: v.string(),
      coverImageId: v.optional(v.id("_storage")),
      coverImageUrl: v.union(v.string(), v.null()),
      seoTitle: v.optional(v.string()),
      seoMetaDescription: v.optional(v.string()),
      status: v.union(v.literal("draft"), v.literal("published")),
      publishedAt: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const post = await ctx.db.get(args.id);
    if (!post) return null;

    return {
      _id: post._id,
      _creationTime: post._creationTime,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageId: post.coverImageId,
      coverImageUrl: post.coverImageId
        ? await ctx.storage.getUrl(post.coverImageId)
        : null,
      seoTitle: post.seoTitle,
      seoMetaDescription: post.seoMetaDescription,
      status: post.status,
      publishedAt: post.publishedAt,
      tags: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  },
});

// --- Admin mutations (require auth) ---

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImageId: v.optional(v.id("_storage")),
    tags: v.optional(v.array(v.string())),
    seoTitle: v.optional(v.string()),
    seoMetaDescription: v.optional(v.string()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("A post with this slug already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("posts", {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      coverImageId: args.coverImageId,
      seoTitle: args.seoTitle,
      seoMetaDescription: args.seoMetaDescription,
      status: "draft",
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImageId: v.optional(v.id("_storage")),
    tags: v.optional(v.array(v.string())),
    seoTitle: v.optional(v.string()),
    seoMetaDescription: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing && existing._id !== args.id) {
      throw new ConvexError("A post with this slug already exists");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      slug: args.slug,
      excerpt: args.excerpt,
      content: args.content,
      tags: args.tags,
      coverImageId: args.coverImageId,
      seoTitle: args.seoTitle,
      seoMetaDescription: args.seoMetaDescription,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const publish = mutation({
  args: { token: v.string(), id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    await ctx.db.patch(args.id, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const unpublish = mutation({
  args: { token: v.string(), id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    await ctx.db.patch(args.id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const post = await ctx.db.get(args.id);
    if (post?.coverImageId) {
      await ctx.storage.delete(post.coverImageId);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = mutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);
    return await ctx.storage.getUrl(args.storageId);
  },
});
