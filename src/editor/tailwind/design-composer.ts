/**
 * Compose design value changes into Tailwind class add/remove operations.
 * Works with the existing onAddClass/onRemoveClass flow from EditorPanel.
 */

import { extractVariants, stripVariants, composeVariants } from "./variant-resolver";
import { formatSpacingValue } from "./spacing-map";
import { type VariantKey } from "./design-parser";

// ── Types ──

export type PaddingSide = "top" | "right" | "bottom" | "left";

/** Map from logical side to Tailwind class prefix */
const PADDING_SIDE_PREFIX: Record<PaddingSide, string> = {
  top: "pt",
  right: "pr",
  bottom: "pb",
  left: "pl",
};

const PADDING_AXIS_PREFIX = { x: "px", y: "py" } as const;

/** All padding-related prefixes for matching */
const ALL_PADDING_PREFIXES = ["p", "px", "py", "pt", "pr", "pb", "pl"];

// ── Helpers ──

/**
 * Parse variant key string back into array of variant prefixes.
 * e.g., "dark:lg:" → ["dark:", "lg:"]
 */
function variantKeyToArray(variantKey: VariantKey): string[] {
  if (!variantKey) return [];
  const parts: string[] = [];
  let remaining = variantKey;
  // Split on colons, keeping the colon attached
  while (remaining) {
    const idx = remaining.indexOf(":");
    if (idx === -1) break;
    parts.push(remaining.slice(0, idx + 1));
    remaining = remaining.slice(idx + 1);
  }
  return parts;
}

/**
 * Find all existing classes for a given padding property+variant combo.
 * Returns classes that affect the given side (including shorthands like p- and px-/py-).
 */
function findPaddingClasses(
  classString: string,
  side: PaddingSide,
  variantKey: VariantKey
): string[] {
  const classes = classString.split(/\s+/).filter(Boolean);
  const matches: string[] = [];

  // Which prefixes affect this side?
  const affectingSide: string[] = ["p", PADDING_SIDE_PREFIX[side]];
  if (side === "left" || side === "right") affectingSide.push("px");
  if (side === "top" || side === "bottom") affectingSide.push("py");

  for (const cls of classes) {
    const variants = extractVariants(cls);
    const base = stripVariants(cls);
    const clsVariantKey = variants.join("");

    if (clsVariantKey !== variantKey) continue;

    const paddingMatch = base.match(/^(p|px|py|pt|pr|pb|pl)-(.+)$/);
    if (paddingMatch && affectingSide.includes(paddingMatch[1])) {
      matches.push(cls);
    }
  }

  return matches;
}

/**
 * Find all padding classes for a specific variant key (any side/shorthand).
 */
function findAllPaddingClassesForVariant(
  classString: string,
  variantKey: VariantKey
): string[] {
  const classes = classString.split(/\s+/).filter(Boolean);
  const matches: string[] = [];

  for (const cls of classes) {
    const variants = extractVariants(cls);
    const base = stripVariants(cls);
    const clsVariantKey = variants.join("");

    if (clsVariantKey !== variantKey) continue;

    const paddingMatch = base.match(/^(p|px|py|pt|pr|pb|pl)-(.+)$/);
    if (paddingMatch) {
      matches.push(cls);
    }
  }

  return matches;
}

/**
 * Get the current effective padding values for a variant by parsing existing classes.
 */
function getCurrentPadding(
  classString: string,
  variantKey: VariantKey
): { top?: string; right?: string; bottom?: string; left?: string } {
  const classes = classString.split(/\s+/).filter(Boolean);
  const sides: { top?: string; right?: string; bottom?: string; left?: string } = {};

  for (const cls of classes) {
    const variants = extractVariants(cls);
    const base = stripVariants(cls);
    const clsVariantKey = variants.join("");

    if (clsVariantKey !== variantKey) continue;

    const paddingMatch = base.match(/^(p|px|py|pt|pr|pb|pl)-(.+)$/);
    if (!paddingMatch) continue;

    const [, prefix, value] = paddingMatch;
    switch (prefix) {
      case "p":
        sides.top = value; sides.right = value; sides.bottom = value; sides.left = value;
        break;
      case "px":
        sides.right = value; sides.left = value;
        break;
      case "py":
        sides.top = value; sides.bottom = value;
        break;
      case "pt": sides.top = value; break;
      case "pr": sides.right = value; break;
      case "pb": sides.bottom = value; break;
      case "pl": sides.left = value; break;
    }
  }

  return sides;
}

// ── Public API ──

/**
 * Apply a per-side padding change.
 * Handles shorthand explosion: if element has `p-4` and you change only top,
 * it removes `p-4` and adds individual per-side classes to preserve the others.
 */
