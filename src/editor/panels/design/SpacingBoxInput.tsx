"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SPACING_TOKENS, TOKEN_TO_CSS, isSpacingToken } from "../../tailwind/spacing-map";

export type SpacingMode = "collapsed" | "expanded";

interface SpacingBoxInputProps {
  label: string;
  /** Values in collapsed mode: x (horizontal) and y (vertical) */
  valuesAxis: { x: string; y: string };
  /** Values in expanded mode: individual sides */
  valuesSides: { top: string; right: string; bottom: string; left: string };
  mode: SpacingMode;
  onToggleMode: () => void;
  onChangeAxis: (axis: "x" | "y", value: string) => void;
  onChangeSide: (side: "top" | "right" | "bottom" | "left", value: string) => void;
}

// ── Preset suggestions for the dropdown ──

interface SpacingSuggestion {
  token: string;
  css: string;
}

const ALL_SUGGESTIONS: SpacingSuggestion[] = SPACING_TOKENS.map((t) => ({
  token: t,
  css: TOKEN_TO_CSS[t] ?? t,
}));

function filterSuggestions(query: string): SpacingSuggestion[] {
  if (!query) return ALL_SUGGESTIONS;
  const q = query.toLowerCase();
  return ALL_SUGGESTIONS.filter(
    (s) => s.token.startsWith(q) || s.css.toLowerCase().includes(q)
  );
}

// ── SVG icons matching Figma's padding input icons ──

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

  // Filtered suggestions based on what the user is typing
  const suggestions = editing ? filterSuggestions(localValue) : [];

  // Commit the current local value
  const commit = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      setEditing(false);
      setShowDropdown(false);
      setFocusedIdx(-1);
      // Only commit if value actually changed
      if (trimmed !== value) {
        onChange(trimmed);
      }
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
    // Small delay to allow dropdown click to register
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

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIdx >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.children;
      items[focusedIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIdx]);

  const displayValue = editing ? localValue : value;
  const cssHint = !editing && value && isSpacingToken(value) ? TOKEN_TO_CSS[value] : undefined;

  return (
    <div className="editor-spacing-field-wrap">
      <div className="editor-spacing-field" title={title}>
        <span className="editor-spacing-icon">{icon}</span>
        <input
          ref={inputRef}
          className="editor-spacing-input"
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
        {cssHint && <span className="editor-spacing-hint">{cssHint}</span>}
      </div>

      {/* Dropdown with TW preset values */}
      {showDropdown && editing && suggestions.length > 0 && (
        <div className="editor-spacing-dropdown" ref={dropdownRef}>
          {suggestions.slice(0, 20).map((s, i) => (
            <div
              key={s.token}
              className={`editor-spacing-dropdown-item ${i === focusedIdx ? "editor-spacing-dropdown-item--focused" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                handleSelectSuggestion(s.token);
              }}
              onMouseEnter={() => setFocusedIdx(i)}
            >
              <span className="editor-spacing-dropdown-token">{s.token}</span>
              <span className="editor-spacing-dropdown-css">{s.css}</span>
            </div>
          ))}
          {/* Show custom value hint when input doesn't match a token */}
          {localValue && !isSpacingToken(localValue) && (
            <div className="editor-spacing-dropdown-custom">
              <span className="editor-spacing-dropdown-token">
                [{localValue}]
              </span>
              <span className="editor-spacing-dropdown-css">custom value</span>
            </div>
          )}
        </div>
      )}
    </div>
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
    <div className="editor-spacing-box">
      {mode === "collapsed" ? (
        <div className="editor-spacing-row">
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
          <button
            className="editor-spacing-toggle"
            onClick={onToggleMode}
            title="Switch to individual sides"
          >
            <IconToggle expanded={false} />
          </button>
        </div>
      ) : (
        <>
          <div className="editor-spacing-row">
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
            <button
              className="editor-spacing-toggle"
              onClick={onToggleMode}
              title="Switch to axis mode"
            >
              <IconToggle expanded={true} />
            </button>
          </div>
          <div className="editor-spacing-row">
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
            <div className="editor-spacing-toggle-spacer" />
          </div>
        </>
      )}
    </div>
  );
}
