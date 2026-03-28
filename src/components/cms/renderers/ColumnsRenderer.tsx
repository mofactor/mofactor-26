import { renderNode, type TiptapNode } from "../TiptapRenderer";
import { parseArbitraryClasses } from "@/lib/tw-arbitrary";

interface ColumnsRendererProps {
  node: TiptapNode;
}

const COLS_MAP: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function ColumnsRenderer({ node }: ColumnsRendererProps) {
  const count = node.attrs?.count || 2;
  const gap = node.attrs?.gap || "gap-6";
  const cols = COLS_MAP[count] || "grid-cols-2";
  const { classes, style } = parseArbitraryClasses(node.attrs?.className || "");

  return (
    <div data-type="columns" className={`grid ${cols} ${gap} ${classes}`.trim()} style={style}>
      {node.content?.map((child, i) => renderNode(child, i))}
    </div>
  );
}
