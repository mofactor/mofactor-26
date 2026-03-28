import { renderNode, type TiptapNode } from "../TiptapRenderer";
import { parseArbitraryClasses } from "@/lib/tw-arbitrary";

interface StyledBlockRendererProps {
  node: TiptapNode;
}

export function StyledBlockRenderer({ node }: StyledBlockRendererProps) {
  const { classes, style } = parseArbitraryClasses(node.attrs?.className || "");

  return (
    <div data-type="styled-block" className={classes} style={style}>
      {node.content?.map((child, i) => renderNode(child, i))}
    </div>
  );
}