export function applyPaddingChange(
  side: PaddingSide,
  newValue: string | null,
  variantKey: VariantKey,
  currentClasses: string,
  onAddClass: (cls: string) => void,
  onRemoveClass: (cls: string) => void
): void {
  const variantPrefixes = variantKeyToArray(variantKey);

  // Get current state of all sides before our change
  const current = getCurrentPadding(currentClasses, variantKey);

  // Remove all padding classes for this variant (we'll re-emit the correct ones)
  const existingClasses = findAllPaddingClassesForVariant(currentClasses, variantKey);
  for (const cls of existingClasses) {
    onRemoveClass(cls);
  }

  // Build new side values
  const newSides = { ...current };
  if (newValue !== null && newValue !== "") {
    newSides[side] = formatSpacingValue(newValue);
  } else {
    delete newSides[side];
  }

  // Emit optimal classes
  emitPaddingClasses(newSides, variantPrefixes, onAddClass);
}

/**
 * Apply a padding change for an axis (px or py).
 */
export function applyPaddingAxisChange(
  axis: "x" | "y",
  newValue: string | null,
  variantKey: VariantKey,
  currentClasses: string,
  onAddClass: (cls: string) => void,
  onRemoveClass: (cls: string) => void
): void {
  const variantPrefixes = variantKeyToArray(variantKey);
  const current = getCurrentPadding(currentClasses, variantKey);

  // Remove all padding classes for this variant
  const existingClasses = findAllPaddingClassesForVariant(currentClasses, variantKey);
  for (const cls of existingClasses) {
    onRemoveClass(cls);
  }

  const newSides = { ...current };
  if (axis === "x") {
    if (newValue !== null && newValue !== "") {
      newSides.left = formatSpacingValue(newValue);
      newSides.right = formatSpacingValue(newValue);
    } else {
      delete newSides.left;
      delete newSides.right;
    }
  } else {
    if (newValue !== null && newValue !== "") {
      newSides.top = formatSpacingValue(newValue);
      newSides.bottom = formatSpacingValue(newValue);
    } else {
      delete newSides.top;
      delete newSides.bottom;
    }
  }

  emitPaddingClasses(newSides, variantPrefixes, onAddClass);
}

/**
 * Emit the minimal set of padding classes for given side values.
 * Optimizes: if all 4 are equal → p-X, if pairs match → px-X py-X, else individual.
 */
function emitPaddingClasses(
  sides: { top?: string; right?: string; bottom?: string; left?: string },
  variantPrefixes: string[],
  onAddClass: (cls: string) => void
): void {
  const { top, right, bottom, left } = sides;

  // Nothing to emit
  if (!top && !right && !bottom && !left) return;

  // All 4 equal → p-X
  if (top && top === right && top === bottom && top === left) {
    onAddClass(composeVariants(`p-${top}`, variantPrefixes));
    return;
  }

  // Check axis pairs
  const xMatch = left && left === right;
  const yMatch = top && top === bottom;

  if (xMatch) {
    onAddClass(composeVariants(`px-${left}`, variantPrefixes));
  } else {
    if (left) onAddClass(composeVariants(`pl-${left}`, variantPrefixes));
    if (right) onAddClass(composeVariants(`pr-${right}`, variantPrefixes));
  }

  if (yMatch) {
    onAddClass(composeVariants(`py-${top}`, variantPrefixes));
  } else {
    if (top) onAddClass(composeVariants(`pt-${top}`, variantPrefixes));
    if (bottom) onAddClass(composeVariants(`pb-${bottom}`, variantPrefixes));
  }
}

/**
 * Apply an overflow change (clip content toggle).
 */
export function applyOverflowChange(
  newValue: string | null,
  variantKey: VariantKey,
  currentClasses: string,
  onAddClass: (cls: string) => void,
  onRemoveClass: (cls: string) => void
): void {
  const variantPrefixes = variantKeyToArray(variantKey);
  const classes = currentClasses.split(/\s+/).filter(Boolean);

  // Remove existing overflow classes for this variant
  for (const cls of classes) {
    const variants = extractVariants(cls);
    const base = stripVariants(cls);
    const clsVariantKey = variants.join("");

    if (clsVariantKey !== variantKey) continue;

    if (/^overflow-(hidden|visible|auto|scroll|clip)$/.test(base)) {
      onRemoveClass(cls);
    }
  }

  // Add new overflow class if value provided
  if (newValue) {
    onAddClass(composeVariants(`overflow-${newValue}`, variantPrefixes));
  }
}
