import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { LogoDividerNodeView } from "./LogoDividerNodeView";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";
import { splitClasses } from "./figureClasses";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    logoDivider: {
      setLogoDivider: () => ReturnType;
    };
  }
}

export const LogoDivider = Node.create({
  name: "logoDivider",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      className: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-class") || "",
        renderHTML: (attrs: Record<string, string>) => {
          const { classes, style } = parseArbitraryClasses(attrs.className);
          const styleStr = styleObjectToString(style);
          return {
            "data-class": attrs.className,
            ...(classes ? { class: classes } : {}),
            ...(styleStr ? { style: styleStr } : {}),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="logo-divider"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      "data-class": dataClass,
      class: cls,
      style,
      ...rest
    } = HTMLAttributes;

    const { figure: figCls } = splitClasses(cls || "");

    return [
      "div",
      mergeAttributes(rest, {
        "data-type": "logo-divider",
        "data-class": dataClass || "",
        ...(figCls ? { class: figCls } : {}),
      }),
      [
        "div",
        { class: "flex items-center gap-4 my-8", ...(style ? { style } : {}) },
        ["hr", { class: "flex-1 border-t border-zinc-200 dark:border-zinc-800" }],
        ["img", { src: "/assets/mflogo.svg", alt: "", width: "50", height: "20", class: "opacity-25" }],
        ["hr", { class: "flex-1 border-t border-zinc-200 dark:border-zinc-800" }],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LogoDividerNodeView);
  },

  addCommands() {
    return {
      setLogoDivider:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name });
        },
    };
  },
});
