"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import type { SlashCommandItem } from "./extensions/SlashCommand";

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandMenu = forwardRef(
  ({ items, command }: SlashCommandMenuProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) =>
            prev <= 0 ? items.length - 1 : prev - 1
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev >= items.length - 1 ? 0 : prev + 1
          );
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div className="z-50 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <div className="max-h-72 overflow-y-auto p-1">
          {items.map((item, index) => (
            <button
              key={item.title}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() => selectItem(index)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800">
                {item.icon}
              </span>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-zinc-400">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

SlashCommandMenu.displayName = "SlashCommandMenu";
