import type { CSSProperties } from "react";

/**
 * Maps Tailwind arbitrary-value prefixes to CSS property names.
 * Handles the most common utilities — extend as needed.
 */
const PREFIX_MAP: Record<string, string | string[]> = {
  // Padding
  p: "padding",
  px: ["paddingLeft", "paddingRight"],
  py: ["paddingTop", "paddingBottom"],
  pt: "paddingTop",
  pr: "paddingRight",
  pb: "paddingBottom",
  pl: "paddingLeft",

  // Margin
  m: "margin",
  mx: ["marginLeft", "marginRight"],
  my: ["marginTop", "marginBottom"],
  mt: "marginTop",
  mr: "marginRight",
  mb: "marginBottom",
  ml: "marginLeft",

  // Sizing
  w: "width",
  h: "height",
  "min-w": "minWidth",
  "min-h": "minHeight",
  "max-w": "maxWidth",
  "max-h": "maxHeight",
  size: ["width", "height"],

  // Gap
  gap: "gap",
  "gap-x": "columnGap",
  "gap-y": "rowGap",

  // Position
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  inset: "inset",
  "inset-x": ["left", "right"],
  "inset-y": ["top", "bottom"],

  // Border
  rounded: "borderRadius",
  "rounded-t": ["borderTopLeftRadius", "borderTopRightRadius"],
  "rounded-b": ["borderBottomLeftRadius", "borderBottomRightRadius"],
  "rounded-l": ["borderTopLeftRadius", "borderBottomLeftRadius"],
  "rounded-r": ["borderTopRightRadius", "borderBottomRightRadius"],
  "rounded-tl": "borderTopLeftRadius",
  "rounded-tr": "borderTopRightRadius",
  "rounded-bl": "borderBottomLeftRadius",
  "rounded-br": "borderBottomRightRadius",
  border: "borderWidth",
  "border-t": "borderTopWidth",
  "border-r": "borderRightWidth",
  "border-b": "borderBottomWidth",
  "border-l": "borderLeftWidth",

  // Typography
  leading: "lineHeight",
  tracking: "letterSpacing",

  // Layout
  aspect: "aspectRatio",

  // Effects
  opacity: "opacity",
  z: "zIndex",

  // Grid
  "grid-cols": "gridTemplateColumns",
  "grid-rows": "gridTemplateRows",
  "col-span": "gridColumn",
  "row-span": "gridRow",
};

