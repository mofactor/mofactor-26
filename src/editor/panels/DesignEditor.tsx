"use client";

import { useMemo, useState } from "react";
import {
  parseDesignClasses,
  getPaddingForVariant,
  getOverflowForVariant,
  getVariantKey,
} from "../tailwind/design-parser";
import DesignModeBar, {
  type Breakpoint,
  type ThemeMode,
} from "./design/DesignModeBar";
import PaddingSection from "./design/PaddingSection";
import OverflowSection from "./design/OverflowSection";

interface DesignEditorProps {
  element: HTMLElement;
  effectiveClasses: string;
  onAddClass: (cls: string) => void;
  onRemoveClass: (cls: string) => void;
}

export default function DesignEditor({
  element,
  effectiveClasses,
  onAddClass,
  onRemoveClass,
}: DesignEditorProps) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("base");
  const [theme, setTheme] = useState<ThemeMode>("light");

  const parsed = useMemo(
    () => parseDesignClasses(effectiveClasses),
    [effectiveClasses]
  );

  const variantKey = useMemo(
    () => getVariantKey(breakpoint, theme),
    [breakpoint, theme]
  );

  const paddingSides = useMemo(
    () => getPaddingForVariant(parsed, variantKey),
    [parsed, variantKey]
  );

  const overflowValue = useMemo(
    () => getOverflowForVariant(parsed, variantKey),
    [parsed, variantKey]
  );

  return (
    <div>
      <DesignModeBar
        breakpoint={breakpoint}
        theme={theme}
        onChangeBreakpoint={setBreakpoint}
        onChangeTheme={setTheme}
      />

      {/* Padding */}
      <div className="mb-3">
        <div className="text-zinc-500 text-[10px] uppercase tracking-[0.5px] mb-1.5">
          Padding
        </div>
        <PaddingSection
          paddingSides={paddingSides}
          variantKey={variantKey}
          currentClasses={effectiveClasses}
          onAddClass={onAddClass}
          onRemoveClass={onRemoveClass}
        />
      </div>

      {/* Overflow */}
      <div className="mb-3">
        <OverflowSection
          overflowValue={overflowValue}
          variantKey={variantKey}
          currentClasses={effectiveClasses}
          onAddClass={onAddClass}
          onRemoveClass={onRemoveClass}
        />
      </div>
    </div>
  );
}
