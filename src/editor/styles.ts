/**
 * All editor CSS injected as a runtime <style> tag.
 * Scoped to [data-editor-root] and editor-specific classes.
 * No dependency on Tailwind or the site's styles.
 */
import editorCSS from "./editor.raw.css";

export function injectEditorStyles(): () => void {
  const style = document.createElement("style");
  style.setAttribute("data-editor-styles", "");
  style.textContent = editorCSS;
  document.head.appendChild(style);
  return () => style.remove();
}
