import { parseArbitraryClasses } from "@/lib/tw-arbitrary";
import { splitFigureClasses } from "../render-helpers";
import { Lightbox } from "@/components/ui/Lightbox";

interface ImageRendererProps {
  attrs?: Record<string, any>;
}

export function ImageRenderer({ attrs }: ImageRendererProps) {
  if (!attrs?.src) return null;

  const { classes, style } = parseArbitraryClasses(attrs.className || "");
  const { figure: figCls, inner: imgCls } = splitFigureClasses(classes);

  const imgClasses = ["max-w-full", imgCls || "rounded-lg"].filter(Boolean).join(" ");
  const hasDarkSrc = !!attrs.darkSrc;

  const lightImg = (
    <img
      src={attrs.src}
      alt={attrs.alt || ""}
      className={hasDarkSrc ? `${imgClasses} dark:hidden` : imgClasses}
      style={style}
    />
  );

  const darkImg = hasDarkSrc ? (
    <img
      src={attrs.darkSrc}
      alt={attrs.alt || ""}
      className={`${imgClasses} hidden dark:block`}
      style={style}
    />
  ) : null;

  const images = (
    <>
      {lightImg}
      {darkImg}
    </>
  );

  return (
    <figure data-class={attrs.className || ""} className={figCls || undefined}>
      {attrs.href ? (
        <a
          href={attrs.href}
          target={attrs.target || undefined}
          rel={attrs.target === "_blank" ? "noopener noreferrer" : undefined}
        >
          {images}
        </a>
      ) : attrs.lightbox ? (
        hasDarkSrc ? (
          <>
            <Lightbox images={[{ src: attrs.src, alt: attrs.alt || "" }]}>
              {lightImg}
            </Lightbox>
            <Lightbox images={[{ src: attrs.darkSrc, alt: attrs.alt || "" }]}>
              {darkImg}
            </Lightbox>
          </>
        ) : (
          <Lightbox images={[{ src: attrs.src, alt: attrs.alt || "" }]}>
            {lightImg}
          </Lightbox>
        )
      ) : (
        images
      )}
      {attrs.title && attrs.showCaption !== false && (
        <figcaption className="mt-2 text-center text-sm text-zinc-500">
          {attrs.title}
        </figcaption>
      )}
    </figure>
  );
}
