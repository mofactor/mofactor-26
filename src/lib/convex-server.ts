// Server-side Convex client for on-demand pages and server islands.
// CONVEX_URL (e.g. http://127.0.0.1:3230 on the server) skips TLS + nginx; falls back to the public URL.
import { ConvexHttpClient } from "convex/browser";
import { CONVEX_URL } from "astro:env/server";
import { PUBLIC_CONVEX_URL } from "astro:env/client";

const url = CONVEX_URL ?? PUBLIC_CONVEX_URL;

export const convex = url ? new ConvexHttpClient(url) : null;
