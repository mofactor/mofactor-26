// ── Patch Operations ──

export type PatchOperationType =
  | "text"
  | "addClass"
  | "removeClass"
  | "setStyle"
  | "removeStyle"
  | "hide"
  | "show"
  | "setProp";

export interface PatchOperation {
  type: PatchOperationType;
  /** For text operations */
  value?: string;
  /** For class operations */
  className?: string;
  /** For style operations — CSS property name (camelCase) */
  property?: string;
  /** For style operations — CSS value */
  styleValue?: string;
  /** For prop operations — JSX attribute name */
  propName?: string;
  /** For prop operations — new value */
  propValue?: string | number | boolean;
  /** For prop operations — original value (for revert/safety check) */
  propOriginalValue?: string | number | boolean;
}

// ── Patch ──

export interface SourceLocation {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
}

export interface Patch {
  id: string;
  selector: string;
  pathname: string;
  operations: PatchOperation[];
  originalText?: string;
  originalClasses?: string;
  originalStyles?: string;
  /** Exact source location from React _debugSource (dev only) */
  sourceLocation?: SourceLocation;
  /** Full stack of source locations up the fiber tree (for prop tracing) */
  sourceLocationStack?: SourceLocation[];
  /** Component name when editing props (e.g. "HeroHeadline") */
  componentName?: string;
  /** Specific source location for prop commit (targets the selected component level) */
  propSourceLocation?: SourceLocation;
  createdAt: string;
  updatedAt: string;
}

export interface PatchFile {
  version: 1;
  patches: Patch[];
}

// ── Editor State ──

export interface EditorState {
  editMode: boolean;
  toggleEditMode: () => void;
  selectedElement: HTMLElement | null;
  selectedSelector: string | null;
  selectedSourceLocation: SourceLocation | null;
  selectedSourceLocationStack: SourceLocation[] | null;
  selectElement: (el: HTMLElement) => void;
  clearSelection: () => void;
  patches: Patch[];
  applyPatch: (patch: Patch) => void;
  removePatch: (patchId: string) => void;
  resetAllPatches: () => void;
  commitPatch: (patchId: string) => Promise<CommitResult>;
  getPatchForSelector: (selector: string, pathname: string) => Patch | undefined;
  isLoaded: boolean;
  // Annotation mode
  annotateMode: boolean;
  toggleAnnotateMode: () => void;
  annotations: Annotation[];
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  clearAnnotations: () => void;
  addThreadMessage: (annotationId: string, content: string) => void;
  copyAnnotationsOutput: () => void;
  outputDetailLevel: OutputDetailLevel;
  setOutputDetailLevel: (level: OutputDetailLevel) => void;
}

export interface CommitResult {
  ok: boolean;
  file?: string;
  line?: number;
  error?: string;
  hint?: string;
}

// ── Annotations ──

export interface Annotation {
  id: string;
  /** % of viewport width */
  x: number;
  /** px from top of document (absolute), or viewport if isFixed */
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isFixed?: boolean;
  reactComponents?: string;
  sourceFile?: string;
  intent?: AnnotationIntent;
  severity?: AnnotationSeverity;
  status?: AnnotationStatus;
  thread?: ThreadMessage[];
}

export interface ThreadMessage {
  role: "user" | "agent";
  content: string;
  timestamp: number;
}

export type AnnotationIntent = "fix" | "change" | "question" | "approve";
export type AnnotationSeverity = "blocking" | "important" | "suggestion";
export type AnnotationStatus = "pending" | "acknowledged" | "resolved" | "dismissed";

export type OutputDetailLevel = "compact" | "standard" | "detailed" | "forensic";

// ── Tailwind ──

export interface TailwindClass {
  name: string;
  category: TailwindCategory;
  /** The raw CSS properties this class applies */
  cssText: string;
}

export type TailwindCategory =
  | "layout"
  | "spacing"
  | "sizing"
  | "typography"
  | "color"
  | "background"
  | "border"
  | "effect"
  | "transform"
  | "transition"
  | "other";
