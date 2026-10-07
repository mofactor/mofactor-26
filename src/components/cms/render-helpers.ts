// Shared by the React renderer (TiptapRenderer.tsx, used by the admin preview) and the
// Astro renderer (TiptapContent.astro, used by public blog pages), so both derive the
// same classes and styles from a post's Tiptap JSON.
import type { CSSProperties } from "react";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";

export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

/** Classes that control layout width: they belong on <figure> (a direct child of .blog-prose) */
const FIGURE_CLASSES = new Set(["wide", "full"]);

export function splitFigureClasses(cls: string) {
  const parts = cls.split(/\s+/).filter(Boolean);
  const figure: string[] = [];
  const inner: string[] = [];
  for (const c of parts) {
    (FIGURE_CLASSES.has(c) ? figure : inner).push(c);
  }
  return { figure: figure.join(" "), inner: inner.join(" ") };
}

export const COLS_MAP: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

function getAlignStyle(attrs?: Record<string, any>): CSSProperties | undefined {
  if (attrs?.textAlign && attrs.textAlign !== "left") {
    return { textAlign: attrs.textAlign };
  }
  return undefined;
}

/** Get combined className (regular classes) for a block node */
export function getBlockClasses(attrs?: Record<string, any>): string {
  if (!attrs?.className) return "";
  const { classes } = parseArbitraryClasses(attrs.className);
  return classes;
}

/** Get combined inline style (arbitrary values + textAlign) for a block node */
export function getBlockStyle(attrs?: Record<string, any>): CSSProperties | undefined {
  const align = getAlignStyle(attrs);
  if (!attrs?.className) return align;
  const { style } = parseArbitraryClasses(attrs.className);
  const merged = { ...style, ...align };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/** Get inline style without textAlign (for list/blockquote elements) */
export function getBlockStyleNoAlign(attrs?: Record<string, any>): CSSProperties | undefined {
  if (!attrs?.className) return undefined;
  const { style } = parseArbitraryClasses(attrs.className);
  return Object.keys(style).length > 0 ? style : undefined;
}

/** CSSProperties → inline style string for .astro (undefined stays undefined) */
export function toStyleAttr(style?: CSSProperties): string | undefined {
  if (!style || Object.keys(style).length === 0) return undefined;
  return styleObjectToString(style);
}

/** Paragraphs with no content (or only whitespace text) are skipped */
export function hasInlineContent(node: TiptapNode): boolean {
  return !!node.content?.some((c) => c.type !== "text" || c.text?.trim());
}

// ── Inline content → HTML (Astro renderer) ──────────────────────────────────

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// React refuses javascript: URLs in href; keep that protection in the string renderer
const safeHref = (href: unknown) =>
  typeof href === "string" && !/^\s*javascript:/i.test(href) ? href : undefined;

function wrapMark(html: string, mark: TiptapMark): string {
  switch (mark.type) {
    case "bold":
      return `<strong>${html}</strong>`;
    case "italic":
      return `<em>${html}</em>`;
    case "underline":
      return `<u>${html}</u>`;
    case "strike":
      return `<s>${html}</s>`;
    case "code":
      return `<code>${html}</code>`;
    case "link": {
      const href = safeHref(mark.attrs?.href);
      const target = mark.attrs?.target || "_blank";
      const hrefAttr = href !== undefined ? ` href="${escapeHtml(href)}"` : "";
      return `<a${hrefAttr} target="${escapeHtml(target)}" rel="noopener noreferrer">${html}</a>`;
    }
    default:
      return html;
  }
}

/**
 * Text + marks + hard breaks → escaped HTML. Marks wrap in array order (last mark
 * outermost), matching TiptapRenderer.tsx's applyMark loop.
 */
export function inlineToHtml(content?: TiptapNode[]): string {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.type === "text") {
        let html = escapeHtml(node.text ?? "");
        for (const mark of node.marks ?? []) html = wrapMark(html, mark);
        return html;
      }
      if (node.type === "hardBreak") return "<br>";
      return "";
    })
    .join("");
}
