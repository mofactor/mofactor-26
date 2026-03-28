/**
 * Annotation engine — storage + element identification.
 * Reuses fiber.ts for React detection and selector.ts for CSS selectors.
 */

import type { Annotation } from "../types";

// =============================================================================
// localStorage Persistence
// =============================================================================

const STORAGE_PREFIX = "editor-annotations-";
const SETTINGS_KEY = "editor-annotation-settings";
const DEFAULT_RETENTION_DAYS = 7;

export function loadAnnotations(pathname: string): Annotation[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${pathname}`);
    if (!stored) return [];
    const data = JSON.parse(stored);
    const cutoff = Date.now() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return data.filter(
      (a: { timestamp?: number }) => !a.timestamp || a.timestamp > cutoff,
    );
  } catch {
    return [];
  }
}

export function saveAnnotations(
  pathname: string,
  annotations: Annotation[],
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${pathname}`,
      JSON.stringify(annotations),
    );
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearAnnotations(pathname: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${pathname}`);
  } catch {
    // ignore
  }
}

export function loadAnnotationSettings<T>(defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaults;
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
}

export function saveAnnotationSettings<T>(settings: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// =============================================================================
// Element Identification (adapted from Agentation)
// =============================================================================

/**
 * Identify a DOM element with a human-readable name + path.
 * Returns something like: `button "Save"` with path `#app > form > .actions`
 */
export function identifyElement(
  target: HTMLElement,
): { name: string; path: string } {
  const path = getElementPath(target);

  if (target.dataset.element) {
    return { name: target.dataset.element, path };
  }

  const tag = target.tagName.toLowerCase();

  // SVG
  if (["path", "circle", "rect", "line", "g"].includes(tag)) {
    const svg = target.closest("svg");
    if (svg?.parentElement) {
      const parentName = identifyElement(svg.parentElement).name;
      return { name: `graphic in ${parentName}`, path };
    }
    return { name: "graphic element", path };
  }
  if (tag === "svg") {
    if (target.parentElement?.tagName.toLowerCase() === "button") {
      const text = target.parentElement.textContent?.trim();
      return {
        name: text ? `icon in "${text}" button` : "button icon",
        path,
      };
    }
    return { name: "icon", path };
  }

  // Interactive
  if (tag === "button") {
    const text = target.textContent?.trim();
    const ariaLabel = target.getAttribute("aria-label");
    if (ariaLabel) return { name: `button [${ariaLabel}]`, path };
    return { name: text ? `button "${text.slice(0, 25)}"` : "button", path };
  }
  if (tag === "a") {
    const text = target.textContent?.trim();
    const href = target.getAttribute("href");
    if (text) return { name: `link "${text.slice(0, 25)}"`, path };
    if (href) return { name: `link to ${href.slice(0, 30)}`, path };
    return { name: "link", path };
  }
  if (tag === "input") {
    const type = target.getAttribute("type") || "text";
    const placeholder = target.getAttribute("placeholder");
    const name = target.getAttribute("name");
    if (placeholder) return { name: `input "${placeholder}"`, path };
    if (name) return { name: `input [${name}]`, path };
    return { name: `${type} input`, path };
  }

  // Headings
  if (/^h[1-6]$/.test(tag)) {
    const text = target.textContent?.trim();
    return { name: text ? `${tag} "${text.slice(0, 35)}"` : tag, path };
  }

  // Text
  if (tag === "p") {
    const text = target.textContent?.trim();
    if (text) return { name: `paragraph: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`, path };
    return { name: "paragraph", path };
  }
  if (tag === "span" || tag === "label") {
    const text = target.textContent?.trim();
    if (text && text.length < 40) return { name: `"${text}"`, path };
    return { name: tag, path };
  }
  if (tag === "li") {
    const text = target.textContent?.trim();
    if (text && text.length < 40) return { name: `list item: "${text.slice(0, 35)}"`, path };
    return { name: "list item", path };
  }
  if (tag === "img") {
    const alt = target.getAttribute("alt");
    return { name: alt ? `image "${alt.slice(0, 30)}"` : "image", path };
  }
  if (tag === "video") return { name: "video", path };

  // Containers
  if (["div", "section", "article", "nav", "header", "footer", "aside", "main"].includes(tag)) {
    const role = target.getAttribute("role");
    const ariaLabel = target.getAttribute("aria-label");
    if (ariaLabel) return { name: `${tag} [${ariaLabel}]`, path };
    if (role) return { name: role, path };

    // Try to describe by first meaningful child content
    const heading = target.querySelector("h1, h2, h3, h4, h5, h6");
    if (heading) {
      const hText = heading.textContent?.trim();
      if (hText) return { name: `${tag === "div" ? "container" : tag} with "${hText.slice(0, 30)}"`, path };
    }

    // Try non-utility class names (filter out Tailwind utilities)
    const UTILITY_PATTERN = /^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky|overflow|gap|space|p[xytblr]?|m[xytblr]?|w|h|min|max|top|right|bottom|left|z|text|font|leading|tracking|bg|border|rounded|shadow|opacity|transition|transform|animate|cursor|pointer|select|col|row|items|justify|self|place|order|grow|shrink|basis|aspect|inset|ring|outline|decoration|underline|line|break|whitespace|align|vertical|float|clear|object|table|caption|list|accent|caret|scroll|snap|touch|resize|appearance|columns|container)($|-.)/;
    const className = target.className;
    if (typeof className === "string" && className) {
      const meaningful = className
        .split(/\s+/)
        .map((c) => c.replace(/[A-Z0-9]{5,}.*$/, ""))
        .filter((c) => c.length > 3 && !UTILITY_PATTERN.test(c) && !/^[a-z]{1,2}$/.test(c) && !c.includes(":"))
        .slice(0, 2);
      if (meaningful.length > 0) return { name: meaningful.join(" "), path };
    }

    // Try direct text content (short only)
    const directText = Array.from(target.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent?.trim())
      .filter(Boolean)
      .join(" ");
    if (directText && directText.length > 2 && directText.length < 50) {
      return { name: `${tag === "div" ? "container" : tag}: "${directText.slice(0, 35)}"`, path };
    }

    return { name: tag === "div" ? "container" : tag, path };
  }

  return { name: tag, path };
}

