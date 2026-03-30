"use client";

import { useState } from "react";
import { useEditor } from "./EditorProvider";
import type { OutputDetailLevel } from "./types";
import { cn } from "@/lib/utils";

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
      className={cn(
        "fixed bottom-20 z-[9995] flex items-center gap-2",
        "bg-zinc-900 text-zinc-200 px-[14px] py-2 rounded-[10px] text-[13px]",
        "shadow-[0_4px_24px_rgba(0,0,0,0.3)] select-none transition-[right,background-color] duration-200",
        editor.editMode || editor.annotateMode ? "right-[356px] bg-zinc-700" : "right-4"
      )}
    >
      {/* Edit mode toggle */}
      <button
        className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 hover:opacity-80"
        onClick={editor.toggleEditMode}
      >
        {editor.editMode ? "Exit Edit" : "Edit"}
      </button>

      {pagePatches.length > 0 && (
        <>
          <span className="bg-white/15 px-[7px] py-px rounded-lg text-[11px]">
            {pagePatches.length}
          </span>
          <button
            className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 opacity-70 hover:opacity-100"
            onClick={editor.resetAllPatches}
            title="Reset all patches on this page"
          >
            Reset All
          </button>
        </>
      )}

      {/* Divider */}
      <span className="w-px h-4 bg-white/15 shrink-0" />

      {/* Annotate mode toggle */}
      <button
        className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 hover:opacity-80"
        onClick={editor.toggleAnnotateMode}
      >
        {editor.annotateMode ? "Exit Annotate" : "Annotate"}
      </button>

      {annotationCount > 0 && (
        <>
          <span className="bg-amber-400/25 px-[7px] py-px rounded-lg text-[11px]">
            {annotationCount}
          </span>
          <button
            className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 hover:opacity-80"
            onClick={handleCopy}
            title="Copy annotations as markdown"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 opacity-60 hover:opacity-100"
            onClick={editor.clearAnnotations}
            title="Clear all annotations"
          >
            Clear
          </button>
        </>
      )}

      {/* Settings toggle */}
      {editor.annotateMode && (
        <button
          className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 opacity-70 hover:opacity-100"
          onClick={() => setShowSettings((v) => !v)}
          title="Annotation settings"
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      )}

      <kbd className="opacity-40 text-[10px] border border-white/20 px-[5px] py-[2px] rounded">
        EE / AA
      </kbd>

      {/* Settings dropdown */}
      {showSettings && editor.annotateMode && (
        <div className="absolute bottom-[calc(100%+8px)] right-0 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 min-w-[200px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[12px]">
          <div className="text-zinc-500 text-[10px] uppercase tracking-[0.5px] mb-1.5">
            Output Detail
          </div>
          <div className="flex flex-wrap gap-1">
            {DETAIL_LEVELS.map((level) => (
              <button
                key={level.value}
                className={cn(
                  "bg-zinc-800 text-zinc-400 border border-transparent rounded px-2 py-px text-[10px] cursor-pointer transition-all hover:text-white",
                  editor.outputDetailLevel === level.value && "bg-white text-black"
                )}
                onClick={() => editor.setOutputDetailLevel(level.value)}
              >
                {level.label}
              </button>
            ))}
          </div>

          {annotationCount > 0 && (
            <>
              <div className="text-zinc-500 text-[10px] uppercase tracking-[0.5px] mt-2 mb-1.5">
                Actions
              </div>
              <button
                className="w-full px-3 py-1.5 border-none rounded-md cursor-pointer text-[12px] transition-colors bg-zinc-700 text-rose-400 hover:bg-zinc-600"
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
