import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";
import { splitClasses } from "./figureClasses";

export const StylableImage = Image.extend({
  // Render as block-level figure so it can receive data-active
  group: "block",
  atom: true,

  addAttributes() {
    return {
      ...this.parent?.(),
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
      href: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const a = el.querySelector("a");
          return a?.getAttribute("href") || el.getAttribute("data-href") || null;
        },
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.href ? { "data-href": attrs.href } : {},
      },
      target: {
        default: null,
        parseHTML: (el: HTMLElement) => {
          const a = el.querySelector("a");
          return a?.getAttribute("target") || el.getAttribute("data-target") || null;
        },
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.target ? { "data-target": attrs.target } : {},
      },
      darkSrc: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-dark-src") || null,
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.darkSrc ? { "data-dark-src": attrs.darkSrc } : {},
      },
      showCaption: {
        default: true,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-show-caption") !== "false",
        renderHTML: (attrs: Record<string, boolean>) =>
          attrs.showCaption === false ? { "data-show-caption": "false" } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
        getAttrs: (el) => {
          const fig = el as HTMLElement;
          const img = fig.querySelector("img");
          if (!img) return false;
          const figcaption = fig.querySelector("figcaption");
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt"),
            title: figcaption?.textContent || img.getAttribute("title") || null,
            darkSrc: fig.getAttribute("data-dark-src") || null,
            showCaption: fig.getAttribute("data-show-caption") !== "false",
          };
        },
      },
      { tag: "img[src]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, showCaption, "data-class": dataClass, "data-href": href, "data-target": target, "data-dark-src": darkSrc, "data-show-caption": _dsc, class: cls, style, ...figureAttrs } = HTMLAttributes;

    const { figure: figCls, inner: imgCls } = splitClasses(cls || "");
    const imgClasses = ["max-w-full", imgCls || "rounded-lg"].filter(Boolean).join(" ");

    const children: any[] = [
      ["img", { src, alt, title, class: imgClasses, ...(style ? { style } : {}) }],
    ];

    if (title && showCaption !== false) {
      children.push(["figcaption", { class: "mt-2 text-center text-sm text-zinc-500" }, title]);
    }

    return [
      "figure",
      mergeAttributes(figureAttrs, {
        "data-type": "image",
        "data-class": dataClass || "",
        ...(href ? { "data-href": href } : {}),
        ...(target ? { "data-target": target } : {}),
        ...(darkSrc ? { "data-dark-src": darkSrc } : {}),
        ...(showCaption === false ? { "data-show-caption": "false" } : {}),
        ...(figCls ? { class: figCls } : {}),
      }),
      ...children,
    ];
  },
});
