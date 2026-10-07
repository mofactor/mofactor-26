import Autoplay from "embla-carousel-autoplay";
import DualLineHeading from "@/components/ui/DualLineHeading";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/Carousel";
import { Button } from "@/components/ui/Button";
import { Img } from "@/components/ui/Img";
import type { Testimonial } from "@/data/testimonials";
import type { IslandImage } from "@/lib/island-image";

type TestimonialWithAvatar = Testimonial & { avatarImage: IslandImage };

function AuthorBlock({ testimonial: t }: { testimonial: TestimonialWithAvatar }) {
  const content = (
    <div className="flex items-center gap-5 pt-6">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <Img
          image={t.avatarImage}
          alt={t.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="space-y-0.5">
        <p className="text-[16px] font-semibold text-black dark:text-white">
          {t.name}
        </p>
        <p className="text-[14px] text-body">
          {t.title}
        </p>
      </div>
    </div>
  );

  if (t.link) {
    return (
      <a href={t.link} target="_blank" rel="noopener noreferrer" className="group/author inline-flex items-center gap-2 hover:opacity-75 transition-opacity">
        {content}
        <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover/author:opacity-100 group-hover/author:translate-x-0 text-body" />
      </a>
    );
  }

  return content;
}

function TestimonialNav() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useCarousel();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full touch-manipulation active:scale-95"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
      >
        <ChevronLeft />
        <span className="sr-only">Previous testimonial</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full touch-manipulation active:scale-95"
        disabled={!canScrollNext}
        onClick={scrollNext}
      >
        <ChevronRight />
        <span className="sr-only">Next testimonial</span>
      </Button>
    </div>
  );
}

// Island: the testimonial carousel. Avatars arrive pre-optimized from Recommendations.astro.
export default function RecommendationsCarousel({ testimonials }: { testimonials: TestimonialWithAvatar[] }) {
  return (
    <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 12000, stopOnInteraction: true })]}>
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-16 pb-8">
        {/* Left column — heading + nav */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <DualLineHeading
            topLine="Shoutouts."
            bottomLine="What stakeholders and teammates say about me."
          />
          <div className="max-w-sm text-body py-6 space-y-4">
            <p>
              Here&apos;s a collection of actual recommendations from the stakeholders and colleagues. Please be informed that none of these recommendations are placeholders and/or fake but real feedback.
            </p>
            <p>
              You are welcome to corroborate these recommendations with the authors.
            </p>
          </div>
          <TestimonialNav />
        </div>

        {/* Right column — carousel */}
        <div className="md:col-span-6 md:col-start-7 overflow-hidden">
          <CarouselContent>
            {testimonials.map((t, i) => (
              <CarouselItem key={i} className="basis-full">
                <div className="flex flex-col gap-6">
                  {/* Decorative quote mark */}
                  <span
                    className="text-[72px] leading-none font-bold text-zinc-900 dark:text-zinc-400 select-none [-webkit-text-stroke:1.5px] [-webkit-text-fill-color:transparent]"
                  >
                    &ldquo;
                  </span>

                  {/* Quote */}
                  <blockquote className="flex flex-col gap-4 text-black dark:text-white">
                    {t.headline && (
                      <p className="text-[28px] md:text-3xl leading-[1.2] tracking-[-0.015em] pb-4">
                        {t.headline}
                      </p>
                    )}
                    {t.quote.split("\n\n").map((paragraph, pi, arr) => (
                      <p
                        key={pi}
                        className="text-[18px] md:text-[20px] font-normal leading-[1.5] text-body"
                      >
                        {paragraph}
                        {pi === arr.length - 1 && "\u201D"}
                      </p>
                    ))}
                  </blockquote>

                  {/* Author */}
                  <AuthorBlock testimonial={t} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </div>
    </Carousel>
  );
}