/** Readable DOM path like `#app > form > .actions > button` */
function getElementPath(target: HTMLElement, maxDepth = 4): string {
  const parts: string[] = [];
  let current: HTMLElement | null = target;
  let depth = 0;

  while (current && depth < maxDepth) {
    const tag = current.tagName.toLowerCase();
    if (tag === "html" || tag === "body") break;

    let identifier = tag;
    if (current.id) {
      identifier = `#${current.id}`;
    } else if (current.className && typeof current.className === "string") {
      const meaningful = current.className
        .split(/\s+/)
        .find(
          (c) =>
            c.length > 2 &&
            !c.match(/^[a-z]{1,2}$/) &&
            !c.match(/[A-Z0-9]{5,}/),
        );
      if (meaningful) identifier = `.${meaningful.split("_")[0]}`;
    }

    parts.unshift(identifier);
    current = current.parentElement;
    depth++;
  }

  return parts.join(" > ");
}

/** Full DOM path for forensic output */
export function getFullElementPath(target: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = target;

  while (current && current.tagName.toLowerCase() !== "html") {
    const tag = current.tagName.toLowerCase();
    let identifier = tag;

    if (current.id) {
      identifier = `${tag}#${current.id}`;
    } else if (current.className && typeof current.className === "string") {
      const cls = current.className
        .split(/\s+/)
        .map((c) => c.replace(/[_][a-zA-Z0-9]{5,}.*$/, ""))
        .find((c) => c.length > 2);
      if (cls) identifier = `${tag}.${cls}`;
    }

    parts.unshift(identifier);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

/** Get text from element and siblings for context */
export function getNearbyText(element: HTMLElement): string {
  const texts: string[] = [];

  const ownText = element.textContent?.trim();
  if (ownText && ownText.length < 100) texts.push(ownText);

  const prev = element.previousElementSibling;
  if (prev) {
    const t = prev.textContent?.trim();
    if (t && t.length < 50) texts.unshift(`[before: "${t.slice(0, 40)}"]`);
  }

  const next = element.nextElementSibling;
  if (next) {
    const t = next.textContent?.trim();
    if (t && t.length < 50) texts.push(`[after: "${t.slice(0, 40)}"]`);
  }

  return texts.join(" ");
}

/** Cleaned CSS classes (module hashes stripped) */
export function getElementClasses(target: HTMLElement): string {
  const className = target.className;
  if (typeof className !== "string" || !className) return "";

  return className
    .split(/\s+/)
    .filter((c) => c.length > 0)
    .map((c) => {
      const match = c.match(/^([a-zA-Z][a-zA-Z0-9_-]*?)(?:_[a-zA-Z0-9]{5,})?$/);
      return match ? match[1] : c;
    })
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .join(", ");
}

/** Key computed styles based on element type */
export function getDetailedComputedStyles(
  target: HTMLElement,
): Record<string, string> {
  if (typeof window === "undefined") return {};

  const DEFAULT_VALUES = new Set([
    "none", "normal", "auto", "0px", "rgba(0, 0, 0, 0)", "transparent", "static", "visible",
  ]);

  const styles = window.getComputedStyle(target);
  const result: Record<string, string> = {};
  const tag = target.tagName.toLowerCase();

  const TEXT = new Set(["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "li", "a", "code", "pre"]);
  const CONTAINER = new Set(["div", "section", "article", "nav", "header", "footer", "aside", "main"]);

  let properties: string[];
  if (TEXT.has(tag)) {
    properties = ["color", "fontSize", "fontWeight", "fontFamily", "lineHeight"];
  } else if (tag === "button") {
    properties = ["backgroundColor", "color", "padding", "borderRadius", "fontSize"];
  } else if (tag === "input" || tag === "textarea" || tag === "select") {
    properties = ["backgroundColor", "color", "padding", "borderRadius", "fontSize"];
  } else if (tag === "img" || tag === "video") {
    properties = ["width", "height", "objectFit", "borderRadius"];
  } else if (CONTAINER.has(tag)) {
    properties = ["display", "padding", "margin", "gap", "backgroundColor"];
  } else {
    properties = ["color", "fontSize", "margin", "padding", "backgroundColor"];
  }

  for (const prop of properties) {
    const cssName = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    const value = styles.getPropertyValue(cssName);
    if (value && !DEFAULT_VALUES.has(value)) {
      result[prop] = value;
    }
  }

  return result;
}

/** Full computed styles for forensic output */
export function getForensicComputedStyles(target: HTMLElement): string {
  if (typeof window === "undefined") return "";

  const DEFAULT_VALUES = new Set([
    "none", "normal", "auto", "0px", "rgba(0, 0, 0, 0)", "transparent", "static", "visible",
  ]);

  const PROPERTIES = [
    "color", "backgroundColor", "borderColor",
    "fontSize", "fontWeight", "fontFamily", "lineHeight", "textAlign",
    "width", "height", "padding", "margin", "border", "borderRadius",
    "display", "position", "zIndex", "flexDirection", "justifyContent", "alignItems", "gap",
    "opacity", "overflow", "boxShadow", "transform",
  ];

  const styles = window.getComputedStyle(target);
  const parts: string[] = [];

  for (const prop of PROPERTIES) {
    const cssName = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    const value = styles.getPropertyValue(cssName);
    if (value && !DEFAULT_VALUES.has(value)) {
      parts.push(`${cssName}: ${value}`);
    }
  }

  return parts.join("; ");
}

/** Accessibility info */
export function getAccessibilityInfo(target: HTMLElement): string {
  const parts: string[] = [];

  const role = target.getAttribute("role");
  const ariaLabel = target.getAttribute("aria-label");
  const tabIndex = target.getAttribute("tabindex");
  const ariaHidden = target.getAttribute("aria-hidden");

  if (role) parts.push(`role="${role}"`);
  if (ariaLabel) parts.push(`aria-label="${ariaLabel}"`);
  if (tabIndex) parts.push(`tabindex=${tabIndex}`);
  if (ariaHidden === "true") parts.push("aria-hidden");
  if (target.matches("a, button, input, select, textarea, [tabindex]")) {
    parts.push("focusable");
  }

  return parts.join(", ");
}

// =============================================================================
// React Component Detection (lightweight, reuses existing fiber walker)
// =============================================================================

/**
 * Walk the React fiber tree to get component hierarchy.
 * Returns a string like "<App> <Layout> <Button>" (innermost to outermost).
 */
export function getReactComponents(el: HTMLElement, maxCount = 4): string | null {
  const fiberKey = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  if (!fiberKey) {
    // Walk up DOM to find nearest fiber
    let current: HTMLElement | null = el;
    let walked = 0;
    while (current && walked < 20) {
      const key = Object.keys(current).find((k) => k.startsWith("__reactFiber$"));
      if (key) return walkFiber((current as any)[key], maxCount);
      current = current.parentElement;
      walked++;
    }
    return null;
  }
  return walkFiber((el as any)[fiberKey], maxCount);
}

// Framework internals to skip
const SKIP_NAMES = new Set([
  "Component", "PureComponent", "Fragment", "Suspense", "Profiler",
  "StrictMode", "Routes", "Route", "Outlet", "Root",
  "ErrorBoundaryHandler", "HotReload", "Hot",
  "InnerLayoutRouter", "OuterLayoutRouter", "RenderFromTemplateContext",
  "RedirectBoundary", "NotFoundBoundary", "SegmentViewNode",
  "ScrollAndFocusHandler", "LoadingBoundary", "MetadataBoundary",
  "ViewportBoundary", "HTTPAccessFallbackBoundary",
]);
const SKIP_PATTERNS = [
  /Provider$/, /Consumer$/, /Router$/, /Boundary$/,
  /^Client(Page|Segment|Root)/, /^Server(Root|Component)/,
  /^(Inner|Outer)/, /Context$/, /^(Dev|React)(Overlay|Tools)/,
  /Overlay$/, /Handler$/, /^With[A-Z]/, /Wrapper$/, /^RSC/,
  /^__next/, /^Next/, /^next/, /Layout$/, /Template$/,
  /Segment/, /ViewNode/, /^Lazy/, /^Fallback/,
];

function walkFiber(fiber: any, maxCount: number): string | null {
  const components: string[] = [];
  let current = fiber;
  let depth = 0;

  while (current && depth < 30 && components.length < maxCount) {
    if (typeof current.type === "function" || typeof current.type === "object") {
      const name =
        current.type?.displayName ||
        current.type?.name ||
        current.type?.render?.displayName ||
        current.type?.render?.name;

      if (
        name &&
        name.length > 2 &&
        !SKIP_NAMES.has(name) &&
        !SKIP_PATTERNS.some((p) => p.test(name))
      ) {
        components.push(name);
      }
    }
    current = current.return;
    depth++;
  }

  if (components.length === 0) return null;
  return components.reverse().map((c) => `<${c}>`).join(" ");
}
