"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorProvider";
import { getComponentPropsStack } from "./engine/fiber";
import ClassEditor from "./panels/ClassEditor";
import DesignEditor from "./panels/DesignEditor";
import MetaInfo from "./panels/MetaInfo";
import PropsEditor, { type PropChange } from "./panels/PropsEditor";
import StyleEditor from "./panels/StyleEditor";
import TextEditor from "./panels/TextEditor";
import type { Patch, PatchOperation } from "./types";

type Tab = "text" | "design" | "styles" | "props" | "meta";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function EditorPanel() {
  const editor = useEditor();
  const [activeTab, setActiveTab] = useState<Tab>("text");

  const [pendingText, setPendingText] = useState<string | null>(null);
  const [addedClasses, setAddedClasses] = useState<string[]>([]);
  const [removedClasses, setRemovedClasses] = useState<string[]>([]);
  const [styleChanges, setStyleChanges] = useState<{ property: string; value: string }[]>([]);
  const [removedStyles, setRemovedStyles] = useState<string[]>([]);
  const [propChanges, setPropChanges] = useState<PropChange[]>([]);

  const pendingTextRef = useRef<string | null>(null);
  const addedClassesRef = useRef<string[]>([]);
  const removedClassesRef = useRef<string[]>([]);
  const styleChangesRef = useRef<{ property: string; value: string }[]>([]);
  const removedStylesRef = useRef<string[]>([]);
  const propChangesRef = useRef<PropChange[]>([]);
  pendingTextRef.current = pendingText;
  addedClassesRef.current = addedClasses;
  removedClassesRef.current = removedClasses;
  styleChangesRef.current = styleChanges;
  removedStylesRef.current = removedStyles;
  propChangesRef.current = propChanges;

  const prevContextRef = useRef<{
    selector: string;
    originals: { text: string; classes: string; styles: string };
    existingPatchId?: string;
    existingPatchCreatedAt?: string;
    componentName?: string;
  } | null>(null);

  const element = editor?.selectedElement;
  const selector = editor?.selectedSelector;

  const componentStack = useMemo(() => {
    if (!element) return [];
    return getComponentPropsStack(element);
  }, [element]);
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const componentInfo = componentStack[selectedComponentIndex] ?? null;

  const originals = useMemo(() => {
    if (!element) return null;
    return {
      text: element.textContent ?? "",
      classes: element.getAttribute("class") ?? "",
      styles: element.style.cssText,
    };
  }, [element]);

  const existingPatch = useMemo(() => {
    if (!selector || !editor) return undefined;
    return editor.getPatchForSelector(selector, window.location.pathname);
  }, [selector, editor]);

  const effectiveClasses = useMemo(() => {
    if (!originals) return "";
    if (!existingPatch) return originals.classes;
    let classes = originals.classes.split(/\s+/).filter(Boolean);
    for (const op of existingPatch.operations) {
      if (op.type === "addClass" && op.className && !classes.includes(op.className)) {
        classes.push(op.className);
      }
      if (op.type === "removeClass" && op.className) {
        classes = classes.filter((c) => c !== op.className);
      }
    }
    return classes.join(" ");
  }, [originals, existingPatch]);

  // effectiveClasses + pending add/remove — used by DesignEditor to stay reactive
  const liveClasses = useMemo(() => {
    let classes = effectiveClasses.split(/\s+/).filter(Boolean);
    for (const cls of removedClasses) {
      classes = classes.filter((c) => c !== cls);
    }
    for (const cls of addedClasses) {
      if (!classes.includes(cls)) classes.push(cls);
    }
    return classes.join(" ");
  }, [effectiveClasses, addedClasses, removedClasses]);

  // Auto-apply pending changes when element changes
  useEffect(() => {
    const prev = prevContextRef.current;
    if (prev && editor) {
      const ops: PatchOperation[] = [];
      const pt = pendingTextRef.current;
      if (pt !== null && pt !== prev.originals.text) {
        ops.push({ type: "text", value: pt });
      }
      for (const cls of addedClassesRef.current) ops.push({ type: "addClass", className: cls });
      for (const cls of removedClassesRef.current) ops.push({ type: "removeClass", className: cls });
      for (const { property, value } of styleChangesRef.current) ops.push({ type: "setStyle", property, styleValue: value });
      for (const prop of removedStylesRef.current) ops.push({ type: "removeStyle", property: prop });
      for (const pc of propChangesRef.current) {
        ops.push({ type: "setProp", propName: pc.propName, propValue: pc.value, propOriginalValue: pc.originalValue });
      }
      if (ops.length > 0) {
        const now = new Date().toISOString();
        editor.applyPatch({
          id: prev.existingPatchId ?? uid(),
          selector: prev.selector,
          pathname: window.location.pathname,
          operations: ops,
          originalText: prev.originals.text,
          originalClasses: prev.originals.classes,
          originalStyles: prev.originals.styles,
          componentName: prev.componentName,
          createdAt: prev.existingPatchCreatedAt ?? now,
          updatedAt: now,
        });
      }
    }

    prevContextRef.current =
      selector && originals
        ? {
          selector,
          originals,
          existingPatchId: existingPatch?.id,
          existingPatchCreatedAt: existingPatch?.createdAt,
          componentName: componentInfo?.componentName,
        }
        : null;

    setPendingText(null);
    setAddedClasses([]);
    setRemovedClasses([]);
    setStyleChanges([]);
    setRemovedStyles([]);
    setPropChanges([]);
    setSelectedComponentIndex(0);
    setActiveTab("text");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element]);

  // ── Handlers ──

  const handleTextChange = useCallback(
    (text: string) => {
      setPendingText(text);
      if (element && element.childElementCount === 0 && !element.isContentEditable) {
        element.textContent = text;
      }
    },
    [element]
  );

  const handleAddClass = useCallback(
    (cls: string) => {
      setRemovedClasses((prev) => prev.filter((c) => c !== cls));
      // Only track as "added" if the class isn't already in the original set
      const originalClasses = originals?.classes.split(/\s+/).filter(Boolean) ?? [];
      if (!originalClasses.includes(cls)) {
        setAddedClasses((prev) => (prev.includes(cls) ? prev : [...prev, cls]));
      }
      element?.classList.add(cls);
    },
    [element, originals]
  );

  const handleRemoveClass = useCallback(
    (cls: string) => {
      if (addedClasses.includes(cls)) {
        setAddedClasses((prev) => prev.filter((c) => c !== cls));
        element?.classList.remove(cls);
      } else {
        setRemovedClasses((prev) => [...prev, cls]);
        element?.classList.remove(cls);
      }
    },
    [element, addedClasses]
  );

  const handleRestoreClass = useCallback(
    (cls: string) => {
      setRemovedClasses((prev) => prev.filter((c) => c !== cls));
      element?.classList.add(cls);
    },
    [element]
  );

  const handleSetStyle = useCallback(
    (property: string, value: string) => {
      setStyleChanges((prev) => {
        const next = prev.filter((s) => s.property !== property);
        next.push({ property, value });
        return next;
      });
      setRemovedStyles((prev) => prev.filter((p) => p !== property));
      element?.style.setProperty(property, value);
    },
    [element]
  );

  const handleRemoveStyle = useCallback(
    (property: string) => {
      setStyleChanges((prev) => prev.filter((s) => s.property !== property));
      setRemovedStyles((prev) => [...prev, property]);
      element?.style.removeProperty(property);
    },
    [element]
  );

  const handleChangeProp = useCallback(
    (propName: string, value: string | number | boolean, originalValue: string | number | boolean) => {
      setPropChanges((prev) => {
        const next = prev.filter((c) => c.propName !== propName);
        if (value !== originalValue) next.push({ propName, value, originalValue });
        return next;
      });
    },
    []
  );

  const handleResetProp = useCallback((propName: string) => {
    setPropChanges((prev) => prev.filter((c) => c.propName !== propName));
  }, []);

  // ── Apply / Reset ──

  const handleApply = useCallback(() => {
    if (!selector || !originals || !editor) return;
    const operations: PatchOperation[] = [];

    if (pendingText !== null && pendingText !== originals.text) {
      operations.push({ type: "text", value: pendingText });
    }
    for (const cls of addedClasses) operations.push({ type: "addClass", className: cls });
    for (const cls of removedClasses) operations.push({ type: "removeClass", className: cls });
    for (const { property, value } of styleChanges) operations.push({ type: "setStyle", property, styleValue: value });
    for (const prop of removedStyles) operations.push({ type: "removeStyle", property: prop });
    for (const pc of propChanges) {
      operations.push({ type: "setProp", propName: pc.propName, propValue: pc.value, propOriginalValue: pc.originalValue });
    }

    if (operations.length === 0) return;

    const now = new Date().toISOString();
    const patch: Patch = {
      id: existingPatch?.id ?? uid(),
      selector,
      pathname: window.location.pathname,
      operations,
      originalText: originals.text,
      originalClasses: originals.classes,
      originalStyles: originals.styles,
      sourceLocation: editor.selectedSourceLocation ?? undefined,
      sourceLocationStack: editor.selectedSourceLocationStack ?? undefined,
      componentName: componentInfo?.componentName,
      propSourceLocation: componentInfo?.sourceLocation ?? undefined,
      createdAt: existingPatch?.createdAt ?? now,
      updatedAt: now,
    };

    editor.applyPatch(patch);
    setPendingText(null);
    setAddedClasses([]);
    setRemovedClasses([]);
    setStyleChanges([]);
    setRemovedStyles([]);
    setPropChanges([]);
  }, [
    selector, originals, editor, pendingText, addedClasses, removedClasses,
    styleChanges, removedStyles, propChanges, existingPatch, componentInfo,
  ]);

  const handleReset = useCallback(() => {
    if (existingPatch && editor) editor.removePatch(existingPatch.id);
    editor?.clearSelection();
  }, [existingPatch, editor]);

  const [commitStatus, setCommitStatus] = useState<string | null>(null);

  const handleCommit = useCallback(async () => {
    if (!existingPatch || !editor) return;
    setCommitStatus("Committing...");
    const result = await editor.commitPatch(existingPatch.id);
    if (result.ok) {
      setCommitStatus(`Written to ${result.file}:${result.line}`);
      setTimeout(() => setCommitStatus(null), 3000);
    } else {
      setCommitStatus(result.error ?? "Failed");
      setTimeout(() => setCommitStatus(null), 5000);
    }
  }, [existingPatch, editor]);

  const handleDeselect = useCallback(() => {
    editor?.clearSelection();
  }, [editor]);

  if (!editor?.editMode) return null;

  const hasSelection = element && selector && originals;

  const tabs: { key: Tab; label: string }[] = [
    { key: "text", label: "Text / Classes" },
    { key: "design", label: "Design" },
    { key: "styles", label: "Styles" },
    ...(componentStack.length > 0 ? [{ key: "props" as Tab, label: "Props" }] : []),
    { key: "meta", label: "Meta" },
  ];

  // Shared input / button class helpers
  const btnBase = "flex-1 px-3 py-1.5 border-none rounded-md cursor-pointer font-[inherit] text-[12px] transition-colors disabled:opacity-40 disabled:cursor-default";

  return (
    <div className="fixed inset-y-1 right-1 z-[9995] w-[340px] text-zinc-300 text-xs flex flex-col overflow-hidden rounded-lg bg-zinc-900">
      {hasSelection ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-700 select-none">
            <span>
              <span className="text-zinc-300 font-semibold">
                &lt;{element.tagName.toLowerCase()}&gt;
              </span>
              {existingPatch && (
                <span className="text-amber-400 ml-2 text-[10px]">patched</span>
              )}
            </span>
            <button
              className="bg-transparent border-none cursor-pointer p-0 text-zinc-500 text-base leading-none hover:text-zinc-300"
              onClick={handleDeselect}
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-700">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={cn(
                  "flex-1 py-2 bg-transparent border-none text-zinc-500 cursor-pointer font-[inherit] text-[11px] text-center border-b-2 border-transparent transition-colors hover:text-zinc-300",
                  activeTab === tab.key && "text-zinc-300 border-b-zinc-300"
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="p-3 overflow-y-auto flex-1">
            {activeTab === "text" && (
              <>
                <TextEditor
                  element={element}
                  originalText={originals.text}
                  onChangeText={handleTextChange}
                />
                <div className="border-t border-zinc-700 my-3" />
                <ClassEditor
                  element={element}
                  originalClasses={effectiveClasses}
                  addedClasses={addedClasses}
                  removedClasses={removedClasses}
                  onAddClass={handleAddClass}
                  onRemoveClass={handleRemoveClass}
                  onRestoreClass={handleRestoreClass}
                />
              </>
            )}
            {activeTab === "design" && (
              <DesignEditor
                element={element}
                effectiveClasses={liveClasses}
                onAddClass={handleAddClass}
                onRemoveClass={handleRemoveClass}
              />
            )}
            {activeTab === "styles" && (
              <StyleEditor
                element={element}
                onSetStyle={handleSetStyle}
                onRemoveStyle={handleRemoveStyle}
              />
            )}
            {activeTab === "props" && componentStack.length > 0 && (
              <PropsEditor
                componentStack={componentStack}
                selectedIndex={selectedComponentIndex}
                onSelectComponent={(i) => {
                  setSelectedComponentIndex(i);
                  setPropChanges([]);
                }}
                propChanges={propChanges}
                onChangeProp={handleChangeProp}
                onResetProp={handleResetProp}
              />
            )}
            {activeTab === "meta" && (
              <MetaInfo
                element={element}
                selector={selector}
                sourceLocation={editor.selectedSourceLocation}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-3 py-2.5 border-t border-zinc-700">
            <button
              className={cn(btnBase, "bg-zinc-300 text-zinc-900 hover:bg-zinc-200")}
              onClick={handleApply}
            >
              Apply
            </button>
            {existingPatch && (
              <button
                className={cn(btnBase, "bg-green-500 text-zinc-900 hover:bg-green-400")}
                onClick={handleCommit}
                title="Write this patch to source code"
              >
                Commit
              </button>
            )}
            {existingPatch && (
              <button
                className={cn(btnBase, "bg-zinc-700 text-rose-400 hover:bg-zinc-600")}
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </div>

          {commitStatus && (
            <div
              className={cn(
                "px-3 py-1.5 text-[11px] border-t border-zinc-700 text-center",
                commitStatus.startsWith("Written") ? "text-green-500" : "text-rose-400"
              )}
            >
              {commitStatus}
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-[13px] p-6 text-center leading-relaxed">
          Click any element to inspect
        </div>
      )}
    </div>
  );
}
