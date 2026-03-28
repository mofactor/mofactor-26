import { cn } from "@/lib/utils";

interface SectionHeaderWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionHeaderWrapper({ children, className }: SectionHeaderWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-12 md:gap-0 md:flex-row items-start justify-center pt-24", className)}>
      {children}
    </div>
  );
}
