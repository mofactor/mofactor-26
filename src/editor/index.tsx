"use client";

import { useEffect } from "react";
import AnnotationOverlay from "./AnnotationOverlay";
import EditorOverlay from "./EditorOverlay";
import EditorPanel from "./EditorPanel";
import EditorProvider from "./EditorProvider";
import EditorToolbar from "./EditorToolbar";
import { EDITOR_ATTR } from "./constants";
import { injectEditorStyles } from "./styles";

export default function DevEditor() {
  useEffect(() => {
    const cleanup = injectEditorStyles();
    return cleanup;
  }, []);

  return (
    <EditorProvider>
      <div {...{ [EDITOR_ATTR]: "" }}>
        <EditorOverlay />
        <AnnotationOverlay />
        <EditorPanel />
        <EditorToolbar />
      </div>
    </EditorProvider>
  );
}
