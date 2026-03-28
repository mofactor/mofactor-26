"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Link2, Check } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.59 3.501 6.158 3.186-4.41.634-5.863 3.434-3.296 6.244 2.698 2.952 4.663.908 5.514-1.085.43-1.009.633-2.087.706-2.608.073.521.276 1.599.706 2.608.851 1.993 2.816 4.037 5.514 1.085 2.567-2.81 1.114-5.61-3.296-6.244 2.568.315 5.373-.559 6.158-3.186C19.622 9.418 20 4.458 20 3.768c0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C12.046 4.747 9.087 8.686 8 10.8h4z" />
    </svg>
  );
}

const BAR_TOP = 160; // 10rem — fixed vertical position from viewport top

export function ShareBar({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = barRef.current;
    if (!sentinel || !bar) return;

    // The sentinel sits inside the "full" div alongside TiptapRenderer.
    // TiptapRenderer wraps content in its own <div class="blog-prose">.
    // That inner blog-prose's direct children get max-width: --container-2xl (672px).
    // Wide/full children get wider max-widths.
    const contentArea = sentinel.parentElement;
    if (!contentArea) return;

    let contentInView = false;

    const update = () => {
      const proseEl = contentArea.querySelector(".blog-prose") as HTMLElement | null;
      if (!proseEl) return;

      // Find first narrow text element to measure the prose left edge
      const textEl = proseEl.querySelector(
        ":scope > p, :scope > h2, :scope > h3, :scope > ul, :scope > ol, :scope > blockquote",
      );
      if (!textEl) return;

      const textLeft = textEl.getBoundingClientRect().left;

      // Position bar: icon column (32px) + 16px gap to the left of text
      bar.style.left = `${textLeft - 88}px`;

      // Hide if content area isn't in view or hasn't scrolled to bar level
      const contentRect = contentArea.getBoundingClientRect();
      if (!contentInView || contentRect.top > BAR_TOP || contentRect.bottom < BAR_TOP) {
        bar.style.opacity = "0";
        bar.style.pointerEvents = "none";
        return;
      }

      // Check if a wider-than-text element overlaps vertically with the bar
      const barRect = bar.getBoundingClientRect();
      let overlapped = false;

      for (const child of proseEl.children) {
        const r = child.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Element extends into the left margin (wider than narrow text column)
        const isWide = r.left < textLeft - 10;
        const overlapsVertically = r.top < barRect.bottom + 48 && r.bottom > barRect.top - 48;
        if (isWide && overlapsVertically) {
          overlapped = true;
          break;
        }
      }

      bar.style.opacity = overlapped ? "0" : "1";
      bar.style.pointerEvents = overlapped ? "none" : "auto";
    };

    // Track when content area enters/exits the viewport
    const obs = new IntersectionObserver(
      ([e]) => {
        contentInView = e.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    obs.observe(contentArea);

    // Throttle scroll updates with rAF
    let raf: number;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    const onResize = () => update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    update();

    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/blog/${slug}`
      : `/blog/${slug}`;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      label: "Share on X",
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: XIcon,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: LinkedInIcon,
    },
    {
      label: "Share on Bluesky",
      href: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
      icon: BlueskyIcon,
    },
  ];

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div ref={sentinelRef} className="h-0 w-0 overflow-hidden" />

      <div
        ref={barRef}
        className="fixed z-10 hidden xl:flex flex-col items-center gap-1 transition-opacity duration-200"
        style={{ top: BAR_TOP, opacity: 0, pointerEvents: "none" }}
      >
        {shareLinks.map(({ label, href, icon: Icon }) => (
          <Button
            key={label}
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            aria-label={label}
            className="!text-zinc-400 hover:!text-zinc-900 dark:hover:!text-zinc-100"
            render={
              <a href={href} target="_blank" rel="noopener noreferrer" />
            }
          >
            <Icon className="size-4" />
          </Button>
        ))}

        <div className="my-1 h-px w-5 bg-zinc-200 dark:bg-zinc-800" />

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy link"
          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          onClick={copyLink}
        >
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Link2 className="size-4" />
          )}
        </Button>
      </div>
    </>
  );
}
