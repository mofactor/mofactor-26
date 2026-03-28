import { Node, mergeAttributes } from "@tiptap/core";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    styledBlock: {
      insertStyledBlock: (className?: string) => ReturnType;
    };
  }
}

export const StyledBlock = Node.create({
  name: "styledBlock",
  group: "block",
  content: "block+",
  isolating: true,

  addAttributes() {
    return {
      className: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-class") || "",
        renderHTML: (attrs) => {
          const { classes, style } = parseArbitraryClasses(attrs.className);
          const styleStr = styleObjectToString(style);
          return {
            "data-class": attrs.className,
            class: classes,
            ...(styleStr ? { style: styleStr } : {}),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="styled-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "styled-block",
        class: HTMLAttributes.class || "",
        style: HTMLAttributes.style || "",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertStyledBlock:
        (className: string = "") =>
        ({ commands }) => {
          return commands.insertContent({
            type: "styledBlock",
            attrs: { className },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },
});
