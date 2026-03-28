"use client";

import dynamic from "next/dynamic";

const DevEditor = dynamic(() => import("@/editor"), { ssr: false });

export default function DevEditorLoader() {
  if (process.env.NODE_ENV !== "development") return null;
  return <DevEditor />;
}
