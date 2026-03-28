"use client";

import type { SourceLocation } from "../types";

interface MetaInfoProps {
  element: HTMLElement;
  selector: string;
  sourceLocation: SourceLocation | null;
}

export default function MetaInfo({ element, selector, sourceLocation }: MetaInfoProps) {
  const rect = element.getBoundingClientRect();
  const computedStyle = getComputedStyle(element);

  return (
    <div>
      <div className="editor-meta-row">
        <span className="editor-meta-label">Tag</span>
        <span className="editor-meta-value">{element.tagName.toLowerCase()}</span>
      </div>
      {element.id && (
        <div className="editor-meta-row">
          <span className="editor-meta-label">ID</span>
          <span className="editor-meta-value">#{element.id}</span>
        </div>
      )}
      <div className="editor-meta-row">
        <span className="editor-meta-label">Size</span>
        <span className="editor-meta-value">
          {Math.round(rect.width)} x {Math.round(rect.height)}
        </span>
      </div>
      <div className="editor-meta-row">
        <span className="editor-meta-label">Position</span>
        <span className="editor-meta-value">{computedStyle.position}</span>
      </div>
      <div className="editor-meta-row">
        <span className="editor-meta-label">Display</span>
        <span className="editor-meta-value">{computedStyle.display}</span>
      </div>
      <div className="editor-meta-row">
        <span className="editor-meta-label">Font</span>
        <span className="editor-meta-value">
          {computedStyle.fontSize} / {computedStyle.fontWeight}
        </span>
      </div>
      <div className="editor-meta-row">
        <span className="editor-meta-label">Color</span>
        <span className="editor-meta-value">{computedStyle.color}</span>
      </div>

      {sourceLocation && (
        <div className="editor-selector-display" style={{ marginBottom: 4 }}>
          <span style={{ color: "#71717a" }}>Source:</span>
          <br />
          <span style={{ color: "#4ade80" }}>
            {sourceLocation.fileName}:{sourceLocation.lineNumber}:{sourceLocation.columnNumber}
          </span>
        </div>
      )}

      <div className="editor-selector-display">
        <span style={{ color: "#71717a" }}>Selector:</span>
        <br />
        {selector}
      </div>
    </div>
  );
}
