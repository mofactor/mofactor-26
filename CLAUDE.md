# Project Rules

## UI Components — No Raw HTML Elements

Never use raw HTML elements when a UI component exists in `src/components/ui/`. Always prefer the project's component library.

**Prohibited raw elements → Use instead:**
- `<button>` → `<Button>` from `@/components/ui/Button`
- `<input>` → `<Input>` from `@/components/ui/Input`
- `<textarea>` → `<Textarea>` from `@/components/ui/Textarea`
- `<label>` → `<Label>` from `@/components/ui/Label`
- `<dialog>` → `<Dialog>` from `@/components/ui/Dialog`
- `<select>` → Use appropriate UI component or `@base-ui/react` primitive
- `<switch>` / checkbox toggle → `<Switch>` from `@/components/ui/Switch`

**Exception:** Raw HTML is acceptable only when a UI component genuinely does not exist for the use case and creating one would be overkill (e.g., semantic elements like `<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`, `<form>`).

Before writing any interactive element, check `src/components/ui/` for an existing component.

## Annotation Feedback Loop

When the `editor-annotations` MCP server is connected (check `/mcp`), automatically watch for user annotations:

1. Call `editor_watch` to pick up new annotations and thread replies
2. For each annotation: `editor_acknowledge` → process it → `editor_reply` or `editor_resolve`
3. After processing, call `editor_watch` again immediately — **never stop the loop** unless the user says to stop
4. If `editor_watch` times out with no activity, call it again

This runs the annotation HTTP server on port 4747. The browser sends annotations there, and your responses flow back via SSE.
