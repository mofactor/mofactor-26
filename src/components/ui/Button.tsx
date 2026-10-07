import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./variants";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

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
