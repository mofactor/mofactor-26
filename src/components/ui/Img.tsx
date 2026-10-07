import type { ImgHTMLAttributes } from "react";
import type { IslandImage } from "@/lib/island-image";

interface ImgProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "width" | "height"> {
  image: IslandImage;
  alt: string;
}

/** <img> for pre-optimized images inside islands (replaces next/image there). */
export function Img({ image, alt, loading = "lazy", decoding = "async", ...props }: ImgProps) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={loading}
      decoding={decoding}
      {...props}
    />
  );
}
