"use client";

import { useEditor, EditorContent, ReactRenderer, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { StylableImage } from "./extensions/ImageExtension";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { Plugin, PluginKey, TextSelection, AllSelection, NodeSelection as PMNodeSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";

import { Columns, Column } from "./extensions/ColumnsExtension";
import { StyledBlock } from "./extensions/StyledBlockExtension";
import { VideoBlock } from "./extensions/VideoExtension";
import { LogoDivider } from "./extensions/LogoDividerExtension";
import { StylableNodes } from "./extensions/StylableNodesExtension";
import { generateVariantArbitraryCSS } from "@/lib/tw-arbitrary";
import {
  SlashCommand,
  getSlashCommandItems,
} from "./extensions/SlashCommand";
import { SlashCommandMenu } from "./SlashCommandMenu";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { offset } from "@floating-ui/dom";
import { Toolbar } from "./Toolbar";
import { FilePickerDialog } from "./FilePickerDialog";
import "./editor.css";

const lowlight = createLowlight(common);

/** All block-level node types that support className via the inspector. */
const STYLEABLE_TYPES = new Set([
  "styledBlock", "columns", "column",
  "paragraph", "heading", "bulletList", "orderedList",
  "listItem", "blockquote", "codeBlock", "horizontalRule",
]);

// ProseMirror decoration plugin — the reliable way to add data-active to nodes.
// Unlike direct DOM manipulation, decorations survive ProseMirror re-renders.
const activeNodeKey = new PluginKey<number | null>("activeNode");
const ActiveNodeDecoration = Extension.create({
  name: "activeNodeDecoration",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: activeNodeKey,
        state: {
          init() {
            return null as number | null;
          },
          apply(tr, prev) {
            const meta = tr.getMeta(activeNodeKey);
            if (meta !== undefined) return meta as number | null;
            if (prev != null) {
              const mapped = tr.mapping.map(prev);
              if (tr.doc.nodeAt(mapped)) return mapped;
              return null;
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            const pos = activeNodeKey.getState(state);
            if (pos == null) return DecorationSet.empty;
            const node = state.doc.nodeAt(pos);
            if (!node) return DecorationSet.empty;
            return DecorationSet.create(state.doc, [
              Decoration.node(pos, pos + node.nodeSize, { "data-active": "" }),
            ]);
          },
        },
      }),
    ];
  },
});

/** Detect whether plain text looks like markdown. */
function looksLikeMarkdown(text: string): boolean {
  return /^#{1,6}\s/m.test(text) ||       // headings
    /^[-*+]\s/m.test(text) ||              // unordered list
    /^\d+\.\s/m.test(text) ||              // ordered list
    /^>\s/m.test(text) ||                  // blockquote
    /^---$|^\*\*\*$|^___$/m.test(text) ||  // horizontal rule
    /!\[.*?\]\(.*?\)/.test(text) ||        // image
    /\[.*?\]\(.*?\)/.test(text);           // link
}

/** Convert inline markdown marks to HTML. */
function inlineMarkdown(line: string): string {
  return line
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>");
}

