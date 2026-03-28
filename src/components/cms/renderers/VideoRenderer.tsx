import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { parseArbitraryClasses } from "@/lib/tw-arbitrary";

const FIGURE_CLASSES = new Set(["wide", "full"]);

function splitClasses(cls: string) {
  const parts = cls.split(/\s+/).filter(Boolean);
  const figure: string[] = [];
  const inner: string[] = [];
  for (const c of parts) {
    (FIGURE_CLASSES.has(c) ? figure : inner).push(c);
  }
  return { figure: figure.join(" "), inner: inner.join(" ") };
}

interface VideoRendererProps {
  attrs?: Record<string, any>;
}

export function VideoRenderer({ attrs }: VideoRendererProps) {
  if (!attrs?.src) return null;

  const { classes, style } = parseArbitraryClasses(attrs.className || "");
  const { figure: figCls, inner: innerCls } = splitClasses(classes);

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
