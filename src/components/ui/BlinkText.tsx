"use client";

import { useEffect, useRef } from "react";
import { animate, createScope, onScroll } from "animejs";
import { splitText } from "animejs/text";

export interface BlinkTimingConfig {
  fadeTime?: number;
  randomHoldMin?: number;
  randomHoldMax?: number;
  blinkTimeMin?: number;
  blinkTimeMax?: number;
}

interface BlinkTextProps {
  text: string;
  mode?: "words" | "chars";
  /** Delay between each word/char in seconds */
  staggerDelay?: number;
  /** Delay before the entire animation starts in seconds */
  delay?: number;
  timingConfig?: BlinkTimingConfig;
  inView?: boolean;
  className?: string;
  onComplete?: () => void;
}

export default function BlinkText({
  text,
  mode = "words",
  staggerDelay = 0.075,
  delay = 0,
  timingConfig,
  inView = true,
  className,
  onComplete,
}: BlinkTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const {
      fadeTime = 0.075,
      randomHoldMin = 0,
      randomHoldMax = 0.2,
      blinkTimeMin = 0.075,
      blinkTimeMax = 0.3,
    } = timingConfig ?? {};

    scopeRef.current = createScope({ root: containerRef }).add(() => {
      const split = splitText(containerRef.current!, { [mode]: true });
      const elements = mode === "chars" ? split.chars : split.words;

      elements.forEach((el) => {
        el.style.opacity = "0";
      });

      const runAnimation = () => {
        let completed = 0;

        elements.forEach((el, i) => {
          const randomHold =
            randomHoldMin + Math.random() * (randomHoldMax - randomHoldMin);
          const randomBlink =
            blinkTimeMin + Math.random() * (blinkTimeMax - blinkTimeMin);

          const fadeMs = fadeTime * 1000;
          const holdMs = randomHold * 1000;
          const blinkSegment = (randomBlink * 1000) / 4;

          animate(el, {
            opacity: [
              { to: 1, duration: fadeMs },
              { to: 0.5, duration: holdMs },
              { to: 0.2, duration: blinkSegment },
              { to: 1, duration: blinkSegment },
              { to: 0.2, duration: blinkSegment },
              { to: 1, duration: blinkSegment },
            ],
            delay: delay * 1000 + i * staggerDelay * 1000,
            ease: "inQuad",
            onComplete: () => {
              completed++;
              if (completed === elements.length) onComplete?.();
            },
          });
        });
      };

      if (inView) {
        onScroll({
          target: containerRef.current!,
          enter: "bottom right",
          repeat: false,
          onEnter: runAnimation,
        });
      } else {
        runAnimation();
      }
    });

    return () => {
      scopeRef.current?.revert();
    };
  }, [text, mode, staggerDelay, delay, timingConfig, inView, onComplete]);

  return (
    <span ref={containerRef} className={className}>
      {text}
    </span>
  );
}
