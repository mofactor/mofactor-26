export interface LazyVideoOptions {
  src: string;
  className?: string;
  style?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

/**
 * Swaps `root`'s content (an optional poster) for a <video> once it comes within
 * 200px of the viewport. Framework-free twin of LazyVideo.tsx. Returns a cleanup.
 */
export function lazyVideo(root: HTMLElement, options: LazyVideoOptions): () => void {
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();

      const video = document.createElement("video");
      if (options.className) video.className = options.className;
      if (options.style) video.setAttribute("style", options.style);
      // Set as properties and attributes: autoplay policies check `muted` before playing
      video.muted = !!options.muted;
      if (options.muted) video.setAttribute("muted", "");
      video.loop = !!options.loop;
      video.playsInline = !!options.playsInline;
      if (options.playsInline) video.setAttribute("playsinline", "");
      video.autoplay = !!options.autoplay;

      const source = document.createElement("source");
      source.src = options.src;
      source.type = options.src.endsWith(".webm") ? "video/webm" : "video/mp4";
      video.append(source);

      root.replaceChildren(video);
    },
    { rootMargin: "200px" },
  );

  io.observe(root);
  return () => io.disconnect();
}
