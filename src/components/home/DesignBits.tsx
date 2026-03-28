"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import DualLineHeading from "@/components/ui/DualLineHeading";
import LazyVideo from "@/components/ui/LazyVideo";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, useCarousel } from "@/components/ui/Carousel";
import { Button } from "@/components/ui/Button";
import { Lightbox, type LightboxImage } from "@/components/ui/Lightbox";
import { designBitsItems, type DesignBitItem } from "@/data/designBits";

const TWEEN_FACTOR_BASE = 0.1;

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

function MetaLine({ item }: { item: DesignBitItem }) {
  if (item.comingSoon) {
    return (
      <>
        <span>Coming soon</span>
        {item.category && (
          <>
            <span className="mx-[0.35em]">·</span>
            <span>{item.category}</span>
          </>
        )}
      </>
    );
  }
  return (
    <>
      {item.date && <span>{item.date}</span>}
      {item.category && (
        <>
          {item.date && <span className="mx-[0.35em]">·</span>}
          <span>{item.category}</span>
        </>
      )}
      {item.readTime && (
        <>
          <span className="mx-[0.35em]">·</span>
          <span>{item.readTime}</span>
        </>
      )}
    </>
  );
}

function BitSliderNav() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        className="rounded-lg px-6 touch-manipulation active:scale-95"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
      >
        <ChevronLeft />
        <span className="sr-only">Previous slide</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-lg px-6 touch-manipulation active:scale-95"
        disabled={!canScrollNext}
        onClick={scrollNext}
      >
        <ChevronRight />
        <span className="sr-only">Next slide</span>
      </Button>
    </div>
  );
}

