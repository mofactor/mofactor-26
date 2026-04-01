"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SPACING_TOKENS, TOKEN_TO_PX, isSpacingToken } from "../../tailwind/spacing-map";

export type SpacingMode = "collapsed" | "expanded";

interface SpacingBoxInputProps {
  label: string;
  valuesAxis: { x: string; y: string };
  valuesSides: { top: string; right: string; bottom: string; left: string };
  mode: SpacingMode;
  onToggleMode: () => void;
  onChangeAxis: (axis: "x" | "y", value: string) => void;
  onChangeSide: (side: "top" | "right" | "bottom" | "left", value: string) => void;
}

// ── Preset suggestions ──

interface SpacingSuggestion {
  token: string;
  css: string;
}

const ALL_SUGGESTIONS: SpacingSuggestion[] = SPACING_TOKENS.map((t) => ({
  token: t,
  css: TOKEN_TO_PX[t] ?? t,
}));

function filterSuggestions(query: string): SpacingSuggestion[] {
  if (!query) return ALL_SUGGESTIONS;
  const q = query.toLowerCase();
  return ALL_SUGGESTIONS.filter(
    (s) => s.token.startsWith(q) || s.css.toLowerCase().startsWith(q)
  );
}

// ── SVG icons ──

const IconPaddingY = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="5" y1="1" x2="9" y2="1" stroke="currentColor" strokeWidth="1.5" />
    <line x1="5" y1="13" x2="9" y2="13" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconPaddingX = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="1" y1="5" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" />
    <line x1="13" y1="5" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconPaddingTop = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="5" y1="1" x2="9" y2="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconPaddingBottom = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="5" y1="13" x2="9" y2="13" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconPaddingLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="1" y1="5" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconPaddingRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <line x1="13" y1="5" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconToggle = ({ expanded }: { expanded: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    {expanded ? (
      <>
        <rect x="2" y="2" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="9" y="2" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="2" y="9" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="9" y="9" width="3" height="3" rx="0.5" fill="currentColor" />
      </>
    ) : (
      <>
        <line x1="4" y1="3" x2="10" y2="3" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="11" x2="10" y2="11" stroke="currentColor" strokeWidth="1.2" />
      </>
    )}
  </svg>
);

// ── SpacingInput: single input with local editing state + dropdown ──

