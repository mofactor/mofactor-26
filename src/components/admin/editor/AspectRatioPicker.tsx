"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { PresetTabs } from "./PresetTabs";
import {
  ASPECT_PRESETS,
  type AspectRatioValue,
} from "./extensions/figureClasses";

const CUSTOM_KEY = "__custom__";

const ROWS = [
  [
    ...ASPECT_PRESETS.map((p) => ({ value: p.value, label: p.label })),
    { value: CUSTOM_KEY, label: "Custom" },
  ],
];

interface AspectRatioPickerProps {
  value: AspectRatioValue;
  onChange: (ratio: AspectRatioValue) => void;
  inline?: boolean;
}

export function AspectRatioPicker({
  value,
  onChange,
  inline,
}: AspectRatioPickerProps) {
  const isCustom =
    value !== "video" &&
    value !== "none" &&
    !ASPECT_PRESETS.some((p) => p.value === value);
  const [customInput, setCustomInput] = useState(isCustom ? value : "");
  const [showCustom, setShowCustom] = useState(isCustom);

  const handleSelect = (selected: string) => {
    if (selected === CUSTOM_KEY) {
      setShowCustom(true);
      if (customInput) onChange(customInput);
    } else {
      setShowCustom(false);
      onChange(selected);
    }
  };

  const commitCustom = (raw: string) => {
    const v = raw.trim();
    if (v && /^\d+(\.\d+)?(\/\d+(\.\d+)?)?$/.test(v)) onChange(v);
  };

  return (
    <div className={inline ? "grid grid-cols-3 items-center" : ""}>
      {inline ? (
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Ratio
        </span>
      ) : (
        <Label className="mb-1.5 inline-block text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Aspect Ratio
        </Label>
      )}

      <div className={inline ? "col-span-2 space-y-1.5" : "space-y-1.5"}>
        <PresetTabs
          rows={ROWS}
          active={showCustom ? CUSTOM_KEY : value}
          onSelect={handleSelect}
        />

        {showCustom && (
          <Input
            size="xs"
            placeholder="e.g. 3/4"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onBlur={(e) => commitCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitCustom(e.currentTarget.value);
                e.currentTarget.blur();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
