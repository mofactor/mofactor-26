"use client";

import { type ElementType } from "react";
import BlinkText, { type BlinkTimingConfig } from "@/components/ui/BlinkText";
import ThinkingText from "@/components/ui/ThinkingText";

interface BlinkProps {
  mode?: "words" | "chars";
  staggerDelay?: number;
  delay?: number;
  timingConfig?: BlinkTimingConfig;
  inView?: boolean;
}

interface DualLineHeadingProps {
  as?: ElementType;
  topLine?: string;
  bottomLine?: string;
  blink?: boolean | BlinkProps;
  thinkingWords?: string[];
  thinkingPosition?: "before" | "after";
  className?: string;
}

export default function DualLineHeading({
  as: Tag = "h2",
  topLine,
  bottomLine,
  blink = false,
  thinkingWords,
  thinkingPosition = "before",
  className = "",
}: DualLineHeadingProps) {
  const blinkProps: BlinkProps | undefined = blink
    ? typeof blink === "object" ? blink : {}
    : undefined;

  const thinking = thinkingWords && (
    <div className={thinkingPosition === "before" ? "mb-2" : "mt-2"}>
      <ThinkingText
        className="text-sm text-zinc-400 dark:text-zinc-500 font-mono"
        words={thinkingWords}
      />
    </div>
  );

  return (
    <Tag
      className={`text-[30px] md:text-[36px] font-normal leading-[1.3] ${className}`}
    >
      {thinkingPosition === "before" && thinking}
      {topLine && (
        <span className="text-zinc-400 dark:text-zinc-500">
          {blinkProps ? <BlinkText text={topLine} mode="words" timingConfig={{ fadeTime: 0.35, randomHoldMax: 0.5, blinkTimeMax: 1 }} {...blinkProps} /> : topLine}
        </span>
      )}
      {topLine && bottomLine && <br />}
      {bottomLine && (
        <span className="text-foreground">
          {blinkProps ? <BlinkText text={bottomLine} mode="words" timingConfig={{ fadeTime: 0.5, randomHoldMax: 0.75, blinkTimeMax: 1.5 }} {...blinkProps} /> : bottomLine}
        </span>
      )}
      {thinkingPosition === "after" && thinking}
    </Tag>
  );
}
