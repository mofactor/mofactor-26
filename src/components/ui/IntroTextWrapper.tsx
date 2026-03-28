import { cn } from "@/lib/utils";

interface IntroTextWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function IntroTextWrapper({ children, className }: IntroTextWrapperProps) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-6", className)}>
      <div className="lg:col-span-6 lg:col-start-2 text-[18px] space-y-12 lg:text-[22px]">
        {children}
      </div>
    </div>
  );
}
