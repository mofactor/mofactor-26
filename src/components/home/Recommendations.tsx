"use client";

import Image from "next/image";
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

type Testimonial = {
  headline?: string;
  quote: string;
  name: string;
  title: string;
  avatar: string;
  link?: string;
};

const testimonials: Testimonial[] = [
  {
    headline: "Onur is one of the most product-minded designers I’ve worked with.",
    quote:
      "As our lead product designer, he moves fast without sacrificing clarity or strategy. We collaborated on a decentralized platform offering, and I was impressed by how quickly he translated complex infrastructure into a clean, intuitive product experience.\n\nHe thinks beyond UI into systems, growth, and execution.\n\nI’d work with him again anytime.",
    name: "Lukas Mattecka",
    title: "Lead Business Dev at InFlux Technologies",
    avatar: "/assets/headshots/lukas-mattecka.jpeg",
    link: "https://linkedin.com/in/lukas-mattecka",
  },
  {
    headline: "Quick, Intuitive, & Great to Work With",
    quote:
      "Onur was the lead designer for a new service/product that we developed and launched at Automattic, and from the very beginning, he was an incredibly helpful, thoughtful, and creative colleague.\n\nHe suffered the challenges of getting so much feedback, sometimes conflicting, sometimes off the mark, sometimes probably completely unhelpful, but in the end he absorbed all of that mess and turned it into a clean, striking, and very much on-brand flow that exists on the platform today.\n\nHe's quick and intuitive with his design ideas, welcoming to all, and just fun to work with. I hope to have the chance to work with him again someday.",
    name: "Marjorie R. Asturias",
    title: "Head of Operations — WordPress.com",
    link: "https://www.linkedin.com/in/marjorieasturias",
    avatar: "/assets/headshots/marjorie.jpeg",
  },
  {
    headline: "He Founded Design @Udemy",
    quote:
      "During his time at Udemy, Onur Oztaskiran served as the design lead, taking on projects that required both a high level of creativity and strong technical skills, often under very tight deadlines.\n\nHe is proficient in all relevant design and has consistently shown initiative in executing new skills, expanding his abilities beyond traditional design. He took Udemy from 2012 to where it is today.",
    name: "Goksel Eryigit",
    title: "Senior Software Engineer at Udemy",
    avatar: "/assets/headshots/geryit.png",
    link: "https://www.linkedin.com/in/geryit/",
  },
  {
    headline: "A Designer Who Leads, Not Follows",
    quote:
      "With so many self-claimed designers these days, it's hard to find true creatives. Onur certainly understands the importance of attention to detail and is definitely one that leads, rather than follows.\n\nI'd recommend Onur to those seeking stunning, crisp and innovative designs. Having worked with and recommended Onur on several projects, both personal and client work, I can say that I have enjoyed the experience.",
    name: "David Knight",
    title: "CTO, Buildstack",
    avatar: "/assets/headshots/david-knight.png",
  },
];

function AuthorBlock({ testimonial: t }: { testimonial: Testimonial }) {
  const content = (
    <div className="flex items-center gap-5 pt-6">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <Image
          src={t.avatar}
          alt={t.name}
          fill
          className="object-cover"
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

export default function Recommendations() {
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
