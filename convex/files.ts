import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./helpers";

export const list = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("files"),
      _creationTime: v.number(),
      storageId: v.id("_storage"),
      name: v.string(),
      type: v.string(),
      size: v.number(),
      url: v.union(v.string(), v.null()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const files = await ctx.db.query("files").order("desc").collect();

    return Promise.all(
      files.map(async (file) => ({
        _id: file._id,
        _creationTime: file._creationTime,
        storageId: file.storageId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: await ctx.storage.getUrl(file.storageId),
        createdAt: file.createdAt,
      }))
    );
  },
});

export const upload = mutation({
  args: {
    token: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    return await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      size: args.size,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("files") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.token);

    const file = await ctx.db.get(args.id);
    if (!file) return null;

    await ctx.storage.delete(file.storageId);
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
