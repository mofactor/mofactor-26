"use client";

import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Label } from "@/components/ui/Label";
import { WidthDefault, WidthWide, WidthFull } from "@/components/icons/WidthIcons";
import type { WidthMode } from "./extensions/figureClasses";

const MODES: { value: WidthMode; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { value: "default", label: "Default", icon: WidthDefault },
  { value: "wide", label: "Wide", icon: WidthWide },
  { value: "full", label: "Full", icon: WidthFull },
];

const activeOutline =
  "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-100";

const activeGhost =
  "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-100";

const inactiveGhost =
  "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

const activeTabs =
  "bg-white dark:bg-zinc-925 text-foreground shadow-border border-zinc-300 dark:border-input dark:bg-input/30";

const inactiveTabs =
  "text-foreground/40 hover:text-foreground border-transparent bg-transparent dark:text-muted-foreground dark:hover:text-foreground";

interface WidthModePickerProps {
  value: WidthMode;
  onChange: (mode: WidthMode) => void;
  variant?: "icon" | "label" | "inline";
  styleVariant?: "default" | "tabs";
  buttonVariant?: "outline" | "secondary" | "ghost" | "default";
}

export function WidthModePicker({ value, onChange, variant = "icon", styleVariant = "default", buttonVariant }: WidthModePickerProps) {
  const isLabel = variant === "label";
  const isInline = variant === "inline";
  const isTabs = styleVariant === "tabs";

  return (
    <div className={`${isInline ? "grid grid-cols-3 items-center" : isLabel ? "" : "space-y-2"}`}>
      {!isLabel && (
        isInline
          ? <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Width</span>
          : <Label className="mb-1.5 inline-block text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Width</Label>
      )}
      {isTabs ? (
        <div className={`inline-flex w-full items-center rounded-md bg-muted p-0.5 border border-zinc-200 dark:border-zinc-1000 inset-shadow-xs ${isInline ? "col-span-2" : ""}`}>
          {MODES.map((mode) => {
            const active = value === mode.value;
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => onChange(mode.value)}
                title={mode.label}
                className={`flex-1 cursor-pointer rounded-sm py-1 text-sm font-medium transition-all ${isLabel ? "px-2.5" : "flex items-center justify-center"
                  } ${isLabel ? "" : isInline ? "h-6" : "h-7"} ${active ? activeTabs : inactiveTabs
                  }`}
              >
                {isLabel ? (
                  <span className="text-xs">{mode.label}</span>
                ) : (
                  <Icon className={isInline ? "size-3.5" : "size-4"} />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <ButtonGroup className={`${isLabel ? "w-fit gap-1 [&>*]:rounded-md!" : isInline ? "col-span-2 w-full" : "w-full"}`}>
          {MODES.map((mode) => {
            const active = value === mode.value;
            const Icon = mode.icon;
            return (
              <Button
                key={mode.value}
                variant={isLabel ? "ghost" : buttonVariant ?? "secondary"}
                size={isLabel ? "sm" : isInline ? "icon-xs" : "icon-sm"}
                onClick={() => onChange(mode.value)}
                title={mode.label}
                className={`flex-1 ${isLabel
                  ? active ? activeGhost : inactiveGhost
                  : active ? activeOutline : ""
                  }`}
              >
                {isLabel ? (
                  <span className="text-xs">{mode.label}</span>
                ) : (
                  <Icon className={isInline ? "size-3.5" : "size-5"} />
                )}
              </Button>
            );
          })}
        </ButtonGroup>
      )}
    </div>
  );
}
