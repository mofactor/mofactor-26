import { animate, createScope, onScroll } from "animejs";
import { splitText } from "animejs/text";

export interface BlinkTimingConfig {
  fadeTime?: number;
  randomHoldMin?: number;
  randomHoldMax?: number;
  blinkTimeMin?: number;
  blinkTimeMax?: number;
}

export interface BlinkOptions {
  mode?: "words" | "chars";
  /** Delay between each word/char in seconds */
  staggerDelay?: number;
  /** Delay before the entire animation starts in seconds */
  delay?: number;
  timingConfig?: BlinkTimingConfig;
  inView?: boolean;
  onComplete?: () => void;
}

/**
 * Splits `el` into words/chars and blinks them in, by default when scrolled into view.
 * Framework-free so both the React and the Astro wrappers share it. Returns a cleanup.
 */
export function blink(el: HTMLElement, options: BlinkOptions = {}): () => void {
  const {
    mode = "words",
    staggerDelay = 0.075,
    delay = 0,
    timingConfig,
    inView = true,
    onComplete,
  } = options;
  const {
    fadeTime = 0.075,
    randomHoldMin = 0,
    randomHoldMax = 0.2,
    blinkTimeMin = 0.075,
    blinkTimeMax = 0.3,
  } = timingConfig ?? {};

  const scope = createScope({ root: el }).add(() => {
    const split = splitText(el, { [mode]: true });
    const elements = mode === "chars" ? split.chars : split.words;

    elements.forEach((part) => {
      part.style.opacity = "0";
    });
    // Words are hidden individually now, so the container can drop its CSS pre-hide
    el.setAttribute("data-fx-ready", "");

    const runAnimation = () => {
      let completed = 0;

      elements.forEach((part, i) => {
        const randomHold =
          randomHoldMin + Math.random() * (randomHoldMax - randomHoldMin);
        const randomBlink =
          blinkTimeMin + Math.random() * (blinkTimeMax - blinkTimeMin);

        const fadeMs = fadeTime * 1000;
        const holdMs = randomHold * 1000;
        const blinkSegment = (randomBlink * 1000) / 4;

        animate(part, {
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
        target: el,
        enter: "bottom right",
        repeat: false,
        onEnter: runAnimation,
      });
    } else {
      runAnimation();
    }
  });

  return () => scope.revert();
}
