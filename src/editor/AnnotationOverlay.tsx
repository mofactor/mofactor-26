"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    // code blocks (``` ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // bullet lists (lines starting with - or *)
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, (m) => m.includes('<ul>') ? m : `<ol>${m}</ol>`)
    // paragraphs (double newline)
    .replace(/\n{2,}/g, '</p><p>')
    // single newlines → <br>
    .replace(/\n/g, '<br>');
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

  // Hover highlight in annotate mode
  useEffect(() => {
    if (!editor?.annotateMode) {
      setHoverInfo(null);
      hoveredElRef.current = null;
      return;
    }

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (pending) return; // Don't hover while popup is open

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

      // Block new annotation while popup is open — wiggle instead
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

  // Focus textarea when popup opens
  useEffect(() => {
    if (pending && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [pending]);

  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [editingId]);

  // Auto-scroll thread when new messages arrive
  useEffect(() => {
    if (editingId && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [editingId, editor?.annotations]);

  // Escape to close popup
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

  // Compute popup position (centered horizontally near click, above or below)
  const popupStyle = pending
    ? (() => {
        const popupWidth = 360;
        const popupHeight = 220;
        let left = (pending.x / 100) * window.innerWidth - popupWidth / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - popupWidth - 8));
        // Place above click point if enough room, otherwise below (document-relative)
        const spaceAbove = pending.clientY;
        const top = spaceAbove > popupHeight + 20
          ? pending.y - popupHeight - 12
          : pending.y + 16;
        return { left, top, width: popupWidth };
      })()
    : null;

  const renderableAnnotations = editor.annotations.filter(
    (a) => a.status !== "resolved" && a.status !== "dismissed"
  );

  return (
    <>
      {/* Annotate mode banner */}
      {editor.annotateMode && (
        <div className="editor-annotate-banner">
          ANNOTATE MODE — click any element to add feedback
        </div>
      )}

      {/* Hover highlight (while browsing, before click) */}
      {editor.annotateMode && hoverInfo?.rect && !pending && (
        <>
          <div
            className="editor-annotate-highlight"
            style={{
              position: "absolute",
              top: hoverInfo.rect.top,
              left: hoverInfo.rect.left,
              width: hoverInfo.rect.width,
              height: hoverInfo.rect.height,
            }}
          />
          <div
            className="editor-annotate-tooltip"
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

      {/* Persistent highlight of clicked element while popup is open */}
      {pending?.boundingBox && (
        <>
          <div
            className="editor-annotate-highlight editor-annotate-highlight--active"
            style={{
              position: "absolute",
              top: pending.boundingBox.y,
              left: pending.boundingBox.x,
              width: pending.boundingBox.width,
              height: pending.boundingBox.height,
            }}
          />
          <div
            className="editor-annotate-tooltip editor-annotate-tooltip--active"
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
            className={`editor-annotation-marker${editingId === a.id ? " editor-annotation-marker--editing" : ""}${a.status && a.status !== "pending" ? ` editor-annotation-marker--${a.status}` : ""}`}
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
          <div className="editor-annotation-popup" style={{ left, top, width: popW }}>
            <div className="editor-annotation-popup-header">
              <span className="editor-annotation-popup-element">{ann.element}</span>
              <span className={`editor-annotation-status editor-annotation-status--${statusLabel}`}>
                {statusLabel}
              </span>
              <button
                className="editor-annotation-popup-delete"
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
                  className="editor-annotation-textarea"
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
                <div className="editor-annotation-popup-actions">
                  <button
                    className="editor-btn"
                    style={{ opacity: 0.6 }}
                    onClick={() => {
                      setEditComment(ann.comment);
                      setIsEditingComment(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="editor-btn editor-btn--primary"
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
              <div className="editor-annotation-comment-row">
                <div className="editor-annotation-comment-text">{ann.comment}</div>
                <button
                  className="editor-annotation-comment-edit"
                  onClick={() => {
                    setEditComment(ann.comment);
                    setIsEditingComment(true);
                  }}
                >
                  Edit
                </button>
              </div>
            )}

            {/* Thread messages */}
            {hasThread && (
              <div className="editor-annotation-thread">
                <div className="editor-annotation-thread-label">Thread</div>
                <div className="editor-annotation-thread-messages">
                  {ann.thread!.map((msg, i) => (
                    <div
                      key={i}
                      className={`editor-annotation-thread-msg editor-annotation-thread-msg--${msg.role}`}
                    >
                      <span className="editor-annotation-thread-role">
                        {msg.role === "agent" ? "Claude" : "You"}
                      </span>
                      <span className="editor-annotation-thread-content" dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
                    </div>
                  ))}
                  {ann.thread!.length > 0
                    && ann.thread![ann.thread!.length - 1].role === "user"
                    && ann.status !== "resolved"
                    && ann.status !== "dismissed" && (
                    <div className="editor-annotation-thread-msg editor-annotation-thread-msg--agent editor-annotation-thinking">
                      <span className="editor-annotation-thread-role">Claude</span>
                      <span className="editor-annotation-thread-content">thinking</span>
                      <span className="editor-thinking-dots">
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
            <div className="editor-annotation-reply">
              <textarea
                className="editor-annotation-textarea editor-annotation-textarea--reply"
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
                className="editor-btn editor-btn--small"
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
        <div className={`editor-annotation-popup${wiggle ? " editor-annotation-popup--wiggle" : ""}`} style={popupStyle}>
          <div className="editor-annotation-popup-header">
            <span className="editor-annotation-popup-element">{pending.element}</span>
            {pending.sourceFile && (
              <span className="editor-annotation-popup-source">{pending.sourceFile}</span>
            )}
          </div>
          {pending.selectedText && (
            <div className="editor-annotation-popup-selection">
              &ldquo;{pending.selectedText.slice(0, 60)}
              {pending.selectedText.length > 60 ? "..." : ""}&rdquo;
            </div>
          )}
          <textarea
            ref={textareaRef}
            className="editor-annotation-textarea"
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
          <div className="editor-annotation-popup-intents">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`editor-intent-pill${intent === opt.value ? " editor-intent-pill--active" : ""}`}
                onClick={() => setIntent(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="editor-annotation-popup-actions">
            <button
              className="editor-btn"
              style={{ opacity: 0.6 }}
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
            <button
              className="editor-btn editor-btn--primary"
              onClick={submitAnnotation}
              disabled={!comment.trim()}
            >
              Add ({navigator.platform.includes("Mac") ? "\u2318" : "Ctrl"}+{"\u21B5"})
            </button>
          </div>
        </div>
      )}
    </>
  );
}
