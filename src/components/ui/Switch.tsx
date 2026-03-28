"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "xs" | "sm" | "default";
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  size = "default",
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange ? (v: boolean) => onCheckedChange(v) : undefined}
      disabled={disabled}
      className={cn(
        "group inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "bg-zinc-200 data-[checked]:bg-zinc-900 dark:bg-zinc-700 dark:data-[checked]:bg-zinc-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "xs" ? "h-3.5 w-7" : size === "sm" ? "h-4 w-7" : "h-5 w-9",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white dark:bg-zinc-950 shadow-sm transition-transform relative",
          "before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:transition-colors before:content-['']",
          "before:bg-zinc-200 data-[checked]:before:bg-zinc-900 dark:before:bg-zinc-700 dark:data-[checked]:before:bg-zinc-100",
          size === "xs"
            ? "size-2.5 data-[checked]:translate-x-3.5 before:size-1"
            : size === "sm"
              ? "size-3 data-[checked]:translate-x-3 before:size-1"
              : "size-4 data-[checked]:translate-x-4 before:size-1.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
