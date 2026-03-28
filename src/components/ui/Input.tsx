import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-white text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-zinc-950 dark:disabled:bg-input/80",
  {
    variants: {
      size: {
        xs: "h-6 rounded-sm px-2 text-xs",
        sm: "h-8 px-3 text-xsmd",
        default: "h-9 px-4 text-sm",
        lg: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Input({
  className,
  size,
  ...props
}: Omit<InputPrimitive.Props, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