function SpacingInput({
  icon,
  value,
  onChange,
  title,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);

  const suggestions = editing ? filterSuggestions(localValue) : [];

  const commit = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      setEditing(false);
      setShowDropdown(false);
      setFocusedIdx(-1);
      if (trimmed !== value) onChange(trimmed);
    },
    [onChange, value]
  );

  const handleFocus = useCallback(() => {
    setLocalValue(value);
    setEditing(true);
    setShowDropdown(true);
    setFocusedIdx(-1);
  }, [value]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        commit(localValue);
      }
    }, 150);
  }, [commit, localValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIdx >= 0 && suggestions[focusedIdx]) {
          commit(suggestions[focusedIdx].token);
        } else {
          commit(localValue);
        }
        inputRef.current?.blur();
      } else if (e.key === "Escape") {
        setEditing(false);
        setShowDropdown(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, -1));
      }
    },
    [focusedIdx, suggestions, localValue, commit]
  );

  const handleSelectSuggestion = useCallback(
    (token: string) => {
      commit(token);
      inputRef.current?.blur();
    },
    [commit]
  );

  useEffect(() => {
    if (focusedIdx >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.children;
      items[focusedIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIdx]);

  const displayValue = editing ? localValue : value;
  const cssHint = !editing && value && isSpacingToken(value) ? TOKEN_TO_PX[value] : undefined;

  return (
    <div className="flex-1 relative min-w-0">
      {/* Field wrapper */}
      <div
        className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md px-1.5 py-[5px] min-w-0 focus-within:border-zinc-300"
        title={title}
      >
        <span className="text-zinc-500 shrink-0 flex items-center">{icon}</span>
        <input
          ref={inputRef}
          className="bg-transparent border-none text-zinc-100 text-[12px] w-full min-w-0 outline-none p-0 caret-zinc-100 placeholder:text-zinc-500 font-[inherit]"
          type="text"
          value={displayValue}
          placeholder="0"
          onChange={(e) => {
            setLocalValue(e.target.value);
            setShowDropdown(true);
            setFocusedIdx(-1);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          spellCheck={false}
          autoComplete="off"
        />
        {cssHint && (
          <span className="text-zinc-500 text-[9px] shrink-0 whitespace-nowrap">{cssHint}</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && editing && suggestions.length > 0 && (
        <div
          className="absolute top-[calc(100%+2px)] left-0 right-0 z-10 max-h-[180px] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
          ref={dropdownRef}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.token}
              className={cn(
                "flex justify-between items-center px-2 py-1 cursor-pointer gap-1.5 hover:bg-zinc-700",
                i === focusedIdx && "bg-zinc-700"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSuggestion(s.token);
              }}
              onMouseEnter={() => setFocusedIdx(i)}
            >
              <span className="text-zinc-100 text-[11px] font-medium">{s.token}</span>
              <span className="text-zinc-500 text-[10px]">{s.css}</span>
            </div>
          ))}
          {localValue && !isSpacingToken(localValue) && (
            <div className="flex justify-between items-center px-2 py-1 border-t border-zinc-700 gap-1.5">
              <span className="text-amber-400 text-[11px] font-medium">[{localValue}]</span>
              <span className="text-zinc-500 text-[10px] italic">Enter to apply</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Toggle button ──

function ToggleBtn({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      className="bg-transparent border border-zinc-700 rounded text-zinc-500 cursor-pointer flex items-center justify-center w-7 h-7 shrink-0 p-0 transition-colors hover:text-zinc-300 hover:border-zinc-300"
      onClick={onClick}
      title={expanded ? "Switch to axis mode" : "Switch to individual sides"}
    >
      <IconToggle expanded={expanded} />
    </button>
  );
}

export default function SpacingBoxInput({
  label,
  valuesAxis,
  valuesSides,
  mode,
  onToggleMode,
  onChangeAxis,
  onChangeSide,
}: SpacingBoxInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {mode === "collapsed" ? (
        <div className="flex gap-1 items-start">
          <SpacingInput
            icon={<IconPaddingY />}
            value={valuesAxis.y}
            onChange={(v) => onChangeAxis("y", v)}
            title={`${label} vertical (top & bottom)`}
          />
          <SpacingInput
            icon={<IconPaddingX />}
            value={valuesAxis.x}
            onChange={(v) => onChangeAxis("x", v)}
            title={`${label} horizontal (left & right)`}
          />
          <ToggleBtn expanded={false} onClick={onToggleMode} />
        </div>
      ) : (
        <>
          <div className="flex gap-1 items-start">
            <SpacingInput
              icon={<IconPaddingTop />}
              value={valuesSides.top}
              onChange={(v) => onChangeSide("top", v)}
              title={`${label} top`}
            />
            <SpacingInput
              icon={<IconPaddingBottom />}
              value={valuesSides.bottom}
              onChange={(v) => onChangeSide("bottom", v)}
              title={`${label} bottom`}
            />
            <ToggleBtn expanded={true} onClick={onToggleMode} />
          </div>
          <div className="flex gap-1 items-start">
            <SpacingInput
              icon={<IconPaddingLeft />}
              value={valuesSides.left}
              onChange={(v) => onChangeSide("left", v)}
              title={`${label} left`}
            />
            <SpacingInput
              icon={<IconPaddingRight />}
              value={valuesSides.right}
              onChange={(v) => onChangeSide("right", v)}
              title={`${label} right`}
            />
            <div className="w-7 shrink-0" />
          </div>
        </>
      )}
    </div>
  );
}
