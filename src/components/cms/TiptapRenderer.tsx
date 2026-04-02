import { type ReactNode, Fragment } from "react";
import { ColumnsRenderer } from "./renderers/ColumnsRenderer";
import { StyledBlockRenderer } from "./renderers/StyledBlockRenderer";
import { CodeBlockRenderer } from "./renderers/CodeBlockRenderer";
import { ImageRenderer } from "./renderers/ImageRenderer";
import { VideoRenderer } from "./renderers/VideoRenderer";
import {
  parseArbitraryClasses,
  generateVariantArbitraryCSS,
  collectClassesFromJSON,
} from "@/lib/tw-arbitrary";
import { MfLogo } from "@/components/ui/MfLogo";

interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

interface TiptapRendererProps {
  content: string; // JSON string
}

export function TiptapRenderer({ content }: TiptapRendererProps) {
  let doc: TiptapNode;
  try {
    doc = JSON.parse(content);
  } catch {
    return <p className="text-zinc-500">Unable to render content.</p>;
  }

  if (!doc.content) return null;

  // Generate runtime CSS for variant+arbitrary classes (e.g. dark:border-[12px])
  const variantCSS = generateVariantArbitraryCSS(collectClassesFromJSON(doc));

  return (
    <div className="blog-prose">
      {variantCSS && <style dangerouslySetInnerHTML={{ __html: variantCSS }} />}
      {doc.content.map((node, i) => renderNode(node, i))}
    </div>
  );
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  switch (node.type) {
    case "paragraph": {
      // Skip empty paragraphs (no content or only whitespace)
      const hasContent = node.content?.some(
        (c) => c.type !== "text" || c.text?.trim()
      );
      if (!hasContent) return null;
      const pStyle = getBlockStyle(node.attrs);
      const pCls = getBlockClasses(node.attrs);
      return (
        <p key={key} className={pCls || undefined} style={pStyle}>
          {renderInline(node.content)}
        </p>
      );
    }

    case "heading": {
      const level = node.attrs?.level || 1;
      const hStyle = getBlockStyle(node.attrs);
      const hCls = getBlockClasses(node.attrs);
      const children = renderInline(node.content);
      if (level === 1) return <h1 key={key} className={hCls || undefined} style={hStyle}>{children}</h1>;
      if (level === 2) return <h2 key={key} className={hCls || undefined} style={hStyle}>{children}</h2>;
      if (level === 3) return <h3 key={key} className={hCls || undefined} style={hStyle}>{children}</h3>;
      if (level === 4) return <h4 key={key} className={hCls || undefined} style={hStyle}>{children}</h4>;
      return <h5 key={key} className={hCls || undefined} style={hStyle}>{children}</h5>;
    }

    case "bulletList": {
      const ulCls = getBlockClasses(node.attrs);
      const ulStyle = getBlockStyleNoAlign(node.attrs);
      return (
        <ul key={key} className={ulCls || undefined} style={ulStyle}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );
    }

    case "orderedList": {
      const olCls = getBlockClasses(node.attrs);
      const olStyle = getBlockStyleNoAlign(node.attrs);
      return (
        <ol key={key} className={olCls || undefined} style={olStyle}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );
    }

    case "listItem": {
      const liCls = getBlockClasses(node.attrs);
      const liStyle = getBlockStyleNoAlign(node.attrs);
      return (
        <li key={key} className={liCls || undefined} style={liStyle}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );
    }

    case "blockquote": {
      const bqCls = getBlockClasses(node.attrs);
      const bqStyle = getBlockStyleNoAlign(node.attrs);
      return (
        <blockquote key={key} className={bqCls || undefined} style={bqStyle}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      );
    }

    case "codeBlock":
      return (
        <CodeBlockRenderer
          key={key}
          language={node.attrs?.language}
          content={node.content}
        />
      );

    case "image":
      return <ImageRenderer key={key} attrs={node.attrs} />;

    case "video":
      return <VideoRenderer key={key} attrs={node.attrs} />;

    case "horizontalRule":
      return <hr key={key} />;

    case "logoDivider": {
      const ldParsed = parseArbitraryClasses(node.attrs?.className || "");
      const ldParts = ldParsed.classes.split(/\s+/).filter(Boolean);
      const ldFigure = ldParts.filter((c: string) => c === "wide" || c === "full").join(" ");
      const ldInner = ldParts.filter((c: string) => c !== "wide" && c !== "full").join(" ");
      return (
        <div key={key} className={ldFigure || undefined}>
          <div className={`flex items-center gap-4 my-8${ldInner ? ` ${ldInner}` : ""}`} style={ldParsed.style}>
            <hr className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
            <MfLogo className="h-5 w-auto text-zinc-200 dark:text-zinc-800" />
            <hr className="flex-1 border-t border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      );
    }

    case "columns":
      return <ColumnsRenderer key={key} node={node} />;

    case "column": {
      const col = parseArbitraryClasses(node.attrs?.className || "");
      return (
        <div key={key} data-type="column" className={col.classes} style={col.style}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </div>
      );
    }

    case "styledBlock":
      return <StyledBlockRenderer key={key} node={node} />;

    default:
      return null;
  }
}

function renderInline(content?: TiptapNode[]): ReactNode {
  if (!content) return null;

  return content.map((node, i) => {
    if (node.type === "text") {
      let element: ReactNode = node.text;

      if (node.marks) {
        for (const mark of node.marks) {
          element = applyMark(element, mark, i);
        }
      }

      return <Fragment key={i}>{element}</Fragment>;
    }

    if (node.type === "hardBreak") {
      return <br key={i} />;
    }

    return null;
  });
}

function applyMark(
  element: ReactNode,
  mark: TiptapMark,
  key: number
): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong>{element}</strong>;
    case "italic":
      return <em>{element}</em>;
    case "underline":
      return <u>{element}</u>;
    case "strike":
      return <s>{element}</s>;
    case "code":
      return <code>{element}</code>;
    case "link":
      return (
        <a
          href={mark.attrs?.href}
          target={mark.attrs?.target || "_blank"}
          rel="noopener noreferrer"
        >
          {element}
        </a>
      );
    default:
      return element;
  }
}

function getAlignStyle(
  attrs?: Record<string, any>
): React.CSSProperties | undefined {
  if (attrs?.textAlign && attrs.textAlign !== "left") {
    return { textAlign: attrs.textAlign };
  }
  return undefined;
}

/** Get combined className (regular classes) for a block node */
function getBlockClasses(attrs?: Record<string, any>): string {
  if (!attrs?.className) return "";
  const { classes } = parseArbitraryClasses(attrs.className);
  return classes;
}

/** Get combined inline style (arbitrary values + textAlign) for a block node */
function getBlockStyle(
  attrs?: Record<string, any>
): React.CSSProperties | undefined {
  const align = getAlignStyle(attrs);
  if (!attrs?.className) return align;
  const { style } = parseArbitraryClasses(attrs.className);
  const merged = { ...style, ...align };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/** Get inline style without textAlign (for list/blockquote elements) */
function getBlockStyleNoAlign(
  attrs?: Record<string, any>
): React.CSSProperties | undefined {
  if (!attrs?.className) return undefined;
  const { style } = parseArbitraryClasses(attrs.className);
  return Object.keys(style).length > 0 ? style : undefined;
}

// Re-export renderNode for use by child renderers
export { renderNode };
export type { TiptapNode };
