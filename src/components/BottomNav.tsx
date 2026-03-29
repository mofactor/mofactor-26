"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { animate, createDraggable, createSpring } from "animejs";
import { useTheme } from "@/hooks/useTheme";

export type NavItem = { label: string; href: string };

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Root", href: "#root" },
  { label: "Work", href: "#work" },
  { label: "Design Bits", href: "#designbits" },
  { label: "About", href: "#about" },
  { label: "Shoutouts", href: "#recommendations" },
  { label: "Journal", href: "#journal" },
];

const MIN_H = 5;
const MAX_H = 36;
const TRACK_COUNT = 8;

// Progressive blur — jh3y's technique:
// Each layer i uses sin() to curve both the blur amount AND the coverage zone.
const N_LAYERS = 10;
const BLUR_MAX = 24;
const MASK_STOP = 75;

const BLUR_LAYERS = Array.from({ length: N_LAYERS }, (_, idx) => {
  const i = idx + 1;
  const half = Math.PI / 2;
  const blur = Math.sin(((N_LAYERS - i) / N_LAYERS) * half) * BLUR_MAX;
  const stop = Math.sin((i / N_LAYERS) * half) * MASK_STOP;
  const maskStart = (100 - stop).toFixed(1);
  return {
    blur: `${blur.toFixed(2)}px`,
    mask: `linear-gradient(to bottom, transparent 0% ${maskStart}%, black 100%)`,
  };
});

const LABEL_OFFSET_PX = 32;

// Eased fade gradient — 12 stops following a power curve (alpha = (1-t)^1.5).
// Linear gradients look harsh; the power curve makes the fade feel perceptually smooth.
const N_GRAD = 12;
const GRAD_REACH = 100; // % of overlay height
const GRAD_POWER = 1.5;   // quadratic — slower falloff, more presence higher up
function fadeGradient(base: string) {
  return `linear-gradient(to top, ${Array.from({ length: N_GRAD + 1 }, (_, i) => {
    const t = i / N_GRAD;
    const alpha = Math.pow(1 - t, GRAD_POWER);
    const pct = (alpha * 100).toFixed(1);
    const pos = (t * GRAD_REACH).toFixed(1);
    return `color-mix(in srgb, ${base} ${pct}%, transparent) ${pos}%`;
  }).join(", ")})`;
}

/**
 * Walk up the DOM from `el` looking for:
 *   1. data-nav-theme="dark" | "light"  — explicit override on any ancestor
 *   2. A non-transparent computed background-color
 *
 * Returns perceived luminance 0–1 (0 = black, 1 = white).
 * Falls back to 1 (light) when no opaque background is found.
 */
function getPerceivedLuminance(
  x: number,
  y: number,
  navOverlay: Element | null
): number {
  // elementsFromPoint returns ALL elements at (x, y) top→bottom.
  // Skip anything inside the nav overlay so we always read page content,
  // no pointer-events tricks needed — works at any sample Y.
  const all = document.elementsFromPoint(x, y);
  const el = all.find((e) => !navOverlay?.contains(e) && e !== navOverlay) ?? null;
  if (!el) return 1;

  // Pass 1 — data-nav-theme hint wins over everything, checked before any
  // bg-color so a full-card overlay link can't shadow a deeper hint.
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const hint = (node as HTMLElement).dataset?.navTheme;
    if (hint === "dark") return 0;
    if (hint === "light") return 1;
    node = node.parentElement;
  }

  // Pass 2 — first non-transparent background-color in ancestor chain.
  node = el;
  while (node && node !== document.documentElement) {
    const bg = window.getComputedStyle(node as HTMLElement).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (m) {
        const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (alpha >= 0.15) {
          return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
        }
      }
    }
    node = node.parentElement;
  }

  return 1;
}

