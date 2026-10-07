// @ts-check
import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import pruneImageOriginals from "./src/integrations/prune-image-originals.ts";

export default defineConfig({
  site: "https://monofactor.com",

  // Keep today's URLs exactly: /work/flux, not /work/flux/
  trailingSlash: "never",
  build: { format: "file" },

  // scripts/deploy.sh builds into a sibling dir, then swaps it in
  outDir: process.env.ASTRO_OUT_DIR ?? "./dist",
  // Outside node_modules so `npm ci` on deploy keeps the optimized-image cache
  cacheDir: "./.astro-cache",

  // Pages prerender by default; blog, actions, /og and /nexus opt into on-demand rendering
  adapter: node({ mode: "standalone" }),
  integrations: [react(), pruneImageOriginals()],
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle island deps at startup. Discovering them mid-session makes Vite re-optimize
    // and can load two React copies in dev ("Invalid hook call").
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@base-ui/react/button",
        "@base-ui/react/dialog",
        "@base-ui/react/input",
        "@base-ui/react/switch",
        "@base-ui/react/merge-props",
        "@base-ui/react/use-render",
        "embla-carousel-react",
        "embla-carousel-autoplay",
        "embla-carousel-auto-scroll",
        "embla-carousel-wheel-gestures",
        "lucide-react",
        "animejs",
        "animejs/text",
        "three",
        "clsx",
        "tailwind-merge",
        "class-variance-authority",
      ],
    },
  },

  env: {
    schema: {
      // Convex: the browser uses the public URL; SSR may use a faster local one
      PUBLIC_CONVEX_URL: envField.string({ context: "client", access: "public", optional: true }),
      CONVEX_URL: envField.string({ context: "server", access: "public", optional: true }),
      // Contact form (Brevo). Optional so a missing key reports "not configured" instead of failing the build
      BREVO_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      BREVO_SENDER_EMAIL: envField.string({ context: "server", access: "secret", optional: true }),
      BREVO_RECIPIENT_EMAIL: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },

  image: { domains: ["monovex.monofactor.com"] },
  prefetch: { prefetchAll: true },

  // Required in dev for data-astro-source-file/-loc, which the visual editor reads
  devToolbar: { enabled: true },
});
