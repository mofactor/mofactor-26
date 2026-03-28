"use client";

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
      {/* Component selector — show when multiple components in chain */}
      {componentStack.length > 1 && (
        <div className="editor-component-selector">
          {componentStack.map((comp, i) => (
            <button
              key={i}
              className={`editor-component-pill${i === selectedIndex ? " editor-component-pill--active" : ""}`}
              onClick={() => onSelectComponent(i)}
            >
              {comp.componentName}
            </button>
          ))}
        </div>
      )}

      <div style={{ color: "#d4d4d8", fontSize: 11, marginBottom: 10, fontWeight: 600, fontFamily: "monospace" }}>
        &lt;{componentName} /&gt;
      </div>

      {editable.length === 0 ? (
        <div style={{ color: "#fbbf24", fontSize: 10 }}>
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
              className={`editor-prop-row${isChanged ? " editor-prop-row--changed" : ""}`}
            >
              <span className="editor-prop-label">{propName}</span>
              {info.type === "boolean" ? (
                <input
                  className="editor-prop-toggle"
                  type="checkbox"
                  checked={currentValue as boolean}
                  onChange={(e) =>
                    onChangeProp(propName, e.target.checked, info.value as boolean)
                  }
                />
              ) : info.type === "number" ? (
                <input
                  className="editor-prop-input"
                  type="number"
                  value={currentValue as number}
                  onChange={(e) =>
                    onChangeProp(
                      propName,
                      parseFloat(e.target.value) || 0,
                      info.value as number
                    )
                  }
                />
              ) : (
                <input
                  className="editor-prop-input"
                  type="text"
                  value={currentValue as string}
                  onChange={(e) =>
                    onChangeProp(propName, e.target.value, info.value as string)
                  }
                />
              )}
              {isChanged && (
                <button
                  className="editor-style-delete"
                  onClick={() => onResetProp(propName)}
                  title="Reset"
                >
                  x
                </button>
              )}
            </div>
          );
        })
      )}

      {readOnly.length > 0 && (
        <div className="editor-prop-readonly">
          <div style={{ fontSize: 10, marginBottom: 6 }}>Read-only</div>
          {readOnly.map(([propName, info]) => (
            <div key={propName} className="editor-meta-row">
              <span className="editor-meta-label">{propName}</span>
              <span className="editor-meta-value" style={{ fontSize: 10 }}>
                {formatReadOnly(info.value, info.type)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ color: "#71717a", fontSize: 9, marginTop: 10 }}>
        Props apply on commit
      </div>
    </div>
  );
}