/** Detect color-like values: #hex, rgb(), hsl(), oklch(), named colors */
const COLOR_RE = /^(#|rgb|hsl|oklch|oklab|lab|lch|color\()/i;

function isColorValue(value: string): boolean {
  return COLOR_RE.test(value);
}

/**
 * Parse a class string into regular Tailwind classes and inline styles
 * for any arbitrary bracket values like `p-[128px]`.
 */
export function parseArbitraryClasses(className: string): {
  classes: string;
  style: CSSProperties;
} {
  if (!className) return { classes: "", style: {} };

  const parts = className.split(/\s+/).filter(Boolean);
  const regular: string[] = [];
  const style: Record<string, string> = {};

  for (const cls of parts) {
    // Match: optional-variant: prefix-[value]
    // We skip variant prefixes (dark:, hover:, etc.) — those can't become inline styles
    if (cls.includes(":") || !cls.includes("[")) {
      regular.push(cls);
      continue;
    }

    const match = cls.match(/^(-?)([\w-]+)-\[(.+)\]$/);
    if (!match) {
      regular.push(cls);
      continue;
    }

    const [, negative, prefix, rawValue] = match;
    const value = negative ? `-${rawValue}` : rawValue;

    // Special cases: text-[...] and bg-[...] are ambiguous
    if (prefix === "text") {
      if (isColorValue(rawValue)) {
        style.color = value;
      } else {
        style.fontSize = value;
      }
      continue;
    }

    if (prefix === "bg") {
      if (isColorValue(rawValue)) {
        style.backgroundColor = value;
      } else {
        style.background = value;
      }
      continue;
    }

    if (prefix === "border" && isColorValue(rawValue)) {
      style.borderColor = value;
      continue;
    }

    // Grid shorthand values
    if (prefix === "col-span") {
      style.gridColumn = `span ${rawValue} / span ${rawValue}`;
      continue;
    }
    if (prefix === "row-span") {
      style.gridRow = `span ${rawValue} / span ${rawValue}`;
      continue;
    }

    const cssProp = PREFIX_MAP[prefix];
    if (!cssProp) {
      // Unknown prefix — keep as regular class (Tailwind might handle it)
      regular.push(cls);
      continue;
    }

    if (Array.isArray(cssProp)) {
      for (const prop of cssProp) {
        style[prop] = value;
      }
    } else {
      style[cssProp] = value;
    }
  }

  return {
    classes: regular.join(" "),
    style: style as CSSProperties,
  };
}

/**
 * Convert a style object to a CSS string for use in Tiptap extensions
 * (which need a string, not a React CSSProperties object).
 */
export function styleObjectToString(style: CSSProperties): string {
  return Object.entries(style)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${cssKey}: ${value}`;
    })
    .join("; ");
}

/* ------------------------------------------------------------------ */
/*  Runtime CSS for variant + arbitrary classes (e.g. dark:border-[12px]) */
/* ------------------------------------------------------------------ */

/** Convert camelCase to kebab-case */
function toKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Variant → CSS selector template.
 * `dark` matches the project's @custom-variant: (&:where(.dark, .dark *))
 */
const VARIANT_SELECTORS: Record<string, (sel: string) => string> = {
  dark: (s) => `${s}:where(.dark, .dark *)`,
  hover: (s) => `${s}:hover`,
  focus: (s) => `${s}:focus`,
  active: (s) => `${s}:active`,
  "focus-visible": (s) => `${s}:focus-visible`,
  "focus-within": (s) => `${s}:focus-within`,
};

/** Escape special characters for use in CSS selectors */
function escapeCSS(cls: string): string {
  return cls.replace(/([:#\[\]().,%/])/g, "\\$1");
}

/**
 * Resolve a Tailwind prefix + arbitrary value to CSS declaration(s).
 * Returns null if the prefix isn't recognised.
 */
function resolveArbitraryToCSS(
  prefix: string,
  rawValue: string,
  negative: boolean
): string[] | null {
  const value = negative ? `-${rawValue}` : rawValue;

  if (prefix === "text") {
    return isColorValue(rawValue)
      ? [`color: ${value}`]
      : [`font-size: ${value}`];
  }
  if (prefix === "bg") {
    return isColorValue(rawValue)
      ? [`background-color: ${value}`]
      : [`background: ${value}`];
  }
  if (prefix === "border" && isColorValue(rawValue)) {
    return [`border-color: ${value}`];
  }
  if (prefix === "col-span") {
    return [`grid-column: span ${rawValue} / span ${rawValue}`];
  }
  if (prefix === "row-span") {
    return [`grid-row: span ${rawValue} / span ${rawValue}`];
  }

  const cssProp = PREFIX_MAP[prefix];
  if (!cssProp) return null;

  if (Array.isArray(cssProp)) {
    return cssProp.map((p) => `${toKebab(p)}: ${value}`);
  }
  return [`${toKebab(cssProp)}: ${value}`];
}

/**
 * Maps standard Tailwind utility classes (without brackets) to CSS declarations.
 * Used to generate runtime CSS for variant+standard classes like `dark:rounded-full`.
 */
const STANDARD_CLASS_MAP: Record<string, string> = {
  // Border radius
  "rounded": "border-radius: 0.25rem",
  "rounded-none": "border-radius: 0",
  "rounded-xs": "border-radius: 0.0625rem",
  "rounded-sm": "border-radius: 0.125rem",
  "rounded-md": "border-radius: 0.375rem",
  "rounded-lg": "border-radius: 0.5rem",
  "rounded-xl": "border-radius: 0.75rem",
  "rounded-2xl": "border-radius: 1rem",
  "rounded-3xl": "border-radius: 1.5rem",
  "rounded-full": "border-radius: 9999px",
  "rounded-t-none": "border-top-left-radius: 0; border-top-right-radius: 0",
  "rounded-t-sm": "border-top-left-radius: 0.125rem; border-top-right-radius: 0.125rem",
  "rounded-t-md": "border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem",
  "rounded-t-lg": "border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem",
  "rounded-t-xl": "border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem",
  "rounded-t-2xl": "border-top-left-radius: 1rem; border-top-right-radius: 1rem",
  "rounded-t-3xl": "border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem",
  "rounded-t-full": "border-top-left-radius: 9999px; border-top-right-radius: 9999px",
  "rounded-b-none": "border-bottom-left-radius: 0; border-bottom-right-radius: 0",
  "rounded-b-sm": "border-bottom-left-radius: 0.125rem; border-bottom-right-radius: 0.125rem",
  "rounded-b-md": "border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem",
  "rounded-b-lg": "border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem",
  "rounded-b-xl": "border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem",
  "rounded-b-2xl": "border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem",
  "rounded-b-3xl": "border-bottom-left-radius: 1.5rem; border-bottom-right-radius: 1.5rem",
  "rounded-b-full": "border-bottom-left-radius: 9999px; border-bottom-right-radius: 9999px",
  "rounded-tl-none": "border-top-left-radius: 0",
  "rounded-tl-sm": "border-top-left-radius: 0.125rem",
  "rounded-tl-md": "border-top-left-radius: 0.375rem",
  "rounded-tl-lg": "border-top-left-radius: 0.5rem",
  "rounded-tl-xl": "border-top-left-radius: 0.75rem",
  "rounded-tl-2xl": "border-top-left-radius: 1rem",
  "rounded-tl-3xl": "border-top-left-radius: 1.5rem",
  "rounded-tl-full": "border-top-left-radius: 9999px",
  "rounded-tr-none": "border-top-right-radius: 0",
  "rounded-tr-sm": "border-top-right-radius: 0.125rem",
  "rounded-tr-md": "border-top-right-radius: 0.375rem",
  "rounded-tr-lg": "border-top-right-radius: 0.5rem",
  "rounded-tr-xl": "border-top-right-radius: 0.75rem",
  "rounded-tr-2xl": "border-top-right-radius: 1rem",
  "rounded-tr-3xl": "border-top-right-radius: 1.5rem",
  "rounded-tr-full": "border-top-right-radius: 9999px",
  "rounded-bl-none": "border-bottom-left-radius: 0",
  "rounded-bl-sm": "border-bottom-left-radius: 0.125rem",
  "rounded-bl-md": "border-bottom-left-radius: 0.375rem",
  "rounded-bl-lg": "border-bottom-left-radius: 0.5rem",
  "rounded-bl-xl": "border-bottom-left-radius: 0.75rem",
  "rounded-bl-2xl": "border-bottom-left-radius: 1rem",
  "rounded-bl-3xl": "border-bottom-left-radius: 1.5rem",
  "rounded-bl-full": "border-bottom-left-radius: 9999px",
  "rounded-br-none": "border-bottom-right-radius: 0",
  "rounded-br-sm": "border-bottom-right-radius: 0.125rem",
  "rounded-br-md": "border-bottom-right-radius: 0.375rem",
  "rounded-br-lg": "border-bottom-right-radius: 0.5rem",
  "rounded-br-xl": "border-bottom-right-radius: 0.75rem",
  "rounded-br-2xl": "border-bottom-right-radius: 1rem",
  "rounded-br-3xl": "border-bottom-right-radius: 1.5rem",
  "rounded-br-full": "border-bottom-right-radius: 9999px",
  // Aspect ratio
  "aspect-auto": "aspect-ratio: auto",
  "aspect-square": "aspect-ratio: 1 / 1",
  "aspect-video": "aspect-ratio: 16 / 9",
  // Shadows
  "shadow": "box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  "shadow-sm": "box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)",
  "shadow-md": "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  "shadow-lg": "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  "shadow-xl": "box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "shadow-2xl": "box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)",
  "shadow-inner": "box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  "shadow-none": "box-shadow: 0 0 #0000",
  // Opacity
  "opacity-0": "opacity: 0",
  "opacity-5": "opacity: 0.05",
  "opacity-10": "opacity: 0.1",
  "opacity-20": "opacity: 0.2",
  "opacity-25": "opacity: 0.25",
  "opacity-30": "opacity: 0.3",
  "opacity-40": "opacity: 0.4",
  "opacity-50": "opacity: 0.5",
  "opacity-60": "opacity: 0.6",
  "opacity-70": "opacity: 0.7",
  "opacity-75": "opacity: 0.75",
  "opacity-80": "opacity: 0.8",
  "opacity-90": "opacity: 0.9",
  "opacity-95": "opacity: 0.95",
  "opacity-100": "opacity: 1",
  // Border width
  "border": "border-width: 1px",
  "border-0": "border-width: 0px",
  "border-2": "border-width: 2px",
  "border-4": "border-width: 4px",
  "border-8": "border-width: 8px",
  "border-none": "border-style: none",
  // Ring
  "ring": "box-shadow: var(--tw-ring-inset) 0 0 0 3px var(--tw-ring-color)",
  "ring-0": "box-shadow: var(--tw-ring-inset) 0 0 0 0px var(--tw-ring-color)",
  "ring-1": "box-shadow: var(--tw-ring-inset) 0 0 0 1px var(--tw-ring-color)",
  "ring-2": "box-shadow: var(--tw-ring-inset) 0 0 0 2px var(--tw-ring-color)",
  "ring-4": "box-shadow: var(--tw-ring-inset) 0 0 0 4px var(--tw-ring-color)",
  "ring-8": "box-shadow: var(--tw-ring-inset) 0 0 0 8px var(--tw-ring-color)",
  "ring-inset": "--tw-ring-inset: inset",
  // Display
  "hidden": "display: none",
  "block": "display: block",
  "inline": "display: inline",
  "inline-block": "display: inline-block",
  "flex": "display: flex",
  "inline-flex": "display: inline-flex",
  "grid": "display: grid",
};

/** Sorted longest-first so "border-t" matches before "border". */
const SORTED_PREFIXES = Object.keys(PREFIX_MAP).sort((a, b) => b.length - a.length);

/** CSS properties that use Tailwind's spacing scale (value × 0.25rem). */
const SPACING_PROPS = new Set([
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
  "gap", "columnGap", "rowGap",
  "top", "right", "bottom", "left", "inset",
]);

/**
 * Resolve a standard Tailwind utility (e.g. "mb-32") to CSS declaration(s)
 * by reusing PREFIX_MAP + the spacing scale. Falls back to STANDARD_CLASS_MAP.
 */
function resolveStandardUtility(cls: string): string | null {
  const direct = STANDARD_CLASS_MAP[cls];
  if (direct) return direct;

  const isNeg = cls.startsWith("-");
  const base = isNeg ? cls.slice(1) : cls;

  for (const prefix of SORTED_PREFIXES) {
    if (!base.startsWith(prefix + "-")) continue;
    const rawValue = base.slice(prefix.length + 1);
    const cssProp = PREFIX_MAP[prefix];
    const props = Array.isArray(cssProp) ? cssProp : [cssProp];
    const isSpacing = props.some((p) => SPACING_PROPS.has(p));

    let cssValue: string | null = null;
    if (rawValue === "auto") cssValue = "auto";
    else if (rawValue === "full") cssValue = "100%";
    else if (rawValue === "px") cssValue = "1px";
    else if (isSpacing && /^\d+(\.\d+)?$/.test(rawValue)) {
      const num = parseFloat(rawValue);
      cssValue = num === 0 ? "0px" : `${num * 0.25}rem`;
    }
    if (!cssValue) return null;

    if (isNeg && cssValue !== "auto") cssValue = `-${cssValue}`;
    return props.map((p) => `${toKebab(p)}: ${cssValue}`).join("; ");
  }
  return null;
}

/**
 * Generate CSS rules for variant+arbitrary classes that can't be inlined.
 * Also generates CSS for variant+standard classes (e.g. dark:rounded-full,
 * dark:mb-32) via dynamic resolution.
 *
 * Example:
 *   "dark:border-[12px]"
 *   → `.dark\:border-\[12px\]:where(.dark, .dark *) { border-width: 12px; }`
 *   "dark:mb-32"
 *   → `.dark\:mb-32:where(.dark, .dark *) { margin-bottom: 8rem; }`
 */
export function generateVariantArbitraryCSS(classes: string[]): string {
  const seen = new Set<string>();
  const rules: string[] = [];

  for (const cls of classes) {
    if (!cls.includes(":") || seen.has(cls)) continue;
    seen.add(cls);

    // Try arbitrary bracket syntax first: variant:prefix-[value]
    if (cls.includes("[")) {
      const match = cls.match(/^([\w-]+):(-?)([\w-]+)-\[(.+)\]$/);
      if (!match) continue;

      const [, variant, neg, prefix, rawValue] = match;
      const selectorFn = VARIANT_SELECTORS[variant];
      if (!selectorFn) continue;

      const declarations = resolveArbitraryToCSS(prefix, rawValue, neg === "-");
      if (!declarations) continue;

      const selector = selectorFn(`.${escapeCSS(cls)}`);
      rules.push(`${selector}{${declarations.join(";")}}`);
      continue;
    }

    // Standard variant class: variant:utility (e.g. dark:rounded-full, dark:mb-32)
    const colonIdx = cls.indexOf(":");
    const variant = cls.slice(0, colonIdx);
    const utility = cls.slice(colonIdx + 1);
    const selectorFn = VARIANT_SELECTORS[variant];
    if (!selectorFn) continue;

    const cssDecl = resolveStandardUtility(utility);
    if (!cssDecl) continue;

    const selector = selectorFn(`.${escapeCSS(cls)}`);
    rules.push(`${selector}{${cssDecl}}`);
  }

  return rules.join("\n");
}

/**
 * Walk a Tiptap JSON tree and collect every class name from node attributes.
 */
export function collectClassesFromJSON(
  node: { attrs?: Record<string, any>; content?: any[] }
): string[] {
  const classes: string[] = [];
  if (node.attrs?.className) {
    classes.push(...node.attrs.className.split(/\s+/).filter(Boolean));
  }
  if (node.attrs?.gap) {
    classes.push(node.attrs.gap);
  }
  if (node.content) {
    for (const child of node.content) {
      classes.push(...collectClassesFromJSON(child));
    }
  }
  return classes;
}
