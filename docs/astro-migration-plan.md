# Monofactor: Next.js → Astro migration plan

Status: direction approved 2026-10-08 · Target: Astro 7.3.x (Vite 8, Rust compiler), React 19, Tailwind v4, self-hosted Convex · Host: Plesk server (see §6)

**Decisions (2026-10-08):**
- Migrate islands-first, because Astro is the better fit for a website.
- Keep hosting on the existing Plesk server.
- The editor's precise click-to-commit for `.astro` files lands after cutover.

**Progress (2026-10-08):**

| Phase | Status |
|---|---|
| 0–1 Scaffold | Done |
| 2 Components | Done for everything the public pages use |
| 3 Home | Done. Contact → Astro Action; Journal → server island |
| 4 Case studies | Done. Converted with a codemod; layout parity verified |
| 5 Blog, OG, sitemap | Done. Astro-native post renderer; posts render on the server; real 404s |
| 6 Admin | Done. One client-only React app at `/nexus/[...path]`; a wouter shim keeps Next's `useRouter`/`usePathname`/`useParams`/`Link` signatures |
| Editor, basic mode | Done. `factorframe` integration (dev only, nothing in builds); patch API as dev middleware; annotations carry exact `.astro` file:line; commits to `.astro` are refused with a hint until phase 7 |
| Next | Final checks → staging on tt6 → production switch (8); then precise `.astro` commits (7) |

**What changed from the plan in practice:**
- **Images stay in `public/`.** `import.meta.glob("/public/**")` feeds `astro:assets`, which optimizes them in place, so existing URLs keep working. A build hook (`src/integrations/prune-image-originals.ts`) deletes the original copies Vite would otherwise duplicate into `_astro/`.
- **Lightbox islands use `client:idle`.** Their trigger wrapper is `display: contents`, which `client:visible` can't observe.
- **Two packages had to be hoisted** for Astro 7's build: `cookie@2` and `sharp`.
- **Build output must stay inside the project**, or the prerender step can't resolve `react`.
- **Restart the dev server after generating files with scripts.** Otherwise Tailwind's dev plugin misses their classes. Production builds are unaffected.
- **Astro's dev toolbar strips the source stamps.** Its audit app removes `data-astro-source-*` from the DOM after load. The editor records them first, from a `<head>` inline script.
- **The admin preview stays on the React renderer.** Admin login lives in localStorage, so the server can't render drafts.
- **Share links use the canonical URL.** Server-rendered islands must not branch on `window` for attributes, because React's hydration doesn't patch mismatched attributes.
- **Blog renderer:** `TiptapContent.astro` renders posts as static HTML with islands only for media. The admin preview keeps the React renderer. Both use `render-helpers.ts`.
- **`/og` renderer:** runs satori through its CommonJS build. `@vercel/og` and satori's ESM builds bundle harfbuzz with CommonJS globals, which fail under Astro. It uses Noto Sans, Next's OG font, so cards match pixel for pixel apart from antialiasing.
- **Measured against production Next:**
  - Home: 1,500 → 958 KB of JS.
  - Flux: 776 → 448 KB.
  - Blog posts: about 2,000 words of article HTML for crawlers, where Next served 20 ("Loading…").
  - Postlight, Solitonic and Wadi Grocery no longer shift layout while images load. Next's authored width/height hints were wrong, by up to 1,638px on Postlight.

---

## TL;DR

- **Complexity: medium.** This is a port, not a rewrite. About three quarters of the component code moves over unchanged. The real work sits in eight specific places (§2).
- **Effort: about 12–16 focused days (roughly 3 weeks).** About 9–11 days if precise commit-to-source in the dev editor waits until after cutover.
- **Lift-and-shift saves little.** Hydrating whole pages, as Next does today, saves only about 3–4 days. Most of the cost is in pieces both approaches need: SEO/OG, the contact action, the blog, admin, images and the editor. The islands work is where the payoff is.
- **Approach (decided): local first.** Islands-first, built and run locally on the `astro` branch, in a worktree at `../mofactor-26-astro`. `main` stays a runnable Next copy.
  - Nothing touches the server until the local build is at parity.
  - Staging on `tt6.monofactor.com` comes only just before cutover.
  - Port the editor's annotate mode early so the Claude annotation loop keeps working throughout.
- **Hosting stays the same.** The Plesk + Passenger + Git auto-deploy setup carries over. Mainly the startup file and the deploy commands change (§6).
- **Biggest wins:**
  - Case-study pages stop hydrating the whole page.
  - Blog posts become real server-rendered HTML. Today they render client-side, and unknown slugs return 200.
  - The homepage stops opening a Convex websocket.
  - The dev editor gets precise source locations again. They're already broken on Next 16.
- **Biggest risks:** animation timing under lazy hydration, the image pipeline (about 140 raster images move to `astro:assets`), and commit-to-source for `.astro` files in the editor.

---

## 1. What's being migrated

