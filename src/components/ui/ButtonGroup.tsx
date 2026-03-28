"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*]:rounded-none [&>:first-child]:rounded-l-sm [&>:last-child]:rounded-r-sm [&>*:not(:first-child)]:border-l-0",
        vertical:
          "flex-col [&>*]:rounded-none [&>:first-child]:rounded-t-sm [&>:last-child]:rounded-b-sm [&>*:not(:first-child)]:border-t-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export { ButtonGroup, buttonGroupVariants };
