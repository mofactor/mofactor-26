"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

const IMG = "https://monofactor.com";

const journeys = [
  { year: "2025", location: "The North", country: "Norway", image: `${IMG}/5e90767d-2aa2-4b6e-ebd8-5cb18c688b00/format=auto,fit=scale-down,w=507,dpr=2` },
];

const gear = [
  "Sony a7R V",
  "DJI Mavic 3 Classic",
  "Sony 24-70mm GM f/2.8",
  "DJI Mini 4 Pro",
  "DJI RS3 Mini",
  "Sony 50mm f/1.8",
  "DJI Osmo 4",
  "Sigma 14-24mm f/1.4",
];

// Outer step (pill + gap) and inner step (pill only, no gap)
const STEP_MD = 572;
const STEP_SM = 277;
const IMG_STEP_MD = 500;
const IMG_STEP_SM = 245;

const getStep = () => typeof window !== "undefined" && window.innerWidth < 768 ? STEP_SM : STEP_MD;
const getImgStep = () => typeof window !== "undefined" && window.innerWidth < 768 ? IMG_STEP_SM : IMG_STEP_MD;

export default function Journeys() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: false });
  // Ref to the Embla container (the flex strip Embla translates).
  // We read its actual CSS transform to drive the inner carousel at the correct ratio,
  // avoiding the drift that scrollProgress() causes on non-uniform viewport widths.
  const emblaContainerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive the inner image carousel by reading the Embla container's actual
  // translateX and scaling it by imgStep/step (parallax ratio).
  // This is accurate at every point — during drag, during snap animation, and at rest.
  const syncInner = useCallback(() => {
    if (!emblaContainerRef.current || !innerRef.current) return;
    const matrix = new DOMMatrix(getComputedStyle(emblaContainerRef.current).transform);
    const outerX = matrix.m41; // actual translateX in px (negative while scrolled)
    const innerX = outerX * (getImgStep() / getStep());
    innerRef.current.style.transform = `translateX(${innerX}px)`;
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    const onScroll = () => syncInner();
    const onSettle = () => {
      // After the snap animation finishes, correct the inner carousel to the
      // exact index position — eliminates any ratio drift at end-of-carousel.
      const idx = emblaApi.selectedScrollSnap();
      if (innerRef.current) {
        innerRef.current.style.transform = `translateX(${-(idx * getImgStep())}px)`;
      }
    };
    const onPointerDown = () => setIsDragging(true);
    const onPointerUp = () => setIsDragging(false);

    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("settle", onSettle);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);

    syncInner(); // align on mount

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("settle", onSettle);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, syncInner]);

  // Auto-advance: every 3s after a 2s delay, stop at last slide.
  // Pauses permanently on first user interaction (matches original behaviour).
  useEffect(() => {
    if (!emblaApi) return;

    let stopped = false;
    const pause = () => { stopped = true; };
    emblaApi.on("pointerDown", pause);

    const startTimer = setTimeout(() => {
      autoTimerRef.current = setInterval(() => {
        if (stopped || !emblaApi.canScrollNext()) {
          if (autoTimerRef.current) clearInterval(autoTimerRef.current);
          return;
        }
        emblaApi.scrollNext();
      }, 3000);
    }, 2000);

    return () => {
      clearTimeout(startTimer);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      emblaApi.off("pointerDown", pause);
    };
  }, [emblaApi]);

  const active = journeys[activeIndex];

  return (
    <div className="bg-beige relative overflow-hidden py-20 md:py-32">
      {/* Solid beige block covering space left of the container on large screens */}
      <div className="bg-beige absolute top-0 left-0 z-10 hidden h-full w-[calc(100%-88vw)] md:block lg:w-[calc(((100%-1280px)/2)+3rem)] xl:w-[calc(((100%-1536px)/2)+6rem)]" />

      <div className="container">
        <div className="md:grid md:grid-cols-12 md:gap-6">

          {/* Col 1–2: gradient that fades the left edge of the carousel */}
          <div className="relative z-10 hidden md:col-span-2 md:grid">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-beige" />
          </div>

          {/* Col 3–12: main content */}
          <div className="md:col-span-12">

            <h2 className="text-[30px] md:text-[36px] font-normal leading-[1.1] tracking-[-0.015em] max-md:text-center">
              <span className="text-body opacity-75">Journeys.</span>
              <br />
              <span className="text-black dark:text-white">
                Life away from the screen.
              </span>
            </h2>

            {/* ── Carousel ─────────────────────────────────────────────────────── */}
            <div className="relative mt-8 md:mt-20" style={{ cursor: isDragging ? "grabbing" : "grab" }}>
              <div className="relative py-6 md:py-0">

                {/* ── Layer 1: Embla outline carousel ── */}
                <div ref={emblaRef} className="overflow-hidden">
                  <div ref={emblaContainerRef} className="flex">
                    {journeys.map((journey, index) => (
                      <div
                        key={index}
                        className="mr-8 w-[245px] shrink-0 md:mr-[72px] md:w-[500px]"
                      >
                        <div className="relative aspect-[507/710] w-full overflow-hidden rounded-full border border-black/5 dark:border-white/5">
                          {/* Inner border ring */}
                          <div className="pointer-events-none absolute inset-0 z-30 p-3 md:p-5">
                            <div className="relative h-full w-full rounded-full border border-black/5 dark:border-white/5" />
                          </div>
                          {/* Faint year / location / country text */}
                          <div className="absolute inset-0 z-20 flex flex-col justify-between py-6 text-center text-black opacity-20 dark:text-white md:py-12">
                            <p className="text-[12px] md:text-base">{journey.year}</p>
                            <p className="text-[28px] font-light leading-[1.5] md:text-[64px]">
                              {journey.location}
                            </p>
                            <p className="text-[12px] md:text-base">{journey.country}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Layer 2: Stationary overlay pill with parallax image carousel ── */}
                {/*
                  The pill stays fixed at the left. The inner flex strip is driven
                  by Embla's scrollProgress (0→1), scaled to the total image width,
                  creating the parallax: images pan inside the pill as the outline
                  carousel scrolls past.
                */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center md:justify-start">
                  <div className="relative w-[245px] md:w-[500px]">
                    <div className="relative aspect-[507/710] w-full overflow-hidden rounded-full">

                      <div
                        ref={innerRef}
                        className="flex h-full"
                        style={{ willChange: "transform" }}
                      >
                        {journeys.map((journey, index) => (
                          <div key={index} className="relative shrink-0 basis-full h-full">
                            <img
                              src={journey.image}
                              alt={journey.location}
                              draggable={false}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      {/* White inner border ring */}
                      <div className="pointer-events-none absolute inset-0 z-30 p-3 md:p-5">
                        <div className="relative h-full w-full rounded-full border border-white/20" />
                      </div>

                      {/* Active journey text (white, over the photo) */}
                      <div className="absolute inset-0 z-20 flex flex-col justify-between py-6 text-center text-white opacity-80 md:py-12">
                        <p className="text-[12px] md:text-base">{active.year}</p>
                        <p className="text-[28px] font-light leading-[1.5] md:text-[64px]">
                          {active.location}
                        </p>
                        <p className="text-[12px] md:text-base">{active.country}</p>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
            {/* ── End carousel ── */}

            {/* What's in my bag */}
            <div className="mt-12 max-w-xl max-md:mx-auto">
              <div className="text-center md:text-left">
                <p className="mb-5 text-[12px] font-light text-black/60">
                  What&apos;s in my bag
                </p>
                <div className="flex flex-wrap justify-center md:justify-start">
                  {gear.map((item) => (
                    <div
                      key={item}
                      className="mr-2 mb-2 rounded-full border border-black/5 px-2 py-1 font-mono text-[10px] text-black/60"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
