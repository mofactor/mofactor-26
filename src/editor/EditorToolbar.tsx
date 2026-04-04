"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor } from "./EditorProvider";
import { fetchHistory, clearServerHistory } from "./engine/sync";
import type { Annotation, OutputDetailLevel } from "./types";
import { cn } from "@/lib/utils";

const DETAIL_LEVELS: { value: OutputDetailLevel; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
  { value: "forensic", label: "Forensic" },
];

interface HistoryEntry extends Annotation {
  completedAt: number;
  resolvedBy?: string;
  agentSummary?: string;
}

export default function EditorToolbar() {
  const editor = useEditor();
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const entries = await fetchHistory() as HistoryEntry[];
    setHistory(entries);
    setHistoryLoading(false);
  }, []);

  const handleToggleHistory = useCallback(() => {
    setShowHistory((v) => {
      if (!v) {
        loadHistory();
        setShowSettings(false);
      }
      return !v;
    });
  }, [loadHistory]);

  const handleClearHistory = useCallback(async () => {
    await clearServerHistory();
    setHistory([]);
  }, []);

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
        <span
          className="bg-amber-400/25 px-[7px] py-px rounded-lg text-[11px]"
          title={`${annotationCount} pending`}
        >
          {annotationCount}
        </span>
      )}

      {/* Divider */}
      <span className="w-px h-4 bg-white/15 shrink-0" />

      {/* History toggle */}
      <button
        className={cn(
          "bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 opacity-70 hover:opacity-100",
          showHistory && "opacity-100"
        )}
        onClick={handleToggleHistory}
        title="Annotation history"
      >
        History
      </button>

      {/* Settings toggle (annotate mode only) */}
      {editor.annotateMode && (
        <button
          className="bg-transparent border-none text-inherit cursor-pointer font-inherit p-0 opacity-70 hover:opacity-100"
          onClick={() => { setShowSettings((v) => !v); setShowHistory(false); }}
          title="Annotation settings"
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      )}

      <kbd className="opacity-40 text-[10px] border border-white/20 px-[5px] py-[2px] rounded">
        EE / AA
      </kbd>

      {/* History dropdown */}
      {showHistory && (
        <div className="absolute bottom-[calc(100%+8px)] right-0 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 min-w-[320px] max-w-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[12px]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-zinc-500 text-[10px] uppercase tracking-[0.5px]">
              Completed Annotations
            </div>
            {history.length > 0 && (
              <button
                className="bg-transparent border-none cursor-pointer text-rose-400 text-[10px] p-0 opacity-70 hover:opacity-100"
                onClick={handleClearHistory}
              >
                Clear All
              </button>
            )}
          </div>

          {historyLoading ? (
            <div className="text-zinc-500 text-[11px] py-3 text-center">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-zinc-500 text-[11px] py-3 text-center">No completed annotations yet.</div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto flex flex-col gap-1.5">
              {[...history].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="bg-zinc-800 rounded-md px-2.5 py-2 border border-zinc-700/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-zinc-200 text-[11px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">
                      {entry.element}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-[0.5px] px-[6px] py-px rounded-[3px] shrink-0",
                        entry.status === "resolved"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-zinc-500/20 text-zinc-500"
                      )}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <div className="text-zinc-300 text-[11px] leading-[1.4] whitespace-pre-wrap break-words mb-1">
                    {entry.comment}
                  </div>
                  {entry.resolvedBy && (
                    <div className="text-zinc-500 text-[10px] leading-[1.3] overflow-hidden text-ellipsis whitespace-nowrap">
                      {entry.resolvedBy}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-zinc-600 text-[10px]">
                      {new Date(entry.completedAt).toLocaleString()}
                    </span>
                    <button
                      className="bg-transparent border-none cursor-pointer text-amber-400 text-[10px] p-0 opacity-70 hover:opacity-100"
                      onClick={() => {
                        const { completedAt, resolvedBy, agentSummary, id, ...annotation } = entry;
                        const newId = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                        editor.addAnnotation({
                          ...annotation,
                          id: newId,
                          status: "pending",
                          thread: annotation.thread || [],
                        });
                        setShowHistory(false);
                      }}
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              <div className="flex flex-col gap-1">
                <button
                  className="w-full px-3 py-1.5 border-none rounded-md cursor-pointer text-[12px] transition-colors bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  onClick={() => {
                    handleCopy();
                    setShowSettings(false);
                  }}
                >
                  {copied ? "Copied!" : "Copy as Markdown"}
                </button>
                <button
                  className="w-full px-3 py-1.5 border-none rounded-md cursor-pointer text-[12px] transition-colors bg-zinc-700 text-rose-400 hover:bg-zinc-600"
                  onClick={() => {
                    editor.clearAnnotations();
                    setShowSettings(false);
                  }}
                >
                  Clear All Annotations
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
