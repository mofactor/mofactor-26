"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import { ReactNode, useMemo } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export default function ConvexLayout({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);
  return (
    <ConvexProvider client={client}>
      {children}
      <Toaster position="bottom-center" toastOptions={{
        classNames: {
          toast: "!border-none !shadow-border font-sans text-sm",
          success: "bg-green-50 border-green-200 text-green-800",
          error: "bg-red-50 border-red-200 text-red-800",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }} />
    </ConvexProvider>
  );
}
