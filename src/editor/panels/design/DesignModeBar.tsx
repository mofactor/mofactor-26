"use client";

import { cn } from "@/lib/utils";

export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";
export type ThemeMode = "light" | "dark";

interface DesignModeBarProps {
  breakpoint: Breakpoint;
  theme: ThemeMode;
  onChangeBreakpoint: (bp: Breakpoint) => void;
  onChangeTheme: (theme: ThemeMode) => void;
}

const BREAKPOINTS: { key: Breakpoint; label: string; title: string }[] = [
  { key: "base", label: "Base", title: "Mobile-first default (no prefix)" },
  { key: "sm", label: "sm", title: "Small screens (640px+)" },
  { key: "md", label: "md", title: "Tablet (768px+)" },
  { key: "lg", label: "lg", title: "Desktop (1024px+)" },
  { key: "xl", label: "xl", title: "Desktop Large (1280px+)" },
  { key: "2xl", label: "2xl", title: "Desktop FHD (1536px+)" },
];

const THEMES: { key: ThemeMode; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

// Pill used for both theme and breakpoint toggles
function Pill({
  label,
  active,
  title,
  onClick,
}: {
  label: string;
  active: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "bg-zinc-800 text-zinc-400 border border-transparent rounded px-2 py-px text-[10px] cursor-pointer transition-all hover:text-white",
        active && "bg-white text-black"
      )}
      onClick={onClick}
      title={title}
    >
      {label}
    </button>
  );
}

export default function DesignModeBar({
  breakpoint,
  theme,
  onChangeBreakpoint,
  onChangeTheme,
}: DesignModeBarProps) {
  const isNonBase = breakpoint !== "base" || theme !== "light";

  return (
    <div className="flex flex-col gap-1.5 mb-3 pb-2.5 border-b border-zinc-700">
      {/* Theme toggle */}
      <div className="flex flex-wrap gap-[3px]">
        {THEMES.map((t) => (
          <Pill
            key={t.key}
            label={t.label}
            active={theme === t.key}
            onClick={() => onChangeTheme(t.key)}
          />
        ))}
      </div>

      {/* Breakpoint selector */}
      <div className="flex flex-wrap gap-[3px]">
        {BREAKPOINTS.map((bp) => (
          <Pill
            key={bp.key}
            label={bp.label}
            active={breakpoint === bp.key}
            title={bp.title}
            onClick={() => onChangeBreakpoint(bp.key)}
          />
        ))}
      </div>

      {/* Non-base variant indicator */}
      {isNonBase && (
        <div className="text-[10px] font-semibold text-amber-400 bg-amber-400/12 px-2 py-px rounded self-start">
          {theme === "dark" ? "dark:" : ""}
          {breakpoint !== "base" ? `${breakpoint}:` : ""}
        </div>
      )}
    </div>
  );
}
