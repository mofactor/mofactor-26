/**
 * Parse an element's Tailwind classes into structured design values,
 * decomposed by variant (breakpoint + theme).
 */

import { extractVariants, stripVariants } from "./variant-resolver";

// ── Types ──

export interface SpacingSides {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface OverflowValue {
  overflow?: string; // "hidden" | "visible" | "auto" | "scroll" | "clip"
}

/** Variant key is the concatenation of sorted variant prefixes, e.g., "", "dark:", "lg:", "dark:lg:" */
export type VariantKey = string;

export interface ParsedDesignValues {
  padding: Record<VariantKey, SpacingSides>;
  overflow: Record<VariantKey, OverflowValue>;
}

// ── Padding regex ──
// Matches: p-4, px-4, py-4, pt-4, pr-4, pb-4, pl-4, p-[16px], etc.
const PADDING_REGEX = /^(p|px|py|pt|pr|pb|pl)-(.+)$/;

// ── Overflow regex ──
const OVERFLOW_REGEX = /^overflow-(hidden|visible|auto|scroll|clip)$/;

// ── Helpers ──

/**
 * Build a variant key from extracted variant prefixes.
 * Prefixes are joined as-is (already in order from extractVariants).
 */
function buildVariantKey(variants: string[]): VariantKey {
  return variants.join("");
}

/**
 * Build a variant key from breakpoint and theme selections.
 */
export function getVariantKey(
  breakpoint: string,
  theme: string
): VariantKey {
  const parts: string[] = [];
  if (theme === "dark") parts.push("dark:");
  if (breakpoint !== "base") parts.push(`${breakpoint}:`);
  return parts.join("");
}

/**
 * Apply a padding class match to the sides object.
 * Handles shorthand expansion: p- sets all 4, px- sets left+right, etc.
 */
function applyPaddingToSides(
  sides: SpacingSides,
  prefix: string,
  value: string
): void {
  switch (prefix) {
    case "p":
      sides.top = value;
      sides.right = value;
      sides.bottom = value;
      sides.left = value;
      break;
    case "px":
      sides.right = value;
      sides.left = value;
      break;
    case "py":
      sides.top = value;
      sides.bottom = value;
      break;
    case "pt":
      sides.top = value;
      break;
    case "pr":
      sides.right = value;
      break;
    case "pb":
      sides.bottom = value;
      break;
    case "pl":
      sides.left = value;
      break;
  }
}

// ── Main Parser ──

/**
 * Parse an element's class list into structured design values.
 * Classes are processed in order so later per-side classes override earlier shorthands.
 */
export function parseDesignClasses(classString: string): ParsedDesignValues {
  const result: ParsedDesignValues = {
    padding: {},
    overflow: {},
  };

  const classes = classString.split(/\s+/).filter(Boolean);

  for (const cls of classes) {
    const variants = extractVariants(cls);
    const base = stripVariants(cls);
    const variantKey = buildVariantKey(variants);

    // Try padding
    const paddingMatch = base.match(PADDING_REGEX);
    if (paddingMatch) {
      const [, prefix, value] = paddingMatch;
      if (!result.padding[variantKey]) {
        result.padding[variantKey] = {};
      }
      applyPaddingToSides(result.padding[variantKey], prefix, value);
      continue;
    }

    // Try overflow
    const overflowMatch = base.match(OVERFLOW_REGEX);
    if (overflowMatch) {
      const [, value] = overflowMatch;
      if (!result.overflow[variantKey]) {
        result.overflow[variantKey] = {};
      }
      result.overflow[variantKey].overflow = value;
    }
  }

  return result;
}

/**
 * Get padding sides for a specific variant, or empty object if none set.
 */
export function getPaddingForVariant(
  parsed: ParsedDesignValues,
  variantKey: VariantKey
): SpacingSides {
  return parsed.padding[variantKey] ?? {};
}

/**
 * Get overflow value for a specific variant, or undefined if none set.
 */
export function getOverflowForVariant(
  parsed: ParsedDesignValues,
  variantKey: VariantKey
): string | undefined {
  return parsed.overflow[variantKey]?.overflow;
}