export default function BottomNav({ items: navItems = DEFAULT_NAV_ITEMS }: { items?: NavItem[] } = {}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fadeGrad = fadeGradient("var(--nav-fade-base)");

  const [dashHeights, setDashHeights] = useState<number[]>(
    navItems.map(() => MIN_H)
  );
  // Per-item darkness: true = dark background behind this item → use light colours
  const [darkMap, setDarkMap] = useState<boolean[]>(navItems.map(() => false));

  const rafRef = useRef<number>(0);
  // Refs to each nav <a> element so we can read their rendered x positions
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Mobile draggable + auto-slide refs
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<ReturnType<typeof createDraggable> | null>(null);
  const boundsRef = useRef({ min: 0, max: 0 });
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const justDraggedRef = useRef(false);
  const justDraggedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoScrollAnimRef = useRef<ReturnType<typeof animate> | null>(null);
  const prevActiveRef = useRef(0);

  const computeState = useCallback(() => {
    const windowH = window.innerHeight;
    const scrollY = window.scrollY;
    // 0.8 determines the center of the nav items — check sigma too
    const viewportCenter = scrollY + windowH * 0.7;

    // Dash heights
    // Gaussian falloff — sharp peak at the active section, steep drop-off
    // to neighbours. sigma = 0.4*windowH means sections ~1 viewport away
    // get weight ≈ 0.08, giving a clear genie-effect spread.
    const sigma = windowH * 0.7;
    const weights = navItems.map((item) => {
      const el = document.querySelector(item.href);
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + scrollY + rect.height / 2;
      const distance = Math.abs(mid - viewportCenter);
      return Math.exp(-(distance * distance) / (2 * sigma * sigma));
    });
    setDashHeights(weights.map((w) => MIN_H + w * (MAX_H - MIN_H)));

    // Per-item dark detection.
    // Sample right at the nav level (windowH - 60). elementsFromPoint returns
    // all elements at that coordinate; we skip anything inside the nav overlay
    // so we always read the page content behind it — no pointer-events hacks.
    const navOverlay = document.querySelector("[data-nav-row]")?.parentElement ?? null;
    const sampleVY = windowH - 60;
    const newDark = itemRefs.current.map((ref) => {
      if (!ref) return false;
      const rect = ref.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      return getPerceivedLuminance(x, sampleVY, navOverlay) < 0.5;
    });
    setDarkMap(newDark);
  }, []);

  useEffect(() => {
    const scheduleUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(computeState);
    };
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    // Re-run when sections resize (e.g. videos/images loading change section height)
    const ro = new ResizeObserver(scheduleUpdate);
    navItems.forEach((item) => {
      const el = document.querySelector(item.href);
      if (el) ro.observe(el);
    });

    // Re-run when data-nav-theme attributes change (e.g. darkHover cards)
    const mo = new MutationObserver(scheduleUpdate);
    mo.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-nav-theme"],
    });

    computeState();
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mo.disconnect();
    };
  }, [computeState]);

  // ── Mobile draggable setup ──────────────────────────────────────────
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const mql = window.matchMedia("(max-width: 767px)");

    const updateBounds = () => {
      const innerW = inner.scrollWidth;
      const outerW = outer.clientWidth;
      boundsRef.current = { min: Math.min(0, -(innerW - outerW)), max: 0 };
    };

    const setup = () => {
      // Tear down previous instance
      autoScrollAnimRef.current?.cancel();
      autoScrollAnimRef.current = null;
      draggableRef.current?.revert();
      draggableRef.current = null;
      isDraggingRef.current = false;

      if (!mql.matches) return;

      updateBounds();

      draggableRef.current = createDraggable(inner, {
        x: {
          modifier: (x: number) => Math.max(boundsRef.current.min, Math.min(boundsRef.current.max, x)),
        },
        y: false,
        releaseEase: createSpring({ stiffness: 120, damping: 22, mass: 1 }),
        dragThreshold: 5,
        scrollThreshold: 15,
        cursor: false,
        onGrab: () => {
          isDraggingRef.current = true;
          hasDraggedRef.current = false;
          autoScrollAnimRef.current?.cancel();
          autoScrollAnimRef.current = null;
        },
        onDrag: () => {
          hasDraggedRef.current = true;
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(computeState);
        },
        onRelease: () => {
          if (hasDraggedRef.current) {
            justDraggedRef.current = true;
            clearTimeout(justDraggedTimer.current);
            justDraggedTimer.current = setTimeout(() => {
              justDraggedRef.current = false;
            }, 120);
          }
        },
        onSettle: () => {
          isDraggingRef.current = false;
          computeState();
        },
        onAfterResize: () => {
          updateBounds();
        },
      });
    };

    setup();
    mql.addEventListener("change", setup);
    return () => {
      mql.removeEventListener("change", setup);
      clearTimeout(justDraggedTimer.current);
      autoScrollAnimRef.current?.cancel();
      draggableRef.current?.revert();
      draggableRef.current = null;
    };
  }, []);

  // ── Auto-scroll to center active tab on mobile ────────────────────
  const activeIndex = dashHeights.indexOf(Math.max(...dashHeights));

  useEffect(() => {
    if (!draggableRef.current || !innerRef.current || !outerRef.current) return;
    if (isDraggingRef.current) return;
    if (activeIndex === prevActiveRef.current) return;
    prevActiveRef.current = activeIndex;

    const itemEl = itemRefs.current[activeIndex];
    if (!itemEl) return;

    const outerW = outerRef.current.clientWidth;
    const innerW = innerRef.current.scrollWidth;
    const itemLeft = itemEl.offsetLeft;
    const itemW = itemEl.offsetWidth;

    let targetX = -(itemLeft + itemW / 2 - outerW / 2);
    const minX = -(innerW - outerW);
    targetX = Math.max(minX, Math.min(0, targetX));

    autoScrollAnimRef.current?.cancel();

    const startX = draggableRef.current.x ?? 0;
    if (Math.abs(startX - targetX) < 2) return;

    const proxy = { x: startX };
    autoScrollAnimRef.current = animate(proxy, {
      x: targetX,
      duration: 450,
      ease: "outQuart",
      onUpdate: () => {
        if (isDraggingRef.current) {
          autoScrollAnimRef.current?.cancel();
          return;
        }
        draggableRef.current?.setX(proxy.x);
      },
    });
  }, [activeIndex]);

  // Hide the gradient entirely when any nav item sits over a dark section
  const anyDark = !isDark && darkMap.some(Boolean);

  const getTrackHeights = (i: number): number[] => {
    if (i >= navItems.length - 1) return [];
    const from = dashHeights[i];
    const to = dashHeights[i + 1];
    return Array.from({ length: TRACK_COUNT }, (_, k) => {
      const t = (k + 1) / (TRACK_COUNT + 1);
      return from + (to - from) * t;
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      {BLUR_LAYERS.map(({ blur, mask }, i) => (
        <div
          key={i}
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: `blur(${blur})`,
            WebkitBackdropFilter: `blur(${blur})`,
            mask: mask,
            WebkitMask: mask,
          }}
        />
      ))}

      {/* Fade gradient — fades from page bg at bottom to transparent.
          Hidden entirely over dark sections so nav text stays visible. */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-[250ms]"
        style={{
          background: fadeGrad,
          opacity: anyDark ? 0 : 1,
        }}
      />

      {/* pb-9 makes room for the absolutely-positioned labels below the dashes */}
      <div ref={outerRef} data-nav-row className="relative overflow-hidden md:justify-center flex items-end md:px-6 pb-20 pt-24 pointer-events-none [&>*]:pointer-events-auto">
        <div className="absolute top-20 left-0 right-0 pointer-events-none h-full" />
        <div ref={innerRef} className="flex items-end shrink-0 px-12 md:px-0">
          {navItems.map((item, index) => {
            const isActive = index === activeIndex;
            const dashH = dashHeights[index];
            const dark = isDark || darkMap[index];
            const trackHeights = getTrackHeights(index);
            const trackDark = dark || darkMap[index + 1];

            return (
              <Fragment key={item.href}>
                <a
                  ref={(el) => { itemRefs.current[index] = el; }}
                  href={item.href}
                  onClick={(e) => {
                    if (justDraggedRef.current) { e.preventDefault(); return; }
                    // Replace history instead of pushing so back button
                    // skips past section changes to the actual previous page.
                    e.preventDefault();
                    const target = document.querySelector(item.href);
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth" });
                      history.replaceState(null, "", item.href);
                    }
                  }}
                  className="w-4 flex-shrink-0 relative flex flex-col items-center"
                >
                  <div
                    className={`w-[1.5px] flex-shrink-0 transition-colors duration-[250ms] ease-out ${isActive
                      ? dark ? "bg-white" : "bg-black !w-0.5"
                      : dark ? "bg-white/40" : "bg-body"
                      }`}
                    style={{ height: `${dashH}px` }}
                  />
                  <span
                    className={`absolute font-medium text-[18px] text-trim-both text-edge-both -bottom-12 py-3 rounded-lg left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-[250ms] ease-in-out ${isActive
                      ? dark ? "text-black bg-white/80 backdrop-blur-md px-4" : "text-white bg-black px-4"
                      : dark ? "text-white/60 px-3 hover:text-white" : "text-black/50 hover:text-black px-3"
                      }`}
                  >
                    {item.label}
                  </span>
                </a>

                {trackHeights.map((th, ti) => (
                  <div
                    key={ti}
                    className="w-4 flex-shrink-0 flex flex-col items-center justify-end"
                  >
                    <div
                      className={`w-[1.5px] transition-colors duration-[250ms] ease-out ${trackDark ? "bg-white/25" : "bg-black/20"
                        }`}
                      style={{ height: `${th}px` }}
                    />
                  </div>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
