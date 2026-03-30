"use client";

import { cn } from "@/lib/utils";
import type { ComponentPropInfo } from "../engine/fiber";

export interface PropChange {
  propName: string;
  value: string | number | boolean;
  originalValue: string | number | boolean;
}

interface PropsEditorProps {
  componentStack: ComponentPropInfo[];
  selectedIndex: number;
  onSelectComponent: (index: number) => void;
  propChanges: PropChange[];
  onChangeProp: (
    propName: string,
    value: string | number | boolean,
    originalValue: string | number | boolean
  ) => void;
  onResetProp: (propName: string) => void;
}

function formatReadOnly(value: unknown, type: string): string {
  if (type === "function") return "fn()";
  if (type === "array") return `[${(value as unknown[]).length} items]`;
  if (type === "object") {
    if (value && typeof (value as Promise<unknown>).then === "function") return "Promise";
    const keys = Object.keys(value as object);
    return `{ ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", ..." : ""} }`;
  }
  return String(value).slice(0, 60);
}

const inputCls =
  "flex-1 rounded px-1.5 py-1 text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700 outline-none focus:border-zinc-300 font-[inherit] min-w-0";

export default function PropsEditor({
  componentStack,
  selectedIndex,
  onSelectComponent,
  propChanges,
  onChangeProp,
  onResetProp,
}: PropsEditorProps) {
  const selected = componentStack[selectedIndex];
  if (!selected) return null;

  const { componentName, props: componentProps } = selected;
  const editable = Object.entries(componentProps).filter(([, info]) => info.editable);
  const readOnly = Object.entries(componentProps).filter(([, info]) => !info.editable);

  return (
    <div>
      {/* Component selector */}
      {componentStack.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {componentStack.map((comp, i) => (
            <button
              key={i}
              className={cn(
                "bg-zinc-800 text-zinc-400 border border-transparent rounded px-2 py-px text-[10px] cursor-pointer transition-all hover:text-white",
                i === selectedIndex && "bg-white text-black"
              )}
              onClick={() => onSelectComponent(i)}
            >
              {comp.componentName}
            </button>
          ))}
        </div>
      )}

      <div className="text-zinc-300 text-[11px] mb-2.5 font-semibold font-mono">
        &lt;{componentName} /&gt;
      </div>

      {editable.length === 0 ? (
        <div className="text-amber-400 text-[10px]">
          No editable props (all complex types)
        </div>
      ) : (
        editable.map(([propName, info]) => {
          const change = propChanges.find((c) => c.propName === propName);
          const currentValue = change ? change.value : info.value;
          const isChanged = change !== undefined;

          return (
            <div
              key={propName}
              className={cn(
                "flex gap-1.5 mb-1.5 items-center pl-1.5 border-l-2 border-transparent",
                isChanged && "border-l-green-400"
              )}
            >
              <span className="text-zinc-400 text-[11px] min-w-[70px] shrink-0">
                {propName}
              </span>
              {info.type === "boolean" ? (
                <input
                  className="w-4 h-4 accent-zinc-300 cursor-pointer"
                  type="checkbox"
                  checked={currentValue as boolean}
                  onChange={(e) =>
                    onChangeProp(propName, e.target.checked, info.value as boolean)
                  }
                />
              ) : info.type === "number" ? (
                <input
                  className={inputCls}
                  type="number"
                  value={currentValue as number}
                  onChange={(e) =>
                    onChangeProp(propName, parseFloat(e.target.value) || 0, info.value as number)
                  }
                />
              ) : (
                <input
                  className={inputCls}
                  type="text"
                  value={currentValue as string}
                  onChange={(e) =>
                    onChangeProp(propName, e.target.value, info.value as string)
                  }
                />
              )}
              {isChanged && (
                <button
                  className="bg-transparent border-none cursor-pointer p-0 text-zinc-500 text-[14px] px-1 hover:text-rose-400"
                  onClick={() => onResetProp(propName)}
                  title="Reset"
                >
                  ×
                </button>
              )}
            </div>
          );
        })
      )}

      {readOnly.length > 0 && (
        <div className="text-zinc-500 mt-3 border-t border-zinc-800 pt-2">
          <div className="text-[10px] mb-1.5">Read-only</div>
          {readOnly.map(([propName, info]) => (
            <div key={propName} className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-500">{propName}</span>
              <span className="text-zinc-300 text-right text-[10px] max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
                {formatReadOnly(info.value, info.type)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="text-zinc-500 text-[9px] mt-2.5">
        Props apply on commit
      </div>
    </div>
  );
}
