"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
        <div className="text-zinc-400 text-[11px] mb-2">
          Type directly on the element
        </div>
        {changed && (
          <div className="text-[10px] text-zinc-500">
            <span className="text-rose-400 line-through">
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
      <div className="text-amber-400 text-[10px] mb-2">
        This element has child elements. Text editing will only affect leaf text nodes.
      </div>
      <textarea
        className="w-full min-h-[60px] p-2 resize-y bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md text-[12px] outline-none focus:border-zinc-300 font-[inherit]"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChangeText(e.target.value);
        }}
        rows={3}
        spellCheck={false}
      />
      {changed && (
        <div className="mt-1.5 text-[10px] text-zinc-500">
          <span className="text-rose-400 line-through">
            {originalText.length > 80
              ? originalText.slice(0, 80) + "..."
              : originalText}
          </span>
        </div>
      )}
    </div>
  );
}
