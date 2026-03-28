"use client";

import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { animate } from "animejs";
import { cn } from "@/lib/utils";

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scroll speed in pixels per second (default: 40) */
  speed?: number;
  /** Scroll direction (default: "left") */
  direction?: "left" | "right";
  /** Pause scrolling on hover (default: false) */
  pauseOnHover?: boolean;
  /** Fade-out gradient mask on edges (default: false) */
  mask?: boolean | "left" | "right" | "both";
}

const maskStyles: Record<string, string> = {
  both: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
  left: "linear-gradient(to right, transparent, black 10%)",
  right: "linear-gradient(to left, transparent, black 10%)",
};

export default function Marquee({
  children,
  speed = 40,
  direction = "left",
  pauseOnHover = false,
  mask = false,
  className,
  ...props
}: MarqueeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const [repeats, setRepeats] = useState(1);

  useLayoutEffect(() => {
    if (!wrapperRef.current || !copyRef.current) return;
    const containerW = wrapperRef.current.clientWidth;
    const copyW = copyRef.current.scrollWidth;
    if (copyW === 0) return;
    setRepeats(Math.ceil(containerW / copyW) + 1);
  }, [children]);

  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const hw = trackRef.current.scrollWidth / 2;
    if (hw === 0) return;
    const sign = direction === "left" ? -1 : 1;
    const from = sign === -1 ? 0 : -hw;
    const to = sign === -1 ? -hw : 0;
    const duration = (hw / speed) * 1000;

    animRef.current?.pause();

    animRef.current = animate(trackRef.current, {
      translateX: [from, to],
      duration,
      ease: "linear",
      loop: true,
    });

    return () => {
      animRef.current?.pause();
      animRef.current = null;
    };
  }, [repeats, speed, direction]);

  const handleHoverStart = useCallback(() => {
    if (pauseOnHover) animRef.current?.pause();
  }, [pauseOnHover]);

  const handleHoverEnd = useCallback(() => {
    if (pauseOnHover) animRef.current?.play();
  }, [pauseOnHover]);

  const maskSide = mask === true ? "both" : mask || null;

  return (
    <div
      ref={wrapperRef}
      className={cn("[--marquee-gap:1rem] w-full overflow-hidden", className)}
      style={maskSide ? { maskImage: maskStyles[maskSide], WebkitMaskImage: maskStyles[maskSide] } : undefined}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      {...props}
    >
      <div
        ref={trackRef}
        className="flex w-max"
      >
        <div ref={copyRef} className="flex shrink-0 items-center gap-[var(--marquee-gap)] pr-[var(--marquee-gap)]">
          {Array.from({ length: repeats }, (_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-[var(--marquee-gap)]">
              {children}
            </div>
          ))}
        </div>
        <div aria-hidden className="flex shrink-0 items-center gap-[var(--marquee-gap)] pr-[var(--marquee-gap)]">
          {Array.from({ length: repeats }, (_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-[var(--marquee-gap)]">
              {children}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
