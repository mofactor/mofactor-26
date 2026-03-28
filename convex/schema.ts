import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(), // Tiptap JSON, stored as JSON.stringify'd string
    coverImageId: v.optional(v.id("_storage")),
    seoTitle: v.optional(v.string()),
    seoMetaDescription: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_and_published", ["status", "publishedAt"])
    .index("by_status", ["status"]),

  files: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    createdAt: v.number(),
  }),

  sessions: defineTable({
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
