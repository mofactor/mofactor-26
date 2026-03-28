import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const login = mutation({
  args: { password: v.string() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new ConvexError("Admin password not configured");
    }

    if (args.password !== adminPassword) {
      throw new ConvexError("Invalid password");
    }

    const token = crypto.randomUUID();
    const now = Date.now();

    await ctx.db.insert("sessions", {
      token,
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { token };
  },
});

export const validateSession = query({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return false;
    }

    return true;
  },
});

export const logout = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return null;
  },
});
