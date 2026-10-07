import { animate, steps } from "animejs";

const DEFAULT_WORDS = ["Thinking", "Considering", "Perusing", "Pondering"];
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export interface ThinkingOptions {
  words?: string[];
  typingSpeed?: number;
  pauseDuration?: number;
}

/**
 * Spinning asterisk, blinking cursor, and words that scramble in one after another.
 * Expects `[data-fx-icon]`, `[data-fx-text]` and `[data-fx-cursor]` inside `root`.
 * Framework-free so both the React and the Astro wrappers share it. Returns a cleanup.
 */
export function thinking(root: HTMLElement, options: ThinkingOptions = {}): () => void {
  const words = options.words?.length ? options.words : DEFAULT_WORDS;
  const typingSpeed = options.typingSpeed ?? 70;
  const pauseDuration = options.pauseDuration ?? 1200;

  const icon = root.querySelector<SVGSVGElement>("[data-fx-icon]");
  const cursor = root.querySelector<HTMLElement>("[data-fx-cursor]");
  const text = root.querySelector<HTMLElement>("[data-fx-text]");
  if (!text) return () => {};

  let cancelled = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let typing: ReturnType<typeof animate> | undefined;

  const spin = icon
    ? animate(icon, { rotate: 360, duration: 2000, ease: "linear", loop: true })
    : undefined;
  const cursorBlink = cursor
    ? animate(cursor, {
        opacity: [1, 0],
        duration: 500,
        ease: steps(2),
        loop: true,
        alternate: true,
      })
    : undefined;

  const typeWord = (index: number) => {
    const word = words[index];
    const obj = { progress: 0 };

    typing = animate(obj, {
      progress: word.length,
      duration: word.length * typingSpeed,
      ease: "linear",
      onUpdate: () => {
        if (cancelled) return;
        const settled = Math.floor(obj.progress);
        // Settled characters + one scrambling character at the cursor
        let next = word.slice(0, settled);
        if (settled < word.length) {
          next += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        text.textContent = next;
      },
      onComplete: () => {
        if (cancelled) return;
        text.textContent = word;
        timeout = setTimeout(() => {
          if (!cancelled) typeWord((index + 1) % words.length);
        }, pauseDuration);
      },
    });
  };

  typeWord(0);

  return () => {
    cancelled = true;
    typing?.cancel();
    spin?.cancel();
    cursorBlink?.cancel();
    clearTimeout(timeout);
  };
}
