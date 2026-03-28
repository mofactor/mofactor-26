"use client";

import { useCallback, useState } from "react";

interface StyleRow {
  property: string;
  value: string;
}

interface StyleEditorProps {
  element: HTMLElement;
  onSetStyle: (property: string, value: string) => void;
  onRemoveStyle: (property: string) => void;
}

function parseInlineStyles(el: HTMLElement): StyleRow[] {
  const rows: StyleRow[] = [];
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style[i];
    const val = el.style.getPropertyValue(prop);
    rows.push({ property: prop, value: val });
  }
  return rows;
}

export default function StyleEditor({
  element,
  onSetStyle,
  onRemoveStyle,
}: StyleEditorProps) {
  const [rows, setRows] = useState<StyleRow[]>(() => parseInlineStyles(element));
  const [newProp, setNewProp] = useState("");
  const [newVal, setNewVal] = useState("");

  const updateRow = useCallback(
    (idx: number, field: "property" | "value", val: string) => {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: val };
        // Apply live if both fields are filled
        if (next[idx].property && next[idx].value) {
          onSetStyle(next[idx].property, next[idx].value);
        }
        return next;
      });
    },
    [onSetStyle]
  );

  const removeRow = useCallback(
    (idx: number) => {
      const row = rows[idx];
      if (row.property) {
        onRemoveStyle(row.property);
      }
      setRows((prev) => prev.filter((_, i) => i !== idx));
    },
    [rows, onRemoveStyle]
  );

  const addRow = useCallback(() => {
    if (newProp.trim()) {
      const prop = newProp.trim();
      const val = newVal.trim() || "initial";
      setRows((prev) => [...prev, { property: prop, value: val }]);
      onSetStyle(prop, val);
      setNewProp("");
      setNewVal("");
    }
  }, [newProp, newVal, onSetStyle]);

  return (
    <div>
      {rows.map((row, i) => (
        <div key={i} className="editor-style-row">
          <input
            value={row.property}
            onChange={(e) => updateRow(i, "property", e.target.value)}
            placeholder="property"
            spellCheck={false}
          />
          <span style={{ color: "#71717a" }}>:</span>
          <input
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            placeholder="value"
            spellCheck={false}
          />
          <button className="editor-style-delete" onClick={() => removeRow(i)}>
            x
          </button>
        </div>
      ))}

      {/* Add new style row */}
      <div className="editor-style-row" style={{ marginTop: 8 }}>
        <input
          value={newProp}
          onChange={(e) => setNewProp(e.target.value)}
          placeholder="property"
          spellCheck={false}
          onKeyDown={(e) => e.key === "Enter" && addRow()}
        />
        <span style={{ color: "#71717a" }}>:</span>
        <input
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder="value"
          spellCheck={false}
          onKeyDown={(e) => e.key === "Enter" && addRow()}
        />
        <button
          className="editor-style-delete"
          onClick={addRow}
          style={{ color: "#4ade80" }}
        >
          +
        </button>
      </div>
    </div>
  );
}
