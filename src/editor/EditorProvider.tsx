"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SHORTCUT_KEY, isShortcutModifier } from "./constants";
import { PatchApplicator } from "./engine/applicator";
import { getSourceLocation, getSourceLocationStack } from "./engine/fiber";
import { PatchStore } from "./engine/patches";
import { generateSelector, validateSelector } from "./engine/selector";
import { TailwindClassIndex } from "./tailwind/class-index";
import { buildTailwindIndex } from "./tailwind";
import {
  loadAnnotations,
  saveAnnotations,
  clearAnnotations as clearStoredAnnotations,
  loadAnnotationSettings,
  saveAnnotationSettings,
} from "./engine/annotations";
import { generateOutput } from "./engine/output";
import {
  checkServerAvailable,
  createSession,
  syncAnnotation,
  syncUpdateAnnotation,
  syncDeleteAnnotation,
  syncAddThreadMessage,
  subscribeToEvents,
} from "./engine/sync";
import type {
  Annotation,
  CommitResult,
  EditorState,
  OutputDetailLevel,
  Patch,
  SourceLocation,
} from "./types";

interface EditorContextValue extends EditorState {
  applicator: PatchApplicator;
  tailwindIndex: TailwindClassIndex;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue | null {
  return useContext(EditorContext);
}

export default function EditorProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);
  const [selectedSourceLocation, setSelectedSourceLocation] = useState<SourceLocation | null>(null);
  const [selectedSourceLocationStack, setSelectedSourceLocationStack] = useState<SourceLocation[] | null>(null);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tailwindIndex, setTailwindIndex] = useState<TailwindClassIndex>(
    () => new TailwindClassIndex()
  );

  // Annotation state
  const [annotateMode, setAnnotateMode] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [outputDetailLevel, setOutputDetailLevel] = useState<OutputDetailLevel>(
    () => loadAnnotationSettings<{ outputDetail: OutputDetailLevel }>({ outputDetail: "standard" }).outputDetail
  );

  // Server sync state
  const serverConnectedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const storeRef = useRef<PatchStore>(new PatchStore());
  const applicatorRef = useRef<PatchApplicator>(new PatchApplicator());

  // Initialize: load patches + build Tailwind index
  useEffect(() => {
    const store = storeRef.current;
    const applicator = applicatorRef.current;

    const init = async () => {
      // Load patches
      const loaded = await store.load();
      const pagePatches = store.getForPage(window.location.pathname);
      setPatches(loaded);
      setIsLoaded(true);

      // Apply patches to DOM
      applicator.apply(pagePatches);
      applicator.startObserving();

      // Build Tailwind index in background
      const idx = await buildTailwindIndex();
      setTailwindIndex(idx);
    };

    init();

    // Subscribe to store changes
    const unsub = store.subscribe(() => {
      const all = store.getAll();
      setPatches([...all]);
      applicator.apply(store.getForPage(window.location.pathname));
    });

    return () => {
      unsub();
      applicator.destroy();
      store.destroy();
    };
  }, []);

  // Double-tap shortcut: "E E" to toggle edit mode
  useEffect(() => {
    let lastKey = "";
    let lastTime = 0;
    const DOUBLE_TAP_MS = 400;

    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/contentEditable
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      if (key === lastKey && now - lastTime < DOUBLE_TAP_MS) {
        if (key === "e") {
          e.preventDefault();
          if (editMode) {
            setEditMode(false);
            setSelectedElement(null);
            setSelectedSelector(null);
            setSelectedSourceLocation(null);
            setSelectedSourceLocationStack(null);
          } else {
            setAnnotateMode(false);
            setEditMode(true);
          }
        } else if (key === "a") {
          e.preventDefault();
          if (annotateMode) {
            setAnnotateMode(false);
          } else {
            setEditMode(false);
            setSelectedElement(null);
            setSelectedSelector(null);
            setSelectedSourceLocation(null);
            setSelectedSourceLocationStack(null);
            setAnnotateMode(true);
          }
        }
        lastKey = "";
        lastTime = 0;
      } else {
        lastKey = key;
        lastTime = now;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, annotateMode]);

  // Load annotations on mount + connect to MCP server + subscribe to SSE
  useEffect(() => {
    const pathname = window.location.pathname;
    const raw = loadAnnotations(pathname);
    // Deduplicate by ID (guards against corrupted localStorage)
    const seen = new Set<string>();
    const loaded = raw.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    if (loaded.length !== raw.length) saveAnnotations(pathname, loaded);
    setAnnotations(loaded);
    let unsubscribeSse: (() => void) | null = null;

    // Try connecting to MCP HTTP server (non-blocking)
    checkServerAvailable().then(async (ok) => {
      if (!ok) return;
      serverConnectedRef.current = true;
      const session = await createSession(pathname);
      if (session) {
        sessionIdRef.current = session.id;
        // Sync only active annotations to the server (skip resolved/dismissed)
        for (const ann of loaded) {
          if (ann.status !== "resolved" && ann.status !== "dismissed") {
            syncAnnotation(session.id, ann);
          }
        }
        // Subscribe to SSE for real-time updates from Claude
        unsubscribeSse = subscribeToEvents(session.id, (event) => {
          const payload = event.payload as Record<string, unknown>;
          if (event.type === "annotation.updated" && payload.id) {
            const { id, status, resolvedBy } = payload as {
              id: string;
              status?: string;
              resolvedBy?: string;
            };
            setAnnotations((prev) => {
              const next = prev.map((a) =>
                a.id === id ? { ...a, ...(status ? { status: status as Annotation["status"] } : {}), ...(resolvedBy ? { resolvedBy } : {}) } : a
              );
              saveAnnotations(pathname, next);
              return next;
            });
          } else if (event.type === "thread.message") {
            const { annotationId, message } = payload as {
              annotationId: string;
              message: { role: "user" | "agent"; content: string; timestamp: number };
            };
            if (annotationId && message && message.role === "agent") {
              setAnnotations((prev) => {
                const next = prev.map((a) => {
                  if (a.id !== annotationId) return a;
                  return { ...a, thread: [...(a.thread || []), message] };
                });
                saveAnnotations(pathname, next);
                return next;
              });
            }
          }
        });
      }
    }).catch(() => { /* server unavailable — ignore */ });

    return () => {
      if (unsubscribeSse) unsubscribeSse();
    };
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode((v) => !v);
    setAnnotateMode(false);
    setSelectedElement(null);
    setSelectedSelector(null);
    setSelectedSourceLocation(null);
  }, []);

  const toggleAnnotateMode = useCallback(() => {
    setAnnotateMode((v) => {
      if (!v) {
        // Entering annotate mode — exit edit mode
        setEditMode(false);
        setSelectedElement(null);
        setSelectedSelector(null);
        setSelectedSourceLocation(null);
      }
      return !v;
    });
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => {
      // Deduplicate by ID
      const next = [...prev.filter((a) => a.id !== annotation.id), annotation];
      saveAnnotations(window.location.pathname, next);
      return next;
    });
    // Sync to server (fire-and-forget)
    if (serverConnectedRef.current && sessionIdRef.current) {
      syncAnnotation(sessionIdRef.current, annotation);
    }
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAnnotations(window.location.pathname, next);
      return next;
    });
    if (serverConnectedRef.current) {
      syncDeleteAnnotation(id);
    }
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      saveAnnotations(window.location.pathname, next);
      return next;
    });
    if (serverConnectedRef.current) {
      syncUpdateAnnotation(id, updates);
    }
  }, []);

  const addThreadMessage = useCallback((annotationId: string, content: string) => {
    const message = { role: "user" as const, content, timestamp: Date.now() };
    setAnnotations((prev) => {
      const next = prev.map((a) => {
        if (a.id !== annotationId) return a;
        return { ...a, thread: [...(a.thread || []), message] };
      });
      saveAnnotations(window.location.pathname, next);
      return next;
    });
    if (serverConnectedRef.current) {
      syncAddThreadMessage(annotationId, message);
    }
  }, []);

  const clearAllAnnotations = useCallback(() => {
    clearStoredAnnotations(window.location.pathname);
    // Delete each from server
    if (serverConnectedRef.current) {
      for (const ann of annotations) {
        syncDeleteAnnotation(ann.id);
      }
    }
    setAnnotations([]);
  }, [annotations]);

  const copyAnnotationsOutput = useCallback(() => {
    const output = generateOutput(annotations, window.location.pathname, outputDetailLevel);
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }, [annotations, outputDetailLevel]);

  const handleSetOutputDetailLevel = useCallback((level: OutputDetailLevel) => {
    setOutputDetailLevel(level);
    saveAnnotationSettings({ outputDetail: level });
  }, []);

  const selectElement = useCallback((el: HTMLElement) => {
    const selector = generateSelector(el);
    if (validateSelector(selector, el)) {
      setSelectedElement(el);
      setSelectedSelector(selector);
      setSelectedSourceLocation(getSourceLocation(el));
      setSelectedSourceLocationStack(getSourceLocationStack(el));
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    setSelectedSelector(null);
    setSelectedSourceLocation(null);
  }, []);

  const applyPatch = useCallback((patch: Patch) => {
    storeRef.current.upsert(patch);
    applicatorRef.current.applyOne(patch);
  }, []);

  const removePatch = useCallback((patchId: string) => {
    const store = storeRef.current;
    const patch = store.getAll().find((p) => p.id === patchId);
    if (patch) {
      applicatorRef.current.revertOne(patch);
      store.remove(patchId);
    }
  }, []);

  const resetAllPatches = useCallback(() => {
    const store = storeRef.current;
    const applicator = applicatorRef.current;
    const pagePatches = store.getForPage(window.location.pathname);
    for (const patch of pagePatches) {
      applicator.revertOne(patch);
    }
    store.removeAllForPage(window.location.pathname);
    setSelectedElement(null);
    setSelectedSelector(null);
    setSelectedSourceLocation(null);
  }, []);

  const commitPatch = useCallback(async (patchId: string): Promise<CommitResult> => {
    try {
      // Flush patches to file so the commit API can read them
      await storeRef.current.flush();
      const res = await fetch("/api/editor-patches/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patchId }),
      });
      const data = await res.json();
      if (data.ok) {
        // The patch was committed to source and removed from patches.json.
        // Remove from in-memory store + localStorage before reloading.
        const store = storeRef.current;
        const patch = store.getAll().find((p) => p.id === patchId);
        if (patch) {
          applicatorRef.current.revertOne(patch);
        }
        store.remove(patchId);
        setPatches([...store.getAll()]);
        applicatorRef.current.apply(store.getForPage(window.location.pathname));
        setSelectedElement(null);
        setSelectedSelector(null);
        setSelectedSourceLocation(null);
        setSelectedSourceLocationStack(null);
      }
      return data;
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }, []);

  const getPatchForSelector = useCallback(
    (selector: string, pathname: string) => {
      return storeRef.current.getBySelector(selector, pathname);
    },
    []
  );

  const value = useMemo<EditorContextValue>(
    () => ({
      editMode,
      toggleEditMode,
      selectedElement,
      selectedSelector,
      selectedSourceLocation,
      selectedSourceLocationStack,
      selectElement,
      clearSelection,
      patches,
      applyPatch,
      removePatch,
      resetAllPatches,
      commitPatch,
      getPatchForSelector,
      isLoaded,
      applicator: applicatorRef.current,
      tailwindIndex,
      annotateMode,
      toggleAnnotateMode,
      annotations,
      addAnnotation,
      removeAnnotation,
      updateAnnotation,
      clearAnnotations: clearAllAnnotations,
      addThreadMessage,
      copyAnnotationsOutput,
      outputDetailLevel,
      setOutputDetailLevel: handleSetOutputDetailLevel,
    }),
    [
      editMode,
      toggleEditMode,
      selectedElement,
      selectedSelector,
      selectedSourceLocation,
      selectedSourceLocationStack,
      selectElement,
      clearSelection,
      patches,
      applyPatch,
      removePatch,
      resetAllPatches,
      commitPatch,
      getPatchForSelector,
      isLoaded,
      tailwindIndex,
      annotateMode,
      toggleAnnotateMode,
      annotations,
      addAnnotation,
      removeAnnotation,
      updateAnnotation,
      clearAllAnnotations,
      addThreadMessage,
      copyAnnotationsOutput,
      outputDetailLevel,
      handleSetOutputDetailLevel,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
