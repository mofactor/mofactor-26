"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const navItems = [
  { label: "Work", href: "#work" },
  { label: "Mesign Bits", href: "#designbits" },
  { label: "About", href: "#about" },
  { label: "Recommendations", href: "#recommendations" },
  { label: "Journeys", href: "#journeys" },
  { label: "Notes", href: "#notes" },
];

const MIN_WIDTH = 4;
const MAX_WIDTH = 30;
const TRACK_COUNT = 4;

export default function Sidebar() {
  const [dashWidths, setDashWidths] = useState<number[]>(
    navItems.map(() => MIN_WIDTH)
  );
  const rafRef = useRef<number>(0);

  const computeWidths = useCallback(() => {
    const windowH = window.innerHeight;
    const scrollY = window.scrollY;
    const viewportCenter = scrollY + windowH * 0.4;

    const sectionData = navItems.map((item) => {
      const el = document.querySelector(item.href);
      if (!el) return { top: 0, bottom: 0, mid: 0 };
      const rect = el.getBoundingClientRect();
      const top = rect.top + scrollY;
      const bottom = rect.bottom + scrollY;
      return { top, bottom, mid: (top + bottom) / 2 };
    });

    // Calculate weight for each section based on proximity to viewport center
    // Use raw weights (no normalization) so items only reach max when viewport
    // is centered on a section
    const weights = sectionData.map((s) => {
      const distance = Math.abs(s.mid - viewportCenter);
      const maxDist = windowH * 2.5;
      return Math.max(0, 1 - distance / maxDist);
    });

    // Map directly to dash widths (no normalization)
    const newWidths = weights.map(
      (w) => MIN_WIDTH + w * (MAX_WIDTH - MIN_WIDTH)
    );

    setDashWidths(newWidths);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(computeWidths);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial computation
    computeWidths();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [computeWidths]);

  // Determine active section (highest dash width)
  const activeIndex = dashWidths.indexOf(Math.max(...dashWidths));

  // Compute track widths between items (linear interpolation)
  const getTrackWidths = (itemIndex: number): number[] => {
    if (itemIndex >= navItems.length - 1) return [];
    const fromW = dashWidths[itemIndex];
    const toW = dashWidths[itemIndex + 1];
    return Array.from({ length: TRACK_COUNT }, (_, i) => {
      const t = (i + 1) / (TRACK_COUNT + 1);
      return fromW + (toW - fromW) * t;
    });
  };

  return (
    <div className="fixed inset-x-0 md:top-60 pointer-events-none z-50 hidden md:block">
      <div className="mx-auto sm:px-12 lg:max-w-[1280px] xl:max-w-[1536px] grid w-full md:grid-cols-12">
        <div className="pointer-events-auto flex flex-col gap-2 text-[14px] md:col-span-2">
          {navItems.map((item, index) => {
            const isActive = index === activeIndex;
            const dashW = dashWidths[index];
            const trackWidths = getTrackWidths(index);

            return (
              <div key={item.href} className="grid gap-2">
                {/* Link row */}
                <div className="flex">
                  <a
                    href={item.href}
                    className={`inline-block flex items-center transition-colors duration-300 ease-out ${isActive
                      ? "text-black dark:text-white"
                      : "text-body dark:text-body-dark"
                      }`}
                  >
                    <div
                      className={`h-[1px] relative flex-shrink-0 ${isActive
                        ? "bg-black dark:bg-white"
                        : "bg-body dark:bg-body-dark"
                        }`}
                      style={{ width: `${dashW}px` }}
                    >
                      <span className="absolute top-1/2 left-full -translate-y-1/2 py-2 pl-2 whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                  </a>
                </div>

                {/* Track lines between items */}
                {trackWidths.map((tw, ti) => (
                  <div
                    key={ti}
                    className="bg-black/15 h-[1px] dark:bg-white/15"
                    style={{ width: `${tw}px` }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
