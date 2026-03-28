"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/Carousel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Lightbox, type LightboxImage } from "@/components/ui/Lightbox";
import AutoScroll from "embla-carousel-auto-scroll";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { cn } from "@/lib/utils";

type ProcessSlide = {
  src: string;
  alt: string;
  navTheme?: "dark" | "light";
};

type FadeMask = "left" | "right" | "both";

const fadeMaskStyle: Record<FadeMask, string> = {
  left: "[mask-image:linear-gradient(to_right,transparent,gray_96px)]",
  right: "[mask-image:linear-gradient(to_left,transparent,black_80px)]",
  both: "[mask-image:linear-gradient(to_right,transparent,80px,black_160px,black_calc(100%-160px),transparent_calc(100%-80px))]",
};

function CarouselNav() {
  const { api, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();

  const stopAutoScroll = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoScroll = (api?.plugins() as any)?.autoScroll;
    if (autoScroll?.isPlaying()) autoScroll.reset();
  };

  const handlePrev = () => {
    stopAutoScroll();
    scrollPrev();
  };

  const handleNext = () => {
    stopAutoScroll();
    scrollNext();
  };

  return (
    <div className="flex justify-start gap-2 pb-7">
      <Button
        variant="outline"
        size="icon"
        className="rounded-lg px-6 touch-manipulation active:scale-95"
        disabled={!canScrollPrev}
        onClick={handlePrev}
      >
        <ChevronLeft />
        <span className="sr-only">Previous slide</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-lg px-6 touch-manipulation active:scale-95"
        disabled={!canScrollNext}
        onClick={handleNext}
      >
        <ChevronRight />
        <span className="sr-only">Next slide</span>
      </Button>
    </div>
  );
}

function AutoScrollDarkGuard() {
  const { api } = useCarousel();

  useEffect(() => {
    if (!api) return;

    const html = document.documentElement;

    let reiniting = false;
    const sync = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const autoScroll = (api.plugins() as any)?.autoScroll;
      if (!autoScroll) return;
      const isDark = html.classList.contains("dark");
      if (isDark) {
        if (!reiniting) {
          reiniting = true;
          api.reInit();
          reiniting = false;
        }
        autoScroll.stop();
      } else {
        autoScroll.play();
      }
    };

    sync();

    api.on("reInit", sync);
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      api.off("reInit", sync);
      observer.disconnect();
    };
  }, [api]);

  return null;
}

export default function ProcessCarousel({ slides, fadeMask, disableFadeMaskDark, lightbox = false, autoScroll = false, disableAutoScrollDark = false, breakout }: { slides: ProcessSlide[]; fadeMask?: FadeMask; disableFadeMaskDark?: boolean; lightbox?: boolean; autoScroll?: boolean; disableAutoScrollDark?: boolean; breakout?: "right" | "full" }) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const lightboxImages: LightboxImage[] = slides.map((s) => ({
    src: s.src,
    alt: s.alt,
  }));

  const plugins = [WheelGesturesPlugin()];
  if (autoScroll) plugins.unshift(AutoScroll({ speed: 1 }));

  return (
    <>
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={plugins}
        className={cn(breakout === "right" && "mr-[calc(-50vw+50%)]", breakout === "full" && "pl-4 mx-[calc(-50vw+50%)]")}
        style={{ "--slide-spacing": "1.5rem" } as React.CSSProperties}
      >
        <div className={cn(breakout === "full" && "container mx-auto -translate-x-4")}>
          <CarouselNav />
        </div>
        {autoScroll && disableAutoScrollDark && <AutoScrollDarkGuard />}
        <CarouselContent viewportClassName={cn("pl-24 -translate-x-24 -mr-24", fadeMask ? fadeMaskStyle[fadeMask] : undefined, fadeMask && disableFadeMaskDark && "dark:![mask-image:none] dark:pl-0 dark:translate-x-0 dark:mr-0")}>

          {slides.map((slide, i) => (
            <CarouselItem key={i} className="py-2 basis-full sm:basis-1/2 lg:basis-1/3">
              <Card
                className={cn("overflow-hidden rounded-xl md:p-1.5", lightbox && "cursor-pointer")}
                {...(slide.navTheme ? { "data-nav-theme": slide.navTheme } : {})}
                {...(lightbox ? { onClick: () => { setLbIndex(i); setLbOpen(true); } } : {})}
              >
                <CardContent className="p-0">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={1920}
                    height={1080}
                    className="object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {lightbox && (
        <Lightbox
          images={lightboxImages}
          open={lbOpen}
          onOpenChange={setLbOpen}
          index={lbIndex}
          onIndexChange={setLbIndex}
        />
      )}
    </>
  );
}
