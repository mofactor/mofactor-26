import { QueryCtx, MutationCtx } from "./_generated/server";
import { ConvexError } from "convex/values";

export async function requireAuth(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new ConvexError("Unauthorized");
  }

  return session;
}
