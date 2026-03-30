"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EDITOR_ATTR } from "./constants";
import { useEditor } from "./EditorProvider";
import { cn } from "@/lib/utils";

/** Build a short label like `<div.flex.gap-4>` or `<a#logo>` */
function formatElementLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;

  const classes = el.className;
  if (typeof classes === "string" && classes.trim()) {
    const list = classes.trim().split(/\s+/);
    const meaningful = list
      .filter((c) => !c.startsWith("editor-"))
      .slice(0, 3);
    if (meaningful.length > 0) return `${tag}.${meaningful.join(".")}`;
  }
  return tag;
}

/**
 * Full-viewport overlay that handles hover highlights and click-to-select.
 * Uses capture-phase listeners on document — not a blocking overlay div.
 */
export default function EditorOverlay() {
  const editor = useEditor();
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);

  const isEditorElement = useCallback((el: HTMLElement) => {
    return !!el.closest(`[${EDITOR_ATTR}]`);
  }, []);

  // Toggle editor-active class on <html> for page offset
  useEffect(() => {
    if (editor?.editMode) {
      document.documentElement.classList.add("editor-active");
    } else {
      document.documentElement.classList.remove("editor-active");
    }
    return () => document.documentElement.classList.remove("editor-active");
  }, [editor?.editMode]);

  // Track selected element position (it may move on scroll/resize)
  useEffect(() => {
    if (!editor?.selectedElement) {
      setSelectedRect(null);
      return;
    }

    const update = () => {
      if (editor.selectedElement) {
        setSelectedRect(editor.selectedElement.getBoundingClientRect());
      }
      rafRef.current = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafRef.current);
  }, [editor?.selectedElement]);

  // Capture-phase mousemove for hover highlight
  useEffect(() => {
    if (!editor?.editMode) {
      setHoverRect(null);
      hoveredElRef.current = null;
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isEditorElement(target)) {
        setHoverRect(null);
        hoveredElRef.current = null;
        return;
      }
      if (target !== hoveredElRef.current) {
        hoveredElRef.current = target;
        setHoverRect(target.getBoundingClientRect());
      }
    };

    const handleScroll = () => {
      if (hoveredElRef.current) {
        setHoverRect(hoveredElRef.current.getBoundingClientRect());
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove, { capture: true });
      window.removeEventListener("scroll", handleScroll);
    };
  }, [editor?.editMode, isEditorElement]);

  // Capture-phase click for selection
  useEffect(() => {
    if (!editor?.editMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isEditorElement(target)) return;

      if (editor.selectedElement?.contains(target) && editor.selectedElement.isContentEditable) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      editor.selectElement(target);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isEditorElement(target)) return;

      if (editor.selectedElement?.contains(target) && editor.selectedElement.isContentEditable) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("mousedown", handleMouseDown, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
    };
  }, [editor?.editMode, editor?.selectElement, editor?.selectedElement, isEditorElement]);

  // Shift+Enter to select parent element
  useEffect(() => {
    if (!editor?.editMode || !editor.selectedElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        const parent = editor.selectedElement?.parentElement;
        if (
          parent &&
          parent.tagName !== "BODY" &&
          parent.tagName !== "HTML" &&
          !isEditorElement(parent)
        ) {
          editor.selectElement(parent);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [editor?.editMode, editor?.selectedElement, editor?.selectElement, isEditorElement]);

  if (!editor) return null;

  // Label: above rect top-left, flip below if near viewport top
  const labelForRect = (
    rect: DOMRect,
    el: HTMLElement | null,
    variant: "selected" | "hover"
  ) => {
    if (!rect || !el) return null;
    const aboveTop = rect.top - 24;
    const top = aboveTop >= 0 ? aboveTop : rect.bottom + 2;
    return (
      <div
        className={cn(
          // base label
          "fixed z-[9992] bg-zinc-900/85 text-zinc-100 text-[12px] px-2 py-px rounded-[3px]",
          "pointer-events-none whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis leading-[1.5]",
          // hover variant: dimmer
          variant === "hover" && "bg-zinc-900/55"
        )}
        style={{ top, left: rect.left }}
      >
        {formatElementLabel(el)}
      </div>
    );
  };

  return (
    <>
      {/* Edit mode banner */}
      {editor.editMode && (
        <div
          className="fixed top-0 left-0 flex items-center justify-center px-3 py-1 m-1 z-[9990]
            bg-zinc-900/90 text-zinc-100 text-center max-w-max text-[11px] rounded pointer-events-none"
          style={{ right: "var(--ed-sidebar-w, 340px)" }}
        >
          EDIT MODE — click any element to inspect
        </div>
      )}

      {/* Hover highlight */}
      {editor.editMode && hoverRect && (
        <div
          className="fixed pointer-events-none z-[9990] border-2 border-zinc-900/60 rounded-[3px] transition-all duration-[25ms] ease-out dark:border-zinc-100/60"
          style={{
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        />
      )}

      {/* Selected highlight + label */}
      {selectedRect && (
        <>
          <div
            className="fixed pointer-events-none z-[9990] border-2 border-zinc-900/90 bg-zinc-900/[0.06] rounded-[3px] transition-all duration-[25ms] ease-out dark:border-zinc-100/90 dark:bg-zinc-100/[0.06]"
            style={{
              top: selectedRect.top,
              left: selectedRect.left,
              width: selectedRect.width,
              height: selectedRect.height,
            }}
          />
          {labelForRect(selectedRect, editor.selectedElement, "selected")}
        </>
      )}
    </>
  );
}
