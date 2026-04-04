"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EDITOR_ATTR } from "./constants";
import { useEditor } from "./EditorProvider";
import {
  identifyElement,
  getElementClasses,
  getDetailedComputedStyles,
  getForensicComputedStyles,
  getFullElementPath,
  getAccessibilityInfo,
  getNearbyText,
  getReactComponents,
} from "./engine/annotations";
import { getSourceLocation } from "./engine/fiber";
import type { Annotation, AnnotationIntent } from "./types";

function generateId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Lightweight markdown → HTML for thread messages. */
function renderMd(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, (m) => m.includes("<ul>") ? m : `<ol>${m}</ol>`)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function isElementFixed(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (style.position === "fixed" || style.position === "sticky") return true;
    current = current.parentElement;
  }
  return false;
}

function formatSourceLocation(loc: { fileName: string; lineNumber: number } | null): string | undefined {
  if (!loc) return undefined;
  const file = loc.fileName.replace(/^.*?\/src\//, "src/");
  return `${file}:${loc.lineNumber}`;
}

type PendingAnnotation = {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  isFixed?: boolean;
  fullPath?: string;
  accessibility?: string;
  computedStyles?: string;
  reactComponents?: string;
  sourceFile?: string;
};

type HoverRect = { top: number; left: number; width: number; height: number; bottom: number };

type HoverInfo = {
  element: string;
  rect: HoverRect | null;
  reactComponents?: string | null;
};

const INTENT_OPTIONS: { value: AnnotationIntent; label: string }[] = [
  { value: "fix", label: "Fix" },
  { value: "change", label: "Change" },
  { value: "question", label: "Question" },
  { value: "approve", label: "Approve" },
];

// Shared class fragments
const textareaBase =
  "w-full bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md text-[12px] outline-none p-2 resize-y box-border focus:border-zinc-300 font-[inherit]";

const btnBase =
  "border-none rounded-md cursor-pointer font-[inherit] text-[12px] transition-colors disabled:opacity-40 disabled:cursor-default";

export default function AnnotationOverlay() {
  const editor = useEditor();
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [pending, setPending] = useState<PendingAnnotation | null>(null);
  const [comment, setComment] = useState("");
  const [intent, setIntent] = useState<AnnotationIntent>("fix");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [replyText, setReplyText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const [wiggle, setWiggle] = useState(false);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const isEditorElement = useCallback((el: HTMLElement) => {
    return !!el.closest(`[${EDITOR_ATTR}]`);
  }, []);

  // Clear open popups when annotate mode is turned off
  useEffect(() => {
    if (!editor?.annotateMode) {
      setEditingId(null);
      setIsEditingComment(false);
      setPending(null);
    }
  }, [editor?.annotateMode]);

  // Hover highlight in annotate mode
  useEffect(() => {
    if (!editor?.annotateMode) {
      setHoverInfo(null);
      hoveredElRef.current = null;
      return;
    }

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (pending) return;
      const target = e.target as HTMLElement;
      if (!target || isEditorElement(target)) {
        setHoverInfo(null);
        hoveredElRef.current = null;
        return;
      }
      if (target === hoveredElRef.current) return;
      hoveredElRef.current = target;

      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        const { name } = identifyElement(target);
        const react = getReactComponents(target);
        const displayName = react ? `${react} ${name}` : name;
        const r = target.getBoundingClientRect();
        setHoverInfo({
          element: displayName,
          rect: {
            top: r.top + window.scrollY,
            left: r.left + window.scrollX,
            width: r.width,
            height: r.height,
            bottom: r.bottom + window.scrollY,
          },
          reactComponents: react,
        });
      }, 50);
    };

    document.addEventListener("mousemove", handleMouseMove, { capture: true });
    return () => {
      document.removeEventListener("mousemove", handleMouseMove, { capture: true });
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [editor?.annotateMode, pending, isEditorElement]);

  // Click to create annotation
  useEffect(() => {
    if (!editor?.annotateMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isEditorElement(target)) return;
      e.preventDefault();
      e.stopPropagation();

      if (pendingRef.current) {
        setWiggle(true);
        setTimeout(() => setWiggle(false), 400);
        return;
      }

      const { name, path } = identifyElement(target);
      const react = getReactComponents(target);
      const rect = target.getBoundingClientRect();
      const selectedText = window.getSelection()?.toString().trim() || undefined;
      const sourceLoc = getSourceLocation(target);

      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yAbsolute = e.clientY + window.scrollY;

      setPending({
        x: xPercent,
        y: yAbsolute,
        clientY: e.clientY,
        element: react ? `${react} ${name}` : name,
        elementPath: path,
        selectedText,
        boundingBox: { x: rect.x + window.scrollX, y: rect.y + window.scrollY, width: rect.width, height: rect.height },
        nearbyText: getNearbyText(target),
        cssClasses: getElementClasses(target) || undefined,
        isFixed: isElementFixed(target),
        fullPath: getFullElementPath(target),
        accessibility: getAccessibilityInfo(target) || undefined,
        computedStyles: editor.outputDetailLevel === "forensic"
          ? getForensicComputedStyles(target)
          : JSON.stringify(getDetailedComputedStyles(target)),
        reactComponents: react || undefined,
        sourceFile: formatSourceLocation(sourceLoc),
      });
      setComment("");
      setIntent("fix");
      setHoverInfo(null);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isEditorElement(target)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("mousedown", handleMouseDown, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
    };
  }, [editor?.annotateMode, editor?.outputDetailLevel, isEditorElement]);

  useEffect(() => {
    if (pending && textareaRef.current) textareaRef.current.focus();
  }, [pending]);

  useEffect(() => {
    if (editingId && editTextareaRef.current) editTextareaRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (editingId && threadEndRef.current) {
      // Scroll within the thread container only, not the page
      threadEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [editingId, editor?.annotations]);

  useEffect(() => {
    if (!pending && !editingId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPending(null);
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pending, editingId]);

  const submitAnnotation = useCallback(() => {
    if (!pending || !comment.trim() || !editor) return;
    const annotation: Annotation = {
      id: generateId(),
      x: pending.x,
      y: pending.y,
      comment: comment.trim(),
      element: pending.element,
      elementPath: pending.elementPath,
      timestamp: Date.now(),
      selectedText: pending.selectedText,
      boundingBox: pending.boundingBox,
      nearbyText: pending.nearbyText,
      cssClasses: pending.cssClasses,
      computedStyles: pending.computedStyles,
      fullPath: pending.fullPath,
      accessibility: pending.accessibility,
      isFixed: pending.isFixed,
      reactComponents: pending.reactComponents,
      sourceFile: pending.sourceFile,
      intent,
      severity: "suggestion",
      status: "pending",
    };
    editor.addAnnotation(annotation);
    setPending(null);
    setComment("");
    setEditingId(annotation.id);
    setEditComment(annotation.comment);
    setIsEditingComment(false);
  }, [pending, comment, intent, editor]);

  const submitEdit = useCallback(() => {
    if (!editingId || !editComment.trim() || !editor) return;
    editor.updateAnnotation(editingId, { comment: editComment.trim() });
    setEditingId(null);
    setEditComment("");
  }, [editingId, editComment, editor]);

  const submitReply = useCallback(() => {
    if (!editingId || !replyText.trim() || !editor) return;
    editor.addThreadMessage(editingId, replyText.trim());
    setReplyText("");
  }, [editingId, replyText, editor]);

  if (!editor) return null;

  const popupStyle = pending
    ? (() => {
      const popupWidth = 360;
      const popupHeight = 220;
      let left = (pending.x / 100) * window.innerWidth - popupWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - popupWidth - 8));
      const spaceAbove = pending.clientY;
      const top = spaceAbove > popupHeight + 20 ? pending.y - popupHeight - 12 : pending.y + 16;
      return { left, top, width: popupWidth };
    })()
    : null;

  const renderableAnnotations = editor.annotations.filter(
    (a) => a.status !== "resolved" && a.status !== "dismissed"
  );

  // Status badge styles
  const statusStyles: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-400",
    acknowledged: "bg-blue-500/20 text-blue-500",
    resolved: "bg-green-500/20 text-green-500",
    dismissed: "bg-zinc-500/20 text-zinc-500",
  };

  // Marker color styles
  const markerStyles: Record<string, string> = {
    acknowledged: "bg-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.4)] hover:shadow-[0_3px_12px_rgba(59,130,246,0.6)]",
    resolved: "bg-green-500 shadow-[0_2px_8px_rgba(34,197,94,0.4)] hover:shadow-[0_3px_12px_rgba(34,197,94,0.6)]",
    dismissed: "bg-zinc-500 shadow-[0_2px_8px_rgba(113,113,122,0.3)] opacity-60",
  };

  return (
    <>
      {/* Annotate mode banner */}
      {editor.annotateMode && (
        <div className="fixed top-0 right-0 flex items-center justify-center px-3 py-1 m-1 z-[9990] bg-zinc-900/90 text-zinc-100 text-center max-w-max text-[11px] rounded pointer-events-none">
          ANNOTATE MODE — click any element to add feedback
        </div>
      )}

      {/* Hover highlight */}
      {editor.annotateMode && hoverInfo?.rect && !pending && (
        <>
          <div
            className="pointer-events-none z-[9988] border-2 border-dashed border-amber-400/60 rounded-[3px] bg-amber-400/[0.04] transition-all duration-[25ms]"
            style={{
              position: "absolute",
              top: hoverInfo.rect.top,
              left: hoverInfo.rect.left,
              width: hoverInfo.rect.width,
              height: hoverInfo.rect.height,
            }}
          />
          <div
            className="z-[9989] bg-zinc-900/85 text-zinc-100 text-[12px] px-2 py-px rounded-[3px] pointer-events-none whitespace-nowrap max-w-[320px] overflow-hidden text-ellipsis leading-[1.5]"
            style={{
              position: "absolute",
              top: hoverInfo.rect.top >= 28 ? hoverInfo.rect.top - 26 : hoverInfo.rect.bottom + 4,
              left: hoverInfo.rect.left,
            }}
          >
            {hoverInfo.element}
          </div>
        </>
      )}

      {/* Persistent highlight while popup is open */}
      {pending?.boundingBox && (
        <>
          <div
            className="pointer-events-none z-[9988] border-2 border-solid border-amber-400/80 rounded-[3px] bg-amber-400/[0.08] transition-all duration-[25ms]"
            style={{
              position: "absolute",
              top: pending.boundingBox.y,
              left: pending.boundingBox.x,
              width: pending.boundingBox.width,
              height: pending.boundingBox.height,
            }}
          />
          <div
            className="z-[9989] bg-zinc-900/95 text-zinc-100 font-semibold text-[12px] px-2 py-px rounded-[3px] pointer-events-none whitespace-nowrap max-w-[320px] overflow-hidden text-ellipsis leading-[1.5]"
            style={{
              position: "absolute",
              top: pending.boundingBox.y >= 28
                ? pending.boundingBox.y - 26
                : pending.boundingBox.y + pending.boundingBox.height + 4,
              left: pending.boundingBox.x,
            }}
          >
            {pending.element}
          </div>
        </>
      )}

      {/* Annotation markers */}
      {editor.annotateMode &&
        renderableAnnotations.map((a, i) => (
          <div
            key={a.id}
            className={cn(
              "z-[9991] w-[22px] h-[22px] rounded-full text-[11px] font-semibold flex items-center justify-center cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all select-none",
              // default: amber
              "bg-amber-400 text-zinc-900 shadow-[0_2px_8px_rgba(245,158,11,0.4)] hover:scale-[1.2] hover:shadow-[0_3px_12px_rgba(245,158,11,0.6)]",
              // status override
              a.status && a.status !== "pending" && markerStyles[a.status],
              // editing state
              editingId === a.id && "scale-[1.25] bg-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.7)]"
            )}
            style={{
              left: `${a.x}%`,
              top: a.isFixed ? a.y - window.scrollY : a.y,
              position: a.isFixed ? "fixed" : "absolute",
            }}
            title={a.comment}
            onClick={(e) => {
              e.stopPropagation();
              if (editingId === a.id) {
                setEditingId(null);
                setIsEditingComment(false);
              } else {
                setEditingId(a.id);
                setEditComment(a.comment);
                setIsEditingComment(false);
              }
            }}
          >
            {i + 1}
          </div>
        ))}

      {/* Edit marker popup */}
      {editingId && (() => {
        const ann = editor.annotations.find((a) => a.id === editingId);
        if (!ann) return null;
        const markerX = (ann.x / 100) * window.innerWidth;
        const markerY = ann.y;
        const hasThread = ann.thread && ann.thread.length > 0;
        const popW = 360;
        let left = markerX - popW / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
        const top = markerY + 28;
        const statusLabel = ann.status || "pending";
        return (
          <div
            className="absolute z-[9996] bg-zinc-900 border border-zinc-700 rounded-[10px] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[12px] text-zinc-300 max-h-[600px] overflow-y-auto"
            style={{ left, top, width: popW }}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-zinc-200 font-semibold text-[12px] overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                {ann.element}
              </span>
              <span className={cn("text-[9px] uppercase tracking-[0.5px] px-[6px] py-px rounded-[3px] shrink-0", statusStyles[statusLabel])}>
                {statusLabel}
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setEditingId(null)}
              >
                Close
              </Button>
              <button
                className="bg-transparent border-none cursor-pointer p-0 text-rose-400 text-[11px] opacity-70 hover:opacity-100"
                onClick={() => {
                  editor.removeAnnotation(ann.id);
                  setEditingId(null);
                }}
              >
                Delete
              </button>
            </div>

            {isEditingComment ? (
              <>
                <textarea
                  ref={editTextareaRef}
                  className={cn(textareaBase, "min-h-[52px]")}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      submitEdit();
                      setIsEditingComment(false);
                    }
                  }}
                  rows={2}
                  placeholder="Edit feedback..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className={cn(btnBase, "px-3 py-1 bg-zinc-700 text-zinc-300 opacity-60 hover:opacity-100")}
                    onClick={() => {
                      setEditComment(ann.comment);
                      setIsEditingComment(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={cn(btnBase, "px-3 py-1 bg-zinc-300 text-zinc-900 hover:bg-zinc-200")}
                    onClick={() => {
                      submitEdit();
                      setIsEditingComment(false);
                    }}
                    disabled={!editComment.trim()}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 text-zinc-200 text-[12px] leading-[1.4] whitespace-pre-wrap break-words">
                  {ann.comment}
                </div>
                <button
                  className="bg-transparent border-none cursor-pointer text-zinc-500 text-[10px] p-0 shrink-0 hover:text-zinc-200"
                  onClick={() => {
                    setEditComment(ann.comment);
                    setIsEditingComment(true);
                  }}
                >
                  Edit
                </button>
              </div>
            )}

            {/* Working indicator for fresh annotations (no thread yet) */}
            {!hasThread && ann.status === "acknowledged" && (
              <div className="border-t border-zinc-700 mt-2 pt-1.5">
                <div className="px-2 py-1 rounded-md text-[12px] leading-[1.4] bg-zinc-400/10 opacity-70 flex items-center">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.3px] mr-1.5 text-blue-500">
                    Claude
                  </span>
                  <span className="text-zinc-300 leading-[1.5]">working</span>
                  <span className="inline-flex items-center gap-1 ml-0.5">
                    <span className="editor-thinking-dot" />
                    <span className="editor-thinking-dot" />
                    <span className="editor-thinking-dot" />
                  </span>
                </div>
              </div>
            )}

            {/* Thread messages */}
            {hasThread && (
              <div className="border-t border-zinc-700 mt-2 pt-2">
                <div className="text-zinc-500 text-[10px] uppercase tracking-[0.5px] mb-1.5">
                  Thread
                </div>
                <div className="max-h-[460px] overflow-y-auto flex flex-col gap-1">
                  {ann.thread!.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-2 py-1 rounded-md text-[12px] leading-[1.4]",
                        msg.role === "user" ? "bg-zinc-800" : "bg-zinc-400/10"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-[0.3px] mr-1.5",
                          msg.role === "user" ? "text-zinc-400" : "text-blue-500"
                        )}
                      >
                        {msg.role === "agent" ? "Claude" : "You"}
                      </span>
                      <span
                        className="editor-thread-content text-zinc-300 leading-[1.5]"
                        dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
                      />
                    </div>
                  ))}
                  {ann.thread!.length > 0
                    && ann.thread![ann.thread!.length - 1].role === "user"
                    && ann.status !== "resolved"
                    && ann.status !== "dismissed" && (
                      <div className="px-2 py-1 rounded-md text-[12px] leading-[1.4] bg-zinc-400/10 opacity-70 flex items-center">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.3px] mr-1.5 text-blue-500">
                          Claude
                        </span>
                        <span className="text-zinc-300 leading-[1.5]">thinking</span>
                        <span className="inline-flex items-center gap-1 ml-0.5">
                          <span className="editor-thinking-dot" />
                          <span className="editor-thinking-dot" />
                          <span className="editor-thinking-dot" />
                        </span>
                      </div>
                    )}
                  <div ref={threadEndRef} />
                </div>
              </div>
            )}

            {/* Reply input */}
            <div className="flex gap-1 items-stretch mt-1.5">
              <textarea
                className={cn(textareaBase, "min-h-[28px] text-[11px] py-1 resize-none flex-1")}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    submitReply();
                  }
                }}
                rows={1}
                placeholder="Reply..."
              />
              <button
                className="shrink-0 px-2.5 py-1 text-[10px] bg-zinc-700 text-zinc-300 border-none rounded hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-default cursor-pointer font-[inherit]"
                onClick={submitReply}
                disabled={!replyText.trim()}
              >
                Send
              </button>
            </div>
          </div>
        );
      })()}

      {/* New annotation popup */}
      {pending && popupStyle && (
        <div
          className={cn(
            "absolute z-[9996] bg-zinc-900 border border-zinc-700 rounded-[10px] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-[12px] text-zinc-300 max-h-[600px] overflow-y-auto",
            wiggle && "editor-annotation-popup--wiggle"
          )}
          style={popupStyle}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-zinc-200 font-semibold text-[12px] overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
              {pending.element}
            </span>
            {pending.sourceFile && (
              <span className="text-zinc-500 text-[10px] overflow-hidden text-ellipsis whitespace-nowrap">
                {pending.sourceFile}
              </span>
            )}
          </div>

          {pending.selectedText && (
            <div className="bg-zinc-800 px-2 py-1 rounded text-[11px] text-zinc-400 mb-2 italic overflow-hidden text-ellipsis whitespace-nowrap">
              &ldquo;{pending.selectedText.slice(0, 60)}
              {pending.selectedText.length > 60 ? "..." : ""}&rdquo;
            </div>
          )}

          <textarea
            ref={textareaRef}
            className={cn(textareaBase, "min-h-[52px]")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submitAnnotation();
              }
            }}
            rows={3}
            placeholder="Describe the issue or feedback..."
          />

          {/* Intent pills */}
          <div className="flex gap-1 my-2">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  "bg-zinc-800 text-zinc-400 border border-transparent rounded px-2 py-px text-[10px] cursor-pointer transition-all hover:text-white",
                  intent === opt.value && "bg-white text-black"
                )}
                onClick={() => setIntent(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              className={cn(btnBase, "px-3 py-1 bg-zinc-700 text-zinc-300 opacity-60 hover:opacity-100")}
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
            <button
              className={cn(btnBase, "px-3 py-1 bg-zinc-300 text-zinc-900 hover:bg-zinc-200")}
              onClick={submitAnnotation}
              disabled={!comment.trim()}
            >
              Add ({navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+{"↵"})
            </button>
          </div>
        </div>
      )}
    </>
  );
}
