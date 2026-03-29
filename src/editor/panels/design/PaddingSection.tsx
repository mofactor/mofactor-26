"use client";

import { useCallback, useMemo, useState } from "react";
import { type SpacingSides, type VariantKey } from "../../tailwind/design-parser";
import { applyPaddingChange, applyPaddingAxisChange } from "../../tailwind/design-composer";
import { parseSpacingValue } from "../../tailwind/spacing-map";
import SpacingBoxInput, { type SpacingMode } from "./SpacingBoxInput";

interface PaddingSectionProps {
  paddingSides: SpacingSides;
  variantKey: VariantKey;
  currentClasses: string;
  onAddClass: (cls: string) => void;
  onRemoveClass: (cls: string) => void;
}

export default function PaddingSection({
  paddingSides,
  variantKey,
  currentClasses,
  onAddClass,
  onRemoveClass,
}: PaddingSectionProps) {
  const [mode, setMode] = useState<SpacingMode>(() => {
    // Auto-detect: if all 4 sides are individually different, start expanded
    const { top, right, bottom, left } = paddingSides;
    if (top !== bottom || left !== right) return "expanded";
    return "collapsed";
  });

  // Display values for each side (parse bracket notation for display)
  const sideValues = useMemo(
    () => ({
      top: parseSpacingValue(paddingSides.top ?? ""),
      right: parseSpacingValue(paddingSides.right ?? ""),
      bottom: parseSpacingValue(paddingSides.bottom ?? ""),
      left: parseSpacingValue(paddingSides.left ?? ""),
    }),
    [paddingSides]
  );

  // Axis values for collapsed mode
  const axisValues = useMemo(() => {
    const x =
      sideValues.left === sideValues.right ? sideValues.left : "";
    const y =
      sideValues.top === sideValues.bottom ? sideValues.top : "";
    return { x, y };
  }, [sideValues]);

  const handleChangeSide = useCallback(
    (side: "top" | "right" | "bottom" | "left", value: string) => {
      applyPaddingChange(side, value || null, variantKey, currentClasses, onAddClass, onRemoveClass);
    },
    [variantKey, currentClasses, onAddClass, onRemoveClass]
  );

  const handleChangeAxis = useCallback(
    (axis: "x" | "y", value: string) => {
      applyPaddingAxisChange(axis, value || null, variantKey, currentClasses, onAddClass, onRemoveClass);
    },
    [variantKey, currentClasses, onAddClass, onRemoveClass]
  );

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "collapsed" ? "expanded" : "collapsed"));
  }, []);

  return (
    <SpacingBoxInput
      label="Padding"
      valuesAxis={axisValues}
      valuesSides={sideValues}
      mode={mode}
      onToggleMode={toggleMode}
      onChangeAxis={handleChangeAxis}
      onChangeSide={handleChangeSide}
    />
  );
}
