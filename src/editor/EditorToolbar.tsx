"use client";

import { useState } from "react";
import { useEditor } from "./EditorProvider";
import type { OutputDetailLevel } from "./types";

const DETAIL_LEVELS: { value: OutputDetailLevel; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
  { value: "forensic", label: "Forensic" },
];

export default function EditorToolbar() {
  const editor = useEditor();
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!editor) return null;

  const pagePatches = editor.patches.filter(
    (p) => p.pathname === window.location.pathname || p.pathname === "*"
  );

  const annotationCount = editor.annotations.filter(
    (a) => a.status !== "resolved" && a.status !== "dismissed"
  ).length;

  const handleCopy = () => {
    editor.copyAnnotationsOutput();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`editor-toolbar${editor.editMode ? " editor-toolbar--active" : ""}${editor.annotateMode ? " editor-toolbar--annotate" : ""}`}
    >
      {/* Edit mode toggle */}
      <button onClick={editor.toggleEditMode}>
        {editor.editMode ? "Exit Edit" : "Edit"}
      </button>

      {pagePatches.length > 0 && (
        <>
          <span className="editor-badge">{pagePatches.length}</span>
          <button
            onClick={editor.resetAllPatches}
            title="Reset all patches on this page"
            style={{ opacity: 0.7 }}
          >
            Reset All
          </button>
        </>
      )}

      <span className="editor-toolbar-divider" />

      {/* Annotate mode toggle */}
      <button onClick={editor.toggleAnnotateMode}>
        {editor.annotateMode ? "Exit Annotate" : "Annotate"}
      </button>

      {annotationCount > 0 && (
        <>
          <span className="editor-badge editor-badge--annotate">{annotationCount}</span>
          <button onClick={handleCopy} title="Copy annotations as markdown">
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={editor.clearAnnotations}
            title="Clear all annotations"
            style={{ opacity: 0.6 }}
          >
            Clear
          </button>
        </>
      )}

      {/* Settings toggle */}
      {editor.annotateMode && (
        <button
          onClick={() => setShowSettings((v) => !v)}
          title="Annotation settings"
          style={{ opacity: 0.7 }}
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      )}

      <kbd>EE / AA</kbd>

      {/* Settings dropdown */}
      {showSettings && editor.annotateMode && (
        <div className="editor-annotation-settings">
          <div className="editor-annotation-settings-label">Output Detail</div>
          <div className="editor-annotation-settings-options">
            {DETAIL_LEVELS.map((level) => (
              <button
                key={level.value}
                className={`editor-intent-pill${editor.outputDetailLevel === level.value ? " editor-intent-pill--active" : ""}`}
                onClick={() => editor.setOutputDetailLevel(level.value)}
              >
                {level.label}
              </button>
            ))}
          </div>
          {annotationCount > 0 && (
            <>
              <div className="editor-annotation-settings-label" style={{ marginTop: 8 }}>
                Actions
              </div>
              <button
                className="editor-btn editor-btn--danger"
                style={{ width: "100%" }}
                onClick={() => {
                  editor.clearAnnotations();
                  setShowSettings(false);
                }}
              >
                Clear All Annotations
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
