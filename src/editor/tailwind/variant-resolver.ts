/**
 * Known Tailwind variant prefixes.
 * Responsive breakpoints + state + dark mode.
 */
export const VARIANT_PREFIXES = [
  // Responsive
  "sm:",
  "md:",
  "lg:",
  "xl:",
  "2xl:",
  // State
  "hover:",
  "focus:",
  "active:",
  "disabled:",
  "first:",
  "last:",
  "odd:",
  "even:",
  // Dark mode
  "dark:",
  // Group / peer
  "group-hover:",
  "peer-focus:",
] as const;

/**
 * Strip all variant prefixes from a class name to get the base utility.
 * e.g., "dark:md:text-white" → "text-white"
 */
export function stripVariants(className: string): string {
  let result = className;
  for (const prefix of VARIANT_PREFIXES) {
    while (result.startsWith(prefix)) {
      result = result.slice(prefix.length);
    }
  }
  return result;
}

/**
 * Extract variant prefixes from a class name.
 * e.g., "dark:md:text-white" → ["dark:", "md:"]
 */
export function extractVariants(className: string): string[] {
  const variants: string[] = [];
  let remaining = className;
  for (const prefix of VARIANT_PREFIXES) {
    while (remaining.startsWith(prefix)) {
      variants.push(prefix);
      remaining = remaining.slice(prefix.length);
    }
  }
  return variants;
}

/**
 * Compose a class name with variant prefixes.
 * e.g., composeVariants("text-white", ["dark:", "md:"]) → "dark:md:text-white"
 */
export function composeVariants(
  baseClass: string,
  variants: string[]
): string {
  return variants.join("") + baseClass;
}
