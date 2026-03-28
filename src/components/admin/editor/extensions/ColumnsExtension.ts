import { Node, mergeAttributes } from "@tiptap/core";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      insertColumns: (count?: number) => ReturnType;
      setColumnCount: (pos: number, count: number) => ReturnType;
    };
  }
}

export const Column = Node.create({
  name: "column",
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
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "column",
        class: HTMLAttributes.class || "",
        style: HTMLAttributes.style || "",
      }),
      0,
    ];
  },
});

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column{1,6}",
  isolating: true,

  addAttributes() {
    return {
      count: {
        default: 2,
        parseHTML: (el) => parseInt(el.getAttribute("data-count") || "2"),
        renderHTML: (attrs) => ({ "data-count": attrs.count }),
      },
      gap: {
        default: "gap-6",
        parseHTML: (el) => el.getAttribute("data-gap") || "gap-6",
        renderHTML: (attrs) => ({ "data-gap": attrs.gap }),
      },
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
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "columns",
        class: HTMLAttributes.class || "",
        style: HTMLAttributes.style || "",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertColumns:
        (count: number = 2) =>
        ({ commands }) => {
          const columnContent = Array.from({ length: count }, () => ({
            type: "column",
            attrs: { className: "" },
            content: [{ type: "paragraph" }],
          }));

          return commands.insertContent({
            type: "columns",
            attrs: { count, gap: "gap-6", className: "" },
            content: columnContent,
          });
        },
      setColumnCount:
        (pos: number, count: number) =>
        ({ tr, state }) => {
          const node = state.doc.nodeAt(pos);
          if (!node || node.type.name !== "columns") return false;
          const current = node.childCount;

          // Update the count attribute
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, count });

          if (count > current) {
            // Add columns at the end
            const insertPos = pos + node.nodeSize - 1; // before closing tag
            for (let i = current; i < count; i++) {
              const col = state.schema.nodes.column.createAndFill({ className: "" })!;
              tr.insert(insertPos, col);
            }
          } else if (count < current) {
            // Remove columns from the end
            let removeFrom = pos + 1; // after opening
            // Walk to the (count)th column to find where to start deleting
            for (let i = 0; i < count; i++) {
              const child = tr.doc.nodeAt(removeFrom);
              if (child) removeFrom += child.nodeSize;
            }
            const removeTo = pos + node.nodeSize - 1;
            if (removeFrom < removeTo) {
              tr.delete(removeFrom, removeTo);
            }
          }
          return true;
        },
    };
  },
});
