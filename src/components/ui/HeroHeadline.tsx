import ThinkingText from "@/components/ui/ThinkingText";
import BlinkText from "./BlinkText";

interface HeroHeadlineProps {
  line1: string;
  line1ClassName?: string;
  line2?: string;
  line2ClassName?: string;
  thinkingWords?: string[];
  blink?: boolean;
}

export default function HeroHeadline({ line1, line1ClassName, line2, line2ClassName, thinkingWords, blink = false }: HeroHeadlineProps) {
  return (
    <div>
      {thinkingWords && (
        <div className="mb-2">
          <ThinkingText
            className="text-sm text-zinc-400 dark:text-zinc-500 font-mono"
            words={thinkingWords}
          />
        </div>
      )}
      <h1 className="text-[32px] md:text-[48px] font-normal leading-[1.25]">
        {blink ? (
          <BlinkText
            className={line1ClassName ?? "text-zinc-400 dark:text-zinc-500"}
            text={line1}
            mode="words"
            timingConfig={{
              fadeTime: 0.35,
              randomHoldMax: 0.5,
              blinkTimeMax: 1,
            }}
          />
        ) : (
          <span className={line1ClassName ?? "text-zinc-400 dark:text-zinc-500"}>{line1}</span>
        )}
        {line2 && (
          <>
            <br />
            {blink ? (
              <BlinkText
                className={line2ClassName ?? "text-foreground"}
                text={line2}
                mode="words"
                timingConfig={{
                  fadeTime: 0.5,
                  randomHoldMax: 0.75,
                  blinkTimeMax: 1.5,
                }}
              />
            ) : (
              <span className={line2ClassName ?? "text-foreground"}>{line2}</span>
            )}
          </>
        )}
      </h1>
    </div>
  );
}
