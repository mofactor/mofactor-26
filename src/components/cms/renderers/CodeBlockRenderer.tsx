import type { TiptapNode } from "../TiptapRenderer";

interface CodeBlockRendererProps {
  language?: string;
  content?: TiptapNode[];
}

export function CodeBlockRenderer({
  language,
  content,
}: CodeBlockRendererProps) {
  const code = content?.map((n) => n.text || "").join("") || "";

  return (
    <pre data-language={language || undefined}>
      <code>{code}</code>
    </pre>
  );
}