/** Lightweight markdown-to-HTML for paste handling. */
function markdownToHtml(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line → skip (paragraph separation handled by wrapping)
    if (line.trim() === "") { i++; continue; }

    // Horizontal rule
    if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      out.push("<hr>");
      i++; continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      i++; continue;
    }

    // Unordered list — collect consecutive items
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`<li>${inlineMarkdown(lines[i].replace(/^[-*+]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${inlineMarkdown(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Blockquote — collect consecutive lines
    if (/^>\s?/.test(line)) {
      const bqLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bqLines.push(inlineMarkdown(lines[i].replace(/^>\s?/, "")));
        i++;
      }
      out.push(`<blockquote><p>${bqLines.join(" ")}</p></blockquote>`);
      continue;
    }

    // Plain paragraph
    out.push(`<p>${inlineMarkdown(line)}</p>`);
    i++;
  }

  return out.join("");
}

export interface NodeAncestor {
  pos: number;
  type: string;
  className: string;
  attrs?: Record<string, any>;
}

export interface NodeSelection {
  pos: number;
  type: string;
  className: string;
  ancestors: NodeAncestor[];
  attrs?: Record<string, any>;
}

interface TiptapEditorProps {
  content?: string;
  onChange: (json: string) => void;
  onNodeSelect?: (info: NodeSelection | null) => void;
  activeNodePos?: number | null;
  onEscape?: () => void;
}

export interface TiptapEditorHandle {
  updateNodeClass: (pos: number, className: string) => void;
  updateNodeAttr: (pos: number, key: string, value: unknown) => void;
  deleteNode: (pos: number) => void;
  setColumnCount: (pos: number, count: number) => void;
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor({ content, onChange, onNodeSelect, activeNodePos, onEscape }, ref) {
    const { token } = useAdminSession();
    const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
    const getStorageUrl = useMutation(api.posts.getStorageUrl);
    const registerFile = useMutation(api.files.upload);
    const [filePickerOpen, setFilePickerOpen] = useState(false);
    const [videoPickerOpen, setVideoPickerOpen] = useState(false);
    const [variantCSS, setVariantCSS] = useState("");

    // Refs so editorProps handlers always see latest values (no stale closures)
    const onNodeSelectRef = useRef(onNodeSelect);
    onNodeSelectRef.current = onNodeSelect;
    const onEscapeRef = useRef(onEscape);
    onEscapeRef.current = onEscape;
    // Synchronous active-pos tracking (React state is async)
    const localActivePosRef = useRef<number | null>(activeNodePos ?? null);

    // Track the hovered block pos from the drag handle so click can select it
    const dragHoveredPosRef = useRef<number | null>(null);

    // Debounced onChange — avoids JSON.stringify + React re-render on every keystroke
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          dropcursor: { color: "currentColor", width: 2 },
          link: false,
          underline: false,
        }),
        UnderlineExtension,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        LinkExtension.configure({
          openOnClick: false,
        }),
        StylableImage.configure({
          allowBase64: false,
        }),
        Placeholder.configure({
          placeholder: 'Type "/" for commands...',
        }),
        CodeBlockLowlight.configure({
          lowlight,
        }),
        Columns,
        Column,
        StyledBlock,
        VideoBlock,
        LogoDivider,
        StylableNodes,
        ActiveNodeDecoration,
        SlashCommand.configure({
          suggestion: {
            items: ({ query }: { query: string }) => getSlashCommandItems(query),
            allowedPrefixes: null,
            render: () => {
              let component: ReactRenderer | null = null;
              let popup: TippyInstance | null = null;

              return {
                onStart: (props: any) => {
                  component = new ReactRenderer(SlashCommandMenu, {
                    props,
                    editor: props.editor,
                  });

                  if (!props.clientRect) return;

                  popup = tippy(document.body, {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: "manual",
                    placement: "bottom-start",
                  }) as unknown as TippyInstance;
                },
                onUpdate: (props: any) => {
                  component?.updateProps(props);
                  if (props.clientRect && popup) {
                    (popup as any).setProps({
                      getReferenceClientRect: props.clientRect,
                    });
                  }
                },
                onKeyDown: (props: any) => {
                  if (props.event.key === "Escape") {
                    (popup as any)?.hide();
                    return true;
                  }
                  return (component?.ref as any)?.onKeyDown(props);
                },
                onExit: () => {
                  (popup as any)?.destroy();
                  component?.destroy();
                },
              };
            },
          },
        }),
      ],
      immediatelyRender: false,
      content: content ? JSON.parse(content) : undefined,
      onUpdate: ({ editor }) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          onChangeRef.current(JSON.stringify(editor.getJSON()));
        }, 300);
      },
      editorProps: {
        attributes: {
          class: "blog-prose prose-editor outline-none min-h-[400px] py-6",
        },
        handleKeyDown: (view, event) => {
          if (event.key === "Escape") {
            const activePos = localActivePosRef.current;
            if (activePos != null) {
              // Already selected → walk up via PostForm
              onEscapeRef.current?.();
              return true;
            }
            // Nothing selected → find and select innermost styleable container
            const { selection } = view.state;
            const resolved = view.state.doc.resolve(selection.from);
            const chain: NodeAncestor[] = [];
            for (let d = 1; d <= resolved.depth; d++) {
              const node = resolved.node(d);
              if (STYLEABLE_TYPES.has(node.type.name)) {
                chain.push({
                  pos: resolved.before(d),
                  type: node.type.name,
                  className: node.attrs.className || "",
                  attrs: { ...node.attrs },
                });
              }
            }
            if (chain.length > 0) {
              const target = chain[chain.length - 1];
              localActivePosRef.current = target.pos;
              view.dispatch(view.state.tr.setMeta(activeNodeKey, target.pos));
              view.dom.setAttribute("data-selecting", "");
              onNodeSelectRef.current?.({
                ...target,
                ancestors: chain.slice(0, -1).reverse(),
              });
              return true;
            }
            return true;
          }
          // When in selecting mode, Enter inserts a paragraph after the selected node
          if (
            event.key === "Enter" &&
            view.dom.hasAttribute("data-selecting")
          ) {
            const pos = localActivePosRef.current;
            if (pos != null) {
              const node = view.state.doc.nodeAt(pos);
              if (node) {
                const after = pos + node.nodeSize;
                const paragraph = view.state.schema.nodes.paragraph.create();
                const tr = view.state.tr.insert(after, paragraph);
                tr.setSelection(TextSelection.create(tr.doc, after + 1));
                tr.setMeta(activeNodeKey, null);
                view.dispatch(tr);
                view.dom.removeAttribute("data-selecting");
                localActivePosRef.current = null;
                onNodeSelectRef.current?.(null);
                return true;
              }
            }
          }
          // When in selecting mode, Backspace/Delete removes the selected node
          if (
            (event.key === "Backspace" || event.key === "Delete") &&
            view.dom.hasAttribute("data-selecting")
          ) {
            const pos = localActivePosRef.current;
            if (pos != null) {
              const node = view.state.doc.nodeAt(pos);
              if (node) {
                const tr = view.state.tr.delete(pos, pos + node.nodeSize);
                tr.setMeta(activeNodeKey, null);
                view.dispatch(tr);
                view.dom.removeAttribute("data-selecting");
                localActivePosRef.current = null;
                onNodeSelectRef.current?.(null);
                return true;
              }
            }
          }
          // Backspace/Delete with selection spanning full isolating container:
          // replace with empty paragraph instead of deleting (which destroys the container)
          if (
            (event.key === "Backspace" || event.key === "Delete") &&
            !view.dom.hasAttribute("data-selecting") &&
            !view.state.selection.empty
          ) {
            const { doc, selection } = view.state;
            const resolved = doc.resolve(selection.from);
            const isolatingTypes = ["styledBlock", "columns", "column"];

            for (let d = resolved.depth; d >= 1; d--) {
              if (isolatingTypes.includes(resolved.node(d).type.name)) {
                const from = resolved.start(d);
                const to = resolved.end(d);
                if (selection.from === from && selection.to === to) {
                  const emptyParagraph = view.state.schema.nodes.paragraph.create();
                  const tr = view.state.tr.replaceWith(from, to, emptyParagraph);
                  tr.setSelection(TextSelection.create(tr.doc, from + 1));
                  view.dispatch(tr);
                  return true;
                }
              }
            }
          }
          // Cmd/Ctrl+A: select within nearest isolating container first
          if (event.key === "a" && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
            const { doc, selection } = view.state;
            const resolved = doc.resolve(selection.from);
            const isolatingTypes = ["styledBlock", "columns", "column"];

            // Collect isolating ancestors from innermost to outermost
            const levels: { depth: number }[] = [];
            for (let d = resolved.depth; d >= 1; d--) {
              if (isolatingTypes.includes(resolved.node(d).type.name)) {
                levels.push({ depth: d });
              }
            }

            for (const { depth } of levels) {
              const from = resolved.start(depth);
              const to = resolved.end(depth);
              // If selection doesn't already cover this level, select it
              if (selection.from !== from || selection.to !== to) {
                view.dispatch(
                  view.state.tr.setSelection(TextSelection.create(doc, from, to))
                );
                return true;
              }
              // Already covers this level → try next (outer) level
            }
            // No isolating ancestor, or all levels already selected → default selectAll
            view.dispatch(
              view.state.tr.setSelection(new AllSelection(doc))
            );
            return true;
          }
          return false;
        },
        handleClick: (view, pos) => {
          // Use the pos parameter for reliable hit testing instead of
          // checking selection type (which is unreliable for atom nodes)
          const resolved = view.state.doc.resolve(pos);
          const nodeAfter = resolved.nodeAfter;
          const nodeBefore = resolved.nodeBefore;

          let targetNode = null;
          let targetPos = pos;
          const atomTypes = ["image", "video", "logoDivider"];
          if (nodeAfter && atomTypes.includes(nodeAfter.type.name)) {
            targetNode = nodeAfter;
            targetPos = pos;
          } else if (nodeBefore && atomTypes.includes(nodeBefore.type.name)) {
            targetNode = nodeBefore;
            targetPos = pos - nodeBefore.nodeSize;
          }

          if (targetNode) {
            localActivePosRef.current = targetPos;
            const tr = view.state.tr.setMeta(activeNodeKey, targetPos);
            tr.setSelection(PMNodeSelection.create(view.state.doc, targetPos));
            view.dispatch(tr);
            view.dom.setAttribute("data-selecting", "");
            const resolvedTarget = view.state.doc.resolve(targetPos);
            const chain: NodeAncestor[] = [];
            for (let d = 1; d <= resolvedTarget.depth; d++) {
              const n = resolvedTarget.node(d);
              if (STYLEABLE_TYPES.has(n.type.name)) {
                chain.push({ pos: resolvedTarget.before(d), type: n.type.name, className: n.attrs.className || "", attrs: { ...n.attrs } });
              }
            }
            onNodeSelectRef.current?.({
              pos: targetPos,
              type: targetNode.type.name,
              className: targetNode.attrs.className || "",
              ancestors: [...chain].reverse(),
              attrs: { ...targetNode.attrs },
            });
            return true;
          }

          // If in selecting mode and clicked on non-atom → exit selecting
          if (view.dom.hasAttribute("data-selecting")) {
            localActivePosRef.current = null;
            view.dispatch(view.state.tr.setMeta(activeNodeKey, null));
            view.dom.removeAttribute("data-selecting");
            onNodeSelectRef.current?.(null);
          }
          return false;
        },
        handleScrollToSelection: () => {
          // Prevent ProseMirror's auto-scroll when selecting atom nodes
          // (images/videos) — the clicked element is already in view
          return true;
        },
        transformPastedHTML(html) {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = html;

          // Remove empty paragraphs (empty, whitespace-only, or just <br>)
          wrapper.querySelectorAll("p").forEach((p) => {
            if (!p.textContent?.trim() && !p.querySelector("img")) {
              p.remove();
            }
          });

          // Merge consecutive <ul>/<ol> elements that sources like Notion,
          // Google Docs, etc. split into separate lists per item.
          for (const tag of ["ul", "ol"] as const) {
            const lists = wrapper.querySelectorAll(tag);
            lists.forEach((list) => {
              const prev = list.previousElementSibling;
              if (prev && prev.tagName.toLowerCase() === tag) {
                while (list.firstChild) {
                  prev.appendChild(list.firstChild);
                }
                list.remove();
              }
            });
          }
          return wrapper.innerHTML;
        },
        handlePaste: (_view, event) => {
          const html = event.clipboardData?.getData("text/html");
          if (html) return false; // rich HTML — let default + transformPastedHTML handle it

          const text = event.clipboardData?.getData("text/plain");
          if (text && looksLikeMarkdown(text)) {
            const converted = markdownToHtml(text);
            editor?.commands.insertContent(converted, {
              parseOptions: { preserveWhitespace: false },
            });
            return true;
          }

          return false;
        },
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        updateNodeClass(pos: number, className: string) {
          if (!editor) return;
          const node = editor.state.doc.nodeAt(pos);
          if (!node || node.isText) return;
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                className,
              });
              return true;
            })
            .run();
        },
        updateNodeAttr(pos: number, key: string, value: unknown) {
          if (!editor) return;
          const node = editor.state.doc.nodeAt(pos);
          if (!node || node.isText) return;
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [key]: value,
              });
              return true;
            })
            .run();
        },
        deleteNode(pos: number) {
          if (!editor) return;
          const node = editor.state.doc.nodeAt(pos);
          if (!node) return;
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.delete(pos, pos + node.nodeSize);
              return true;
            })
            .run();
        },
        setColumnCount(pos: number, count: number) {
          if (!editor) return;
          editor.chain().focus().setColumnCount(pos, count).run();
        },
      }),
      [editor]
    );

    // Generate runtime CSS for variant+arbitrary classes (e.g. dark:border-[12px])
    useEffect(() => {
      if (!editor) return;
      const sync = () => {
        const classes: string[] = [];
        editor.state.doc.descendants((node) => {
          if (node.attrs?.className) {
            classes.push(...node.attrs.className.split(/\s+/));
          }
        });
        setVariantCSS(generateVariantArbitraryCSS(classes));
      };
      sync();
      editor.on("update", sync);
      return () => { editor.off("update", sync); };
    }, [editor]);

    // Sync data-active decoration + data-selecting cursor mode
    useEffect(() => {
      if (!editor) return;
      const editorDom = editor.view.dom;

      localActivePosRef.current = activeNodePos ?? null;

      if (activeNodePos == null) {
        editorDom.removeAttribute("data-selecting");
      } else {
        editorDom.setAttribute("data-selecting", "");
      }

      const currentDecoPos = activeNodeKey.getState(editor.view.state);
      const newPos = activeNodePos ?? null;
      if (currentDecoPos !== newPos) {
        editor.view.dispatch(editor.view.state.tr.setMeta(activeNodeKey, newPos));
      }
    }, [editor, activeNodePos]);

    const handleImageUpload = useCallback(
      async (e: Event) => {
        const file = (e as CustomEvent).detail as File;
        if (!file || !token || !editor) return;

        try {
          const uploadUrl = await generateUploadUrl({ token });
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await result.json();
          const imageUrl = await getStorageUrl({ token, storageId });
          if (!imageUrl) return;

          await registerFile({ token, storageId, name: file.name, type: file.type, size: file.size });

          editor
            .chain()
            .focus()
            .setImage({ src: imageUrl, alt: file.name })
            .run();
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      },
      [editor, token, generateUploadUrl, getStorageUrl, registerFile]
    );

    const handleVideoUpload = useCallback(
      async (e: Event) => {
        const file = (e as CustomEvent).detail as File;
        if (!file || !token || !editor) return;

        try {
          const uploadUrl = await generateUploadUrl({ token });
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await result.json();
          const videoUrl = await getStorageUrl({ token, storageId });
          if (!videoUrl) return;

          await registerFile({ token, storageId, name: file.name, type: file.type, size: file.size });

          editor.chain().focus().setVideo({ src: videoUrl, alt: file.name }).run();
        } catch (err) {
          console.error("Video upload failed:", err);
        }
      },
      [editor, token, generateUploadUrl, getStorageUrl, registerFile]
    );

    useEffect(() => {
      const openPicker = () => setFilePickerOpen(true);
      const openVideoPicker = () => setVideoPickerOpen(true);
      window.addEventListener("tiptap-image-upload", handleImageUpload);
      window.addEventListener("tiptap-file-picker-open", openPicker);
      window.addEventListener("tiptap-video-upload", handleVideoUpload);
      window.addEventListener("tiptap-video-picker-open", openVideoPicker);
      return () => {
        window.removeEventListener("tiptap-image-upload", handleImageUpload);
        window.removeEventListener("tiptap-file-picker-open", openPicker);
        window.removeEventListener("tiptap-video-upload", handleVideoUpload);
        window.removeEventListener("tiptap-video-picker-open", openVideoPicker);
      };
    }, [handleImageUpload, handleVideoUpload]);

    // Stable DragHandle props — inline objects/functions would cause the
    // DragHandle useEffect to unregister/re-register the plugin on every
    // render, which kills the Suggestion popup.
    const dragHandlePositionConfig = useMemo(
      () => ({
        placement: "left-start" as const,
        strategy: "absolute" as const,
        middleware: [offset({ mainAxis: 4, crossAxis: 2 })],
      }),
      []
    );

    const handleDragNodeChange = useCallback(
      ({ node, pos }: { node: any; pos: number }) => {
        dragHoveredPosRef.current = node ? pos : null;
      },
      []
    );

    const handleDragEnd = useCallback(() => {
      if (!editor) return;
      localActivePosRef.current = null;
      editor.view.dispatch(editor.view.state.tr.setMeta(activeNodeKey, null));
      editor.view.dom.removeAttribute("data-selecting");
      onNodeSelectRef.current?.(null);
    }, [editor]);

    // Select the block under the drag handle (click, not drag)
    const selectDragHandleNode = useCallback(() => {
      if (!editor || dragHoveredPosRef.current == null) return;
      const pos = dragHoveredPosRef.current;
      const node = editor.state.doc.nodeAt(pos);
      if (!node) return;

      localActivePosRef.current = pos;
      editor.view.dispatch(editor.view.state.tr.setMeta(activeNodeKey, pos));
      editor.view.dom.setAttribute("data-selecting", "");

      const resolved = editor.state.doc.resolve(pos);
      const chain: NodeAncestor[] = [];
      for (let d = 1; d <= resolved.depth; d++) {
        const n = resolved.node(d);
        if (STYLEABLE_TYPES.has(n.type.name)) {
          chain.push({ pos: resolved.before(d), type: n.type.name, className: n.attrs.className || "", attrs: { ...n.attrs } });
        }
      }
      onNodeSelectRef.current?.({
        pos,
        type: node.type.name,
        className: node.attrs.className || "",
        ancestors: [...chain].reverse(),
        attrs: { ...node.attrs },
      });
    }, [editor]);

    if (!editor) return null;

    return (
      <div>
        {variantCSS && <style dangerouslySetInnerHTML={{ __html: variantCSS }} />}
        <Toolbar editor={editor} />
        <DragHandle
          editor={editor}
          computePositionConfig={dragHandlePositionConfig}
          onNodeChange={handleDragNodeChange}
          onElementDragEnd={handleDragEnd}
        >
          <div className="drag-handle" onMouseDown={selectDragHandleNode}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
            </svg>
          </div>
        </DragHandle>
        <EditorContent editor={editor} />
        <FilePickerDialog
          open={filePickerOpen}
          onClose={() => setFilePickerOpen(false)}
          onSelect={(url, name) => {
            editor.chain().focus().setImage({ src: url, alt: name }).run();
          }}
        />
        <FilePickerDialog
          open={videoPickerOpen}
          onClose={() => setVideoPickerOpen(false)}
          accept="video"
          onSelect={(url, name) => {
            editor.chain().focus().setVideo({ src: url, alt: name }).run();
          }}
        />
      </div>
    );
  }
);
