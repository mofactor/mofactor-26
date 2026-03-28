"use client";

import { useEffect, useRef, useState } from "react";

interface TextEditorProps {
  element: HTMLElement;
  originalText: string;
  onChangeText: (text: string) => void;
}

export default function TextEditor({
  element,
  originalText,
  onChangeText,
}: TextEditorProps) {
  const [text, setText] = useState(element.textContent ?? "");
  const callbackRef = useRef(onChangeText);
  callbackRef.current = onChangeText;

  const hasChildren = element.childElementCount > 0;

  // Reset text when element changes
  useEffect(() => {
    setText(element.textContent ?? "");
  }, [element]);

  // Inline contentEditable for leaf elements
  useEffect(() => {
    if (hasChildren) return;

    element.contentEditable = "plaintext-only";
    element.dataset.editorEditing = "true";

    const handleInput = () => {
      const newText = element.textContent ?? "";
      setText(newText);
      callbackRef.current(newText);
    };

    element.addEventListener("input", handleInput);

    return () => {
      element.contentEditable = "inherit";
      delete element.dataset.editorEditing;
      element.removeEventListener("input", handleInput);
    };
  }, [element, hasChildren, originalText]);

  const changed = text !== originalText;

  // Leaf element → inline editing, sidebar shows diff
  if (!hasChildren) {
    return (
      <div>
        <div style={{ color: "#a1a1aa", fontSize: 11, marginBottom: 8 }}>
          Type directly on the element
        </div>
        {changed && (
          <div style={{ fontSize: 10, color: "#71717a" }}>
            <span style={{ color: "#fb7185", textDecoration: "line-through" }}>
              {originalText.length > 120
                ? originalText.slice(0, 120) + "..."
                : originalText}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Complex element with children → textarea fallback
  return (
    <div>
      <div style={{ color: "#fbbf24", fontSize: 10, marginBottom: 8 }}>
        This element has child elements. Text editing will only affect leaf text
        nodes.
      </div>
      <textarea
        className="editor-textarea"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChangeText(e.target.value);
        }}
        rows={3}
        spellCheck={false}
      />
      {changed && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#71717a" }}>
          <span style={{ color: "#fb7185", textDecoration: "line-through" }}>
            {originalText.length > 80
              ? originalText.slice(0, 80) + "..."
              : originalText}
          </span>
        </div>
      )}
    </div>
  );
}
