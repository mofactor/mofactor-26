"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Collapsible({
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root defaultOpen={defaultOpen} className={cn("flex flex-col", className)}>
      <CollapsiblePrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
        {title}
        <ChevronDown className="size-3.5 text-zinc-400 transition-transform duration-200 group-data-[panel-open]:rotate-180 dark:text-zinc-500" />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Panel className="flex flex-col gap-3 px-4 pb-3">
        {children}
      </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
  );
}
