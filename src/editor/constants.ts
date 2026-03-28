export const EDITOR_ATTR = "data-editor-root";
export const EDITOR_PATCHED_ATTR = "data-editor-patched";

export const SHORTCUT_KEY = "e";

export const MUTATION_DEBOUNCE_MS = 100;
export const SAVE_DEBOUNCE_MS = 500;

export const API_ENDPOINT = "/api/editor-patches";

/** Check if the platform shortcut modifier is held (Cmd on Mac, Ctrl elsewhere). */
export function isShortcutModifier(e: KeyboardEvent): boolean {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return isMac ? e.metaKey : e.ctrlKey;
}
