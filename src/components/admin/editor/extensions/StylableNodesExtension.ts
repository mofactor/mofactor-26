import { Extension } from "@tiptap/core";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";

/**
 * Adds a `className` attribute to all standard block-level nodes via
 * addGlobalAttributes — one definition covers every type, zero repetition.
 *
 * Custom nodes (styledBlock, columns, column, image, video, logoDivider)
 * already define their own className attribute and are excluded here.
 */
export const StylableNodes = Extension.create({
  name: "stylableNodes",

  addGlobalAttributes() {
    return [
      {
        types: [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "listItem",
          "blockquote",
          "codeBlock",
          "horizontalRule",
        ],
        attributes: {
          className: {
            default: "",
            parseHTML: (element: HTMLElement) =>
              element.getAttribute("data-class") || "",
            renderHTML: (attributes: Record<string, string>) => {
              if (!attributes.className) return {};
              const { classes, style } = parseArbitraryClasses(
                attributes.className,
              );
              const styleStr = styleObjectToString(style);
              return {
                "data-class": attributes.className,
                ...(classes ? { class: classes } : {}),
                ...(styleStr ? { style: styleStr } : {}),
              };
            },
          },
        },
      },
    ];
  },
});
