import { NextResponse } from "next/server";
import { readFile, writeFile, readdir } from "fs/promises";
import { join, resolve, isAbsolute } from "path";
import { Project, SyntaxKind, type JsxOpeningElement, type JsxSelfClosingElement, type SourceFile } from "ts-morph";
import type { Patch, PatchFile, PatchOperation, SourceLocation } from "@/editor/types";

const PATCH_FILE = join(process.cwd(), "patches.json");

// ── AST-based commit (primary, when sourceLocation is available) ──

/**
 * Resolve the source file path from _debugSource fileName.
 * _debugSource may provide absolute paths or paths relative to project root.
 */
function resolveSourcePath(fileName: string): string {
  if (isAbsolute(fileName)) return fileName;
  return resolve(process.cwd(), fileName);
}

/**
 * Find the JSX element at a given source location.
 * Returns the opening element (for JsxElement) or self-closing element.
 */
function findJsxElementAtLocation(
  sourceFile: SourceFile,
  loc: SourceLocation
): JsxOpeningElement | JsxSelfClosingElement | null {
  // ts-morph lines are 1-based, columns are 0-based
  const pos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
    loc.lineNumber - 1,
    loc.columnNumber
  );

  // Find the narrowest JSX node at this position
  const node = sourceFile.getDescendantAtPos(pos);
  if (!node) return null;

  // Walk up to find the JSX opening element or self-closing element
  let current = node;
  const maxWalk = 10;
  for (let i = 0; i < maxWalk; i++) {
    if (
      current.getKind() === SyntaxKind.JsxOpeningElement ||
      current.getKind() === SyntaxKind.JsxSelfClosingElement
    ) {
      return current as JsxOpeningElement | JsxSelfClosingElement;
    }
    // Also check parent JsxElement → its opening element
    if (current.getKind() === SyntaxKind.JsxElement) {
      const jsxEl = current.asKind(SyntaxKind.JsxElement)!;
      return jsxEl.getOpeningElement();
    }
    const parent = current.getParent();
    if (!parent) break;
    current = parent;
  }

  return null;
}

/**
 * Apply text operations via AST.
 * Handles: <p>text</p> (JsxText children) and prop="text" (string literal attributes).
 */
function applyTextOpsAST(
  jsxEl: JsxOpeningElement | JsxSelfClosingElement,
  ops: PatchOperation[],
  originalText: string | undefined
): boolean {
  const textOp = ops.find((op) => op.type === "text");
  if (!textOp?.value || !originalText) return false;

  // For JsxElement (has children), look for JsxText child containing originalText
  if (jsxEl.getKind() === SyntaxKind.JsxOpeningElement) {
    const parent = jsxEl.getParent();
    if (parent?.getKind() === SyntaxKind.JsxElement) {
      const jsxElement = parent.asKind(SyntaxKind.JsxElement)!;
      const children = jsxElement.getJsxChildren();
      for (const child of children) {
        if (child.getKind() === SyntaxKind.JsxText) {
          const text = child.getText();
          if (text.includes(originalText.slice(0, 40))) {
            child.replaceWithText(text.replace(originalText, textOp.value));
            return true;
          }
        }
      }
    }
  }

  // Try string literal props that contain the original text
  const attributes = jsxEl.getAttributes();
  for (const attr of attributes) {
    if (attr.getKind() !== SyntaxKind.JsxAttribute) continue;
    const jsxAttr = attr.asKind(SyntaxKind.JsxAttribute)!;
    const initializer = jsxAttr.getInitializer();
    if (!initializer) continue;

    // Handle prop="text"
    if (initializer.getKind() === SyntaxKind.StringLiteral) {
      const strLit = initializer.asKind(SyntaxKind.StringLiteral)!;
      if (strLit.getLiteralValue().includes(originalText.slice(0, 40))) {
        strLit.setLiteralValue(
          strLit.getLiteralValue().replace(originalText, textOp.value)
        );
        return true;
      }
    }

    // Handle prop={"text"}
    if (initializer.getKind() === SyntaxKind.JsxExpression) {
      const expr = initializer.asKind(SyntaxKind.JsxExpression)!;
      const inner = expr.getExpression();
      if (inner?.getKind() === SyntaxKind.StringLiteral) {
        const strLit = inner.asKind(SyntaxKind.StringLiteral)!;
        if (strLit.getLiteralValue().includes(originalText.slice(0, 40))) {
          strLit.setLiteralValue(
            strLit.getLiteralValue().replace(originalText, textOp.value)
          );
          return true;
        }
      }
    }
  }

  // Deep search: scan ALL StringLiterals in the element's attribute tree.
  // Handles data-derived text like items={[{ value: "UI Design, AI, ..." }]}
  // where originalText ("AI") is a substring inside a nested string literal.
  const deepMatches = jsxEl
    .getDescendantsOfKind(SyntaxKind.StringLiteral)
    .filter((s) => s.getLiteralValue().includes(originalText));

  if (deepMatches.length === 1) {
    const strLit = deepMatches[0];
    strLit.setLiteralValue(
      strLit.getLiteralValue().replace(originalText, textOp.value)
    );
    return true;
  }

  return false;
}

