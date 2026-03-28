"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Get current effective classes
  const currentClasses = useMemo(() => {
    const base = new Set(originalList);
    removedClasses.forEach((c) => base.delete(c));
    addedClasses.forEach((c) => base.add(c));
    return Array.from(base);
  }, [originalList, addedClasses, removedClasses]);

  // Autocomplete search
  useEffect(() => {
    if (!query || !editor?.tailwindIndex) {
      setSuggestions([]);
      setFocusedIdx(-1);
      return;
    }
    const results = editor.tailwindIndex.search(query, { limit: 20 });
    // Filter out already-present classes
    const filtered = results.filter(
      (r) => !currentClasses.includes(r.name)
    );
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
          // Add raw class even if not in suggestions
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
      <div className="editor-class-chips">
        {originalList.map((cls) => {
          const isRemoved = removedClasses.includes(cls);
          return (
            <span
              key={`orig-${cls}`}
              className={`editor-chip ${isRemoved ? "editor-chip--removed" : "editor-chip--original"}`}
            >
              {cls}
              {isRemoved ? (
                <button onClick={() => onRestoreClass(cls)} title="Restore">
                  +
                </button>
              ) : (
                <button onClick={() => onRemoveClass(cls)} title="Remove">
                  x
                </button>
              )}
            </span>
          );
        })}
        {addedClasses.map((cls) => (
          <span key={`add-${cls}`} className="editor-chip editor-chip--added">
            {cls}
            <button
              onClick={() => onRemoveClass(cls)}
              title="Remove"
            >
              x
            </button>
          </span>
        ))}
      </div>

      {/* Autocomplete input — tabIndex -1 prevents auto-focus on panel render */}
      <input
        ref={inputRef}
        className="editor-autocomplete-input"
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
        <div className="editor-autocomplete-list">
          {suggestions.map((cls, i) => (
            <div
              key={cls.name}
              className={`editor-autocomplete-item ${i === focusedIdx ? "editor-autocomplete-item--focused" : ""}`}
              onClick={() => {
                onAddClass(cls.name);
                setQuery("");
                inputRef.current?.focus();
              }}
              onMouseEnter={() => setFocusedIdx(i)}
            >
              <span className="editor-ac-name">{cls.name}</span>
              <span className="editor-ac-category">{cls.category}</span>
            </div>
          ))}
        </div>
      )}

      {editor?.tailwindIndex && (
        <div style={{ marginTop: 8, fontSize: 10, color: "#71717a" }}>
          {editor.tailwindIndex.size} classes indexed
        </div>
      )}
    </div>
  );
}
