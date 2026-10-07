/**
 * React fiber walking utilities.
 * Extracts _debugSource metadata from React's internal fiber tree
 * to get the exact source file:line:column that rendered a DOM element.
 *
 * Only works in development mode — React strips _debugSource in production.
 */

export interface SourceLocation {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

/**
 * Find the React fiber node attached to a DOM element.
 * React attaches fibers as `__reactFiber$xxxxx` properties.
 */
function getFiber(el: HTMLElement): any | null {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  return key ? (el as any)[key] : null;
}

/**
 * Walk up the DOM tree to find the nearest element with a React fiber.
 * Handles elements created by non-React code (e.g. anime.js splitText).
 */
function findNearestFiber(el: HTMLElement): any | null {
  let current: HTMLElement | null = el;
  const maxWalk = 30;
  let walked = 0;
  while (current && walked < maxWalk) {
    const fiber = getFiber(current);
    if (fiber) return fiber;
    current = current.parentElement;
    walked++;
  }
  return null;
}

/**
 * Astro's dev compiler stamps every element from an .astro template with
 * data-astro-source-file / data-astro-source-loc ("line:col"). Elements rendered by a
 * React island don't have them; for those, fall back to the island's component file.
 */
type AstroSource = { file: string; loc: string | null };

/** The stamp for one element: captured early by the factorframe integration (Astro's dev
 *  toolbar strips the attributes after load), or still on the element. */
function readAstroSource(el: Element): AstroSource | null {
  const captured = (window as { __factorframeSources?: WeakMap<Element, AstroSource> }).__factorframeSources?.get(el);
  if (captured) return captured;
  const file = el.getAttribute("data-astro-source-file");
  return file ? { file, loc: el.getAttribute("data-astro-source-loc") } : null;
}

function getAstroSourceLocation(el: HTMLElement): SourceLocation | null {
  const island = el.closest("astro-island");
  // Nearest stamped ancestor, skipping Astro's own components (node_modules/astro/components/Image.astro)
  let node: Element | null = el;
  let source: AstroSource | null = null;
  for (; node; node = node.parentElement) {
    source = readAstroSource(node);
    if (source && !source.file.includes("/node_modules/")) break;
  }
  // Inside an island, only Astro-rendered slot content (inside the island) is stamped
  if (node && source && (!island || island.contains(node))) {
    const [line, col] = (source.loc ?? "").split(":").map(Number);
    return { fileName: source.file, lineNumber: line || 0, columnNumber: col || 0 };
  }
  const componentUrl = island?.getAttribute("component-url");
  if (componentUrl) {
    return { fileName: componentUrl.replace(/^\//, "").split("?")[0], lineNumber: 0, columnNumber: 0 };
  }
  return null;
}

/**
 * Walk up the fiber tree from a DOM element to find _debugSource.
 * Returns the first source location found, which corresponds to
 * the JSX element that rendered this DOM node.
 */
export function getSourceLocation(el: HTMLElement): SourceLocation | null {
  const astro = getAstroSourceLocation(el);
  if (astro && astro.lineNumber > 0) return astro;

  let fiber = findNearestFiber(el);
  if (!fiber) return astro;

  const maxDepth = 20;
  let depth = 0;

  while (fiber && depth < maxDepth) {
    if (fiber._debugSource) {
      const src = fiber._debugSource;
      return {
        fileName: src.fileName,
        lineNumber: src.lineNumber,
        columnNumber: src.columnNumber ?? 0,
      };
    }
    fiber = fiber.return;
    depth++;
  }

  // React 19 has no _debugSource: at least name the island's component file
  if (astro) return astro;

  return null;
}

// ── Component prop extraction ──

export interface ComponentPropInfo {
  componentName: string;
  sourceLocation: SourceLocation | null;
  props: Record<
    string,
    {
      value: unknown;
      type: "string" | "number" | "boolean" | "object" | "array" | "function" | "other";
      editable: boolean;
    }
  >;
}

const SKIP_PROPS = new Set(["children", "key", "ref", "className", "style"]);

function classifyValue(value: unknown): { type: ComponentPropInfo["props"][string]["type"]; editable: boolean } {
  if (value === null || value === undefined) return { type: "other", editable: false };
  if (typeof value === "string") return { type: "string", editable: true };
  if (typeof value === "number") return { type: "number", editable: true };
  if (typeof value === "boolean") return { type: "boolean", editable: true };
  if (typeof value === "function") return { type: "function", editable: false };
  if (Array.isArray(value)) return { type: "array", editable: false };
  if (typeof value === "object") return { type: "object", editable: false };
  return { type: "other", editable: false };
}

function extractComponentInfo(fiber: any): ComponentPropInfo | null {
  const componentName = fiber.type.displayName || fiber.type.name;
  const rawProps = fiber.memoizedProps || {};

  const props: ComponentPropInfo["props"] = {};
  for (const [key, value] of Object.entries(rawProps)) {
    if (SKIP_PROPS.has(key)) continue;
    const classified = classifyValue(value);
    props[key] = { value, ...classified };
  }

  if (Object.keys(props).length === 0) return null;

  // Get the _debugSource from this component's fiber
  let sourceLocation: SourceLocation | null = null;
  if (fiber._debugSource) {
    const src = fiber._debugSource;
    sourceLocation = {
      fileName: src.fileName,
      lineNumber: src.lineNumber,
      columnNumber: src.columnNumber ?? 0,
    };
  }

  return { componentName, sourceLocation, props };
}

/**
 * Walk up the fiber tree from a DOM element to find the nearest
 * React function component and extract its props.
 * Returns null for plain host elements (no component above).
 */
export function getComponentProps(el: HTMLElement): ComponentPropInfo | null {
  let fiber = findNearestFiber(el);
  if (!fiber) return null;

  const maxDepth = 20;
  let depth = 0;

  while (fiber && depth < maxDepth) {
    if (typeof fiber.type === "function" && fiber.type.name) {
      return extractComponentInfo(fiber);
    }
    fiber = fiber.return;
    depth++;
  }

  return null;
}

/**
 * Walk up the fiber tree and collect ALL function components with their props.
 * Returns an array from innermost to outermost component.
 * Used by the Props tab to let users pick which component level to edit.
 */
export function getComponentPropsStack(el: HTMLElement): ComponentPropInfo[] {
  const stack: ComponentPropInfo[] = [];
  let fiber = findNearestFiber(el);
  if (!fiber) return stack;

  const maxDepth = 30;
  let depth = 0;

  while (fiber && depth < maxDepth && stack.length < 6) {
    if (typeof fiber.type === "function" && fiber.type.name) {
      const info = extractComponentInfo(fiber);
      if (info) stack.push(info);
    }
    fiber = fiber.return;
    depth++;
  }

  return stack;
}

/**
 * Collect ALL _debugSource locations walking up the fiber tree.
 * Used by the commit route to try each level until it finds a string literal.
 */
export function getSourceLocationStack(el: HTMLElement): SourceLocation[] {
  const stack: SourceLocation[] = [];
  // .astro elements: one exact location (the commit route reports .astro as unsupported for now)
  const astro = getAstroSourceLocation(el);
  if (astro && astro.lineNumber > 0) return [astro];

  let fiber = findNearestFiber(el);
  if (!fiber) return stack;

  const maxDepth = 20;
  let depth = 0;
  let lastFile = "";
  let lastLine = -1;

  while (fiber && depth < maxDepth) {
    if (fiber._debugSource) {
      const src = fiber._debugSource;
      const fileName: string = src.fileName;
      const lineNumber: number = src.lineNumber;
      // Deduplicate consecutive entries from the same file:line
      if (fileName !== lastFile || lineNumber !== lastLine) {
        stack.push({
          fileName,
          lineNumber,
          columnNumber: src.columnNumber ?? 0,
        });
        lastFile = fileName;
        lastLine = lineNumber;
      }
    }
    fiber = fiber.return;
    depth++;
  }

  return stack;
}