/**
 * Apply class operations via AST.
 * Handles className="..." (string literal) and className={cn(...)} patterns.
 */
function applyClassOpsAST(
  jsxEl: JsxOpeningElement | JsxSelfClosingElement,
  ops: PatchOperation[]
): boolean {
  const classOps = ops.filter(
    (op) => op.type === "addClass" || op.type === "removeClass"
  );
  if (classOps.length === 0) return false;

  const classAttr = jsxEl.getAttribute("className");
  if (!classAttr || classAttr.getKind() !== SyntaxKind.JsxAttribute) {
    // No className attribute — add one for addClass ops
    const addOps = classOps.filter((op) => op.type === "addClass" && op.className);
    if (addOps.length > 0) {
      const newClasses = addOps.map((op) => op.className).join(" ");
      jsxEl.addAttribute({ name: "className", initializer: `"${newClasses}"` });
      return true;
    }
    return false;
  }

  const jsxAttr = classAttr.asKind(SyntaxKind.JsxAttribute)!;
  const initializer = jsxAttr.getInitializer();
  if (!initializer) return false;

  // Handle className="..."
  if (initializer.getKind() === SyntaxKind.StringLiteral) {
    const strLit = initializer.asKind(SyntaxKind.StringLiteral)!;
    let classes = strLit.getLiteralValue().split(/\s+/).filter(Boolean);

    for (const op of classOps) {
      if (op.type === "addClass" && op.className) {
        if (!classes.includes(op.className)) {
          classes.push(op.className);
        }
      }
      if (op.type === "removeClass" && op.className) {
        classes = classes.filter((c) => c !== op.className);
      }
    }

    if (classes.length === 0) {
      // Remove the className attribute entirely
      jsxAttr.remove();
    } else {
      strLit.setLiteralValue(classes.join(" "));
    }
    return true;
  }

  // Handle className={cn("...", "...")} or className={"..."}
  if (initializer.getKind() === SyntaxKind.JsxExpression) {
    const expr = initializer.asKind(SyntaxKind.JsxExpression)!;
    const inner = expr.getExpression();
    if (!inner) return false;

    // className={"..."}
    if (inner.getKind() === SyntaxKind.StringLiteral) {
      const strLit = inner.asKind(SyntaxKind.StringLiteral)!;
      let classes = strLit.getLiteralValue().split(/\s+/).filter(Boolean);

      for (const op of classOps) {
        if (op.type === "addClass" && op.className && !classes.includes(op.className)) {
          classes.push(op.className);
        }
        if (op.type === "removeClass" && op.className) {
          classes = classes.filter((c) => c !== op.className);
        }
      }
      strLit.setLiteralValue(classes.join(" "));
      return true;
    }

    // className={cn("base", condition && "other")}
    // For cn/clsx calls, find all string literals inside and modify them
    if (inner.getKind() === SyntaxKind.CallExpression) {
      const call = inner.asKind(SyntaxKind.CallExpression)!;
      const args = call.getArguments();

      // Find the first string literal arg to modify
      for (const arg of args) {
        if (arg.getKind() === SyntaxKind.StringLiteral) {
          const strLit = arg.asKind(SyntaxKind.StringLiteral)!;
          let classes = strLit.getLiteralValue().split(/\s+/).filter(Boolean);

          for (const op of classOps) {
            if (op.type === "addClass" && op.className && !classes.includes(op.className)) {
              classes.push(op.className);
            }
            if (op.type === "removeClass" && op.className) {
              classes = classes.filter((c) => c !== op.className);
            }
          }
          strLit.setLiteralValue(classes.join(" "));
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Apply style operations via AST.
 * Handles style={{ prop: "value" }} (object literal).
 */
function applyStyleOpsAST(
  jsxEl: JsxOpeningElement | JsxSelfClosingElement,
  ops: PatchOperation[]
): boolean {
  const styleOps = ops.filter(
    (op) => op.type === "setStyle" || op.type === "removeStyle"
  );
  if (styleOps.length === 0) return false;

  const setOps = styleOps.filter(
    (op) => op.type === "setStyle" && op.property && op.styleValue
  );
  const removeOps = styleOps.filter(
    (op) => op.type === "removeStyle" && op.property
  );

  const styleAttr = jsxEl.getAttribute("style");

  if (!styleAttr || styleAttr.getKind() !== SyntaxKind.JsxAttribute) {
    // No style attribute — create one from setStyle ops
    if (setOps.length > 0) {
      const entries = setOps
        .map((op) => {
          const camelKey = op.property!.replace(/-([a-z])/g, (_, c: string) =>
            c.toUpperCase()
          );
          return `${camelKey}: "${op.styleValue}"`;
        })
        .join(", ");
      jsxEl.addAttribute({
        name: "style",
        initializer: `{{ ${entries} }}`,
      });
      return true;
    }
    return false;
  }

  // Has existing style attr — find the object literal and modify it
  const jsxAttr = styleAttr.asKind(SyntaxKind.JsxAttribute)!;
  const initializer = jsxAttr.getInitializer();
  if (!initializer || initializer.getKind() !== SyntaxKind.JsxExpression)
    return false;

  const expr = initializer.asKind(SyntaxKind.JsxExpression)!;
  const inner = expr.getExpression();
  if (!inner || inner.getKind() !== SyntaxKind.ObjectLiteralExpression)
    return false;

  const objLit = inner.asKind(SyntaxKind.ObjectLiteralExpression)!;

  // Remove properties
  for (const op of removeOps) {
    const camelKey = op.property!.replace(/-([a-z])/g, (_, c: string) =>
      c.toUpperCase()
    );
    const prop = objLit.getProperty(camelKey);
    if (prop) prop.remove();
  }

  // Add/update properties
  for (const op of setOps) {
    const camelKey = op.property!.replace(/-([a-z])/g, (_, c: string) =>
      c.toUpperCase()
    );
    const existing = objLit.getProperty(camelKey);
    if (existing) {
      existing.remove();
    }
    objLit.addPropertyAssignment({
      name: camelKey,
      initializer: `"${op.styleValue}"`,
    });
  }

  return true;
}

/**
 * Apply prop operations via AST.
 * Handles setProp operations by finding/modifying JSX attributes directly.
 */
function applyPropOpsAST(
  jsxEl: JsxOpeningElement | JsxSelfClosingElement,
  ops: PatchOperation[]
): { applied: boolean; error?: string } {
  const propOps = ops.filter((op) => op.type === "setProp" && op.propName != null);
  if (propOps.length === 0) return { applied: false };

  let anyApplied = false;

  for (const op of propOps) {
    const propName = op.propName!;
    const newValue = op.propValue;
    if (newValue == null) continue;

    const attr = jsxEl.getAttribute(propName);

    if (!attr) {
      // Attribute not found on this JSX element — skip (don't add unknown props)
      continue;
    }

    if (attr.getKind() !== SyntaxKind.JsxAttribute) continue;
    const jsxAttr = attr.asKind(SyntaxKind.JsxAttribute)!;
    const initializer = jsxAttr.getInitializer();

    // Boolean shorthand: <Comp prop /> means prop={true}, no initializer
    if (!initializer) {
      if (typeof newValue === "boolean" && !newValue) {
        jsxAttr.remove();
        anyApplied = true;
      } else if (typeof newValue === "string") {
        jsxAttr.setInitializer(`"${newValue}"`);
        anyApplied = true;
      } else {
        jsxAttr.setInitializer(`{${String(newValue)}}`);
        anyApplied = true;
      }
      continue;
    }

    // prop="value" (StringLiteral)
    if (initializer.getKind() === SyntaxKind.StringLiteral) {
      const strLit = initializer.asKind(SyntaxKind.StringLiteral)!;
      if (typeof newValue === "string") {
        strLit.setLiteralValue(newValue);
      } else {
        // Changing type: replace with expression
        jsxAttr.setInitializer(`{${String(newValue)}}`);
      }
      anyApplied = true;
      continue;
    }

    // prop={expression} (JsxExpression)
    if (initializer.getKind() === SyntaxKind.JsxExpression) {
      const expr = initializer.asKind(SyntaxKind.JsxExpression)!;
      const inner = expr.getExpression();
      if (!inner) continue;

      const kind = inner.getKind();

      // prop={"value"} (StringLiteral inside expression)
      if (kind === SyntaxKind.StringLiteral) {
        if (typeof newValue === "string") {
          inner.asKind(SyntaxKind.StringLiteral)!.setLiteralValue(newValue);
        } else {
          inner.replaceWithText(String(newValue));
        }
        anyApplied = true;
        continue;
      }

      // prop={123} (NumericLiteral)
      if (kind === SyntaxKind.NumericLiteral) {
        inner.replaceWithText(String(newValue));
        anyApplied = true;
        continue;
      }

      // prop={true} / prop={false}
      if (kind === SyntaxKind.TrueKeyword || kind === SyntaxKind.FalseKeyword) {
        if (typeof newValue === "boolean" && newValue) {
          // Convert to shorthand: remove initializer
          jsxAttr.remove();
          jsxEl.addAttribute({ name: propName });
        } else {
          inner.replaceWithText(String(newValue));
        }
        anyApplied = true;
        continue;
      }

      // prop={someVariable} or prop={condition ? a : b} — can't safely edit
      return {
        applied: false,
        error: `Prop "${propName}" is a dynamic expression — edit source manually`,
      };
    }
  }

  return { applied: anyApplied };
}

/**
 * Try AST-based commit at a single source location.
 * Returns { ok: true } if at least one operation was applied.
 */
function tryCommitAtLocation(
  project: Project,
  patch: Patch,
  loc: SourceLocation
): { ok: boolean; file?: string; line?: number; error?: string } {
  const filePath = resolveSourcePath(loc.fileName);

  let sourceFile;
  try {
    sourceFile = project.addSourceFileAtPath(filePath);
  } catch {
    return { ok: false, error: `Cannot read ${loc.fileName}` };
  }

  const jsxEl = findJsxElementAtLocation(sourceFile, loc);
  if (!jsxEl) {
    return { ok: false, error: `No JSX element at ${loc.fileName}:${loc.lineNumber}` };
  }

  // Try each operation type — track whether any succeeded
  let applied = false;

  const textOps = patch.operations.filter((op) => op.type === "text");
  if (textOps.length > 0) {
    if (applyTextOpsAST(jsxEl, patch.operations, patch.originalText)) {
      applied = true;
    }
  }

  const classOps = patch.operations.filter(
    (op) => op.type === "addClass" || op.type === "removeClass"
  );
  if (classOps.length > 0) {
    if (applyClassOpsAST(jsxEl, patch.operations)) applied = true;
  }

  const styleOps = patch.operations.filter(
    (op) => op.type === "setStyle" || op.type === "removeStyle"
  );
  if (styleOps.length > 0) {
    if (applyStyleOpsAST(jsxEl, patch.operations)) applied = true;
  }

  const propOps = patch.operations.filter((op) => op.type === "setProp");
  if (propOps.length > 0) {
    const propResult = applyPropOpsAST(jsxEl, patch.operations);
    if (propResult.applied) applied = true;
    // Prop errors (e.g. "dynamic expression") are non-fatal — let the stack walk continue
    // to try parent components where the prop might be a literal
  }

  if (!applied) {
    project.removeSourceFile(sourceFile);
    return { ok: false, error: `No operations applied at ${loc.fileName}:${loc.lineNumber}` };
  }

  return {
    ok: true,
    file: filePath.replace(process.cwd() + "/", ""),
    line: loc.lineNumber,
  };
}

/**
 * AST-based commit: iterates through the source location stack
 * (from the rendered element up through parent components) until
 * an operation is successfully applied.
 */
async function commitWithAST(
  patch: Patch,
  sourceLocation: SourceLocation
): Promise<{ ok: boolean; file?: string; line?: number; error?: string }> {
  const project = new Project({ useInMemoryFileSystem: false });

  // For prop operations with a specific source location, try that first
  const hasPropOps = patch.operations.some((op) => op.type === "setProp");
  if (hasPropOps && patch.propSourceLocation) {
    const result = tryCommitAtLocation(project, patch, patch.propSourceLocation);
    if (result.ok) {
      await project.save();
      return result;
    }
  }

  // Build the list of locations to try: prefer the full stack, fall back to single location
  const locations = patch.sourceLocationStack?.length
    ? patch.sourceLocationStack
    : [sourceLocation];

  let lastError = "";
  for (const loc of locations) {
    const result = tryCommitAtLocation(project, patch, loc);
    if (result.ok) {
      // Save all modified files
      await project.save();
      return result;
    }
    lastError = result.error ?? "";
  }

  return {
    ok: false,
    error: lastError || `Could not apply operations at any source location`,
  };
}

// ── Text-search commit (fallback when _debugSource is unavailable) ──
// Searches all source files for the original text/classes as string literals.

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });
  return (entries as string[])
    .filter((e) => e.endsWith(".tsx") || e.endsWith(".jsx"))
    .map((e) => join(dir, e));
}

async function commitWithTextSearch(
  patch: Patch
): Promise<{ ok: boolean; file?: string; line?: number; error?: string }> {
  const textOp = patch.operations.find((op) => op.type === "text");
  const classOps = patch.operations.filter(
    (op) => op.type === "addClass" || op.type === "removeClass"
  );

  if (!textOp && classOps.length === 0) {
    return { ok: false, error: "Text search only supports text and class operations" };
  }

  const srcDir = join(process.cwd(), "src");
  const files = await collectSourceFiles(srcDir);
  const project = new Project({ useInMemoryFileSystem: false });

  // ── Text operations: search for originalText as a string literal ──
  if (textOp?.value && patch.originalText) {
    const searchText = patch.originalText;

    // Two-pass: collect all exact matches first, only commit if exactly 1
    const matches: {
      filePath: string;
      kind: "string" | "jsx";
      node: import("ts-morph").StringLiteral | import("ts-morph").JsxText;
      sourceFile: import("ts-morph").SourceFile;
    }[] = [];

    for (const filePath of files) {
      let content: string;
      try {
        content = await readFile(filePath, "utf-8");
      } catch {
        continue;
      }
      if (!content.includes(searchText)) continue;

      const sourceFile = project.addSourceFileAtPath(filePath);

      // Search string literals (handles prop="text" and prop={"text"})
      const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
      for (const strLit of stringLiterals) {
        if (strLit.getLiteralValue() === searchText) {
          matches.push({ filePath, kind: "string", node: strLit, sourceFile });
        }
      }

      // Search JsxText children (handles <p>text</p>)
      const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
      for (const jsxText of jsxTexts) {
        if (jsxText.getText().trim() === searchText) {
          matches.push({ filePath, kind: "jsx", node: jsxText, sourceFile });
        }
      }

      if (!matches.some((m) => m.sourceFile === sourceFile)) {
        project.removeSourceFile(sourceFile);
      }
    }

    if (matches.length === 1) {
      const match = matches[0];
      if (match.kind === "string") {
        (match.node as import("ts-morph").StringLiteral).setLiteralValue(textOp.value);
      } else {
        const original = match.node.getText();
        match.node.replaceWithText(original.replace(searchText, textOp.value));
      }
      await project.save();
      return {
        ok: true,
        file: match.filePath.replace(process.cwd() + "/", ""),
        line: match.node.getStartLineNumber(),
      };
    }

    if (matches.length > 1) {
      return {
        ok: false,
        error: `Ambiguous: found ${matches.length} exact matches for "${searchText}" across source files. Cannot auto-commit — please edit the source manually.`,
      };
    }
  }

  // ── Class operations: search for originalClasses as a className value ──
  if (classOps.length > 0 && patch.originalClasses) {
    const origClasses = patch.originalClasses.trim();
    // Use first few classes as a search filter
    const classSnippet = origClasses.split(/\s+/).slice(0, 3).join(" ");

    for (const filePath of files) {
      let content: string;
      try {
        content = await readFile(filePath, "utf-8");
      } catch {
        continue;
      }
      if (!content.includes(classSnippet.split(" ")[0])) continue;

      const sourceFile = project.addSourceFileAtPath(filePath);

      // Find className attributes via JSX element API (more reliable than raw node traversal)
      const jsxElements = [
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
        ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ];
      for (const jsxEl of jsxElements) {
        const classAttr = jsxEl.getAttribute("className");
        if (!classAttr || classAttr.getKind() !== SyntaxKind.JsxAttribute) continue;
        const jsxAttr = classAttr.asKind(SyntaxKind.JsxAttribute)!;
        const init = jsxAttr.getInitializer();
        if (!init) continue;

        // className="..."
        if (init.getKind() === SyntaxKind.StringLiteral) {
          const strLit = init.asKind(SyntaxKind.StringLiteral)!;
          if (strLit.getLiteralValue() === origClasses) {
            let classes = origClasses.split(/\s+/).filter(Boolean);
            for (const op of classOps) {
              if (op.type === "addClass" && op.className && !classes.includes(op.className)) {
                classes.push(op.className);
              }
              if (op.type === "removeClass" && op.className) {
                classes = classes.filter((c) => c !== op.className);
              }
            }
            strLit.setLiteralValue(classes.join(" "));
            await project.save();
            return {
              ok: true,
              file: filePath.replace(process.cwd() + "/", ""),
              line: strLit.getStartLineNumber(),
            };
          }
        }
      }

      project.removeSourceFile(sourceFile);
    }
  }

  return { ok: false, error: "Could not find matching text or classes in source files" };
}

// ── Component-name search commit (for prop operations when _debugSource is unavailable) ──
// Uses the componentName from the patch to find the JSX element and modify its props.

async function commitPropWithComponentSearch(
  patch: Patch
): Promise<{ ok: boolean; file?: string; line?: number; error?: string }> {
  const propOps = patch.operations.filter((op) => op.type === "setProp" && op.propName);
  if (propOps.length === 0 || !patch.componentName) {
    return { ok: false, error: "No prop ops or component name" };
  }

  const srcDir = join(process.cwd(), "src");
  const files = await collectSourceFiles(srcDir);
  const project = new Project({ useInMemoryFileSystem: false });

  const componentName = patch.componentName;
  const searchTag = `<${componentName}`;

  // Collect all JSX elements matching the component name that have the target attributes
  const matches: {
    filePath: string;
    jsxEl: JsxOpeningElement | JsxSelfClosingElement;
    sourceFile: SourceFile;
  }[] = [];

  for (const filePath of files) {
    let content: string;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      continue;
    }
    if (!content.includes(searchTag)) continue;

    const sourceFile = project.addSourceFileAtPath(filePath);

    const jsxElements = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ].filter((el) => el.getTagNameNode().getText() === componentName);

    for (const jsxEl of jsxElements) {
      // Check that this element actually has the attributes we want to modify
      const hasTargetAttrs = propOps.every((op) => jsxEl.getAttribute(op.propName!) != null);
      if (hasTargetAttrs) {
        matches.push({ filePath, jsxEl, sourceFile });
      }
    }

    if (!matches.some((m) => m.sourceFile === sourceFile)) {
      project.removeSourceFile(sourceFile);
    }
  }

  if (matches.length === 0) {
    return { ok: false, error: `No <${componentName}> with matching props found in source` };
  }

  if (matches.length > 1) {
    return {
      ok: false,
      error: `Ambiguous: found ${matches.length} <${componentName}> elements with matching props. Edit source manually.`,
    };
  }

  const match = matches[0];
  const propResult = applyPropOpsAST(match.jsxEl, patch.operations);
  if (propResult.applied) {
    await project.save();
    return {
      ok: true,
      file: match.filePath.replace(process.cwd() + "/", ""),
      line: match.jsxEl.getStartLineNumber(),
    };
  }

  return {
    ok: false,
    error: propResult.error ?? `Failed to apply prop changes to <${componentName}>`,
  };
}

