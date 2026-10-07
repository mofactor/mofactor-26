import { useEffect, useRef } from "react";
import { Asterisk } from "lucide-react";
import { thinking, type ThinkingOptions } from "@/lib/fx/thinking";

interface ThinkingTextProps extends ThinkingOptions {
  className?: string;
}

/** React wrapper for use inside islands. Astro pages use ThinkingText.astro. */
export default function ThinkingText({
  words,
  typingSpeed,
  pauseDuration,
  className,
}: ThinkingTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const wordsKey = JSON.stringify(words ?? null);

  useEffect(() => {
    if (!rootRef.current) return;
    return thinking(rootRef.current, { words, typingSpeed, pauseDuration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey, typingSpeed, pauseDuration]);

  return (
    <span
      ref={rootRef}
      className={`inline-flex items-center uppercase gap-1.5 ${className ?? ""}`}
      data-fx="thinking"
    >
      <Asterisk size={24} strokeWidth={2.5} data-fx-icon="" />
      <span data-fx-text="" />
      <span
        data-fx-cursor=""
        className="inline-block w-[12px] h-[1.1em] bg-current align-text-bottom mx-px"
      />
      ...
    </span>
  );
}
