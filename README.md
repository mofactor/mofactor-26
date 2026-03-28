# Monofactor

A portfolio website and CMS platform built with Next.js, Convex, and a bespoke live visual editor. Features a block-based blog engine powered by Tiptap with Tailwind class assignment on any content block.

## Tech Stack

- **Framework:** Next.js (App Router, standalone output)
- **Backend:** [Convex](https://convex.dev) (self-hosted compatible)
- **Styling:** Tailwind CSS v4
- **Content Editor:** Tiptap (block-based, with custom extensions)
- **UI Primitives:** @base-ui/react, lucide-react
- **Animations:** Anime.js, Three.js (WebGL shaders)
- **Carousel:** Embla Carousel

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Convex instance (cloud or [self-hosted](https://docs.convex.dev/self-hosting))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` (or create `.env.local`) with the following:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-convex-instance.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-convex-site.example.com
CONVEX_SELF_HOSTED_URL=https://your-convex-instance.example.com    # only for self-hosted
CONVEX_SELF_HOSTED_ADMIN_KEY=your-admin-key                        # only for self-hosted

# Site
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Contact form (Brevo / Sendinblue)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=you@example.com
BREVO_RECIPIENT_EMAIL=inbox@example.com
```

**Convex environment variable (server-side):**

Set the admin password on your Convex instance for CMS authentication:

```bash
npx convex env set ADMIN_PASSWORD your-secure-password
```

### 3. Start Convex

```bash
npx convex dev
```

This syncs your `convex/` functions and schema to the Convex instance.

### 4. Start the dev server

```bash
npm run dev
```

The `predev` script auto-generates a Tailwind safelist from published blog posts before starting.

### 5. Build for production

```bash
npm run build
npm start
```

---

## CMS / Convex Setup

### Schema Overview

Defined in `convex/schema.ts`:

| Table | Purpose |
|-------|---------|
| **posts** | Blog posts with Tiptap JSON content, cover images, SEO fields, tags, draft/published status |
| **files** | File library — uploaded images and assets stored in Convex storage |
| **sessions** | Admin authentication sessions (7-day expiry) |

### Authentication

The CMS uses a simple password-based auth flow (`convex/auth.ts`):

1. Admin navigates to `/nexus/login`
2. Password is validated against the `ADMIN_PASSWORD` env var on the Convex server
3. A session token is created (valid for 7 days) and stored in `localStorage`
4. All admin mutations/queries require a valid session token

### Convex Functions

**`convex/posts.ts`** — Blog post CRUD:

| Function | Type | Auth | Description |
|----------|------|------|-------------|
| `list` | query | public | All published posts |
| `listRecent` | query | public | Recent posts (default 6) |
| `getBySlug` | query | public | Single post by URL slug |
| `listAll` | query | admin | All posts (draft + published) |
| `getById` | query | admin | Single post by ID |
| `create` | mutation | admin | Create a new draft post |
| `update` | mutation | admin | Update post content/metadata |
| `publish` | mutation | admin | Set post status to published |
| `unpublish` | mutation | admin | Revert to draft |
| `remove` | mutation | admin | Delete post and cover image |
| `generateUploadUrl` | mutation | admin | Get a Convex storage upload URL |
| `allUsedClasses` | query | public | Collect Tailwind classes from all posts (for safelist) |

**`convex/files.ts`** — File library management

**`convex/auth.ts`** — Login, session validation, logout

### Tailwind Safelist Generation

Blog posts can use arbitrary Tailwind classes on any content block. To ensure these classes are included in the production CSS build:

```bash
npm run generate:safelist
```

This script (`scripts/generate-safelist.mjs`) queries all published posts via `allUsedClasses`, extracts every Tailwind class from the Tiptap JSON, and writes a safelist file that Tailwind picks up during build. This runs automatically before `dev` and `build`.

---

## CMS Admin Panel (`/nexus`)

The admin interface lives at `/nexus` and provides:

- **Dashboard** — List of all posts with status indicators
- **Post Editor** — Full Tiptap block editor with:
  - Slash command menu (`/`) for inserting blocks
  - Multi-column layouts
  - Styled containers with arbitrary Tailwind classes
  - Image and video embedding with file picker
  - Code blocks with syntax highlighting
  - Drag-and-drop block reordering
  - Node inspector for assigning Tailwind classes to any block
- **File Library** (`/nexus/files`) — Upload and manage media assets
- **SEO Fields** — Per-post title and meta description with character counts
- **Tags** — Multi-tag system
- **Draft/Publish workflow** — Preview drafts before going live

---

## Live Visual Editor (`src/editor/`)

A bespoke development tool with two modes — **Edit** mode for applying DOM patches, and **Annotate** mode for leaving visual feedback that Claude agents resolve autonomously. This is **not** the blog content editor — it's a developer tool for tweaking the site's own UI.

### Modes

| Shortcut | Mode | Purpose |
|----------|------|---------|
| `E` `E` | Edit | Select elements, modify classes/styles/props/text, persist patches |
| `A` `A` | Annotate | Click any element, leave feedback — Claude agents pick it up and implement changes |

### Edit Mode

1. **Select**: Click any element on the page to inspect it
2. **Edit**: Use the inspector panel to modify classes, styles, props, or text
3. **Persist**: Patches are saved to `localStorage` and synced to a JSON file via API
4. **Commit**: Optionally commit patches directly to source files (uses `ts-morph` for AST manipulation)

#### Patch Operations

The editor creates reversible "patches" — each targets a CSS selector on a specific page and applies one or more operations:

| Operation | Description |
|-----------|-------------|
| `text` | Change text content |
| `addClass` | Add a CSS/Tailwind class |
| `removeClass` | Remove a class |
| `setStyle` | Set an inline CSS property |
| `removeStyle` | Remove an inline CSS property |
| `hide` | Set `display: none` |
| `show` | Remove `display: none` |
| `setProp` | Change a JSX prop value |

### Annotate Mode

1. **Click** any element — a popup appears with an intent picker (fix / change / question / approve)
2. **Describe** what you want changed in plain language
3. The annotation is synced to the local annotation server (port 4747)
4. The **orchestrator** automatically spawns a Claude agent in an isolated git worktree
5. The agent reads the source file, implements the change, and commits
6. Progress and agent replies stream back to the browser in real-time via SSE
7. **Reply** to an annotation thread to give follow-up instructions — the agent re-spawns with the new context

Annotations include rich element context: source file location (via React fiber traversal), CSS classes, computed styles, nearby text, accessibility info, and the React component stack.

### Architecture

```
src/editor/
├── index.tsx                # DevEditor entry point & loader
├── DevEditorLoader.tsx      # Dynamic import guard (dev-only)
├── EditorProvider.tsx       # React context — state, modes, patch/annotation management, SSE
├── EditorPanel.tsx          # Inspector panel (classes, styles, props, text, meta)
├── EditorOverlay.tsx        # Visual selection overlay & bounding box (capture-phase listeners)
├── EditorToolbar.tsx        # Bottom HUD — mode toggles, patch count, annotation controls
├── AnnotationOverlay.tsx    # Annotation UI — hover highlight, create/reply popups, markers
├── types.ts                 # Patch, Annotation, ThreadMessage, Intent, Severity, Status types
├── constants.ts             # Shared constants (data attributes, API paths, debounce values)
├── editor.raw.css           # Editor styles injected as raw string (avoids Tailwind conflicts)
│
├── engine/
│   ├── fiber.ts             # React fiber traversal for source locations & component props
│   ├── selector.ts          # CSS selector generation & validation
│   ├── patches.ts           # PatchStore — dual persistence (localStorage + file API)
│   ├── applicator.ts        # PatchApplicator — apply/revert patches, MutationObserver re-apply
│   ├── annotations.ts       # Annotation persistence, element identification helpers
│   ├── output.ts            # Markdown output generator (compact/standard/detailed/forensic)
│   └── sync.ts              # HTTP client — syncs annotations to port 4747, SSE subscription
│
├── panels/
│   ├── ClassEditor.tsx      # Tailwind class editor with autocomplete
│   ├── StyleEditor.tsx      # Inline style editor
│   ├── TextEditor.tsx       # Text content editor
│   ├── PropsEditor.tsx      # React props editor
│   └── MetaInfo.tsx         # Element metadata display
│
├── tailwind/
│   └── class-index.ts       # Runtime Tailwind class lookup & autocomplete index
│
└── server/                  # Annotation server (standalone Node.js process)
    ├── index.ts             # Entry point — starts HTTP + MCP + orchestrator
    ├── http.ts              # REST API + SSE server on port 4747
    ├── store.ts             # In-memory annotation store + EventBus (1000-event replay)
    ├── mcp.ts               # MCP server (stdio) — editor_watch, editor_resolve, etc.
    ├── orchestrator.ts      # Multi-agent orchestrator — auto-spawns Claude per annotation
    ├── prompt.ts            # Agent prompt builders (initial + follow-up)
    └── agent-types.ts       # AgentInfo interface
```

### Annotation Server

The annotation server (`src/editor/server/`) is a standalone Node.js process that runs alongside Next.js during development. It has three layers:

#### HTTP API (port 4747)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sessions` | POST | Create a session (keyed to a page URL) |
| `/sessions/:id/annotations` | POST | Add an annotation |
| `/annotations/:id` | PATCH | Update annotation status/intent |
| `/annotations/:id/thread` | POST | Add a thread message |
| `/pending` | GET | List all unresolved annotations |
| `/sessions/:id/pending` | GET | Unresolved annotations for a session |
| `/events` | GET | SSE stream (all events) |
| `/sessions/:id/events` | GET | SSE stream (session-scoped) |
| `/agents` | GET | List running agents |
| `/agents/:id/abort` | POST | Abort a running agent |
| `/annotations/:id/respawn` | POST | Re-trigger agent for an annotation |

#### MCP Server (stdio)

Exposes the `editor-annotations` MCP server for Claude Code integration. Tools:

| Tool | Description |
|------|-------------|
| `editor_list_sessions` | List active annotation sessions |
| `editor_get_pending` | Get unresolved/unclaimed annotations |
| `editor_acknowledge` | Mark annotation as acknowledged |
| `editor_resolve` | Mark as resolved with summary |
| `editor_dismiss` | Dismiss with reason |
| `editor_reply` | Add agent message to thread |
| `editor_watch` | Block until new annotations or replies arrive (loop-based) |

In `--no-agents` mode, Claude Code uses these MCP tools directly to process annotations manually via the `editor_watch` loop.

#### Multi-Agent Orchestrator

When a new annotation arrives, the orchestrator automatically:

1. Creates a **git worktree** at `.claude/worktrees/agent/{annotationId}` on a new branch
2. Spawns a Claude agent (`claude-sonnet-4-6`, max 50 turns) via `@anthropic-ai/claude-agent-sdk`
3. The agent reads the source file, implements the requested change, and commits
4. Progress streams back over SSE — the browser shows a live "Claude thinking..." indicator
5. On success, the annotation is marked `resolved` and a summary is posted to the thread

Limits: max 6 concurrent agents. Follow-up thread replies abort the current agent and re-spawn with updated context.

#### Server Startup Modes

```bash
npx tsx src/editor/server/index.ts              # HTTP + MCP + agents (default)
npx tsx src/editor/server/index.ts --mcp-only   # MCP only (for Claude Code)
npx tsx src/editor/server/index.ts --no-agents  # HTTP + MCP, no auto-spawn
npx tsx src/editor/server/index.ts --port 5000  # Custom port
```

### Patch API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/editor-patches` | GET | Fetch all patches |
| `/api/editor-patches` | POST | Create or update a patch |
| `/api/editor-patches/commit` | POST | Commit a patch to the source file via AST |

### Important Notes

- The live editor is a **development-only** tool — it is disabled in production builds
- Patches live in a JSON file and `localStorage`; they don't affect the production build until committed to source
- The "Commit to Source" feature uses `ts-morph` to modify the actual `.tsx` files, adding/removing classes or changing props directly in the AST
- Annotations are transient (in-memory on the server, localStorage in the browser with 7-day retention) — they are developer feedback, not persistent data
- The orchestrator's spawned agents are explicitly forbidden from using the `editor-annotations` MCP tools to prevent recursive annotation loops

---

## Codebase Structure

```
├── convex/                          # Convex backend
│   ├── schema.ts                    # Database schema (posts, files, sessions)
│   ├── posts.ts                     # Post CRUD functions
│   ├── files.ts                     # File library functions
│   └── auth.ts                      # Authentication (login, sessions)
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Homepage
│   │   ├── (convex)/                # Routes using Convex provider
│   │   │   ├── blog/                # Public blog
│   │   │   │   ├── page.tsx         # Blog listing
│   │   │   │   └── [slug]/          # Dynamic blog post pages
│   │   │   └── nexus/               # Admin CMS
│   │   │       ├── login/           # Admin login
│   │   │       ├── page.tsx         # Dashboard
│   │   │       ├── posts/           # Post editor (new, edit, preview)
│   │   │       └── files/           # File library
│   │   ├── work/                    # Portfolio project pages
│   │   │   ├── solitonic/
│   │   │   ├── flux/
│   │   │   ├── postlight/
│   │   │   ├── airbit/
│   │   │   └── wadi-grocery/
│   │   ├── api/
│   │   │   ├── editor-patches/      # Live editor patch API
│   │   │   └── og/                  # Dynamic OG image generation
│   │   ├── actions/
│   │   │   └── contact.ts           # Contact form server action
│   │   ├── robots.ts                # robots.txt generation
│   │   └── sitemap.ts               # sitemap.xml generation
│   │
│   ├── components/
│   │   ├── ui/                      # Reusable UI components (Button, Input, Dialog, etc.)
│   │   ├── admin/                   # CMS admin components
│   │   │   ├── PostForm.tsx         # Blog post editor form
│   │   │   ├── PostList.tsx         # Posts dashboard
│   │   │   ├── FileLibrary.tsx      # File manager
│   │   │   └── editor/              # Tiptap editor & extensions
│   │   │       ├── TiptapEditor.tsx
│   │   │       └── extensions/      # Custom Tiptap extensions
│   │   │           ├── ColumnsExtension.ts
│   │   │           ├── StyledBlockExtension.ts
│   │   │           ├── ImageExtension.ts
│   │   │           ├── VideoExtension.ts
│   │   │           ├── LogoDividerExtension.ts
│   │   │           ├── StylableNodesExtension.ts
│   │   │           └── SlashCommand.ts
│   │   ├── cms/                     # Blog rendering
│   │   │   ├── TiptapRenderer.tsx   # Tiptap JSON → React
│   │   │   └── renderers/           # Block-specific renderers
│   │   ├── home/                    # Homepage sections
│   │   └── blog/                    # Blog-specific components
│   │
│   ├── editor/                      # Live visual editor & annotation system (dev tool)
│   │   ├── index.tsx                # Entry point
│   │   ├── EditorProvider.tsx       # State management (edit + annotate modes)
│   │   ├── EditorPanel.tsx          # Inspector panel
│   │   ├── EditorOverlay.tsx        # Selection overlay
│   │   ├── AnnotationOverlay.tsx    # Annotation UI (create, reply, markers)
│   │   ├── EditorToolbar.tsx        # Bottom HUD
│   │   ├── engine/                  # Core engine (fiber, selector, patches, applicator, annotations, sync)
│   │   ├── panels/                  # Editor panel sub-components
│   │   ├── tailwind/                # Tailwind class index
│   │   └── server/                  # Annotation server (HTTP + MCP + orchestrator)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAdminSession.ts       # Admin auth state
│   │   └── useTheme.ts              # Dark/light mode
│   │
│   └── lib/                         # Utilities
│       ├── convex.ts                # Convex client setup
│       ├── admin-auth.ts            # Token management
│       ├── tw-classes.ts            # Tailwind class utilities
│       ├── tw-arbitrary.ts          # Arbitrary class CSS generation
│       └── utils.ts                 # General helpers
│
├── scripts/
│   └── generate-safelist.mjs        # Tailwind safelist generator
│
├── public/                          # Static assets
├── next.config.ts                   # Next.js config (standalone, image remotes)
├── postcss.config.mjs               # PostCSS config (Tailwind v4)
├── tsconfig.json                    # TypeScript config
└── package.json
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server + annotation server (auto-generates Tailwind safelist) |
| `npm run build` | Production build (auto-generates safelist before build) |
| `npm start` | Run production server |
| `npm run generate:safelist` | Manually regenerate the Tailwind safelist from published posts |
| `npx convex dev` | Start Convex dev sync |

---

## Data Flow

### Annotation Workflow

```
Browser                         Annotation Server (4747)              Git / Claude Agent
───────                         ────────────────────────              ──────────────────
Press AA → annotate mode
Click element → popup
Submit comment ───────────────→ POST /sessions/:id/annotations
                                    │
                                    ├─→ EventBus emits annotation.created
                                    │
                                    └─→ Orchestrator receives event
                                            │
                                            ├─→ Creates git worktree
                                            │   (.claude/worktrees/agent/{id})
                                            │
                                            └─→ Spawns Claude agent (sonnet) ──→ Reads source file
                                                    │                            Implements change
                                                    │                            Commits to branch
                                                    │
SSE ← agent.progress ←─────── EventBus ←────── Agent streams progress
SSE ← thread.message ←─────── EventBus ←────── Agent posts summary
SSE ← annotation.updated ←─── EventBus ←────── Marks resolved
```

### Patch Workflow (Edit Mode)

```
Click element → EditorPanel opens
Modify classes/styles/text
    │
    ├─→ Live DOM preview (PatchApplicator)
    ├─→ localStorage (immediate)
    └─→ /api/editor-patches (debounced 500ms) → JSON file

"Commit to Source" → /api/editor-patches/commit → ts-morph AST edit → .tsx file updated
```

---

## License

MIT
