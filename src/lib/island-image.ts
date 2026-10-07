/** Optimized image props computed on the server (lib/images.ts) and passed into islands. */
export interface IslandImage {
  src: string;
  srcSet?: string;
  sizes?: string;
  width: number;
  height: number;
}
