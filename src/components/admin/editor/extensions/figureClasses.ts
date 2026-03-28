/** Classes that control layout width — must live on the <figure> (direct child of .blog-prose) */
export const FIGURE_CLASSES = new Set(["wide", "full"]);

/** Margin/padding classes belong on the figure wrapper, not the inner element */
const FIGURE_PREFIXES = /^!?-?m[xytblres]?-|^!?-?p[xytblres]?-/;

/** Node types that support the width-mode toggle (default / wide / full). */
export const SUPPORTS_WIDTH_MODE = new Set(["image", "video", "styledBlock", "columns", "logoDivider"]);

export type WidthMode = "default" | "wide" | "full";

/**
 * Split a class string into figure-level classes (wide/full/margin/padding)
 * and inner-element classes (everything else like rounded, shadow, etc.).
 */
export function splitClasses(cls: string) {
  const parts = cls.split(/\s+/).filter(Boolean);
  const figure: string[] = [];
  const inner: string[] = [];
  for (const c of parts) {
    (FIGURE_CLASSES.has(c) || FIGURE_PREFIXES.test(c) ? figure : inner).push(c);
  }
  return { figure: figure.join(" "), inner: inner.join(" ") };
}

/** Extract the current width mode from a className string. */
export function getWidthMode(className: string): WidthMode {
  const parts = className.split(/\s+/);
  if (parts.includes("full")) return "full";
  if (parts.includes("wide")) return "wide";
  return "default";
}

/** Return a new className with the given width mode applied. */
export function setWidthMode(className: string, mode: WidthMode): string {
  const without = className
    .split(/\s+/)
    .filter((c) => !FIGURE_CLASSES.has(c))
    .join(" ");
  if (mode === "default") return without;
  return without ? `${without} ${mode}` : mode;
}

/* ── Aspect ratio helpers ───────────────────────────────────── */

/** Matches any `aspect-*` Tailwind class (including arbitrary like `aspect-[4/3]`). */
const ASPECT_RE = /^aspect-/;

/** Preset aspect-ratio values → Tailwind class mapping. */
export const ASPECT_PRESETS = [
  { value: "video", label: "16 : 9", cls: "aspect-video" },
  { value: "4/3", label: "4 : 3", cls: "aspect-[4/3]" },
  { value: "square", label: "1 : 1", cls: "aspect-square" },
  { value: "3/2", label: "3 : 2", cls: "aspect-[3/2]" },
  { value: "21/9", label: "21 : 9", cls: "aspect-[21/9]" },
  { value: "none", label: "None", cls: "aspect-none" },
] as const;

export type AspectRatioValue = (typeof ASPECT_PRESETS)[number]["value"] | string;

/** Return true if className contains any aspect-* class. */
export function hasAspectClass(className: string): boolean {
  return className.split(/\s+/).some((c) => ASPECT_RE.test(c));
}

/** Extract the current aspect ratio value from a className string. */
export function getAspectRatio(className: string): AspectRatioValue {
  const parts = className.split(/\s+/);
  const match = parts.find((c) => ASPECT_RE.test(c));
  if (!match) return "video"; // default for video blocks
  const preset = ASPECT_PRESETS.find((p) => p.cls === match);
  if (preset) return preset.value;
  // Custom: extract from aspect-[X/Y] or aspect-[X]
  const inner = match.match(/^aspect-\[(.+)\]$/);
  return inner ? inner[1] : match.replace("aspect-", "");
}

/** Return a new className with the given aspect ratio applied. */
export function setAspectRatio(className: string, ratio: AspectRatioValue): string {
  const without = className
    .split(/\s+/)
    .filter((c) => !ASPECT_RE.test(c))
    .join(" ");
  const preset = ASPECT_PRESETS.find((p) => p.value === ratio);
  const cls = preset ? preset.cls : `aspect-[${ratio}]`;
  return without ? `${without} ${cls}` : cls;
}

/* ── Border radius helpers ──────────────────────────────────── */

/** Matches any `rounded-*` Tailwind class (uniform or per-corner). */
const ROUNDED_RE = /^rounded/;

/** Per-corner prefix pattern. */
const CORNER_PREFIX_RE = /^rounded-(tl|tr|bl|br)/;

export const CORNERS = ["tl", "tr", "bl", "br"] as const;
export type Corner = (typeof CORNERS)[number];

export const RADIUS_PRESETS = [
  { value: "none", label: "None" },
  { value: "xs", label: "XS" },
  { value: "sm", label: "SM" },
  { value: "md", label: "MD" },
  { value: "lg", label: "LG" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "3xl", label: "3XL" },
  { value: "full", label: "Full" },
] as const;

export type RadiusPresetValue = (typeof RADIUS_PRESETS)[number]["value"];
export type RadiusValue = RadiusPresetValue | string;

/** Node types that support the border-radius picker. */
export const SUPPORTS_BORDER_RADIUS = new Set(["image", "video", "styledBlock", "columns", "column", "logoDivider"]);

/** Strip all rounded-* classes from className. */
function stripRounded(cls: string): string {
  return cls.split(/\s+/).filter((c) => !ROUNDED_RE.test(c)).join(" ");
}

/** Build a single rounded class from a value and optional corner. */
function buildRoundedClass(value: string, corner?: Corner): string {
  const isPreset = RADIUS_PRESETS.some((p) => p.value === value);
  const suffix = isPreset ? value : `[${value}]`;
  return corner ? `rounded-${corner}-${suffix}` : `rounded-${suffix}`;
}

