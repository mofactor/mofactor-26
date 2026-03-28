"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const isDev = process.env.NODE_ENV === "development";

export default function FpsOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/nexus");

  useEffect(() => {
    if (!isDev || isAdmin) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      frameCount++;
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        const fps = (frameCount * 1000) / elapsed;
        if (ref.current) ref.current.textContent = `${fps.toFixed(0)} fps`;
        frameCount = 0;
        lastTime = now;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!isDev || isAdmin) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[9999] bottom-7 left-16 font-mono text-xs text-white pointer-events-none select-none tabular-nums bg-black/50 rounded px-1.5 py-0.5"
    >
      -- fps
    </div>
  );
}