// ── Regex-based commit (fallback, when no sourceLocation) ──

const SRC_DIR = join(process.cwd(), "src");

function pathnameToFile(pathname: string): string {
  const route = pathname === "/" ? "" : pathname;
  return join(SRC_DIR, "app", route, "page.tsx");
}

function extractId(selector: string): string | null {
  const match = selector.match(/#([a-zA-Z][\w-]*)/);
  return match ? match[1] : null;
}

function findLineWithId(lines: string[], id: string): number {
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes(`id="${id}"`) ||
      lines[i].includes(`id={"${id}"}`)
    ) {
      return i;
    }
  }
  return -1;
}

function findTargetLine(
  lines: string[],
  anchorLine: number,
  patch: Patch
): number {
  const selectorParts = patch.selector.split(" > ");
  const idPartIndex = selectorParts.findIndex((p) => p.includes("#"));
  if (idPartIndex === selectorParts.length - 1) return anchorLine;

  const searchEnd = Math.min(anchorLine + 200, lines.length);

  if (patch.originalClasses?.trim()) {
    for (let i = anchorLine + 1; i < searchEnd; i++) {
      if (lines[i].includes(patch.originalClasses.trim())) return i;
    }
  }

  if (patch.originalText) {
    const snippet = patch.originalText.slice(0, 60).trim();
    if (snippet) {
      for (let i = anchorLine + 1; i < searchEnd; i++) {
        if (lines[i].includes(snippet)) return i;
      }
    }
  }

  const lastPart = selectorParts[selectorParts.length - 1];
  const tagMatch = lastPart.match(/^(\w+)/);
  const nthMatch = lastPart.match(/:nth-of-type\((\d+)\)/);

  if (tagMatch) {
    const tag = tagMatch[1];
    const nth = nthMatch ? parseInt(nthMatch[1]) : 1;
    let count = 0;
    for (let i = anchorLine + 1; i < searchEnd; i++) {
      if (new RegExp(`<${tag}(\\s|>|$)`).test(lines[i])) {
        count++;
        if (count === nth) return i;
      }
    }
  }

  return -1;
}

