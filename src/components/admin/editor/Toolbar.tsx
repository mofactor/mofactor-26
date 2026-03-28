"use client";

import { memo, useEffect, useReducer, useState } from "react";
import { type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/Button";
import { LinkDialog } from "./LinkDialog";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor;
}

export const Toolbar = memo(function Toolbar({ editor }: ToolbarProps) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    editor.on("selectionUpdate", forceUpdate);
    editor.on("update", forceUpdate);
    return () => {
      editor.off("selectionUpdate", forceUpdate);
      editor.off("update", forceUpdate);
    };
  }, [editor, forceUpdate]);
  const btn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    title: string
  ) => (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      title={title}
      className={active ? "bg-zinc-200 dark:bg-zinc-700" : ""}
    >
      {icon}
    </Button>
  );

  return (
    // <div className="sticky top-4 z-10 flex flex-wrap items-center gap-0.5 rounded-md border border-zinc-200 bg-white/90 px-2 py-1.5 shadow-xs backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 max-w-2xl mx-auto">
    <div className="sticky top-4 z-10 flex flex-wrap items-center gap-0.5 rounded-md shadow-border bg-white p-2 dark:border dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-sm max-w-2xl mx-auto">
      {/* Text formatting */}
      {btn(
        editor.isActive("bold"),
        () => editor.chain().focus().toggleBold().run(),
        <Bold className="size-3.5" />,
        "Bold"
      )}
      {btn(
        editor.isActive("italic"),
        () => editor.chain().focus().toggleItalic().run(),
        <Italic className="size-3.5" />,
        "Italic"
      )}
      {btn(
        editor.isActive("underline"),
        () => editor.chain().focus().toggleUnderline().run(),
        <Underline className="size-3.5" />,
        "Underline"
      )}
      {btn(
        editor.isActive("strike"),
        () => editor.chain().focus().toggleStrike().run(),
        <Strikethrough className="size-3.5" />,
        "Strikethrough"
      )}
      {btn(
        editor.isActive("code"),
        () => editor.chain().focus().toggleCode().run(),
        <Code className="size-3.5" />,
        "Inline code"
      )}

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      {/* Headings */}
      {btn(
        editor.isActive("heading", { level: 1 }),
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        <Heading1 className="size-3.5" />,
        "Heading 1"
      )}
      {btn(
        editor.isActive("heading", { level: 2 }),
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        <Heading2 className="size-3.5" />,
        "Heading 2"
      )}
      {btn(
        editor.isActive("heading", { level: 3 }),
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        <Heading3 className="size-3.5" />,
        "Heading 3"
      )}

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      {/* Lists */}
      {btn(
        editor.isActive("bulletList"),
        () => editor.chain().focus().toggleBulletList().run(),
        <List className="size-3.5" />,
        "Bullet list"
      )}
      {btn(
        editor.isActive("orderedList"),
        () => editor.chain().focus().toggleOrderedList().run(),
        <ListOrdered className="size-3.5" />,
        "Ordered list"
      )}
      {btn(
        editor.isActive("blockquote"),
        () => editor.chain().focus().toggleBlockquote().run(),
        <Quote className="size-3.5" />,
        "Blockquote"
      )}

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      {/* Alignment */}
      {btn(
        editor.isActive({ textAlign: "left" }),
        () => editor.chain().focus().setTextAlign("left").run(),
        <AlignLeft className="size-3.5" />,
        "Align left"
      )}
      {btn(
        editor.isActive({ textAlign: "center" }),
        () => editor.chain().focus().setTextAlign("center").run(),
        <AlignCenter className="size-3.5" />,
        "Align center"
      )}
      {btn(
        editor.isActive({ textAlign: "right" }),
        () => editor.chain().focus().setTextAlign("right").run(),
        <AlignRight className="size-3.5" />,
        "Align right"
      )}

      <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />

      {/* Link */}
      {btn(
        editor.isActive("link") || !!editor.getAttributes("image")?.href,
        () => setLinkOpen(true),
        <Link className="size-3.5" />,
        "Link"
      )}
      <LinkDialog editor={editor} open={linkOpen} onOpenChange={setLinkOpen} />

      {/* Divider */}
      {btn(
        false,
        () => editor.chain().focus().setHorizontalRule().run(),
        <Minus className="size-3.5" />,
        "Divider"
      )}

      <div className="ml-auto flex items-center gap-0.5">
        {btn(
          false,
          () => editor.chain().focus().undo().run(),
          <Undo className="size-3.5" />,
          "Undo"
        )}
        {btn(
          false,
          () => editor.chain().focus().redo().run(),
          <Redo className="size-3.5" />,
          "Redo"
        )}
      </div>
    </div>
  );
});
