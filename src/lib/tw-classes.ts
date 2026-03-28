/**
 * Comprehensive Tailwind class list for CMS content.
 *
 * Used by:
 * - ClassPicker (editor autocomplete suggestions)
 * - scripts/generate-safelist.mjs (generates @source inline() for Tailwind)
 *
 * Single source of truth — update here, run `npm run generate:safelist`.
 */

function expand(prefixes: string[], values: (string | number)[]): string[] {
  return prefixes.flatMap((p) => values.map((v) => `${p}-${v}`));
}

const SPACING = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20,
  24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
];

const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const COLOR_FAMILIES = [
  "zinc", "red", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose", "slate", "gray", "neutral", "stone",
];

const FONT_SIZES = [
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl",
  "8xl", "9xl",
];

const RADII = ["none", "sm", "md", "lg", "xl", "2xl", "3xl", "full"];

// Site custom theme colors (from globals.css @theme)
const CUSTOM_COLORS = [
  "beige", "beige-dark", "lt-grey", "body", "body-dark", "background",
  "foreground", "muted-foreground", "muted-foreground-dark",
  "zinc-150", "zinc-925", "zinc-850",
];

export const ALL_CLASSES: string[] = (() => {
  const classes: string[] = [];

  // Layout
  classes.push(
    "block", "inline-block", "inline", "flex", "inline-flex", "grid",
    "inline-grid", "hidden", "contents", "flow-root",
    "flex-row", "flex-row-reverse", "flex-col", "flex-col-reverse",
    "flex-wrap", "flex-wrap-reverse", "flex-nowrap",
    "flex-1", "flex-auto", "flex-initial", "flex-none",
    "grow", "grow-0", "shrink", "shrink-0",
    "items-start", "items-end", "items-center", "items-baseline", "items-stretch",
    "justify-start", "justify-end", "justify-center", "justify-between",
    "justify-around", "justify-evenly",
    "self-auto", "self-start", "self-end", "self-center", "self-stretch",
    "place-content-center", "place-content-start", "place-content-end",
    "place-items-center", "place-items-start", "place-items-end",
  );

  // Grid
  classes.push(
    ...expand(["grid-cols"], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "none"]),
    ...expand(["grid-rows"], [1, 2, 3, 4, 5, 6, "none"]),
    ...expand(["col-span"], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "full"]),
    ...expand(["row-span"], [1, 2, 3, 4, 5, 6]),
    "col-auto", "row-auto",
  );

  // Spacing: p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml, mbs, mbe, gap
  classes.push(
    ...expand(
      ["p", "px", "py", "pt", "pr", "pb", "pl", "m", "mx", "my", "mt", "mr", "mb", "ml", "mbs", "mbe", "gap", "gap-x", "gap-y"],
      SPACING,
    ),
    "m-auto", "mx-auto", "my-auto", "ml-auto", "mr-auto",
  );

  // Spacing with negative values
  classes.push(
    ...expand(
      ["-m", "-mx", "-my", "-mt", "-mr", "-mb", "-ml"],
      SPACING.filter((v) => v !== 0),
    ),
  );

  // !important margin overrides (for overriding unlayered prose styles)
  classes.push(
    ...expand(
      ["!m", "!mx", "!my", "!mt", "!mr", "!mb", "!ml", "!mbs", "!mbe"],
      SPACING,
    ),
  );

  // Sizing
  classes.push(
    ...expand(["w"], [...SPACING, "full", "screen", "min", "max", "fit", "auto",
      "1/2", "1/3", "2/3", "1/4", "2/4", "3/4", "1/5", "2/5", "3/5", "4/5",
      "1/6", "5/6",
    ]),
    ...expand(["h"], [...SPACING, "full", "screen", "min", "max", "fit", "auto",
      "1/2", "1/3", "2/3", "1/4", "2/4", "3/4", "1/5", "2/5", "3/5", "4/5",
      "1/6", "5/6",
    ]),
    ...expand(["min-w"], [0, "full", "min", "max", "fit"]),
    ...expand(["min-h"], [0, "full", "screen", "min", "max", "fit"]),
    ...expand(["max-w"], [
      0, "none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl",
      "6xl", "7xl", "full", "min", "max", "fit", "prose", "screen-sm",
      "screen-md", "screen-lg", "screen-xl", "screen-2xl",
    ]),
    ...expand(["max-h"], [0, "full", "screen", "min", "max", "fit"]),
    ...expand(["size"], [...SPACING, "full", "min", "max", "fit", "auto"]),
  );

  // Typography
  classes.push(
    ...expand(["text"], FONT_SIZES),
    "text-left", "text-center", "text-right", "text-justify", "text-start", "text-end",
    "font-thin", "font-extralight", "font-light", "font-normal", "font-medium",
    "font-semibold", "font-bold", "font-extrabold", "font-black",
    "font-sans", "font-serif", "font-mono",
    "italic", "not-italic",
    "underline", "overline", "line-through", "no-underline",
    "uppercase", "lowercase", "capitalize", "normal-case",
    "leading-none", "leading-tight", "leading-snug", "leading-normal",
    "leading-relaxed", "leading-loose",
    ...expand(["leading"], [3, 4, 5, 6, 7, 8, 9, 10]),
    "tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide",
    "tracking-wider", "tracking-widest",
    "whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line",
    "whitespace-pre-wrap", "whitespace-break-spaces",
    "break-normal", "break-words", "break-all", "break-keep",
    "truncate", "text-ellipsis", "text-clip",
    "antialiased", "subpixel-antialiased",
    "text-wrap", "text-nowrap", "text-balance", "text-pretty",
    ...expand(["line-clamp"], [1, 2, 3, 4, 5, 6, "none"]),
  );

  // Colors: bg, text, border — standard families
  for (const family of COLOR_FAMILIES) {
    classes.push(
      ...expand([`bg-${family}`, `text-${family}`, `border-${family}`], COLOR_SHADES),
    );
  }
  classes.push(
    "bg-white", "bg-black", "bg-transparent", "bg-current",
    "text-white", "text-black", "text-transparent", "text-current",
    "border-white", "border-black", "border-transparent", "border-current",
  );

  // Site custom colors
  for (const c of CUSTOM_COLORS) {
    classes.push(`bg-${c}`, `text-${c}`, `border-${c}`);
  }

  // Borders
  classes.push(
    "border", "border-0", "border-2", "border-4", "border-8",
    "border-x", "border-x-0", "border-x-2", "border-x-4",
    "border-y", "border-y-0", "border-y-2", "border-y-4",
    "border-t", "border-t-0", "border-t-2", "border-t-4",
    "border-r", "border-r-0", "border-r-2", "border-r-4",
    "border-b", "border-b-0", "border-b-2", "border-b-4",
    "border-l", "border-l-0", "border-l-2", "border-l-4",
    "border-solid", "border-dashed", "border-dotted", "border-double", "border-none",
    "rounded",
    ...expand(["rounded"], RADII),
    ...expand(["rounded-t", "rounded-r", "rounded-b", "rounded-l",
      "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"], RADII),
    "divide-x", "divide-y", "divide-x-0", "divide-y-0",
    "divide-x-2", "divide-y-2", "divide-x-4", "divide-y-4",
    "divide-x-reverse", "divide-y-reverse",
  );

  // Shadows (standard + site custom)
  classes.push(
    "shadow", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl",
    "shadow-2xl", "shadow-inner", "shadow-none",
    "shadow-strong", "shadow-card", "shadow-card-hover",
  );

  // Opacity
  classes.push(...expand(["opacity"], [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]));

  // Effects
  classes.push(
    "blur", "blur-none", "blur-sm", "blur-md", "blur-lg", "blur-xl", "blur-2xl", "blur-3xl",
    "brightness-0", "brightness-50", "brightness-75", "brightness-90", "brightness-95",
    "brightness-100", "brightness-105", "brightness-110", "brightness-125", "brightness-150", "brightness-200",
    "backdrop-blur-sm", "backdrop-blur", "backdrop-blur-md", "backdrop-blur-lg", "backdrop-blur-xl",
    "mix-blend-normal", "mix-blend-multiply", "mix-blend-screen", "mix-blend-overlay",
  );

  // Overflow
  classes.push(
    "overflow-auto", "overflow-hidden", "overflow-clip", "overflow-visible", "overflow-scroll",
    "overflow-x-auto", "overflow-x-hidden", "overflow-x-clip", "overflow-x-visible", "overflow-x-scroll",
    "overflow-y-auto", "overflow-y-hidden", "overflow-y-clip", "overflow-y-visible", "overflow-y-scroll",
  );

  // Position
  classes.push(
    "static", "fixed", "absolute", "relative", "sticky",
    ...expand(["inset"], [0, "auto", "px", ...SPACING]),
    ...expand(["top", "right", "bottom", "left"], [0, "auto", "px", "full", "1/2", "1/3", "2/3", "1/4", "3/4"]),
    ...expand(["z"], [0, 10, 20, 30, 40, 50, "auto"]),
  );

  // Display & visibility
  classes.push(
    "visible", "invisible", "collapse",
    "isolate", "isolation-auto",
  );

  // Object fit & position
  classes.push(
    "object-contain", "object-cover", "object-fill", "object-none", "object-scale-down",
    "object-bottom", "object-center", "object-left", "object-left-bottom", "object-left-top",
    "object-right", "object-right-bottom", "object-right-top", "object-top",
  );

  // Aspect ratio
  classes.push("aspect-auto", "aspect-square", "aspect-video");

  // Transitions
  classes.push(
    "transition", "transition-none", "transition-all", "transition-colors",
    "transition-opacity", "transition-shadow", "transition-transform",
    ...expand(["duration"], [75, 100, 150, 200, 300, 500, 700, 1000]),
    "ease-linear", "ease-in", "ease-out", "ease-in-out",
    ...expand(["delay"], [75, 100, 150, 200, 300, 500, 700, 1000]),
  );

  // Transforms
  classes.push(
    ...expand(["scale"], [0, 50, 75, 90, 95, 100, 105, 110, 125, 150]),
    ...expand(["rotate"], [0, 1, 2, 3, 6, 12, 45, 90, 180]),
    ...expand(["-rotate"], [1, 2, 3, 6, 12, 45, 90, 180]),
    ...expand(["translate-x", "translate-y"], [0, "px", 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, "1/2", "1/3", "2/3", "1/4", "3/4", "full"]),
    "transform", "transform-gpu", "transform-none",
  );

  // Cursor
  classes.push(
    "cursor-auto", "cursor-default", "cursor-pointer", "cursor-wait",
    "cursor-text", "cursor-move", "cursor-help", "cursor-not-allowed", "cursor-none",
    "cursor-grab", "cursor-grabbing",
  );

  // Pointer events & user select
  classes.push(
    "pointer-events-none", "pointer-events-auto",
    "select-none", "select-text", "select-all", "select-auto",
  );

  // Scroll
  classes.push(
    "scroll-smooth", "scroll-auto",
    ...expand(["scroll-m", "scroll-p"], SPACING),
  );

  // Background
  classes.push(
    "bg-fixed", "bg-local", "bg-scroll",
    "bg-clip-border", "bg-clip-padding", "bg-clip-content", "bg-clip-text",
    "bg-repeat", "bg-no-repeat", "bg-repeat-x", "bg-repeat-y", "bg-repeat-round", "bg-repeat-space",
    "bg-auto", "bg-cover", "bg-contain",
    "bg-center", "bg-top", "bg-right-top", "bg-right", "bg-right-bottom",
    "bg-bottom", "bg-left-bottom", "bg-left", "bg-left-top",
    "bg-none",
    ...expand(["bg-gradient-to"], ["t", "tr", "r", "br", "b", "bl", "l", "tl"]),
  );

  // Ring
  classes.push(
    "ring", "ring-0", "ring-1", "ring-2", "ring-4", "ring-8", "ring-inset",
  );

  // Dark mode variants for common utilities
  const darkPrefixed: string[] = [];
  for (const family of COLOR_FAMILIES) {
    darkPrefixed.push(
      ...expand([`dark:bg-${family}`, `dark:text-${family}`, `dark:border-${family}`], COLOR_SHADES),
    );
  }
  darkPrefixed.push(
    "dark:bg-white", "dark:bg-black", "dark:bg-transparent",
    "dark:text-white", "dark:text-black", "dark:text-transparent",
    "dark:border-white", "dark:border-black", "dark:border-transparent",
  );
  for (const c of CUSTOM_COLORS) {
    darkPrefixed.push(`dark:bg-${c}`, `dark:text-${c}`, `dark:border-${c}`);
  }
  // Dark variants for non-color utilities (used by inspector pickers)
  darkPrefixed.push(
    "dark:rounded",
    ...expand(["dark:rounded"], RADII),
    ...expand(["dark:rounded-t", "dark:rounded-r", "dark:rounded-b", "dark:rounded-l",
      "dark:rounded-tl", "dark:rounded-tr", "dark:rounded-br", "dark:rounded-bl"], RADII),
    ...expand(["dark:shadow"], ["sm", "md", "lg", "xl", "2xl", "inner", "none"]),
    "dark:shadow",
    "dark:opacity-0", "dark:opacity-5", "dark:opacity-10", "dark:opacity-20",
    "dark:opacity-25", "dark:opacity-30", "dark:opacity-40", "dark:opacity-50",
    "dark:opacity-60", "dark:opacity-70", "dark:opacity-75", "dark:opacity-80",
    "dark:opacity-90", "dark:opacity-95", "dark:opacity-100",
    "dark:aspect-auto", "dark:aspect-square", "dark:aspect-video",
    ...expand(["dark:ring"], ["0", "1", "2", "4", "8"]),
    "dark:ring", "dark:ring-inset",
    ...expand(["dark:border"], ["0", "2", "4", "8"]),
    "dark:border", "dark:border-none",
    "dark:hidden", "dark:block", "dark:inline", "dark:flex", "dark:grid",
    "dark:inline-block", "dark:inline-flex",
  );
  classes.push(...darkPrefixed);

  // Hover variants for colors
  const hoverPrefixed: string[] = [];
  for (const family of ["zinc", "slate", "gray", "neutral"]) {
    hoverPrefixed.push(
      ...expand([`hover:bg-${family}`, `hover:text-${family}`], COLOR_SHADES),
    );
  }
  hoverPrefixed.push("hover:opacity-80", "hover:opacity-90", "hover:opacity-100");
  classes.push(...hoverPrefixed);

  // Deduplicate & sort
  return [...new Set(classes)].sort();
})();