function applyClassOpsRegex(line: string, operations: PatchOperation[]): string {
  let result = line;
  for (const op of operations) {
    if (op.type === "addClass" && op.className) {
      const m = result.match(/className="([^"]*)"/);
      if (m) {
        result = result.replace(
          `className="${m[1]}"`,
          `className="${`${m[1]} ${op.className}`.trim()}"`
        );
      } else {
        result = result.replace(/(<\w+)(\s)/, `$1 className="${op.className}"$2`);
      }
    }
    if (op.type === "removeClass" && op.className) {
      const m = result.match(/className="([^"]*)"/);
      if (m) {
        const classes = m[1].split(/\s+/).filter((c) => c && c !== op.className).join(" ");
        result = classes
          ? result.replace(`className="${m[1]}"`, `className="${classes}"`)
          : result.replace(/\s*className=""/, "");
      }
    }
  }
  return result;
}

async function commitWithRegex(
  patch: Patch
): Promise<{ ok: boolean; file?: string; line?: number; error?: string; hint?: string }> {
  const sourceFilePath = pathnameToFile(patch.pathname);
  let source: string;
  try {
    source = await readFile(sourceFilePath, "utf-8");
  } catch {
    return { ok: false, error: `Source file not found: ${sourceFilePath}` };
  }

  const lines = source.split("\n");
  const id = extractId(patch.selector);
  if (!id) {
    return {
      ok: false,
      error: "Cannot commit: selector has no id anchor",
      hint: "Only elements within id-bearing ancestors can be committed to source",
    };
  }

  const anchorLine = findLineWithId(lines, id);
  if (anchorLine === -1) {
    return { ok: false, error: `Element with id="${id}" not found in ${sourceFilePath}` };
  }

  const targetLine = findTargetLine(lines, anchorLine, patch);
  if (targetLine === -1) {
    return {
      ok: false,
      error: "Could not locate the target element in source",
      hint: "The element may be dynamically rendered or in a different file",
    };
  }

  // Apply class operations
  const classOps = patch.operations.filter(
    (op) => op.type === "addClass" || op.type === "removeClass"
  );
  if (classOps.length > 0) {
    lines[targetLine] = applyClassOpsRegex(lines[targetLine], classOps);
  }

  // Apply text operations
  const textOp = patch.operations.find((op) => op.type === "text");
  if (textOp?.value && patch.originalText) {
    const searchRange = Math.min(targetLine + 10, lines.length);
    for (let i = targetLine; i < searchRange; i++) {
      if (lines[i].includes(patch.originalText.slice(0, 50))) {
        lines[i] = lines[i].replace(patch.originalText, textOp.value);
        break;
      }
    }
  }

  // Apply style operations
  const styleOps = patch.operations.filter(
    (op) => op.type === "setStyle" || op.type === "removeStyle"
  );
  if (styleOps.length > 0) {
    const styles = styleOps
      .filter((op) => op.type === "setStyle" && op.property && op.styleValue)
      .map((op) => `${op.property}: ${op.styleValue}`)
      .join("; ");

    if (styles) {
      const styleObj = styles
        .split("; ")
        .map((s) => {
          const [k, v] = s.split(": ");
          const camelKey = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
          return `${camelKey}: "${v}"`;
        })
        .join(", ");

      if (lines[targetLine].match(/style=\{\{([^}]*)\}\}/)) {
        lines[targetLine] = lines[targetLine].replace(
          /style=\{\{([^}]*)\}\}/,
          `style={{$1, ${styleObj} }}`
        );
      } else {
        lines[targetLine] = lines[targetLine].replace(
          /(<\w+)(\s)/,
          `$1 style={{ ${styleObj} }}$2`
        );
      }
    }
  }

  await writeFile(sourceFilePath, lines.join("\n"), "utf-8");
  return {
    ok: true,
    file: sourceFilePath.replace(process.cwd() + "/", ""),
    line: targetLine + 1,
  };
}

