"use client";

import { useState, useMemo, useRef } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { X } from "lucide-react";
import { ALL_CLASSES } from "@/lib/tw-classes";
import { inputVariants } from "@/components/ui/Input";

interface ClassPickerProps {
  value: string;
  onChange: (classes: string) => void;
  variant?: "light" | "dark";
}

export function ClassPicker({ value, onChange, variant = "light" }: ClassPickerProps) {
  const [input, setInput] = useState("");
  const justSelected = useRef(false);
  const userInitiatedRef = useRef(false);
  const currentClasses = useMemo(() => value.split(" ").filter(Boolean), [value]);

  const suggestions = useMemo(() => {
    if (!input) return [];
    return ALL_CLASSES.filter(
      (c) => c.includes(input) && !currentClasses.includes(c),
    ).slice(0, 15);
  }, [input, currentClasses]);

  const addClass = (cls: string) => {
    if (cls && !currentClasses.includes(cls)) {
      onChange([...currentClasses, cls].join(" "));
    }
    justSelected.current = true;
    setInput("");
  };

  const removeClass = (cls: string) => {
    onChange(currentClasses.filter((c) => c !== cls).join(" "));
  };

  return (
    <div className="">
      {/* Current classes */}
      {currentClasses.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-2">
          {currentClasses.map((cls) => (
            <span
              key={cls}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs ${variant === "dark" ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-zinc-100 dark:bg-zinc-800"}`}
            >
              {variant === "dark" && <span className="text-indigo-400 dark:text-indigo-500">dark:</span>}
              {cls}
              <button
                onClick={() => removeClass(cls)}
                className="cursor-pointer text-zinc-400 hover:text-red-500"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Combobox */}
      <Combobox.Root
        value={null}
        open={suggestions.length > 0}
        onOpenChange={() => { }}
        onValueChange={(val) => {
          if (val) addClass(val as string);
        }}
        inputValue={input}
        onInputValueChange={(val) => {
          if (justSelected.current) {
            justSelected.current = false;
            return;
          }
          if (userInitiatedRef.current) {
            userInitiatedRef.current = false;
            setInput(val);
          }
        }}
        items={suggestions}
        autoHighlight
      >
        <Combobox.Input
          placeholder="Type a class name..."
          className={inputVariants({ size: "sm" })}
          onInput={() => { userInitiatedRef.current = true; }}
          onKeyDown={(e) => {
            if (e.key === " " && input.trim()) {
              e.preventDefault();
              addClass(input.trim());
            }
            if (e.key === "Enter" && input.trim() && suggestions.length === 0) {
              e.preventDefault();
              addClass(input.trim());
            }
          }}
        />
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4}>
            <Combobox.Popup className="z-50 max-h-48 w-[var(--anchor-width)] overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item
                    key={item}
                    value={item}
                    className="cursor-pointer rounded px-2 py-1 font-mono text-xs text-zinc-600 select-none data-[highlighted]:bg-zinc-100 dark:text-zinc-400 dark:data-[highlighted]:bg-zinc-800"
                  >
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
