import { useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { parseArbitraryClasses } from "@/lib/tw-arbitrary";
import { splitClasses } from "./figureClasses";

export function VideoNodeView({ node }: NodeViewProps) {
  const raw = node.attrs.className || "";
  const { classes, style, figure, inner } = useMemo(() => {
    const parsed = parseArbitraryClasses(raw);
    const split = splitClasses(parsed.classes);
    return { ...parsed, ...split };
  }, [raw]);

  return (
    <NodeViewWrapper
      as="figure"
      data-type="video"
      data-class={raw}
      className={figure || undefined}
    >
      <VideoPlayer
        src={node.attrs.src || ""}
        poster={node.attrs.poster || undefined}
        autoplay={node.attrs.autoplay}
        muted={node.attrs.muted}
        loop={node.attrs.loop}
        hideControls={node.attrs.hideControls}
        className={inner}
        style={style}
      />
      {node.attrs.title && node.attrs.showCaption !== false && (
        <figcaption className="mt-2 text-center text-sm text-zinc-500">
          {node.attrs.title}
        </figcaption>
      )}
    </NodeViewWrapper>
  );
}
