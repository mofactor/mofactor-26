import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: any; range: any }) => void;
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: any;
          range: any;
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const items: SlashCommandItem[] = [
    {
      title: "Heading 1",
      description: "Large heading",
      icon: "H1",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium heading",
      icon: "H2",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small heading",
      icon: "H3",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Bullet List",
      description: "Unordered list",
      icon: "•",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Ordered List",
      description: "Numbered list",
      icon: "1.",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Blockquote",
      description: "Quote block",
      icon: '"',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Code Block",
      description: "Code with syntax highlighting",
      icon: "</>",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Divider",
      description: "Horizontal line",
      icon: "—",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Logo Divider",
      description: "Divider with site logo",
      icon: "◆",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setLogoDivider().run();
      },
    },
    {
      title: "Columns",
      description: "Multi-column layout",
      icon: "▐▌",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertColumns(2)
          .run();
      },
    },
    {
      title: "Styled Block",
      description: "Container with Tailwind classes",
      icon: "□",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertStyledBlock("")
          .run();
      },
    },
    {
      title: "Image Upload",
      description: "Upload a new image",
      icon: "🖼",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            window.dispatchEvent(
              new CustomEvent("tiptap-image-upload", { detail: file })
            );
          }
        };
        input.click();
      },
    },
    {
      title: "Image from Library",
      description: "Pick from uploaded files",
      icon: "📁",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        window.dispatchEvent(new CustomEvent("tiptap-file-picker-open"));
      },
    },
    {
      title: "Video Upload",
      description: "Upload a new video",
      icon: "▶",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*";
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            window.dispatchEvent(
              new CustomEvent("tiptap-video-upload", { detail: file })
            );
          }
        };
        input.click();
      },
    },
    {
      title: "Video from Library",
      description: "Pick from uploaded files",
      icon: "🎬",
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        window.dispatchEvent(new CustomEvent("tiptap-video-picker-open"));
      },
    },
  ];

  return items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
}
