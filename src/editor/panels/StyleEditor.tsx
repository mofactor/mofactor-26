"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

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

const inputCls =
  "flex-1 rounded px-1.5 py-1 text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700 outline-none focus:border-zinc-300 font-[inherit] min-w-0";

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
      if (row.property) onRemoveStyle(row.property);
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
        <div key={i} className="flex gap-1 mb-1 items-center">
          <input
            className={inputCls}
            value={row.property}
            onChange={(e) => updateRow(i, "property", e.target.value)}
            placeholder="property"
            spellCheck={false}
          />
          <span className="text-zinc-500 shrink-0">:</span>
          <input
            className={inputCls}
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            placeholder="value"
            spellCheck={false}
          />
          <button
            className="bg-transparent border-none cursor-pointer p-0 text-zinc-500 text-[14px] px-1 hover:text-rose-400"
            onClick={() => removeRow(i)}
          >
            ×
          </button>
        </div>
      ))}

      {/* Add new style row */}
      <div className="flex gap-1 mt-2 items-center">
        <input
          className={inputCls}
          value={newProp}
          onChange={(e) => setNewProp(e.target.value)}
          placeholder="property"
          spellCheck={false}
          onKeyDown={(e) => e.key === "Enter" && addRow()}
        />
        <span className="text-zinc-500 shrink-0">:</span>
        <input
          className={inputCls}
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder="value"
          spellCheck={false}
          onKeyDown={(e) => e.key === "Enter" && addRow()}
        />
        <button
          className="bg-transparent border-none cursor-pointer p-0 text-green-500 text-[14px] px-1 hover:text-green-400"
          onClick={addRow}
        >
          +
        </button>
      </div>
    </div>
  );
}
