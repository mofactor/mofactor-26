"use client";

import { useEffect, useRef, useState } from "react";
import { animate, steps } from "animejs";
import { Asterisk } from "lucide-react";

const DEFAULT_WORDS = ["Thinking", "Considering", "Perusing", "Pondering"];
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface ThinkingTextProps {
  words?: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export default function ThinkingText({
  words = DEFAULT_WORDS,
  typingSpeed = 70,
  pauseDuration = 1200,
  className,
}: ThinkingTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const spinRef = useRef<ReturnType<typeof animate> | null>(null);
  const blinkRef = useRef<ReturnType<typeof animate> | null>(null);
  const iconRef = useRef<SVGSVGElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const cancelledRef = useRef(false);

  const word = words[wordIndex];

  // Spinning asterisk + blinking cursor (once on mount)
  useEffect(() => {
    if (iconRef.current) {
      spinRef.current = animate(iconRef.current, {
        rotate: 360,
        duration: 2000,
        ease: "linear",
        loop: true,
      });
    }
    if (cursorRef.current) {
      blinkRef.current = animate(cursorRef.current, {
        opacity: [1, 0],
        duration: 500,
        ease: steps(2),
        loop: true,
        alternate: true,
      });
    }
    return () => {
      spinRef.current?.cancel();
      blinkRef.current?.cancel();
    };
  }, []);

  // Scramble-reveal each word, then hold, then next
  useEffect(() => {
    cancelledRef.current = false;
    let timeout: ReturnType<typeof setTimeout>;

    const obj = { progress: 0 };

    const anim = animate(obj, {
      progress: word.length,
      duration: word.length * typingSpeed,
      ease: "linear",
      onUpdate: () => {
        if (cancelledRef.current) return;
        const p = obj.progress;
        const settled = Math.floor(p);
        // Settled characters + one scrambling character at the cursor
        let text = word.slice(0, settled);
        if (settled < word.length) {
          text += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        setDisplayText(text);
      },
      onComplete: () => {
        if (cancelledRef.current) return;
        setDisplayText(word);
        timeout = setTimeout(() => {
          if (cancelledRef.current) return;
          setWordIndex((i) => (i + 1) % words.length);
        }, pauseDuration);
      },
    });

    return () => {
      cancelledRef.current = true;
      anim?.cancel();
      clearTimeout(timeout);
    };
  }, [word, wordIndex, words, typingSpeed, pauseDuration]);

  return (
    <span className={`inline-flex items-center uppercase gap-1.5 ${className ?? ""}`}>
      <Asterisk ref={iconRef} size={24} strokeWidth={2.5} />
      {displayText}
      <span
        ref={cursorRef}
        className="inline-block w-[12px] h-[1.1em] bg-current align-text-bottom mx-px"
      />
      ...
    </span>
  );
}
