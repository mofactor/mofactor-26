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

  const rows = [
    { label: "Tag", value: element.tagName.toLowerCase() },
    ...(element.id ? [{ label: "ID", value: `#${element.id}` }] : []),
    { label: "Size", value: `${Math.round(rect.width)} × ${Math.round(rect.height)}` },
    { label: "Position", value: computedStyle.position },
    { label: "Display", value: computedStyle.display },
    { label: "Font", value: `${computedStyle.fontSize} / ${computedStyle.fontWeight}` },
    { label: "Color", value: computedStyle.color },
  ];

  return (
    <div>
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between py-1 border-b border-zinc-800">
          <span className="text-zinc-500">{row.label}</span>
          <span className="text-zinc-300 text-right max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
            {row.value}
          </span>
        </div>
      ))}

      {sourceLocation && (
        <div className="mt-2 px-2 py-1.5 bg-zinc-800 rounded text-[10px] text-zinc-400 break-all leading-[1.5] mb-1">
          <span className="text-zinc-500">Source:</span>
          <br />
          <span className="text-green-500">
            {sourceLocation.fileName}:{sourceLocation.lineNumber}:{sourceLocation.columnNumber}
          </span>
        </div>
      )}

      <div className="mt-2 px-2 py-1.5 bg-zinc-800 rounded text-[10px] text-zinc-400 break-all leading-[1.5]">
        <span className="text-zinc-500">Selector:</span>
        <br />
        {selector}
      </div>
    </div>
  );
}
