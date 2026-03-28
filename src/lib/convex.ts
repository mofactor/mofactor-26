import { ConvexHttpClient } from "convex/browser";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

export const convexHttp = url ? new ConvexHttpClient(url) : null;