| Area | Today (Next 16.1.6, App Router) | Size |
|---|---|---|
| Public pages | Home, 5 case studies, blog index, blog post | 8 routes. The case studies are about 1,200 lines of JSX, all `"use client"` |
| Server features | Contact server action (Brevo), `/og` (next/og), Convex-backed sitemap, robots, Metadata API on 8 layouts/pages | Small, but Next-specific |
| CMS admin `/nexus` | Client-only React app on Convex: Tiptap editor, file library, localStorage token auth | 7 routes, about 4,000 lines |
| Dev editor `src/editor` | Edit + Annotate modes, MCP/orchestrator server on :4747, patches API, ts-morph commit route | About 8,500 lines |
| Components | 73 `.tsx` components, plus hooks and data files | 77 files are marked `"use client"` |
| Assets | About 140 raster images (~75 MB) served through `next/image`, plus 13 videos (~89 MB) | `public/` is 160 MB |
| Next imports | `next/link` 12 files · `next/image` 10 · `next/navigation` 6 · `next/dynamic` 3 · `next/server` 3 · `next/script` 1 · `next/og` 1 · Metadata types 10 | See Appendix A |

---

## 2. Where the effort concentrates

1. **Case-study pages are whole-page client components.** All five `app/work/*/page.tsx` files are `"use client"`, so today the entire page hydrates. In Astro they become `.astro` pages with small islands for headline effects, carousels and lightboxes. The conversion is mechanical: 234 `className`, 6 `autoPlay` and 6 `playsInline` to rewrite, and no invalid tag nesting. But it is the bulk of the markup.

2. **Images.** `next/image` optimizes on demand. Astro only optimizes images imported from `src/`, and files in `public/` ship as-is.
   - ~~The rasters move to `src/assets/`.~~ Done differently: they stay in `public/` and are optimized in place (see Progress).
   - Islands that render images (ProcessCarousel, DesignBits, Recommendations, Lightbox) get pre-computed `src`/`srcset` props from their `.astro` parent, because Astro's `<Image />` can't be used inside React.

3. **`Lightbox` breaks under Astro slots.** It wraps each child in its own trigger with `React.Children.map`. Children passed from an `.astro` page reach a React component as one opaque HTML block, so every image would open slide 0.
   - Fix: event delegation.
   - Stopgap: the `experimentalReactChildren` flag.

