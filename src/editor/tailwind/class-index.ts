import type { TailwindCategory, TailwindClass } from "../types";

/**
 * Categorize a Tailwind class by its prefix.
 */
function categorize(name: string): TailwindCategory {
  // Layout
  if (
    /^(flex|grid|block|inline|hidden|table|contents|columns|break|box|float|clear|isolat|object|overflow|overscroll|position|inset|top|right|bottom|left|z-)/.test(
      name
    )
  ) {
    return "layout";
  }
  // Spacing
  if (/^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space)-/.test(name)) {
    return "spacing";
  }
  // Sizing
  if (
    /^(w-|h-|min-w|min-h|max-w|max-h|size-|aspect-)/.test(name)
  ) {
    return "sizing";
  }
  // Typography
  if (
    /^(font-|text-(?!.*(color|foreground|muted|beige|zinc|white|black|red|green|blue|yellow|purple|pink|orange|rose|amber|emerald|teal|cyan|sky|indigo|violet|fuchsia|lime|stone|neutral|gray|slate))|leading-|tracking-|indent|align|whitespace|break-|hyphens|content-|truncat|line-clamp|decoration|underline|overline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|italic|not-italic|antialiased|subpixel)/.test(
      name
    )
  ) {
    return "typography";
  }
  // Color (text colors, placeholder colors)
  if (/^(text-|placeholder-)/.test(name) && !categorizeAsTypo(name)) {
    return "color";
  }
  // Background
  if (/^(bg-|from-|via-|to-|gradient)/.test(name)) {
    return "background";
  }
  // Border
  if (/^(border|rounded|ring|outline|divide)/.test(name)) {
    return "border";
  }
  // Effects
  if (/^(shadow|opacity|mix-blend|backdrop|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia|drop-shadow)/.test(name)) {
    return "effect";
  }
  // Transform
  if (/^(scale|rotate|translate|skew|origin|transform)/.test(name)) {
    return "transform";
  }
  // Transition
  if (/^(transition|duration|ease|delay|animate)/.test(name)) {
    return "transition";
  }
  return "other";
}

function categorizeAsTypo(name: string): boolean {
  return /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[)/.test(name);
}

export class TailwindClassIndex {
  private classes: TailwindClass[] = [];
  private byCategory = new Map<TailwindCategory, TailwindClass[]>();

  /**
   * Parse a compiled CSS string and extract all Tailwind class names.
   */
  buildFromCSS(cssText: string): void {
    const classNames = new Set<string>();
    // Match CSS selectors like .text-zinc-400, .bg-red-500\/50, etc.
    const selectorRegex = /\.(-?[a-zA-Z_][\w-]*(?:\\[/.:[\]]*[\w%-]*)*)/g;
    let match: RegExpExecArray | null;

    // Also extract the CSS content for each rule
    const ruleRegex = /\.(-?[a-zA-Z_][\w-]*(?:\\[/.:[\]]*[\w%-]*)*)\s*(?:,\s*[^{]*)?{([^}]*)}/g;
    const cssMap = new Map<string, string>();

    let ruleMatch: RegExpExecArray | null;
    while ((ruleMatch = ruleRegex.exec(cssText)) !== null) {
      const name = unescapeCSS(ruleMatch[1]);
      const body = ruleMatch[2].trim();
      if (!cssMap.has(name)) {
        cssMap.set(name, body);
      }
    }

    while ((match = selectorRegex.exec(cssText)) !== null) {
      classNames.add(unescapeCSS(match[1]));
    }

    this.classes = Array.from(classNames)
      .sort()
      .map((name) => ({
        name,
        category: categorize(name),
        cssText: cssMap.get(name) ?? "",
      }));

    // Group by category
    this.byCategory.clear();
    for (const cls of this.classes) {
      const arr = this.byCategory.get(cls.category) ?? [];
      arr.push(cls);
      this.byCategory.set(cls.category, arr);
    }
  }

  /**
   * Merge static class names into the index.
   * Only adds classes not already present (CSS-scanned classes take priority
   * because they have actual cssText for preview).
   */
  mergeStaticNames(names: string[]): void {
    const existing = new Set(this.classes.map((c) => c.name));
    const newClasses: TailwindClass[] = [];

    for (const name of names) {
      if (existing.has(name)) continue;
      existing.add(name);
      const cls: TailwindClass = { name, category: categorize(name), cssText: "" };
      newClasses.push(cls);
    }

    this.classes = [...this.classes, ...newClasses].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Rebuild category index
    this.byCategory.clear();
    for (const cls of this.classes) {
      const arr = this.byCategory.get(cls.category) ?? [];
      arr.push(cls);
      this.byCategory.set(cls.category, arr);
    }
  }

  /**
   * Search classes by prefix with optional category filter.
   */
  search(
    query: string,
    options?: { category?: TailwindCategory; limit?: number }
  ): TailwindClass[] {
    const limit = options?.limit ?? 50;
    const q = query.toLowerCase();
    const source = options?.category
      ? this.byCategory.get(options.category) ?? []
      : this.classes;

    const results: TailwindClass[] = [];
    for (const cls of source) {
      if (cls.name.toLowerCase().includes(q)) {
        results.push(cls);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  /**
   * Get all categories that have classes.
   */
  getCategories(): TailwindCategory[] {
    return Array.from(this.byCategory.keys());
  }

  get size(): number {
    return this.classes.length;
  }
}

function unescapeCSS(escaped: string): string {
  return escaped.replace(/\\([/.:[\]%])/g, "$1").replace(/\\\//g, "/");
}