// ── API handler ──

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const { patchId } = await request.json();
    if (!patchId) {
      return NextResponse.json({ error: "patchId required" }, { status: 400 });
    }

    // Read patches
    const patchRaw = await readFile(PATCH_FILE, "utf-8");
    const patchFile: PatchFile = JSON.parse(patchRaw);
    const patch = patchFile.patches.find((p) => p.id === patchId);
    if (!patch) {
      return NextResponse.json({ error: "Patch not found" }, { status: 404 });
    }

    // Choose strategy: AST → text search → component search → regex
    let result: { ok: boolean; file?: string; line?: number; error?: string; hint?: string };

    if (patch.sourceLocation) {
      result = await commitWithAST(patch, patch.sourceLocation);
    } else {
      result = { ok: false, error: "No source location" };
    }

    // Fallback: text-search across all source files
    if (!result.ok) {
      const textSearchResult = await commitWithTextSearch(patch);
      result = textSearchResult;
    }

    // Fallback: component-name search (for prop ops when _debugSource is unavailable)
    if (!result.ok && patch.operations.some((op) => op.type === "setProp")) {
      const propResult = await commitPropWithComponentSearch(patch);
      if (propResult.ok) result = propResult;
    }

    // Fallback: regex-based (needs id anchor in selector)
    if (!result.ok) {
      const regexResult = await commitWithRegex(patch);
      result = regexResult;
    }

    if (!result.ok) {
      return NextResponse.json(result, { status: 422 });
    }

    // Remove the committed patch from patches.json
    patchFile.patches = patchFile.patches.filter((p) => p.id !== patchId);
    await writeFile(PATCH_FILE, JSON.stringify(patchFile, null, 2), "utf-8");

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
