"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-none select-none",
  {
    variants: {
      variant: {
        default: "bg-zinc-925 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "bg-white border-transparent dark:bg-transparent shadow-border hover:text-accent-foreground dark:bg-zinc-900 dark:border dark:border-zinc-800 dark:hover:bg-zinc-800",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 rounded-md px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/* Resets visual properties in dark mode before applying darkVariant styles */
const darkReset =
  "dark:border-0 dark:bg-transparent dark:text-inherit dark:shadow-none dark:hover:bg-transparent dark:hover:text-inherit dark:focus-visible:ring-0";

/* Each variant's resolved dark-mode appearance (all classes dark:-prefixed) */
const darkVariantStyles: Record<ButtonVariant, string> = {
  default: "dark:bg-zinc-850 dark:text-zinc-50 dark:hover:bg-primary/90",
  destructive:
    "dark:bg-destructive/60 dark:text-white dark:hover:bg-destructive/90 dark:focus-visible:ring-destructive/40",
  outline:
    "dark:border dark:border-zinc-800 dark:bg-transparent dark:shadow-xs dark:hover:bg-zinc-800 dark:hover:text-accent-foreground",
  secondary:
    "dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80",
  ghost: "dark:hover:bg-accent/50 dark:hover:text-accent-foreground",
  link: "dark:text-primary dark:underline-offset-4 dark:hover:underline",
};

function stripDarkClasses(classes: string) {
  return classes
    .split(" ")
    .filter((c) => !c.startsWith("dark:"))
    .join(" ");
}

function Button({
  className,
  variant = "default",
  darkVariant,
  size = "default",
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { darkVariant?: ButtonVariant }) {
  const base = buttonVariants({ variant, size });

  const finalClassName = darkVariant
    ? cn(
      stripDarkClasses(base),
      darkReset,
      darkVariantStyles[darkVariant],
      className,
    )
    : cn(base, className);

  return (
    <ButtonPrimitive
      data-slot="button"
      className={finalClassName}
      {...props}
    />
  );
}

export { Button, buttonVariants };
