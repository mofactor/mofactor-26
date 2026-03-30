"use client";

import { useCallback } from "react";
import { type VariantKey } from "../../tailwind/design-parser";
import { applyOverflowChange } from "../../tailwind/design-composer";

interface OverflowSectionProps {
  overflowValue: string | undefined;
  variantKey: VariantKey;
  currentClasses: string;
  onAddClass: (cls: string) => void;
  onRemoveClass: (cls: string) => void;
}

export default function OverflowSection({
  overflowValue,
  variantKey,
  currentClasses,
  onAddClass,
  onRemoveClass,
}: OverflowSectionProps) {
  const isClipped = overflowValue === "hidden" || overflowValue === "clip";

  const handleToggle = useCallback(() => {
    if (isClipped) {
      applyOverflowChange(null, variantKey, currentClasses, onAddClass, onRemoveClass);
    } else {
      applyOverflowChange("hidden", variantKey, currentClasses, onAddClass, onRemoveClass);
    }
  }, [isClipped, variantKey, currentClasses, onAddClass, onRemoveClass]);

  return (
    <div className="flex items-center">
      <label className="flex items-center gap-2 cursor-pointer text-[12px] text-zinc-300 select-none">
        <input
          type="checkbox"
          className="w-4 h-4 accent-zinc-300 cursor-pointer rounded"
          checked={isClipped}
          onChange={handleToggle}
        />
        <span>Clip content</span>
      </label>
    </div>
  );
}