4. **Next server features.**
   - The server action becomes an Astro Action. `withState()` keeps the `useActionState` shape, which needs React 19.
   - `next/og` becomes `@vercel/og` or satori in an endpoint.
   - The Metadata API becomes an `SEO.astro` component.
   - Easy-to-miss parity items:
     - absolute OG image URLs (Next's `metadataBase` did this silently)
     - the `%s — Monofactor` title template
     - `viewport-fit=cover`
     - the icon `<link>`s Next generated from `app/icon.svg`, `apple-icon.png` and `favicon.ico`

5. **Blog + Convex.**
   - **Today:** the blog index and post bodies render client-side through `useQuery`. Crawlers without JS see "Loading...", and unknown slugs return 200 with a "Post not found" message.
   - **In Astro:** they're server-rendered with `ConvexHttpClient`, with real 404s and route caching.
   - **Homepage:** `BlogPosts` currently spins up its own `ConvexReactClient` websocket to show three titles. It becomes a server island.

6. **Admin SPA.** It already works as one client-only React app. The only real change is replacing `next/navigation` and `next/link` with a small router shim.

7. **React version.** `package.json` says `react: "latest"`, but 18.3.1 is installed, while Next renders with its own bundled React 19. Astro uses the installed copy, and `useActionState` needs React 19. So React gets pinned to 19.x, and the `"latest"` ranges go away.

8. **Dev editor (factorframe).** It's DOM-based and mostly portable. Its Next couplings:
   - the `next/dynamic` loader
   - the `*.raw.css` loader
   - Next API routes for patches and commit
   - ts-morph, which only edits `.tsx`
   - source lookup through React's `fiber._debugSource`

   That last one is **already dead today**. Next 16's bundled React 19 has no `_debugSource` (0 occurrences in `next/dist/compiled/react-dom`, vs 9 in the installed React 18). Commits currently fall back to text search and regex. Astro can restore precise lookup (§5).

---

## 3. Target architecture

### Config sketch (verify option names against the installed 7.3.x)

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import factorframe from "./src/editor/astro"; // dev-only integration, no-op in builds

export default defineConfig({
  site: "https://monofactor.com",
  trailingSlash: "never",
  build: { format: "file" },             // keep /work/flux exactly as today
  adapter: node({ mode: "standalone" }),  // static pages + on-demand blog/og/actions
  integrations: [react(), factorframe()],
  vite: { plugins: [tailwindcss()] },
  image: { domains: ["monovex.monofactor.com"] },
  prefetch: { prefetchAll: true },
  devToolbar: { enabled: true },          // required for data-astro-source-* in dev
  cacheDir: "./.astro-cache",             // outside node_modules, so `npm ci` on deploy keeps optimized images
});
```

**No route cache at first.** Convex runs on the same server (127.0.0.1:3230), so uncached SSR is fast. Passenger can also run more than one process per app, and an in-memory cache with tag invalidation wouldn't be shared between them. If traffic ever needs it, add Astro's `cache`/`routeRules` with a Redis provider, or a Cloudflare cache rule.

### Route map

| Next today | Astro | Rendering |
|---|---|---|
| `app/layout.tsx` | `src/layouts/Base.astro` + `src/components/SEO.astro` | — |
| `app/page.tsx` | `src/pages/index.astro` | Prerendered; journal list is a server island |
| `app/work/*/page.tsx` + `layout.tsx` metadata | `src/pages/work/<slug>.astro` | Prerendered |
| `app/(convex)/blog/page.tsx` | `src/pages/blog/index.astro` | On demand |
| `app/(convex)/blog/[slug]/page.tsx` | `src/pages/blog/[slug].astro` | On demand, real 404 |
| `app/(convex)/nexus/**` (7 routes) | `src/pages/nexus/[...path].astro` → `<AdminApp client:only="react" />` | On-demand shell, `noindex` |
| `app/og/route.tsx` | `src/pages/og.ts` (template in a `.tsx` module) | On demand, long `Cache-Control` (Cloudflare caches it) |
| `app/sitemap.ts` | `src/pages/sitemap.xml.ts` | On demand |
| `app/robots.ts` | `public/robots.txt` | Static |
| `app/actions/contact.ts` | `src/actions/index.ts` → `contact` | Action endpoint |
| `app/api/editor-patches/**` | factorframe integration dev middleware | Dev only |
| `app/icon.svg`, `apple-icon.png`, `favicon.ico` | `public/` + explicit `<link>`s in `Base.astro` | Static |

### Component rules

1. **Static markup goes in `.astro`.** It ships no JS, and the dev compiler stamps it with source locations for the editor.
2. **Interactive or animated UI is a `.tsx` island.** Pick the directive by position:
   - global chrome: `client:load`
   - hero: `client:load` or `client:idle`
   - below the fold: `client:visible`
   - canvas/WebGPU: `client:only="react"`
3. **Text effects (BlinkText, ThinkingText) get a framework-free core.** It lives in `src/lib/fx/*.ts` and has two thin wrappers: a React one for use inside islands, and an `.astro` one driven by a single shared script.
4. **Primitives used in both worlds stay `.tsx`.** Button and Badge get thin `.astro` twins that share the same `cva` variants.
5. **React context never crosses an island boundary.** Carousel stays inside its parent island. The Convex provider exists only in `AdminApp`.
6. **Children passed from `.astro` into an island are opaque HTML.** No `React.Children` on them.
7. **Watch `space-y-*` and sibling selectors around islands.** `astro-island` is `display: contents`, so margins applied to it don't render. `gap` is fine.

### Component buckets

These were triaged with Jev, TypeSafe's classifier, then hand-checked. I changed 16 labels where it lacked context: commented-out usages, animated grandchildren, and components shared between the public blog and admin.

| Bucket | Components |
|---|---|
| **Delete (dead code)** | FpsOverlay, Sidebar, Journeys, Notes, Marquee\*, WarpedNoiseShader\* (\*imported, but the usage is commented out) |
| **Port to `.astro` (static)** | Footer, ToptalBadge, WorkNavigation, About, Hero (shell), SectionHeaderWrapper, IntroTextWrapper, ProjectMeta, Card, BlogPostCard, MfLogo, TiptapRenderer + CodeBlock/Columns/StyledBlock renderers. DualLineHeading and HeroHeadline get `.astro` twins |
| **Island, eager** | Header, BottomNav, LogoBar, HeroShader→AscendShader (`client:only`) |
| **Island, lazy** | WorkSection, DesignBits, Recommendations, Contact, ProcessCarousel, Lightbox, ShareBar, VideoPlayer (blog videos), image lightbox in blog posts |
| **Framework-free effect** | BlinkText, ThinkingText (React wrappers kept for use inside islands) |
| **Primitives (unchanged)** | Button, Badge, Input, Label, Textarea, Switch, Carousel, LazyVideo (+ Button/Badge `.astro` twins) |
| **Admin SPA (import swaps only)** | `admin/*` (15 files), Collapsible, Dialog, Dropzone, InsetWrapper, NumberButtons, input-group, ButtonGroup, WidthIcons |
| **Replaced by server rendering** | BlogPostClient (→ SSR page), home/BlogPosts (→ server island) |

**Where logic actually changes:**

- Lightbox
- Contact
- BlogPosts / BlogPostClient
- the DualLineHeading / HeroHeadline / Hero twins
- the BlinkText / ThinkingText core
- HeroShader's lazy import
- the nexus layout, login, posts pages and PostForm (router shim)
- the editor engine

Everything else is a move or an import swap.

---

## 4. Phased plan

Each phase ends in a runnable state. Estimates are focused days.

### Phase 0 — Baseline and guardrails (0.5 d)

**Branch setup (done 2026-10-08)**
- Branch `astro` lives in a worktree at `../mofactor-26-astro`. `main` stays on Next for side-by-side comparison.
- The worktree sits beside the repo, not inside it, so main's TypeScript and Tailwind don't scan it.
- The two can't share one `src/`: Next would treat `src/pages/*.ts` endpoints as Pages Router routes.
- **Never merge `astro` into `main` before the cutover runbook (§6).** Every push to `main` auto-deploys production.

**Baseline**
- Production `https://monofactor.com` stays on Next, so it remains the reference until cutover. Capture it any time before cutover.
- During development, compare the local Astro dev server against local Next on `main`.
- What to capture:
  - Playwright screenshots: 8 routes × 3 widths × light/dark.
  - A `<head>` snapshot for every route, plus `sitemap.xml` and `robots.txt`.
  - Lighthouse scores and JS bytes per route.

**Working rules**
- Run the annotation server with `--no-agents` during the migration. The orchestrator can revert in-flight edits.
- Freeze case-study copy, or log edits on `main` so they can be ported.

### Phase 1 — Scaffold (1 d)

**Packages and config**
- Install pinned versions of `astro` 7.3.x, `@astrojs/react` 7, `@astrojs/node` 11, `@tailwindcss/vite`, and `react`/`react-dom` 19 with types.
- Add `astro.config.mjs` and a `tsconfig` (Astro strict + `@/*` paths).
- Add an `astro:env` schema: `PUBLIC_CONVEX_URL` public, `BREVO_*` as server secrets. Rename the `NEXT_PUBLIC_*` vars.

**Layout and SEO**
- `Base.astro`: charset/viewport (`viewport-fit=cover`), Typekit, the no-flash theme script (`is:inline`), JSON-LD, icon links, and the Cal.com and GA scripts.
- `SEO.astro`: title template, absolute OG/Twitter URLs, canonical.
- `404.astro`.

**Styles**
- Move `globals.css` and `cms-safelist.css`.
- Change the env var name in `scripts/generate-safelist.mjs`. Read `PUBLIC_CONVEX_URL` and fall back to `NEXT_PUBLIC_CONVEX_URL`.

**Passenger entry and deploy script**
- Add `passenger.cjs`. It loads `.env.local` with `process.loadEnvFile()`, then runs `import("./dist/server/entry.mjs")`.
- Passenger loads startup files with `require()`, and its `listen()` hook catches the Astro server's call.
- This and `scripts/deploy.sh` (§6) are written now but only exercised at the staging step in Phase 8.
- `astro.config` reads `outDir` from `ASTRO_OUT_DIR`, so the script can build beside the live `dist/` and then swap.
- Add `public/.htaccess` for immutable `/_astro/*` caching.

**Editor (minimal)**
- Mount the editor from the integration in dev (`?raw` CSS import).
- Serve the patches API as dev middleware.
- Annotate mode then works from day one.

**Checkpoint:**
- `astro dev` runs locally.
- The shell renders with fonts and no theme flash.
- Annotations reach :4747.

### Phase 2 — Component layer (2–2.5 d)

**Cleanup and static ports**
- Delete the six dead components and their imports.
- Port these to `.astro`: Footer, ToptalBadge, WorkNavigation, SectionHeaderWrapper, IntroTextWrapper, ProjectMeta, Card, BlogPostCard, About, MfLogo.
- Add `Button.astro` and `Badge.astro` twins that reuse the `cva` variants exported from the `.tsx` files.

**Text effects**
- Extract `src/lib/fx/blink.ts` and `thinking.ts`: framework-free anime.js, each returning a cleanup function.
- The React `BlinkText`/`ThinkingText` become thin wrappers.
- The `.astro` versions render text plus `data-*` options. One shared script animates them with IntersectionObserver.
- Text is pre-hidden with CSS, so lazy hydration can't cause a visible → hidden → blink flash.
- `DualLineHeading.astro`, `HeroHeadline.astro` and `Hero.astro` compose these.

**Image pipeline**
- ~~Move the rasters into `src/assets/`.~~ They stay in `public/`; `src/lib/images.ts` optimizes them in place.
- `img()` resolver: a glob map keyed by the old public path, so `works.ts`, `designBits.ts` and page code keep their string paths.
- `islandImage()`: calls `getImage()` and returns `{ src, srcset, sizes, width, height }` for islands.
- A small React `<Img>` replaces `next/image` inside islands.

**Lightbox**
- Rewrite with event delegation. A `display: contents` wrapper catches clicks on descendant images, and the slide index comes from DOM order.
- Add `role="button"`, `tabindex` and Enter/Space handling.
- The `images` prop API stays the same. The zoom `fullSrc` comes from a large `getImage()` or the original file.

**Islands that only need import swaps**
- Header, BottomNav, LogoBar, LazyVideo, Carousel, ProcessCarousel, DesignBits, Recommendations, WorkSection, ShareBar, VideoPlayer.

**Checkpoint:** a temporary `/dev/kitchen-sink` page renders every component in light and dark.

### Phase 3 — Home (1–1.5 d)

**Page composition (`index.astro`)**
- Header and BottomNav: `client:load`.
- Hero: `Hero.astro`, LogoBar `client:load`, HeroShader `client:only="react"`.
- WorkSection, DesignBits (with pre-computed image props), Recommendations, Contact: `client:visible`.
- About and Footer: static.

**HeroShader**
- Replace `next/dynamic` with `React.lazy` so three.js stays out of the initial chunk.

**Contact form**
- Becomes an Astro Action: `accept: "form"`, zod input, honeypot, Brevo key from an `astro:env` secret.
- **HTML-escape every field** in the email body.
- The component uses `useActionState(withState(actions.contact), …)`.

**Journal list**
- Becomes `<BlogPosts server:defer>` with a skeleton fallback and a server-side Convex fetch.

**Checkpoint:** home matches the baseline screenshots, the contact email arrives, and there's no Convex websocket on the homepage.

### Phase 4 — Case studies ×5 (1.5–2 d)

**One `.astro` page per study**
- Each `layout.tsx`'s metadata becomes `SEO` props, and the layout files are deleted.

**Codemod (ts-morph is already a dev dependency)**
- On HTML elements only: `className` → `class`, `autoPlay` → `autoplay`, `playsInline` → `playsinline`. React components keep `className`.
- Drop `"use client"`.
- `<Image>` → `astro:assets` via `img()`.
- Astro 7's default `compressHTML: "jsx"` keeps JSX whitespace semantics, so the ported markup spaces the same way.

**Page parts**
- Lightbox grids, ProcessCarousel slides (one `getImage()` per slide) and video tags.
- Native `muted autoplay` now works without JS. React drops `muted` in SSR.

**Checkpoint:** all 5 pages match the baseline, and JS per page is recorded next to the baseline numbers.

### Phase 5 — Blog, OG, sitemap (1.5 d)

**Blog pages**
- `blog/index.astro` and `blog/[slug].astro`, rendered on demand.
- Server-side `ConvexHttpClient`, a real 404 for unknown slugs, and JSON-LD.
- Cover image through the remote image service. `image.domains` already lists `monovex.monofactor.com`.

**Post body**
- `TiptapRenderer.astro`: recursive, static HTML.
- Islands only for media nodes: an image lightbox and `VideoPlayer client:visible`. ShareBar is `client:visible`.
- Interim option: hydrate the existing React renderer as one island.

**No caching layer**
- See §3. Publishing is visible immediately, so no invalidation endpoint is needed.
- Optionally, SSR reads Convex through a server-only `CONVEX_URL=http://127.0.0.1:3230`, skipping TLS and nginx. The browser keeps using the public URL.

**SEO endpoints**
- `/og` endpoint with the same query params, so existing share cards keep working.
- `sitemap.xml.ts`: static routes plus Convex posts, with the same try/catch fallback as today.
- `public/robots.txt`.

**Unchanged limitation:** a post that uses brand-new Tailwind classes still needs a rebuild for its CSS. The safelist is generated at build time, same as today.

**Checkpoint:** post HTML is readable with JS off, an unknown slug returns 404, the OG image matches, and the sitemap lists posts.

### Phase 6 — Admin SPA (1 d)

**Mounting**
- `src/pages/nexus/[...path].astro`: `prerender = false`, `noindex`, renders `<AdminApp client:only="react" />`.
- `AdminApp` = ConvexProvider + Toaster + a `wouter` router with base `/nexus`.

**Router shim**
- `@/admin/navigation` exports `useRouter`, `usePathname`, `useParams` and `Link` with Next's call signatures.
- That makes the change an import swap in 9 files.
- The `next/image` logo becomes `<img>`.

**Preview page**
- Choose between keeping a React renderer copy inside admin, or pointing at a token-gated SSR preview route. The SSR route means one renderer and exact production fidelity.

**Dependencies**
- Keep the Yjs/collaboration packages. Nothing imports them directly, but they're required peer dependencies of `@tiptap/extension-drag-handle`.

**Checkpoint:** login, list, create/edit/publish, upload, preview and logout all work. A publish shows up on the public blog immediately.

### Phase 7 — factorframe precise editing (2–4 d)

See §5.

**Checkpoint:**
- A class/text/style edit round-trips on an `.astro` element and on an island element.
- An annotation goes through agent → resolved.

### Phase 8 — Parity QA, staging, cutover, cleanup (1.5–2 d)

**Automated parity (local)**
- Run the Phase 0 suite against a local production build (`astro build` + `astro preview`) and review the diffs.
- Compare Lighthouse scores and JS bytes.

**Staging (first server change)**
- With your OK, repoint tt6 to the `astro` branch (§6) and re-run the suite there against production.

**Manual pass**
- BlinkText/ThinkingText timing
- the hero shader, on WebGPU and the fallback
- video autoplay
- lightbox keyboard navigation and zoom
- carousels
- theme toggle with no flash
- BottomNav section tracking and nav-theme sampling
- Cal.com booking
- GA hits

**Deploy and rollback**
- Follow the cutover runbook in §6.
- Rollback is a one-setting flip back to `.next/standalone/server.js`, which keeps working as long as `.next/` stays on disk.

**Cleanup**
- Remove `next`, `raw-loader`, `next.config.ts`, `next-env.d.ts`, `.next/` and the TS `next` plugin.
- Update `README.md`/`README_TR.md`.
- Update the UI rules in `CLAUDE.md`/`AGENTS.md` for `.astro`: use `.astro` twins in static markup, and put interactive elements in `.tsx` islands.

### Estimate

| Phase | Focused days |
|---|---|
| 0 Baseline and guardrails | 0.5 |
| 1 Scaffold + editor annotate mode | 1 |
| 2 Component layer | 2–2.5 |
| 3 Home | 1–1.5 |
| 4 Case studies | 1.5–2 |
| 5 Blog, OG, sitemap | 1.5 |
| 6 Admin SPA | 1 |
| 7 factorframe precise editing | 2–4 |
| 8 QA, cutover, cleanup | 1.5–2 |
| **Total** | **12–16** |

Phases 3–6 can run in any order after Phase 2. Phase 7 can trail the cutover.

---

## 5. factorframe on Astro

**Carries over unchanged:**
- selection overlay
- patch store and applicator (its MutationObserver re-applies patches after islands hydrate)
- annotation UI
- SSE sync to :4747
- MCP server and orchestrator
- Tailwind class index (it reads the CSSOM, and Vite dev serves CSS as readable `<style>` tags)

**Changes:**

1. **Ship it as an Astro integration.** This fits the plan to make factorframe a pluggable package.
   - `astro:config:setup` (dev only) calls `injectScript("page", …)` to mount the editor in its own React root.
   - `astro:server:setup` serves `/api/editor-patches` through `server.middlewares.use`. That makes it dev-only by construction, with no production routes.
   - It can also spawn the annotation server, so `npm run dev` no longer needs `next dev & tsx …`.
   - The core stays framework-agnostic. Next becomes one adapter and Astro another.

2. **Resolve sources** in a new `engine/source.ts`, replacing the `fiber.ts` lookups.
   - **`.astro` elements:** Astro's dev compiler stamps `data-astro-source-file` and `data-astro-source-loc` on every element. This only happens in dev, with `devToolbar.enabled`.
   - **React islands:** React 19 has no `_debugSource`. Add a dev-only transform that stamps `data-ff-src="file:line:col"` on intrinsic JSX elements, either as a Vite plugin (Oxc parser + magic-string) or a tiny Babel plugin via `@rolldown/plugin-babel`. `@astrojs/react` 7 removed its `babel` option. The transform must run for both SSR and client builds, or hydration will mismatch.
   - Keep the fiber walk only for component names and props inside islands.

3. **Write commits to `.astro` files.** Parse with the Astro compiler, which reports positions, and edit with magic-string. Supported: static `class` strings, inline `style`, static text. Dynamic `class` values (`class={…}`, `class:list`) are refused with a clear message and handed to an agent. The ts-morph writer keeps handling `.tsx`, and gets exact locations again.

4. **Extend the fallbacks.** Text search scans `.astro` as well as `.tsx`. The regex fallback's `pathname → src/app/<route>/page.tsx` mapping becomes `src/pages/<route>.astro`.

5. **Props tab.** It works for island components, since fibers still carry `memoizedProps`. `.astro` components have no runtime props, so hide the tab for them. Reading props from the parent call site could come later.

6. **Agent prompt.** `server/prompt.ts` currently says "Next.js App Router". It should describe Astro pages plus React islands, and say where each kind of change goes.

7. **Optional:** register the mode toggles as an Astro dev toolbar app.

---

## 6. Hosting and deployment (Plesk)

### Today (inspected read-only, 2026-10-08)

**Server**
- Plesk Obsidian 18.0.80 on Debian 12 at `51.255.76.127`: 32 cores, 125 GB RAM.
- The apex `monofactor.com` goes through Cloudflare. `www` and `monovex` point straight at the server.

**Request path**
- Cloudflare → nginx (Plesk) → Apache :7081 → Passenger 6.1.8 (Plesk Node.js extension) → `next-server`.

**App**
- Node `/opt/plesk/node/22` (22.23.3).
- Application root and document root are **both** `httpdocs`.
- Startup file: `.next/standalone/server.js`.

**Deploys (Plesk Git extension)**
- Repo `mofaletta-26.git` pulls `git@github.com:mofactor/mofactor-26.git`, branch `main`, automatically on push.
- After each pull it runs:
  1. `npm ci`
  2. `npm run build`
  3. `cp -r public .next/standalone/`
  4. `cp -r .next/static .next/standalone/.next/`
  5. `cp .env.local .next/standalone/.env.local`
  6. `touch tmp/restart.txt`

**`tt6.monofactor.com`**
- A second Passenger app in the same subscription, with its own document root and repo (`mofactor-26.git`).
- It also auto-deploys `main`, but its files date from early April.

**Convex**
- Self-hosted in Docker on the same box: `convex-monofactor-backend-1` on 127.0.0.1:3230/3231, public as `monovex.monofactor.com`.

**Env**
- Production `.env.local` holds `BREVO_*`, `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CONVEX_URL`.

### Target

Same server, same Plesk/Passenger/Git setup, and no new services.

| Setting | Next today | Astro |
|---|---|---|
| Startup file | `.next/standalone/server.js` | `passenger.cjs`: loads `.env.local`, then imports `dist/server/entry.mjs` |
| Document root | `httpdocs`, the app root. This is why the source tree is public (§10) | `httpdocs/dist/client`. Apache serves built files directly, and everything else goes to Passenger |
| Node | 22.23.3 | 22.23.3 works (Astro needs ≥ 22.12). Plesk's 24.21.0 LTS is the better choice |
| Post-deploy actions | npm ci, build, 3 copies, restart | `bash scripts/deploy.sh` (below) |
| Env | `NEXT_PUBLIC_*` | Add `PUBLIC_CONVEX_URL`, plus an optional server-only `CONVEX_URL=http://127.0.0.1:3230`. Keep the old names until Next is gone |
| Static assets | Served by Next | Apache serves `dist/client`. A `public/.htaccess` adds immutable caching for `/_astro/*`, and Cloudflare caches at the edge |
| Image cache | n/a | `cacheDir: ./.astro-cache`, which survives `npm ci` |

**`scripts/deploy.sh`** (committed, so it's versioned and fail-safe):

```bash
#!/usr/bin/env bash
set -euo pipefail
npm ci
ASTRO_OUT_DIR=dist-next npm run build      # astro.config reads outDir from ASTRO_OUT_DIR
rm -rf dist-prev
[ -d dist ] && mv dist dist-prev
mv dist-next dist                          # near-atomic swap: the live build is never half-written
touch tmp/restart.txt
```

If the build fails, the script exits before the swap and the current build keeps serving. Today's actions rebuild in place, so a failed build can leave things half-written.

### Staging on tt6 (Phase 8, after local parity; Plesk changes, so confirm first)

1. tt6 Git repo: switch the branch from `main` to `astro`, and set the post-deploy action to `bash scripts/deploy.sh`.
2. tt6 Node.js settings: startup file `passenger.cjs`, document root `tt6.monofactor.com/dist/client`, Node 24.
3. tt6 `.env.local`: add `PUBLIC_CONVEX_URL` and `CONVEX_URL`.
4. Push `astro`, read the deploy log, smoke-test, then run the parity suite: tt6 (Astro) vs monofactor.com (Next).

### Production cutover runbook

**Pre-flight**
- The document root is already off the app root (§10, item 0). Otherwise the merge in step 2 briefly serves the new tree publicly, including this plan's server details.
- tt6 passes the parity suite.
- `monofactor.com/.env.local` has the new `PUBLIC_*` vars. These are additive and harmless to Next.
- Content freeze is in effect.

**Steps**
1. **Plesk → monofactor.com → Git:** set the post-deploy action to `bash scripts/deploy.sh`. Next keeps serving, because it runs from `.next/standalone`, which carries its own `node_modules`.
2. **Merge `astro` into `main` and push.** Plesk deploys: `npm ci` plus the Astro build into `dist/`. The restart is harmless, because the startup file still points at Next.
3. **Plesk → Node.js:** set the startup file to `passenger.cjs`, the document root to `httpdocs/dist/client`, and Node to 24. Then restart the app. Astro is now live.
4. **Smoke test:**
   - every route returns 200, and an unknown blog slug returns 404
   - contact form
   - admin login and publish
   - `/og`
   - `/sitemap.xml`
   - theme toggle, videos

**Rollback**
- Set the startup file back to `.next/standalone/server.js` and the document root to `httpdocs/public`, then restart.
- This works as long as `.next/` stays on disk. Keep it for a week, then delete it along with the Next dependencies.

---

## 7. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| Text effects behave differently under lazy hydration (text visible, then hidden, then blinks in) | High / Medium | Framework-free effect script with a CSS pre-hide, or `client:idle` |
| Spacing drifts where `space-y-*` wraps an island (`astro-island` is `display: contents`) | Medium / Low | Screenshot diffs catch it. Use `gap` or wrap the island |
| Lightbox regressions (slide index, keyboard, grid layout) | Medium / Medium | Delegation rewrite + a11y attributes, plus a Playwright test per gallery |
| Image bytes or quality regress vs next/image; build time grows | Medium / Medium | `astro:assets` srcset/avif, a per-route bytes comparison, and the image cache |
| SEO drift (relative OG URLs, missing icons, trailing slashes, canonical) | Medium / High | A `<head>` diff across all routes before cutover |
| `.astro` commit writer takes longer than estimated | Medium / Low (dev only) | Annotate mode ships first. Time-box precise commits |
| Astro 7 is about 4 months old, and the Rust compiler is stricter | Low / Medium | Pin versions. Run `astro check` and a build in CI |
| Convex latency or outage on SSR blog pages | Low / Medium | Route cache with stale-while-revalidate, plus try/catch like today's sitemap |
| Content drifts between `main` and `astro` | Medium / Low | Content freeze or a change log |
| `main` auto-deploys production, so an early merge would ship a half-done site (and the old Next deploy actions would fail on it) | Medium / High | Merge only through the §6 runbook. Day-to-day work goes to `astro` → tt6 |
| Passenger doesn't start Astro's ESM entry | Low / Medium | `passenger.cjs` wrapper, proven on tt6 before production |

---

## 8. Decisions

**Resolved 2026-10-08**
- **Goal:** migrate, islands-first. Astro is the better tool for a website.
- **Hosting:** stay on the Plesk server with Passenger and Git auto-deploy (§6).
- **Editor:** annotate mode in Phase 1. Precise `.astro` commits after cutover.
- **Blog:** on-demand SSR, no cache layer for now (§3).

**Defaults I'll follow unless you say otherwise**
- Text effects: framework-free script.
- Admin: embedded `client:only` SPA.
- Node 24 for the Astro app.
- The admin preview renders through the public SSR route, so it matches production exactly.

**Still needs your OK (server changes)**
- Repoint `tt6.monofactor.com` to the `astro` branch as staging.
- The document-root fix in §10.

**Optional:** cross-document view transitions (CSS only, no client router) for page changes.

---

## 9. Parity checklist

**Routes and URLs**
- [ ] Every route returns the same status code. An unknown blog slug now correctly returns 404.
- [ ] URLs have no trailing slash, same as today.

**SEO**
- [ ] Title, description and canonical match on every route.
- [ ] `og:*` and `twitter:*` tags match, with absolute image URLs.
- [ ] JSON-LD on `/` and on blog posts.
- [ ] Favicon, SVG icon and apple-touch-icon links are present.
- [ ] `sitemap.xml` includes posts; `robots.txt` matches.
- [ ] `/og?title=…&subtitle=…` renders the same image.

**Security**
- [ ] Source files return 404 on tt6 and production (`/package.json`, `/src/...`, `/node_modules/...`).

**Look and behavior**
- [ ] Light/dark screenshots at 375, 768 and 1440 px are within tolerance (hero canvas masked).
- [ ] No theme flash on load, the toggle persists, and every island stays in sync.
- [ ] BottomNav tracks sections and samples the nav theme over dark media.
- [ ] Videos autoplay muted inline. Lightbox opens the right slide, and arrows, zoom and Escape work.
- [ ] Carousels autoplay and scroll with the wheel.

**Integrations**
- [ ] The contact form sends, the honeypot works, and errors show.
- [ ] Cal.com opens and GA records page views.

**Admin**
- [ ] Login, CRUD, upload, preview and publish work, and publishing invalidates the blog cache.

**Editor**
- [ ] Annotate → agent → resolve works.
- [ ] Edit → commit works on `.astro` and on `.tsx`.

**Performance**
- [ ] JS bytes and Lighthouse scores per route are at least as good as the baseline.

---

## 10. Found during the audit (fix regardless)

0. **The whole source tree is publicly downloadable, on both monofactor.com and tt6.** Fix this now, independent of the migration.
   - Examples that return 200: `/package.json`, `/src/app/actions/contact.ts`, `/convex/auth.ts`, `/README.md`, `/.claude/annotation-history.json`, `/.mcp.json`, `/node_modules/**` and `/.next/**`.
   - Cause: Plesk's document root is the app root (`httpdocs`), and Apache serves any file that exists there.
   - No secrets leak: every `.env*` path, including the copy in `.next/standalone/`, returns 403.
   - **Fix now:** in Plesk → Node.js, set the document root to `httpdocs/public` (and `tt6.monofactor.com/public` for tt6).
1. **Contact email injects user input as HTML.** `${name}`, `${subject}` and `${message}` go into the email's `htmlContent` unescaped. Escape them, either in the new Action or in Next now.
2. **Blog is client-rendered.** Content is invisible without JS, and missing slugs return 200.
3. **The homepage opens a Convex websocket** just to show three post titles.
4. **The editor's precise source path never runs on Next 16.** `_debugSource` doesn't exist in React 19.
5. **`"latest"` ranges** for next, react, react-dom, tailwindcss and typescript. React 18.3.1 is installed, while Next renders with its bundled React 19.
6. ~~Unused dependencies~~ Correction: yjs, y-protocols, @tiptap/extension-collaboration and @tiptap/y-tiptap are required peers of `@tiptap/extension-drag-handle`, so they stay.
7. **Six dead components** (§3).

---

## Appendix A — Mechanical swap inventory

- **`next/link` (12):**
  - blog: `BlogPostClient`, `components/blog/BlogPostCard`
  - nexus: `layout`, `page`, `posts/[id]/page`, `posts/[id]/preview/page`, `posts/new/page`, `components/admin/PostList`
  - home: `WorkSection`, `BlogPosts`, `Notes` (dead)
  - work: `components/WorkNavigation`
- **`next/image` (10):**
  - `nexus/layout`
  - all 5 `work/*/page.tsx`
  - `ProcessCarousel`
  - home: `About`, `DesignBits`, `Recommendations`
- **`next/navigation` (6):** nexus `layout`, `login`, `posts/[id]`, `posts/[id]/preview`; `components/admin/PostForm`; `FpsOverlay` (dead)
- **`next/dynamic` (3):** `app/page`, `home/HeroShader`, `editor/DevEditorLoader`
- **`next/server` (3):** `api/editor-patches`, `api/editor-patches/commit`, `og/route`
- **`next/script` (1):** `app/layout` (Cal.com + GA)
- **`process.env.NEXT_PUBLIC_*`:** `(convex)/layout`, `home/BlogPosts`, `lib/convex`, `app/layout` (SITE_URL), and `scripts/generate-safelist.mjs`, which reads `.env.local` directly

## Sources

- Astro v7 upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v7/
- Images guide (public/ isn't optimized; using images in framework components): https://docs.astro.build/en/guides/images/
- Route caching (`cache`, `routeRules`): https://docs.astro.build/en/guides/caching/
- React integration (`withState`, children as one static block, `experimentalReactChildren`, Oxc replacing Babel): https://docs.astro.build/en/guides/integrations-guide/react/
- Template syntax vs JSX: https://docs.astro.build/en/reference/astro-syntax/
- `annotateSourceFile` gating in the compiler: https://github.com/withastro/astro/blob/main/packages/astro/src/core/compile/compile.ts
- Versions checked on npm (2026-10-07): astro 7.3.6, @astrojs/react 7.0.1, @astrojs/node 11.1.7, react 19.3.0