/** Return true if className uses per-corner rounded classes. */
export function hasIndividualCorners(className: string): boolean {
  return className.split(/\s+/).some((c) => CORNER_PREFIX_RE.test(c));
}

/** Extract the uniform border-radius value from a className string. */
export function getBorderRadius(className: string): RadiusValue {
  const parts = className.split(/\s+/);
  const match = parts.find(
    (c) => ROUNDED_RE.test(c) && !CORNER_PREFIX_RE.test(c) && !/^rounded-(t|b|l|r)-/.test(c),
  );
  if (!match) return "";
  if (match === "rounded") return "md";
  const preset = RADIUS_PRESETS.find((p) => `rounded-${p.value}` === match);
  if (preset) return preset.value;
  const inner = match.match(/^rounded-\[(.+)\]$/);
  return inner ? inner[1] : "";
}

/** Extract individual corner radius values from className. */
export function getCornerRadii(className: string): Record<Corner, RadiusValue> {
  const parts = className.split(/\s+/);
  const result: Record<Corner, RadiusValue> = { tl: "", tr: "", bl: "", br: "" };

  for (const corner of CORNERS) {
    const match = parts.find((c) => c.startsWith(`rounded-${corner}-`) || c === `rounded-${corner}`);
    if (!match) continue;
    if (match === `rounded-${corner}`) { result[corner] = "md"; continue; }
    const sizeStr = match.replace(`rounded-${corner}-`, "");
    const preset = RADIUS_PRESETS.find((p) => p.value === sizeStr);
    if (preset) { result[corner] = preset.value; continue; }
    const inner = sizeStr.match(/^\[(.+)\]$/);
    result[corner] = inner ? inner[1] : sizeStr;
  }

  // Fall back to uniform value when no individual corners exist.
  if (Object.values(result).every((v) => v === "")) {
    const uniform = getBorderRadius(className);
    if (uniform) for (const c of CORNERS) result[c] = uniform;
  }

  return result;
}

/** Set uniform border-radius, removing all existing rounded-* classes. */
export function setBorderRadius(className: string, value: RadiusValue): string {
  const without = stripRounded(className);
  if (!value) return without;
  const cls = buildRoundedClass(value);
  return without ? `${without} ${cls}` : cls;
}

/** Set a single corner's radius. Converts from uniform to individual if needed. */
export function setCornerRadius(
  className: string,
  corner: Corner,
  value: RadiusValue,
): string {
  const parts = className.split(/\s+/).filter(Boolean);
  const hasUniform = parts.some(
    (c) => ROUNDED_RE.test(c) && !CORNER_PREFIX_RE.test(c) && !/^rounded-(t|b|l|r)-/.test(c),
  );

  if (hasUniform) {
    const uniformValue = getBorderRadius(className);
    const without = stripRounded(className);
    const cornerClasses = CORNERS.map((c) =>
      buildRoundedClass(c === corner ? value || "none" : uniformValue || "none", c),
    ).join(" ");
    return without ? `${without} ${cornerClasses}` : cornerClasses;
  }

  const filtered = parts.filter(
    (c) => !(c.startsWith(`rounded-${corner}-`) || c === `rounded-${corner}`),
  );
  if (value) filtered.push(buildRoundedClass(value, corner));
  return filtered.join(" ");
}

/** Convert uniform radius to individual corners. */
export function toIndividualCorners(className: string): string {
  const uniform = getBorderRadius(className) || "none";
  const without = stripRounded(className);
  const corners = CORNERS.map((c) => buildRoundedClass(uniform, c)).join(" ");
  return without ? `${without} ${corners}` : corners;
}

/** Convert individual corners back to a uniform radius (uses top-left value). */
export function toUniformRadius(className: string): string {
  const radii = getCornerRadii(className);
  const first = radii.tl || radii.tr || radii.bl || radii.br || "";
  return setBorderRadius(className, first);
}

/* ── Inspector variant (dark/light) proxy ─────────────────── */

export type InspectorVariant = "light" | "dark";

/**
 * Extract the "view" of a className for the given variant.
 * - light → returns non-dark classes only
 * - dark  → returns dark:* classes with the prefix stripped
 */
export function getVariantView(className: string, variant: InspectorVariant): string {
  const parts = className.split(/\s+/).filter(Boolean);
  if (variant === "light") {
    return parts.filter((c) => !c.startsWith("dark:")).join(" ");
  }
  return parts
    .filter((c) => c.startsWith("dark:"))
    .map((c) => c.slice(5))
    .join(" ");
}

/**
 * Merge picker output back into the original className for the given variant.
 * - light → keeps dark:* classes, replaces non-dark classes
 * - dark  → keeps non-dark classes, replaces dark:* classes with prefixed versions
 */
export function mergeVariantChanges(
  originalClassName: string,
  newVariantClasses: string,
  variant: InspectorVariant,
): string {
  const original = originalClassName.split(/\s+/).filter(Boolean);
  const updated = newVariantClasses.split(/\s+/).filter(Boolean);

  if (variant === "light") {
    const darkClasses = original.filter((c) => c.startsWith("dark:"));
    return [...updated, ...darkClasses].filter(Boolean).join(" ");
  }

  const lightClasses = original.filter((c) => !c.startsWith("dark:"));
  const newDark = updated.filter(Boolean).map((c) => `dark:${c}`);
  return [...lightClasses, ...newDark].filter(Boolean).join(" ");
}
