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
      // Remove overflow-hidden/clip
      applyOverflowChange(null, variantKey, currentClasses, onAddClass, onRemoveClass);
    } else {
      // Add overflow-hidden
      applyOverflowChange("hidden", variantKey, currentClasses, onAddClass, onRemoveClass);
    }
  }, [isClipped, variantKey, currentClasses, onAddClass, onRemoveClass]);

  return (
    <div className="editor-design-overflow">
      <label className="editor-design-checkbox-label">
        <input
          type="checkbox"
          className="editor-design-checkbox"
          checked={isClipped}
          onChange={handleToggle}
        />
        <span>Clip content</span>
      </label>
    </div>
  );
}
