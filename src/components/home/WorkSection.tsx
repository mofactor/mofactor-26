"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import DualLineHeading from "@/components/ui/DualLineHeading";
import LazyVideo from "@/components/ui/LazyVideo";
import { works } from "@/data/works";

const workItems = works;

export default function WorkSection() {
  const voidZeroVideoRef = useRef<HTMLVideoElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div>
      <DualLineHeading
        topLine="Recent work."
        bottomLine="From Pixels to Products."
        className="mb-6"
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-16">
        {/* Featured - Coder */}
        <article data-nav-theme="dark" className="relative dark:mix-blend-none overflow-hidden rounded-2xl overflow-hidden sm:col-span-2 md:aspect-[16/9] dark:bg-black">

          {/* Video container */}
          <div className="relative z-10 max-md:aspect-[1/1] md:absolute md:inset-0">
            <div className="h-full w-full">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              >
                <source src={workItems[0].videoSrc} type={workItems[0].videoSrc?.endsWith(".webm") ? "video/webm" : "video/mp4"} />
              </video>
            </div>
          </div>

          {/* Text overlay */}
          <div className="z-20 max-md:border-t max-md:border-white/5 max-md:px-6 max-md:py-6 absolute inset-0 flex flex-col justify-between p-6 dark:max-md:border-white/5">
            <h3 className="text-[20px] max-md:mb-2 text-white">
              {workItems[0].title}
            </h3>
            <p className="max-w-sm text-[14px] text-white opacity-80">
              {workItems[0].description}
            </p>
          </div>

          {/* Link overlay */}
          <Link
            href={workItems[0].href}
            className="absolute inset-0 z-30 inline-block"
          />
        </article>

        {/* Standard cards */}
        {workItems.slice(1).map((item, index) => {
          const isVoidZero = item.title === "VoidZero";
          const videoRef = isVoidZero ? voidZeroVideoRef : null;
          const whiteTextOnHover = item.hoverSrc || (!item.featured && item.videoSrc);

          return (
            <article
              key={item.title}
              data-nav-theme={item.darkHover && hoveredItem === item.title ? "dark" : undefined}
              onMouseEnter={() => setHoveredItem(item.title)}
              onMouseLeave={() => setHoveredItem(null)}
              className="group relative aspect-[1/1] overflow-hidden rounded-2xl bg-white md:col-span-1 dark:bg-zinc-950"
            >
              {/* Layer 1: Logo */}
              <div className="absolute inset-0 z-10 flex items-center justify-center transition-transform duration-300 ease-out dark:invert">
                <img
                  src={item.logoSrc}
                  alt={item.title}
                  loading="lazy"
                  className={`${item.logoClassName || "w-[45%]"} object-contain`}
                />
              </div>

              {/* Layer 2: Hover content - image */}
              {item.hoverSrc && (
                <div className="content-visibility-auto absolute inset-0 z-20 transition-all duration-300 ease-out opacity-0 scale-[1.1] group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
                  <img
                    src={item.hoverSrc}
                    alt={`${item.title} hover`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Layer 2: Hover content - video (VoidZero) */}
              {!item.featured && item.videoSrc && (
                <div className="content-visibility-auto absolute inset-0 z-20 transition-all duration-300 ease-out opacity-0 scale-[1.1] group-hover:opacity-100 group-hover:scale-100 pointer-events-none">
                  <LazyVideo
                    src={item.videoSrc}
                    posterSrc={item.videoPoster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Layer 3: Text overlay */}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4">
                <h3 className={`text-xl p-2 text-black transition-colors duration-300 ease-out dark:text-white ${whiteTextOnHover ? "group-hover:text-white" : ""}`}>
                  {item.title}
                </h3>
                <p className={`max-w-sm p-2 text-black/40 transition-all duration-300 ease-out dark:text-white/40 ${whiteTextOnHover ? "group-hover:text-white" : ""}`}>
                  {item.description}
                </p>
              </div>

              {/* Layer 4: Link overlay */}
              {item.href.startsWith("/") ? (
                <Link
                  href={item.href}
                  className="absolute inset-0 z-30"
                />
              ) : (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-30"
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
