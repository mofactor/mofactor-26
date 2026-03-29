"use client";

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

export default function DesignModeBar({
  breakpoint,
  theme,
  onChangeBreakpoint,
  onChangeTheme,
}: DesignModeBarProps) {
  const isNonBase = breakpoint !== "base" || theme !== "light";

  return (
    <div className="editor-design-modebar">
      {/* Theme toggle */}
      <div className="editor-design-modebar-group">
        {THEMES.map((t) => (
          <button
            key={t.key}
            className={`editor-component-pill ${theme === t.key ? "editor-component-pill--active" : ""}`}
            onClick={() => onChangeTheme(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Breakpoint selector */}
      <div className="editor-design-modebar-group">
        {BREAKPOINTS.map((bp) => (
          <button
            key={bp.key}
            className={`editor-component-pill ${breakpoint === bp.key ? "editor-component-pill--active" : ""}`}
            onClick={() => onChangeBreakpoint(bp.key)}
            title={bp.title}
          >
            {bp.label}
          </button>
        ))}
      </div>

      {/* Non-base variant indicator */}
      {isNonBase && (
        <div className="editor-design-variant-badge">
          {theme === "dark" ? "dark:" : ""}
          {breakpoint !== "base" ? `${breakpoint}:` : ""}
        </div>
      )}
    </div>
  );
}
