import { TailwindClassIndex } from "./class-index";
import { generateStaticClasses } from "./static-classes";

/**
 * Fetches compiled Tailwind CSS from the Next.js dev server
 * and builds a searchable class index.
 * CSS-scanned classes get priority (they have cssText for preview).
 * Static class names fill in the rest for comprehensive autocomplete.
 */
export async function buildTailwindIndex(): Promise<TailwindClassIndex> {
  const index = new TailwindClassIndex();

  try {
    const cssTexts: string[] = [];

    // Method 1: Read from document.styleSheets (already loaded)
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.cssRules) {
          const rules = Array.from(sheet.cssRules);
          cssTexts.push(rules.map((r) => r.cssText).join("\n"));
        }
      } catch {
        // Cross-origin sheets throw SecurityError — skip
      }
    }

    // Method 2: Fetch any <link> stylesheets we couldn't read via CSSOM
    const linkSheets = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    );
    for (const link of linkSheets) {
      if (link.href && new URL(link.href).origin === location.origin) {
        try {
          const res = await fetch(link.href);
          const text = await res.text();
          cssTexts.push(text);
        } catch {
          // Skip failures
        }
      }
    }

    const combined = cssTexts.join("\n");
    index.buildFromCSS(combined);
  } catch {
    // Silently fail — autocomplete just won't have data
  }

  // Merge all standard Tailwind utility names for comprehensive autocomplete
  index.mergeStaticNames(generateStaticClasses());

  return index;
}
