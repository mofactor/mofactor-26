"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Pending changes (not yet applied as a patch)
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [addedClasses, setAddedClasses] = useState<string[]>([]);
  const [removedClasses, setRemovedClasses] = useState<string[]>([]);
  const [styleChanges, setStyleChanges] = useState<
    { property: string; value: string }[]
  >([]);
  const [removedStyles, setRemovedStyles] = useState<string[]>([]);
  const [propChanges, setPropChanges] = useState<PropChange[]>([]);

  // Refs to track latest pending state for auto-apply on element change
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

  // Track previous element's context for auto-apply
  const prevContextRef = useRef<{
    selector: string;
    originals: { text: string; classes: string; styles: string };
    existingPatchId?: string;
    existingPatchCreatedAt?: string;
    componentName?: string;
  } | null>(null);

  const element = editor?.selectedElement;
  const selector = editor?.selectedSelector;

  // Component prop stack from React fiber tree
  const componentStack = useMemo(() => {
    if (!element) return [];
    return getComponentPropsStack(element);
  }, [element]);
  const [selectedComponentIndex, setSelectedComponentIndex] = useState(0);
  const componentInfo = componentStack[selectedComponentIndex] ?? null;

  // Snapshots of original state when element was selected
  const originals = useMemo(() => {
    if (!element) return null;
    return {
      text: element.textContent ?? "",
      classes: element.getAttribute("class") ?? "",
      styles: element.style.cssText,
    };
  }, [element]);

  // Existing patch for this selector
  const existingPatch = useMemo(() => {
    if (!selector || !editor) return undefined;
    return editor.getPatchForSelector(selector, window.location.pathname);
  }, [selector, editor]);

  // Effective classes: originals + existing patch class ops (for display after Apply)
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

  // Auto-apply pending changes when element changes (Figma-style), then reset
  useEffect(() => {
    const prev = prevContextRef.current;
    if (prev && editor) {
      const ops: PatchOperation[] = [];
      const pt = pendingTextRef.current;
      if (pt !== null && pt !== prev.originals.text) {
        ops.push({ type: "text", value: pt });
      }
      for (const cls of addedClassesRef.current) {
        ops.push({ type: "addClass", className: cls });
      }
      for (const cls of removedClassesRef.current) {
        ops.push({ type: "removeClass", className: cls });
      }
      for (const { property, value } of styleChangesRef.current) {
        ops.push({ type: "setStyle", property, styleValue: value });
      }
      for (const prop of removedStylesRef.current) {
        ops.push({ type: "removeStyle", property: prop });
      }
      for (const pc of propChangesRef.current) {
        ops.push({
          type: "setProp",
          propName: pc.propName,
          propValue: pc.value,
          propOriginalValue: pc.originalValue,
        });
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

    // Store context for next element change
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

    // Reset pending state
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
      // Live preview — skip when element is contentEditable (browser already updated DOM)
      if (element && element.childElementCount === 0 && !element.isContentEditable) {
        element.textContent = text;
      }
    },
    [element]
  );

  const handleAddClass = useCallback(
    (cls: string) => {
      setAddedClasses((prev) => [...prev, cls]);
      setRemovedClasses((prev) => prev.filter((c) => c !== cls));
      // Live preview
      element?.classList.add(cls);
    },
    [element]
  );

  const handleRemoveClass = useCallback(
    (cls: string) => {
      // If it was an added class, just un-add it
      if (addedClasses.includes(cls)) {
        setAddedClasses((prev) => prev.filter((c) => c !== cls));
        element?.classList.remove(cls);
      } else {
        // It's an original class — mark for removal
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
      // Live preview
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
        // Only track if value differs from original
        if (value !== originalValue) {
          next.push({ propName, value, originalValue });
        }
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
    for (const cls of addedClasses) {
      operations.push({ type: "addClass", className: cls });
    }
    for (const cls of removedClasses) {
      operations.push({ type: "removeClass", className: cls });
    }
    for (const { property, value } of styleChanges) {
      operations.push({ type: "setStyle", property, styleValue: value });
    }
    for (const prop of removedStyles) {
      operations.push({ type: "removeStyle", property: prop });
    }
    for (const pc of propChanges) {
      operations.push({
        type: "setProp",
        propName: pc.propName,
        propValue: pc.value,
        propOriginalValue: pc.originalValue,
      });
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

    // Reset pending state but keep the sidebar open so the user can Commit
    setPendingText(null);
    setAddedClasses([]);
    setRemovedClasses([]);
    setStyleChanges([]);
    setRemovedStyles([]);
    setPropChanges([]);
  }, [
    selector,
    originals,
    editor,
    pendingText,
    addedClasses,
    removedClasses,
    styleChanges,
    removedStyles,
    propChanges,
    existingPatch,
    componentInfo,
  ]);

  const handleReset = useCallback(() => {
    if (existingPatch && editor) {
      editor.removePatch(existingPatch.id);
    }
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
    // Auto-apply handles persistence via the element-change effect
    editor?.clearSelection();
  }, [editor]);

  // Don't render unless edit mode is on
  if (!editor?.editMode) return null;

  const hasSelection = element && selector && originals;

  const tabs: { key: Tab; label: string }[] = [
    { key: "text", label: "Text / Classes" },
    { key: "design", label: "Design" },
    { key: "styles", label: "Styles" },
    ...(componentStack.length > 0 ? [{ key: "props" as Tab, label: "Props" }] : []),
    { key: "meta", label: "Meta" },
  ];

  return (
    <div className="editor-panel bg-zinc-800 border-l border-zinc-800">
      {hasSelection ? (
        <>
          {/* Header */}
          <div className="editor-panel-header">
            <span>
              <span className="editor-panel-tag">
                &lt;{element.tagName.toLowerCase()}&gt;
              </span>
              {existingPatch && (
                <span style={{ color: "#fbbf24", marginLeft: 8, fontSize: 10 }}>
                  patched
                </span>
              )}
            </span>
            <button className="editor-panel-close" onClick={handleDeselect}>
              x
            </button>
          </div>

          {/* Tabs */}
          <div className="editor-panel-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`editor-panel-tab ${activeTab === tab.key ? "editor-panel-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="editor-panel-body">
            {activeTab === "text" && (
              <>
                <TextEditor
                  element={element}
                  originalText={originals.text}
                  onChangeText={handleTextChange}
                />
                <div style={{ borderTop: "1px solid #3f3f46", margin: "12px 0" }} />
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
                effectiveClasses={effectiveClasses}
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
          <div className="editor-panel-actions">
            <button className="editor-btn editor-btn--primary" onClick={handleApply}>
              Apply
            </button>
            {existingPatch && (
              <button
                className="editor-btn editor-btn--primary"
                onClick={handleCommit}
                style={{ background: "#4ade80", color: "#18181b" }}
                title="Write this patch to source code"
              >
                Commit
              </button>
            )}
            {existingPatch && (
              <button className="editor-btn editor-btn--danger" onClick={handleReset}>
                Reset
              </button>
            )}
          </div>
          {commitStatus && (
            <div
              style={{
                padding: "6px 12px",
                fontSize: 11,
                color: commitStatus.startsWith("Written") ? "#4ade80" : "#fb7185",
                borderTop: "1px solid #3f3f46",
                textAlign: "center",
              }}
            >
              {commitStatus}
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="editor-sidebar-empty">
          Click any element to inspect
        </div>
      )}
    </div>
  );
}
