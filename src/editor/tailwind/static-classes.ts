/**
 * Generates all standard Tailwind v4 utility class names.
 * Used to supplement CSS-scanned classes so autocomplete
 * can suggest classes not yet used in the project.
 */

const SPACING = [
  "0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6",
  "7", "8", "9", "10", "11", "12", "14", "16", "20", "24", "28", "32",
  "36", "40", "44", "48", "52", "56", "60", "64", "72", "80", "96",
];

const COLORS = [
  "inherit", "current", "transparent", "black", "white",
  ...["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
    "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
    "indigo", "violet", "purple", "fuchsia", "pink", "rose",
  ].flatMap((c) => [
    c + "-50", c + "-100", c + "-200", c + "-300", c + "-400",
    c + "-500", c + "-600", c + "-700", c + "-800", c + "-900", c + "-950",
  ]),
];

const FRACTIONS = ["1/2", "1/3", "2/3", "1/4", "2/4", "3/4", "1/5", "2/5", "3/5", "4/5", "1/6", "5/6"];

const OPACITIES = ["0", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100"];

function prefix(pfx: string, values: string[]): string[] {
  return values.map((v) => `${pfx}-${v}`);
}

export function generateStaticClasses(): string[] {
  const classes: string[] = [];
  const add = (...items: string[]) => classes.push(...items);

  // ── Layout ──
  add(
    "block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid",
    "table", "inline-table", "table-caption", "table-cell", "table-column",
    "table-column-group", "table-footer-group", "table-header-group",
    "table-row-group", "table-row", "flow-root", "contents", "list-item", "hidden",
  );
  add("static", "fixed", "absolute", "relative", "sticky");
  add(
    ...prefix("inset", [...SPACING, "auto", ...FRACTIONS, "full"]),
    ...prefix("inset-x", [...SPACING, "auto", ...FRACTIONS, "full"]),
    ...prefix("inset-y", [...SPACING, "auto", ...FRACTIONS, "full"]),
    ...prefix("top", [...SPACING, "auto", ...FRACTIONS, "full"]),
    ...prefix("right", [...SPACING, "auto", ...FRACTIONS, "full"]),
    ...prefix("bottom", [...SPACING, "auto", ...FRACTIONS, "full"]),
    ...prefix("left", [...SPACING, "auto", ...FRACTIONS, "full"]),
  );
  add(...prefix("z", ["0", "10", "20", "30", "40", "50", "auto"]));
  add("visible", "invisible", "collapse");
  add("float-right", "float-left", "float-none", "clear-left", "clear-right", "clear-both", "clear-none");
  add("isolate", "isolation-auto");
  add(
    "overflow-auto", "overflow-hidden", "overflow-clip", "overflow-visible", "overflow-scroll",
    "overflow-x-auto", "overflow-x-hidden", "overflow-x-clip", "overflow-x-visible", "overflow-x-scroll",
    "overflow-y-auto", "overflow-y-hidden", "overflow-y-clip", "overflow-y-visible", "overflow-y-scroll",
  );
  add(
    "object-contain", "object-cover", "object-fill", "object-none", "object-scale-down",
    "object-bottom", "object-center", "object-left", "object-left-bottom", "object-left-top",
    "object-right", "object-right-bottom", "object-right-top", "object-top",
  );

  // ── Flexbox ──
  add(
    "flex-row", "flex-row-reverse", "flex-col", "flex-col-reverse",
    "flex-wrap", "flex-wrap-reverse", "flex-nowrap",
    "flex-1", "flex-auto", "flex-initial", "flex-none",
    "grow", "grow-0", "shrink", "shrink-0",
    "basis-auto", "basis-full", ...prefix("basis", [...SPACING, ...FRACTIONS]),
  );
  add(
    "justify-normal", "justify-start", "justify-end", "justify-center",
    "justify-between", "justify-around", "justify-evenly", "justify-stretch",
    "justify-items-start", "justify-items-end", "justify-items-center", "justify-items-stretch",
    "justify-self-auto", "justify-self-start", "justify-self-end", "justify-self-center", "justify-self-stretch",
  );
  add(
    "items-start", "items-end", "items-center", "items-baseline", "items-stretch",
    "self-auto", "self-start", "self-end", "self-center", "self-stretch", "self-baseline",
    "content-normal", "content-center", "content-start", "content-end",
    "content-between", "content-around", "content-evenly", "content-baseline", "content-stretch",
    "place-content-center", "place-content-start", "place-content-end",
    "place-content-between", "place-content-around", "place-content-evenly", "place-content-baseline", "place-content-stretch",
    "place-items-start", "place-items-end", "place-items-center", "place-items-baseline", "place-items-stretch",
    "place-self-auto", "place-self-start", "place-self-end", "place-self-center", "place-self-stretch",
  );
  add(...prefix("order", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "first", "last", "none"]));

  // ── Grid ──
  add(
    ...prefix("grid-cols", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "none", "subgrid"]),
    ...prefix("col-span", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "full"]),
    "col-auto", "col-start-auto", "col-end-auto",
    ...prefix("col-start", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]),
    ...prefix("col-end", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]),
    ...prefix("grid-rows", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "none", "subgrid"]),
    ...prefix("row-span", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "full"]),
    "row-auto", "row-start-auto", "row-end-auto",
    ...prefix("row-start", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]),
    ...prefix("row-end", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]),
    "grid-flow-row", "grid-flow-col", "grid-flow-dense", "grid-flow-row-dense", "grid-flow-col-dense",
    "auto-cols-auto", "auto-cols-min", "auto-cols-max", "auto-cols-fr",
    "auto-rows-auto", "auto-rows-min", "auto-rows-max", "auto-rows-fr",
  );

  // ── Spacing ──
  add(
    ...prefix("p", SPACING), ...prefix("px", SPACING), ...prefix("py", SPACING),
    ...prefix("pt", SPACING), ...prefix("pr", SPACING), ...prefix("pb", SPACING), ...prefix("pl", SPACING),
    ...prefix("m", [...SPACING, "auto"]),
    ...prefix("mx", [...SPACING, "auto"]), ...prefix("my", [...SPACING, "auto"]),
    ...prefix("mt", [...SPACING, "auto"]), ...prefix("mr", [...SPACING, "auto"]),
    ...prefix("mb", [...SPACING, "auto"]), ...prefix("ml", [...SPACING, "auto"]),
    ...prefix("gap", SPACING), ...prefix("gap-x", SPACING), ...prefix("gap-y", SPACING),
    ...prefix("space-x", SPACING), ...prefix("space-y", SPACING),
    "space-x-reverse", "space-y-reverse",
  );

  // ── Sizing ──
  add(
    ...prefix("w", [...SPACING, "auto", "full", "screen", "svw", "lvw", "dvw", "min", "max", "fit", ...FRACTIONS]),
    ...prefix("h", [...SPACING, "auto", "full", "screen", "svh", "lvh", "dvh", "min", "max", "fit", ...FRACTIONS]),
    ...prefix("size", [...SPACING, "auto", "full", "min", "max", "fit", ...FRACTIONS]),
    ...prefix("min-w", ["0", "full", "min", "max", "fit"]),
    ...prefix("min-h", ["0", "full", "screen", "svh", "lvh", "dvh", "min", "max", "fit"]),
    ...prefix("max-w", ["0", "none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "full", "min", "max", "fit", "prose", "screen-sm", "screen-md", "screen-lg", "screen-xl", "screen-2xl"]),
    ...prefix("max-h", ["0", "none", "full", "screen", "svh", "lvh", "dvh", "min", "max", "fit"]),
  );
  add("aspect-auto", "aspect-square", "aspect-video");

  // ── Typography ──
  add(
    "text-xs", "text-sm", "text-base", "text-lg", "text-xl",
    "text-2xl", "text-3xl", "text-4xl", "text-5xl", "text-6xl", "text-7xl", "text-8xl", "text-9xl",
    "text-left", "text-center", "text-right", "text-justify", "text-start", "text-end",
    "text-wrap", "text-nowrap", "text-balance", "text-pretty",
  );
  add(
    "font-thin", "font-extralight", "font-light", "font-normal", "font-medium",
    "font-semibold", "font-bold", "font-extrabold", "font-black",
    "font-sans", "font-serif", "font-mono",
  );
  add(
    "italic", "not-italic",
    "underline", "overline", "line-through", "no-underline",
    "uppercase", "lowercase", "capitalize", "normal-case",
    "truncate", "text-ellipsis", "text-clip",
    "antialiased", "subpixel-antialiased",
  );
  add(
    ...prefix("leading", ["3", "4", "5", "6", "7", "8", "9", "10", "none", "tight", "snug", "normal", "relaxed", "loose"]),
    ...prefix("tracking", ["tighter", "tight", "normal", "wide", "wider", "widest"]),
    ...prefix("indent", SPACING),
    "align-baseline", "align-top", "align-middle", "align-bottom", "align-text-top", "align-text-bottom", "align-sub", "align-super",
    "whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap", "whitespace-break-spaces",
    "break-normal", "break-words", "break-all", "break-keep",
    "hyphens-none", "hyphens-manual", "hyphens-auto",
  );
  add(
    ...prefix("decoration", ["auto", "from-font", "0", "1", "2", "4", "8"]),
    "decoration-solid", "decoration-double", "decoration-dotted", "decoration-dashed", "decoration-wavy",
    "underline-offset-auto", ...prefix("underline-offset", ["0", "1", "2", "4", "8"]),
    ...prefix("line-clamp", ["1", "2", "3", "4", "5", "6", "none"]),
    ...prefix("list", ["none", "disc", "decimal", "inside", "outside"]),
  );

  // ── Colors (text, bg, border, ring, etc.) ──
  const COLOR_PREFIXES = [
    "text", "bg", "border", "ring", "divide", "outline",
    "decoration", "accent", "fill", "stroke", "placeholder",
    "from", "via", "to", "shadow",
  ];
  for (const pfx of COLOR_PREFIXES) {
    add(...prefix(pfx, COLORS));
  }
  // Caret color
  add(...prefix("caret", COLORS));

  // ── Background ──
  add(
    "bg-fixed", "bg-local", "bg-scroll",
    "bg-clip-border", "bg-clip-padding", "bg-clip-content", "bg-clip-text",
    "bg-repeat", "bg-no-repeat", "bg-repeat-x", "bg-repeat-y", "bg-repeat-round", "bg-repeat-space",
    "bg-origin-border", "bg-origin-padding", "bg-origin-content",
    "bg-bottom", "bg-center", "bg-left", "bg-left-bottom", "bg-left-top",
    "bg-right", "bg-right-bottom", "bg-right-top", "bg-top",
    "bg-auto", "bg-cover", "bg-contain",
    "bg-none", "bg-gradient-to-t", "bg-gradient-to-tr", "bg-gradient-to-r", "bg-gradient-to-br",
    "bg-gradient-to-b", "bg-gradient-to-bl", "bg-gradient-to-l", "bg-gradient-to-tl",
  );

  // ── Border ──
  add(
    "border", "border-0", "border-2", "border-4", "border-8",
    "border-x", "border-x-0", "border-x-2", "border-x-4", "border-x-8",
    "border-y", "border-y-0", "border-y-2", "border-y-4", "border-y-8",
    "border-t", "border-t-0", "border-t-2", "border-t-4", "border-t-8",
    "border-r", "border-r-0", "border-r-2", "border-r-4", "border-r-8",
    "border-b", "border-b-0", "border-b-2", "border-b-4", "border-b-8",
    "border-l", "border-l-0", "border-l-2", "border-l-4", "border-l-8",
    "border-solid", "border-dashed", "border-dotted", "border-double", "border-hidden", "border-none",
    "divide-x", "divide-x-0", "divide-x-2", "divide-x-4", "divide-x-8", "divide-x-reverse",
    "divide-y", "divide-y-0", "divide-y-2", "divide-y-4", "divide-y-8", "divide-y-reverse",
    "divide-solid", "divide-dashed", "divide-dotted", "divide-double", "divide-none",
  );
  add(
    "rounded-none", "rounded-sm", "rounded", "rounded-md", "rounded-lg",
    "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-full",
    "rounded-t-none", "rounded-t-sm", "rounded-t", "rounded-t-md", "rounded-t-lg", "rounded-t-xl", "rounded-t-2xl", "rounded-t-3xl", "rounded-t-full",
    "rounded-r-none", "rounded-r-sm", "rounded-r", "rounded-r-md", "rounded-r-lg", "rounded-r-xl", "rounded-r-2xl", "rounded-r-3xl", "rounded-r-full",
    "rounded-b-none", "rounded-b-sm", "rounded-b", "rounded-b-md", "rounded-b-lg", "rounded-b-xl", "rounded-b-2xl", "rounded-b-3xl", "rounded-b-full",
    "rounded-l-none", "rounded-l-sm", "rounded-l", "rounded-l-md", "rounded-l-lg", "rounded-l-xl", "rounded-l-2xl", "rounded-l-3xl", "rounded-l-full",
    "rounded-tl-none", "rounded-tl-sm", "rounded-tl", "rounded-tl-md", "rounded-tl-lg", "rounded-tl-xl", "rounded-tl-2xl", "rounded-tl-3xl", "rounded-tl-full",
    "rounded-tr-none", "rounded-tr-sm", "rounded-tr", "rounded-tr-md", "rounded-tr-lg", "rounded-tr-xl", "rounded-tr-2xl", "rounded-tr-3xl", "rounded-tr-full",
    "rounded-bl-none", "rounded-bl-sm", "rounded-bl", "rounded-bl-md", "rounded-bl-lg", "rounded-bl-xl", "rounded-bl-2xl", "rounded-bl-3xl", "rounded-bl-full",
    "rounded-br-none", "rounded-br-sm", "rounded-br", "rounded-br-md", "rounded-br-lg", "rounded-br-xl", "rounded-br-2xl", "rounded-br-3xl", "rounded-br-full",
  );
  add(
    "ring", "ring-0", "ring-1", "ring-2", "ring-4", "ring-8", "ring-inset",
    "outline-none", "outline", "outline-dashed", "outline-dotted", "outline-double",
    ...prefix("outline-offset", ["0", "1", "2", "4", "8"]),
    "outline-0", "outline-1", "outline-2", "outline-4", "outline-8",
  );

  // ── Effects ──
  add(
    "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-inner", "shadow-none",
    ...prefix("opacity", OPACITIES),
    "mix-blend-normal", "mix-blend-multiply", "mix-blend-screen", "mix-blend-overlay",
    "mix-blend-darken", "mix-blend-lighten", "mix-blend-color-dodge", "mix-blend-color-burn",
    "mix-blend-hard-light", "mix-blend-soft-light", "mix-blend-difference", "mix-blend-exclusion",
    "mix-blend-hue", "mix-blend-saturation", "mix-blend-color", "mix-blend-luminosity", "mix-blend-plus-lighter",
    "bg-blend-normal", "bg-blend-multiply", "bg-blend-screen", "bg-blend-overlay",
    "bg-blend-darken", "bg-blend-lighten", "bg-blend-color-dodge", "bg-blend-color-burn",
    "bg-blend-hard-light", "bg-blend-soft-light", "bg-blend-difference", "bg-blend-exclusion",
    "bg-blend-hue", "bg-blend-saturation", "bg-blend-color", "bg-blend-luminosity",
  );

  // ── Filters ──
  add(
    ...prefix("blur", ["none", "sm", "", "md", "lg", "xl", "2xl", "3xl"]).map(c => c === "blur-" ? "blur" : c),
    ...prefix("brightness", ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150", "200"]),
    ...prefix("contrast", ["0", "50", "75", "100", "125", "150", "200"]),
    ...prefix("grayscale", ["0", ""]).map(c => c === "grayscale-" ? "grayscale" : c),
    ...prefix("hue-rotate", ["0", "15", "30", "60", "90", "180"]),
    ...prefix("invert", ["0", ""]).map(c => c === "invert-" ? "invert" : c),
    ...prefix("saturate", ["0", "50", "100", "150", "200"]),
    ...prefix("sepia", ["0", ""]).map(c => c === "sepia-" ? "sepia" : c),
    ...prefix("drop-shadow", ["sm", "", "md", "lg", "xl", "2xl", "none"]).map(c => c === "drop-shadow-" ? "drop-shadow" : c),
    ...prefix("backdrop-blur", ["none", "sm", "", "md", "lg", "xl", "2xl", "3xl"]).map(c => c === "backdrop-blur-" ? "backdrop-blur" : c),
    ...prefix("backdrop-brightness", ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150", "200"]),
    ...prefix("backdrop-contrast", ["0", "50", "75", "100", "125", "150", "200"]),
    ...prefix("backdrop-grayscale", ["0", ""]).map(c => c === "backdrop-grayscale-" ? "backdrop-grayscale" : c),
    ...prefix("backdrop-hue-rotate", ["0", "15", "30", "60", "90", "180"]),
    ...prefix("backdrop-invert", ["0", ""]).map(c => c === "backdrop-invert-" ? "backdrop-invert" : c),
    ...prefix("backdrop-opacity", OPACITIES),
    ...prefix("backdrop-saturate", ["0", "50", "100", "150", "200"]),
    ...prefix("backdrop-sepia", ["0", ""]).map(c => c === "backdrop-sepia-" ? "backdrop-sepia" : c),
  );

  // ── Transforms ──
  add(
    ...prefix("scale", ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150"]),
    ...prefix("scale-x", ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150"]),
    ...prefix("scale-y", ["0", "50", "75", "90", "95", "100", "105", "110", "125", "150"]),
    ...prefix("rotate", ["0", "1", "2", "3", "6", "12", "45", "90", "180"]),
    ...prefix("translate-x", [...SPACING, "full", ...FRACTIONS]),
    ...prefix("translate-y", [...SPACING, "full", ...FRACTIONS]),
    ...prefix("skew-x", ["0", "1", "2", "3", "6", "12"]),
    ...prefix("skew-y", ["0", "1", "2", "3", "6", "12"]),
    "origin-center", "origin-top", "origin-top-right", "origin-right", "origin-bottom-right",
    "origin-bottom", "origin-bottom-left", "origin-left", "origin-top-left",
  );

  // ── Transitions & Animation ──
  add(
    "transition-none", "transition-all", "transition", "transition-colors",
    "transition-opacity", "transition-shadow", "transition-transform",
    ...prefix("duration", ["0", "75", "100", "150", "200", "300", "500", "700", "1000"]),
    "ease-linear", "ease-in", "ease-out", "ease-in-out",
    ...prefix("delay", ["0", "75", "100", "150", "200", "300", "500", "700", "1000"]),
    "animate-none", "animate-spin", "animate-ping", "animate-pulse", "animate-bounce",
  );

  // ── Interactivity ──
  add(
    "cursor-auto", "cursor-default", "cursor-pointer", "cursor-wait", "cursor-text",
    "cursor-move", "cursor-help", "cursor-not-allowed", "cursor-none", "cursor-context-menu",
    "cursor-progress", "cursor-cell", "cursor-crosshair", "cursor-vertical-text",
    "cursor-alias", "cursor-copy", "cursor-no-drop", "cursor-grab", "cursor-grabbing",
    "cursor-all-scroll", "cursor-col-resize", "cursor-row-resize", "cursor-n-resize",
    "cursor-e-resize", "cursor-s-resize", "cursor-w-resize", "cursor-ne-resize",
    "cursor-nw-resize", "cursor-se-resize", "cursor-sw-resize", "cursor-ew-resize",
    "cursor-ns-resize", "cursor-nesw-resize", "cursor-nwse-resize", "cursor-zoom-in", "cursor-zoom-out",
  );
  add(
    "select-none", "select-text", "select-all", "select-auto",
    "resize-none", "resize-y", "resize-x", "resize",
    "scroll-auto", "scroll-smooth",
    "snap-start", "snap-end", "snap-center", "snap-align-none",
    "snap-normal", "snap-always",
    "snap-none", "snap-x", "snap-y", "snap-both", "snap-mandatory", "snap-proximity",
    "touch-auto", "touch-none", "touch-pan-x", "touch-pan-left", "touch-pan-right",
    "touch-pan-y", "touch-pan-up", "touch-pan-down", "touch-pinch-zoom", "touch-manipulation",
    "pointer-events-none", "pointer-events-auto",
    "appearance-none", "appearance-auto",
  );
  add(
    ...prefix("will-change", ["auto", "scroll", "contents", "transform"]),
    ...prefix("scroll-m", SPACING), ...prefix("scroll-mx", SPACING), ...prefix("scroll-my", SPACING),
    ...prefix("scroll-mt", SPACING), ...prefix("scroll-mr", SPACING),
    ...prefix("scroll-mb", SPACING), ...prefix("scroll-ml", SPACING),
    ...prefix("scroll-p", SPACING), ...prefix("scroll-px", SPACING), ...prefix("scroll-py", SPACING),
    ...prefix("scroll-pt", SPACING), ...prefix("scroll-pr", SPACING),
    ...prefix("scroll-pb", SPACING), ...prefix("scroll-pl", SPACING),
  );

  // ── Tables ──
  add(
    "border-collapse", "border-separate",
    "table-auto", "table-fixed",
    "caption-top", "caption-bottom",
  );

  // ── SVG ──
  add("fill-none", "stroke-none", ...prefix("stroke", ["0", "1", "2"]));

  // ── Accessibility ──
  add("sr-only", "not-sr-only", "forced-color-adjust-auto", "forced-color-adjust-none");

  // ── Container ──
  add("container");

  // ── Columns ──
  add(
    ...prefix("columns", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
      "auto", "3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"]),
  );

  return classes;
}
