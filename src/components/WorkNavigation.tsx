import Link from "next/link";
import { works } from "@/data/works";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface WorkNavigationProps {
  currentSlug: string;
}

export default function WorkNavigation({ currentSlug }: WorkNavigationProps) {
  const currentPath = `/work/${currentSlug}`;
  const currentIndex = works.findIndex((w) => w.href === currentPath);

  const prev = currentIndex > 0 ? works[currentIndex - 1] : works[works.length - 1];
  const next = currentIndex < works.length - 1 ? works[currentIndex + 1] : works[0];

  return (
    <nav aria-label="Case studies" className="container mb-24">
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between py-10 md:py-8">
          {/* Previous */}
          <Link
            href={prev.href}
            className="group inline-flex items-end gap-4 pr-6 transition-opacity hover:opacity-60"
          >
            <ArrowLeft className="size-4 mb-1 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            <div className="min-w-0">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Previous
              </span>
              <span className="block text-lg text-foreground font-medium truncate">
                {prev.title}
              </span>
            </div>
          </Link>

          {/* Next */}
          <Link
            href={next.href}
            className="group inline-flex items-end gap-4 transition-opacity pl-6 hover:opacity-60"
          >
            <div className="min-w-0 text-right">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Next
              </span>
              <span className="block text-lg text-foreground font-medium truncate">
                {next.title}
              </span>
            </div>
            <ArrowRight className="size-4 shrink-0 mb-1 text-muted-foreground transition-transform ease-out group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
