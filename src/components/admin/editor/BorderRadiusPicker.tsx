"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PresetTabs } from "./PresetTabs";
import {
  RADIUS_PRESETS,
  CORNERS,
  type Corner,
  type RadiusValue,
  getBorderRadius,
  getCornerRadii,
  hasIndividualCorners,
  setBorderRadius,
  setCornerRadius,
  toIndividualCorners,
  toUniformRadius,
} from "./extensions/figureClasses";

/* ── Sentinel keys for non-preset tabs ─────────────────────── */
const DEFAULT_KEY = "__default__";
const CUSTOM_KEY = "__custom__";

/* ── Display presets split into two rows ────────────────────── */
const ROW1 = RADIUS_PRESETS.filter((p) =>
  ["sm", "md", "lg", "xl", "2xl"].includes(p.value),
).map((p) => ({ value: p.value, label: p.label }));

const ROW2 = [
  { value: DEFAULT_KEY, label: "Default" },
  ...RADIUS_PRESETS.filter((p) => ["none", "full"].includes(p.value)).map(
    (p) => ({ value: p.value, label: p.label }),
  ),
  { value: CUSTOM_KEY, label: "Custom" },
];

const ROWS = [ROW1, ROW2];

/* ── SVG corner icons ──────────────────────────────────────── */
function CornerIcon({ corner }: { corner: Corner }) {
  const rotation: Record<Corner, number> = { tl: 0, tr: 90, bl: 270, br: 180 };
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className="shrink-0 text-zinc-400 dark:text-zinc-500"
    >
      <path
        d="M 1 11 L 1 4 A 3 3 0 0 1 4 1 L 11 1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${rotation[corner]} 6 6)`}
      />
    </svg>
  );
}

/* ── Individual-corners toggle icon ────────────────────────── */
function IndividualCornersIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className={active ? "text-foreground" : "text-zinc-400 dark:text-zinc-500"}
    >
      <path d="M 1 5 L 1 2.5 A 1.5 1.5 0 0 1 2.5 1 L 5 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 9 1 L 11.5 1 A 1.5 1.5 0 0 1 13 2.5 L 13 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 13 9 L 13 11.5 A 1.5 1.5 0 0 1 11.5 13 L 9 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 5 13 L 2.5 13 A 1.5 1.5 0 0 1 1 11.5 L 1 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Resolve user input to a RadiusValue ───────────────────── */
function resolveInput(raw: string): RadiusValue {
  const v = raw.trim().toLowerCase();
  if (!v || v === "0") return "none";
  if (RADIUS_PRESETS.some((p) => p.value === v)) return v;
  return v.replace(/^rounded-?/, "").replace(/^\[|\]$/g, "");
}

/* ── Component ─────────────────────────────────────────────── */

interface BorderRadiusPickerProps {
  className: string;
  onChange: (newClassName: string) => void;
}

export function BorderRadiusPicker({ className, onChange }: BorderRadiusPickerProps) {
  const individual = hasIndividualCorners(className);
  const [isIndividual, setIsIndividual] = useState(individual);

  const uniformValue = getBorderRadius(className);
  const cornerValues = getCornerRadii(className);

  const isCustom =
    uniformValue !== "" && !RADIUS_PRESETS.some((p) => p.value === uniformValue);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [customInput, setCustomInput] = useState(isCustom ? uniformValue : "");

  const [editingCorner, setEditingCorner] = useState<Corner | null>(null);
  const [editValue, setEditValue] = useState("");

  /* ── Derive active key for PresetTabs ─────────────────────── */
  const activeKey = showCustom
    ? CUSTOM_KEY
    : uniformValue === ""
      ? DEFAULT_KEY
      : uniformValue;

  /* ── Uniform handlers ────────────────────────────────────── */

  const handleSelect = (selected: string) => {
    if (selected === DEFAULT_KEY) {
      setShowCustom(false);
      onChange(setBorderRadius(className, ""));
    } else if (selected === CUSTOM_KEY) {
      setShowCustom(true);
      if (customInput) onChange(setBorderRadius(className, resolveInput(customInput)));
    } else {
      setShowCustom(false);
      onChange(setBorderRadius(className, selected));
    }
  };

  const commitCustom = (raw: string) => {
    const v = resolveInput(raw);
    if (v) {
      setCustomInput(raw.trim());
      onChange(setBorderRadius(className, v));
    }
  };

  /* ── Individual corner handlers ──────────────────────────── */

  const handleCornerFocus = (corner: Corner) => {
    setEditingCorner(corner);
    setEditValue(cornerValues[corner]);
  };

  const handleCornerCommit = (corner: Corner) => {
    const resolved = resolveInput(editValue);
    onChange(setCornerRadius(className, corner, resolved));
    setEditingCorner(null);
  };

  /* ── Toggle uniform ↔ individual ─────────────────────────── */

  const toggleMode = () => {
    if (isIndividual) {
      setIsIndividual(false);
      setShowCustom(false);
      onChange(toUniformRadius(className));
    } else {
      setIsIndividual(true);
      onChange(toIndividualCorners(className));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-1.5 pt-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Border Radius
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleMode}
          title={isIndividual ? "Uniform corners" : "Individual corners"}
        >
          <IndividualCornersIcon active={isIndividual} />
        </Button>
      </div>

      {isIndividual ? (
        /* ── Individual corners: 2 × 2 grid ──────────────────── */
        <div className="grid grid-cols-2 gap-1.5">
          {CORNERS.map((corner) => {
            const isEditing = editingCorner === corner;
            const display = isEditing ? editValue : cornerValues[corner] || "";
            const isRight = corner === "tr" || corner === "br";
            return (
              <div key={corner} className="flex items-center gap-1.5">
                {isRight ? null : <CornerIcon corner={corner} />}
                <Input
                  size="xs"
                  value={display}
                  placeholder="md"
                  className="flex-1 tabular-nums"
                  onFocus={() => handleCornerFocus(corner)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditValue(e.target.value)
                  }
                  onBlur={() => handleCornerCommit(corner)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      handleCornerCommit(corner);
                      e.currentTarget.blur();
                    }
                  }}
                />
                {isRight ? <CornerIcon corner={corner} /> : null}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Uniform mode: preset tabs + custom ──────────────── */
        <div className="space-y-1.5">
          <PresetTabs rows={ROWS} active={activeKey} onSelect={handleSelect} />

          {showCustom && (
            <Input
              size="xs"
              placeholder="e.g. 100px, 4%, clamp(...)"
              value={customInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomInput(e.target.value)
              }
              onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                commitCustom(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  commitCustom(e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
