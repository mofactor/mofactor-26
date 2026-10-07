import { useEffect, useRef } from "react";
import { blink, type BlinkOptions } from "@/lib/fx/blink";

export type { BlinkTimingConfig } from "@/lib/fx/blink";

interface BlinkTextProps extends BlinkOptions {
  text: string;
  className?: string;
}

/** React wrapper for use inside islands. Astro pages use BlinkText.astro. */
export default function BlinkText({
  text,
  mode,
  staggerDelay,
  delay,
  timingConfig,
  inView,
  className,
  onComplete,
}: BlinkTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    return blink(containerRef.current, {
      mode,
      staggerDelay,
      delay,
      timingConfig,
      inView,
      onComplete,
    });
  }, [text, mode, staggerDelay, delay, timingConfig, inView, onComplete]);

  return (
    <span ref={containerRef} className={className} data-fx="blink">
      {text}
    </span>
  );
}
