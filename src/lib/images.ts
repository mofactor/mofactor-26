// Server-only (use from .astro frontmatter). Islands get plain props via islandImage().
import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";
import type { IslandImage } from "./island-image";

// Every raster under public/, imported so astro:assets can optimize it in place.
// The files stay put, so their public URLs (OG images, lightbox originals) keep working.
// Unused copies the import puts into _astro/ are pruned after the build (see integrations/).
const files = import.meta.glob<{ default: ImageMetadata }>(
  "/public/**/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

/** "/works/flux/two.png" (the public URL) → image metadata for <Image /> / <Picture /> */
export function img(publicPath: string): ImageMetadata {
  const file = files[`/public${publicPath}`];
  if (!file) throw new Error(`[images] Not found under public/: ${publicPath}`);
  return file.default;
}

interface IslandImageOptions {
  width?: number;
  widths?: number[];
  densities?: number[];
  sizes?: string;
}

/** Pre-optimized <img> props for React islands, which can't render astro:assets components. */
export async function islandImage(
  publicPath: string,
  options: IslandImageOptions = {},
): Promise<IslandImage> {
  const image = await getImage({ src: img(publicPath), ...options });
  return {
    src: image.src,
    srcSet: image.srcSet.attribute || undefined,
    sizes: options.sizes,
    width: Number(image.attributes.width),
    height: Number(image.attributes.height),
  };
}
