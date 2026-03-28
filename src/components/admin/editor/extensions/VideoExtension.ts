import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VideoNodeView } from "./VideoNodeView";
import { parseArbitraryClasses, styleObjectToString } from "@/lib/tw-arbitrary";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (attrs: {
        src: string;
        alt?: string;
        poster?: string;
        autoplay?: boolean;
        muted?: boolean;
        loop?: boolean;
        hideControls?: boolean;
      }) => ReturnType;
    };
  }
}

import { splitClasses } from "./figureClasses";

export const VideoBlock = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      poster: { default: null },
      autoplay: { default: false },
      muted: { default: false },
      loop: { default: false },
      hideControls: { default: false },
      showCaption: {
        default: true,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-show-caption") !== "false",
        renderHTML: (attrs: Record<string, boolean>) =>
          attrs.showCaption === false ? { "data-show-caption": "false" } : {},
      },
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
    return [
      {
        tag: 'figure[data-type="video"]',
        getAttrs: (el) => {
          const fig = el as HTMLElement;
          const video = fig.querySelector("video");
          if (!video) return false;
          const figcaption = fig.querySelector("figcaption");
          return {
            src: video.getAttribute("src"),
            poster: video.getAttribute("poster"),
            title: figcaption?.textContent || null,
            autoplay: fig.getAttribute("data-autoplay") === "true",
            muted: fig.getAttribute("data-muted") === "true",
            loop: fig.getAttribute("data-loop") === "true",
            hideControls: fig.getAttribute("data-hide-controls") === "true",
            showCaption: fig.getAttribute("data-show-caption") !== "false",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      src,
      title,
      poster,
      autoplay,
      muted,
      loop,
      hideControls,
      showCaption,
      "data-class": dataClass,
      "data-show-caption": _dsc,
      class: cls,
      style,
      ...figureAttrs
    } = HTMLAttributes;

    const { figure: figCls } = splitClasses(cls || "");

    const children: any[] = [
      [
        "video",
        {
          src,
          ...(poster ? { poster } : {}),
          controls: "true",
          preload: "metadata",
          playsinline: "true",
          class: "aspect-video w-full rounded-xl",
          ...(style ? { style } : {}),
        },
      ],
    ];

    if (title && showCaption !== false) {
      children.push(["figcaption", { class: "mt-2 text-center text-sm text-zinc-500" }, title]);
    }

    return [
      "figure",
      mergeAttributes(figureAttrs, {
        "data-type": "video",
        "data-class": dataClass || "",
        ...(figCls ? { class: figCls } : {}),
        ...(autoplay ? { "data-autoplay": "true" } : {}),
        ...(muted ? { "data-muted": "true" } : {}),
        ...(loop ? { "data-loop": "true" } : {}),
        ...(hideControls ? { "data-hide-controls": "true" } : {}),
        ...(showCaption === false ? { "data-show-caption": "false" } : {}),
      }),
      ...children,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },

  addCommands() {
    return {
      setVideo:
        (attrs: {
          src: string;
          alt?: string;
          poster?: string;
          autoplay?: boolean;
          muted?: boolean;
          loop?: boolean;
          hideControls?: boolean;
        }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
