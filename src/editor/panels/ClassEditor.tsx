"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEditor } from "../EditorProvider";
import type { TailwindClass } from "../types";

interface ClassEditorProps {
  element: HTMLElement;
  originalClasses: string;
  addedClasses: string[];
  removedClasses: string[];
  onAddClass: (cls: string) => void;
  onRemoveClass: (cls: string) => void;
  onRestoreClass: (cls: string) => void;
}

export default function ClassEditor({
  element,
  originalClasses,
  addedClasses,
  removedClasses,
  onAddClass,
  onRemoveClass,
  onRestoreClass,
}: ClassEditorProps) {
  const editor = useEditor();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TailwindClass[]>([]);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const originalList = useMemo(
    () => originalClasses.split(/\s+/).filter(Boolean),
    [originalClasses]
  );

  const currentClasses = useMemo(() => {
    const base = new Set(originalList);
    removedClasses.forEach((c) => base.delete(c));
    addedClasses.forEach((c) => base.add(c));
    return Array.from(base);
  }, [originalList, addedClasses, removedClasses]);

  useEffect(() => {
    if (!query || !editor?.tailwindIndex) {
      setSuggestions([]);
      setFocusedIdx(-1);
      return;
    }
    const results = editor.tailwindIndex.search(query, { limit: 20 });
    const filtered = results.filter((r) => !currentClasses.includes(r.name));
    setSuggestions(filtered);
    setFocusedIdx(-1);
  }, [query, editor?.tailwindIndex, currentClasses]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIdx >= 0 && suggestions[focusedIdx]) {
          onAddClass(suggestions[focusedIdx].name);
          setQuery("");
        } else if (query.trim()) {
          onAddClass(query.trim());
          setQuery("");
        }
      } else if (e.key === "Escape") {
        setQuery("");
        setSuggestions([]);
      }
    },
    [suggestions, focusedIdx, query, onAddClass]
  );

  return (
    <div>
      {/* Current class chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        {originalList.map((cls) => {
          const isRemoved = removedClasses.includes(cls);
          return (
            <span
              key={`orig-${cls}`}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-px rounded text-[11px] leading-[1.5]",
                isRemoved
                  ? "bg-rose-400/15 text-rose-400 line-through"
                  : "bg-zinc-700 text-zinc-100"
              )}
            >
              {cls}
              {isRemoved ? (
                <button
                  className="bg-transparent border-none cursor-pointer p-0 text-[inherit] text-[12px] opacity-50 hover:opacity-100"
                  onClick={() => onRestoreClass(cls)}
                  title="Restore"
                >
                  +
                </button>
              ) : (
                <button
                  className="bg-transparent border-none cursor-pointer p-0 text-[inherit] text-[12px] opacity-50 hover:opacity-100"
                  onClick={() => onRemoveClass(cls)}
                  title="Remove"
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
        {addedClasses.map((cls) => (
          <span key={`add-${cls}`} className="inline-flex items-center gap-1 px-2 py-px rounded text-[11px] leading-[1.5] bg-green-500/15 text-green-400">
            {cls}
            <button
              className="bg-transparent border-none cursor-pointer p-0 text-[inherit] text-[12px] opacity-50 hover:opacity-100"
              onClick={() => onRemoveClass(cls)}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Autocomplete input */}
      <input
        ref={inputRef}
        className="w-full px-2 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md text-[12px] outline-none focus:border-zinc-300 font-[inherit]"
        type="text"
        placeholder="Add class (e.g. text-blue-500)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(e) => { e.target.tabIndex = 0; }}
        onBlur={(e) => { e.target.tabIndex = -1; }}
        tabIndex={-1}
        spellCheck={false}
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="max-h-40 overflow-y-auto mt-1 bg-zinc-800 border border-zinc-700 rounded-md">
          {suggestions.map((cls, i) => (
            <div
              key={cls.name}
              className={cn(
                "px-2 py-1 cursor-pointer flex justify-between gap-2 hover:bg-zinc-700",
                i === focusedIdx && "bg-zinc-700"
              )}
              onClick={() => {
                onAddClass(cls.name);
                setQuery("");
                inputRef.current?.focus();
              }}
              onMouseEnter={() => setFocusedIdx(i)}
            >
              <span className="text-zinc-300">{cls.name}</span>
              <span className="text-zinc-500 text-[10px]">{cls.category}</span>
            </div>
          ))}
        </div>
      )}

      {editor?.tailwindIndex && (
        <div className="mt-2 text-[10px] text-zinc-500">
          {editor.tailwindIndex.size} classes indexed
        </div>
      )}
    </div>
  );
}
