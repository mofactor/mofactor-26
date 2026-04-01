/**
 * Bidirectional mapping between Tailwind spacing tokens and their CSS values.
 * Used by the Design tab to display/accept spacing values.
 */

/** Standard Tailwind v4 spacing scale */
export const SPACING_TOKENS = [
  "0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6",
  "7", "8", "9", "10", "11", "12", "14", "16", "20", "24", "28", "32",
  "36", "40", "44", "48", "52", "56", "60", "64", "72", "80", "96",
] as const;

/** Token → CSS value */
export const TOKEN_TO_CSS: Record<string, string> = {
  "0": "0px",
  "px": "1px",
  "0.5": "0.125rem",
  "1": "0.25rem",
  "1.5": "0.375rem",
  "2": "0.5rem",
  "2.5": "0.625rem",
  "3": "0.75rem",
  "3.5": "0.875rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "7": "1.75rem",
  "8": "2rem",
  "9": "2.25rem",
  "10": "2.5rem",
  "11": "2.75rem",
  "12": "3rem",
  "14": "3.5rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
  "28": "7rem",
  "32": "8rem",
  "36": "9rem",
  "40": "10rem",
  "44": "11rem",
  "48": "12rem",
  "52": "13rem",
  "56": "14rem",
  "60": "15rem",
  "64": "16rem",
  "72": "18rem",
  "80": "20rem",
  "96": "24rem",
};

/** Token → pixel value (assuming 1rem = 16px) */
export const TOKEN_TO_PX: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_TO_CSS).map(([token, css]) => {
    if (css === "0px" || css === "1px") return [token, css];
    const rem = parseFloat(css);
    return [token, `${rem * 16}px`];
  })
);

/**
 * Check if a value is a known spacing token.
 */
export function isSpacingToken(value: string): boolean {
  return value in TOKEN_TO_CSS;
}

/**
 * Format a spacing value for use in a Tailwind class.
 * Known tokens pass through as-is, arbitrary values get wrapped in brackets.
 * e.g., "4" → "4", "16px" → "[16px]"
 */
export function formatSpacingValue(value: string): string {
  if (!value) return "";
  if (isSpacingToken(value)) return value;
  // Already bracketed
  if (value.startsWith("[") && value.endsWith("]")) return value;
  // Arbitrary value
  return `[${value}]`;
}

/**
 * Parse a spacing value from a Tailwind class suffix.
 * e.g., "4" → "4", "[16px]" → "16px"
 */
export function parseSpacingValue(classSuffix: string): string {
  if (classSuffix.startsWith("[") && classSuffix.endsWith("]")) {
    return classSuffix.slice(1, -1);
  }
  return classSuffix;
}
