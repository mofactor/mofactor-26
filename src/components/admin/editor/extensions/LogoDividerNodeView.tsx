import { useMemo } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { MfLogo } from "@/components/ui/MfLogo";
import { parseArbitraryClasses } from "@/lib/tw-arbitrary";
import { splitClasses } from "./figureClasses";

export function LogoDividerNodeView({ node }: NodeViewProps) {
  const raw = node.attrs.className || "";
  const { style, figure, inner } = useMemo(() => {
    const parsed = parseArbitraryClasses(raw);
    const split = splitClasses(parsed.classes);
    return { ...parsed, ...split };
  }, [raw]);

  return (
    <NodeViewWrapper
      data-type="logo-divider"
      data-class={raw}
      className={figure || undefined}
    >
      <div className={`flex items-center gap-4 my-8${inner ? ` ${inner}` : ""}`} style={style}>
        <hr className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
        <MfLogo className="h-5 w-auto text-zinc-200 dark:text-zinc-800" />
        <hr className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
      </div>
    </NodeViewWrapper>
  );
}
