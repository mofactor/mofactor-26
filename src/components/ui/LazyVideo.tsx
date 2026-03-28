"use client";

import { useEffect, useRef, useState } from "react";

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  posterSrc?: string;
}

export default function LazyVideo({ src, posterSrc, ...props }: LazyVideoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={props.className}>
      {visible ? (
        <video {...props}>
          <source src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        </video>
      ) : posterSrc ? (
        <img src={posterSrc} alt="" loading="lazy" className={props.className} />
      ) : null}
    </div>
  );
}