function BitSlider({ item, autoplayDelay = 4000 }: { item: DesignBitItem; autoplayDelay?: number }) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [emblaApi, setEmblaApi] = useState<EmblaCarouselType>();
  const tweenFactor = useRef(0);

  const slides = item.slides!;
  const lightboxImages: LightboxImage[] = slides.map((s) => ({
    src: s.fullSrc,
    alt: s.alt,
  }));

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  const tweenScale = useCallback((api: EmblaCarouselType) => {
    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();

    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach((slideIndex) => {
        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopItem) => {
            const target = loopItem.target();
            if (slideIndex === loopItem.index && target !== 0) {
              const sign = Math.sign(target);
              if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
              if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
            }
          });
        }

        const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
        const scale = numberWithinRange(tweenValue, 0, 1).toString();
        const tweenNode = api.slideNodes()[slideIndex].firstElementChild as HTMLElement;
        if (tweenNode) {
          tweenNode.style.transform = `scale(${scale})`;
          tweenNode.style.opacity = scale;
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    emblaApi
      .on("reInit", setTweenFactor)
      .on("reInit", tweenScale)
      .on("scroll", tweenScale)
      .on("slideFocus", tweenScale);

    return () => {
      emblaApi.slideNodes().forEach((node) => {
        const tweenNode = node.firstElementChild as HTMLElement;
        if (tweenNode) {
          tweenNode.style.transform = "";
          tweenNode.style.opacity = "";
        }
      });
    };
  }, [emblaApi, setTweenFactor, tweenScale]);

  return (
    <>
      <Carousel
        variant="centered"
        opts={{ loop: true }}
        plugins={[Autoplay({ delay: autoplayDelay, stopOnInteraction: true })]}
        setApi={setEmblaApi}
        className="flex flex-1 flex-col"
        style={{ "--slide-spacing": "1rem" } as React.CSSProperties}
      >
        {/* Header with title + nav */}
        <div className="relative p-5 pb-4 flex items-end justify-between">
          <div>
            <div className="text-body dark:text-body-dark mb-2 h-[16px] overflow-hidden text-[12px]">
              <MetaLine item={item} />
            </div>
            <h3 className="max-w-xs text-[20px] leading-[1.35] dark:text-white">
              {item.title}
            </h3>
          </div>
          <BitSliderNav />
        </div>

        {/* Slides */}
        <div
          className="content-visibility-auto relative flex flex-1 items-center pb-8 pt-2"
          {...(item.navTheme ? { "data-nav-theme": item.navTheme } : {})}
        >
          <div className="w-full overflow-hidden rounded-xl">
            <CarouselContent>
              {slides.map((slide, i) => (
                <CarouselItem
                  key={i}
                  className="cursor-pointer"
                  onClick={() => {
                    setLbIndex(i);
                    setLbOpen(true);
                  }}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={1050}
                    height={690}
                    className="w-full rounded-xl"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
        </div>
      </Carousel>

      {item.description && (
        <p className="px-5 pb-5 leading-[1.5] text-body">
          {item.description}
        </p>
      )}

      <Lightbox
        images={lightboxImages}
        open={lbOpen}
        onOpenChange={setLbOpen}
        index={lbIndex}
        onIndexChange={setLbIndex}
      />
    </>
  );
}

function BitVideo({ item }: { item: DesignBitItem }) {
  return (
    <>
      <div className="relative p-5 pb-4">
        <div className="text-body mb-2 h-[16px] overflow-hidden text-[12px]">
          <MetaLine item={item} />
        </div>
        <h3 className="max-w-xs text-[20px] leading-[1.35] dark:text-white">
          {item.title}
        </h3>
      </div>
      <div
        className="p-5 pt-0"
        {...(item.navTheme ? { "data-nav-theme": item.navTheme } : {})}
      >
        <LazyVideo
          src={item.video!}
          autoPlay
          loop
          muted
          playsInline
          className={`w-full rounded-xl object-cover ${item.videoClassName ?? ""}`}
          style={{ aspectRatio: "1050/720" }}
        />
      </div>
      {item.description && (
        <p className="px-5 pb-5 leading-[1.5] text-body">
          {item.description}
        </p>
      )}
    </>
  );
}

function BitStatic({ item }: { item: DesignBitItem }) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const lightboxImages: LightboxImage[] = (item.images ?? []).map((img) => ({
    src: img.fullSrc,
    alt: img.alt,
  }));

  return (
    <>
      <div className="relative p-5 pb-4">
        <div className="text-body mb-2 h-[16px] overflow-hidden text-[12px]">
          <MetaLine item={item} />
        </div>
        <h3 className="max-w-xs text-[20px] leading-[1.35] dark:text-white">
          {item.title}
        </h3>
      </div>
      {item.images && (
        <div
          className="p-5 pt-0"
          {...(item.navTheme ? { "data-nav-theme": item.navTheme } : {})}
        >
          {item.images.map((img, i) => (
            <Image
              key={i}
              src={img.src}
              alt={img.alt}
              width={1050}
              height={690}
              className="w-full cursor-pointer rounded-xl"
              onClick={() => {
                setLbIndex(i);
                setLbOpen(true);
              }}
            />
          ))}
        </div>
      )}
      {item.description && (
        <p className="px-5 pb-5 leading-[1.5] text-body">
          {item.description}
        </p>
      )}
      <Lightbox
        images={lightboxImages}
        open={lbOpen}
        onOpenChange={setLbOpen}
        index={lbIndex}
        onIndexChange={setLbIndex}
      />
    </>
  );
}

export default function DesignBits() {
  return (
    <div>
      <DualLineHeading
        topLine="Design bits."
        bottomLine="What I'm lately working on."
      />

      <div className="mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {designBitsItems.map((item, index) => {
            const spanFull = item.slides && item.slides.length > 5;
            return (
              <article
                key={index}
                className={`group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-925${spanFull ? " sm:col-span-2" : ""}`}
              >
                {item.slides ? (
                  <BitSlider item={item} autoplayDelay={spanFull ? 6000 : 3500} />
                ) : item.video ? (
                  <BitVideo item={item} />
                ) : (
                  <BitStatic item={item} />
                )}
              </article>
            );
          })}
        </div>
        {/* <p className="text-center text-sm mt-24 text-muted-foreground mt-8">More bits coming soon</p> */}
      </div>
    </div>
  );
}
