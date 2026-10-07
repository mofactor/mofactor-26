import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { parseArbitraryClasses } from "@/lib/tw-arbitrary";
import { splitFigureClasses } from "../render-helpers";

interface VideoRendererProps {
  attrs?: Record<string, any>;
}

export function VideoRenderer({ attrs }: VideoRendererProps) {
  if (!attrs?.src) return null;

  const { classes, style } = parseArbitraryClasses(attrs.className || "");
  const { figure: figCls, inner: innerCls } = splitFigureClasses(classes);

  return (
    <figure data-class={attrs.className || ""} className={figCls || undefined}>
      <VideoPlayer
        src={attrs.src}
        poster={attrs.poster || undefined}
        autoplay={attrs.autoplay}
        muted={attrs.muted}
        loop={attrs.loop}
        hideControls={attrs.hideControls}
        className={innerCls}
        style={style}
      />
      {attrs.title && attrs.showCaption !== false && (
        <figcaption className="mt-2 text-center text-sm text-zinc-500">
          {attrs.title}
        </figcaption>
      )}
    </figure>
  );
}
