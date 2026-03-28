import { cn } from "@/lib/utils";

function InsetWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl bg-zinc-125 p-0.5 border border-zinc-200 dark:border-none inset-shadow-xs dark:bg-zinc-1000",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function InsetWrapperLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-block px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function InsetWrapperContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-lg bg-white shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { InsetWrapper, InsetWrapperLabel, InsetWrapperContent };
