"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroHeadline from "@/components/ui/HeroHeadline";
import Footer from "@/components/Footer";
import Image from "next/image";
import ProjectMeta from "@/components/ui/ProjectMeta";
import BlinkText from "@/components/ui/BlinkText";
import DualLineHeading from "@/components/ui/DualLineHeading";
import SectionHeaderWrapper from "@/components/ui/SectionHeaderWrapper";
import IntroTextWrapper from "@/components/ui/IntroTextWrapper";
import WorkNavigation from "@/components/WorkNavigation";
import ProcessCarousel from "@/components/ProcessCarousel";
import { Lightbox } from "@/components/ui/Lightbox";

const processSlides = Array.from({ length: 6 }, (_, i) => ({
  src: `/works/airbit/presentation/${i}.jpg`,
  alt: `Airbit presentation ${i + 1}`,
}));

export default function AirbitPage() {
  return (
    <>
      <Header />
      <BottomNav items={[
        { label: "Intro", href: "#root" },
        { label: "Overview", href: "#overview" },
        { label: "Process", href: "#process" },
        { label: "Extend", href: "#extend" },
        { label: "Outcome", href: "#outcome" },
      ]} />
      <main>
        <article className="leading-">
          {/* Hero */}
          <section id="root" aria-labelledby="root-title" className="relative py-24">
            <div className="container relative md:top-10">
              <header className="grid grid-cols-1 md:grid-cols-12 items-end gap-10 md:gap-6 pt-24 pb-20">
                <div className="md:col-span-8">
                  <HeroHeadline
                    line1="End-to-End Design"
                    line2="For Airbit" blink
                  />
                </div>
                <div className="text-muted-foreground-dark dark:text-muted-foreground md:col-span-4">
                  <BlinkText
                    text="End-to-end design for the world's leading marketplace for beats, enabling creators to sell music globally."
                    mode="words"
                    delay={0.1}
                    timingConfig={{
                      fadeTime: 0.35,
                      randomHoldMax: 0.3,
                      blinkTimeMax: 1,
                    }}
                  />
                </div>
              </header>

              <div className="flex flex-col md:flex-row items-start justify-center">
                <div className="relative w-full space-y-6 md:overflow-hidden">
                  <ProjectMeta
                    variant="grid"
                    className="max-w-full md:max-w-[380px] relative md:absolute md:bottom-1 md:left-6 z-10"
                    items={[
                      { label: "Role", value: "Head of Design" },
                      { label: "Period", value: "2022 - 2024" },
                      { label: "Skills Utilized", value: "UI Design, UX Research, Prototyping, Design Systems, Figma", asBadges: true },
                    ]}
                  />
                  <div data-nav-theme="dark" className="h-full w-full">
                    <Image
                      src="/works/airbit/airbitcover.jpg"
                      alt="Airbit cover"
                      width={1800}
                      height={1000}
                      quality={100}
                      className="rounded-2xl h-full w-full object-cover max-md:aspect-[1/1]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Overview */}
          <section id="overview" aria-labelledby="overview-title" className="pb-24 bg-white dark:bg-zinc-950 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="md:min-w-[360px]"
                  topLine="Overview:"
                  bottomLine="Backstory of the work."
                  blink={{ mode: "words" }}
                />

                <IntroTextWrapper>
                  <p>
                    <a href="https://airbit.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary transition-colors">Airbit</a> is a marketplace platform for producers to monetize their music. As their Head of Design, I’ve been responsible for defining the visual language of the products within the platform, as well as helping designers in the team maintain a growing design system.
                  </p>

                </IntroTextWrapper>
              </SectionHeaderWrapper>
              <div data-nav-theme="dark" className="pt-20">


                <Image src="/works/airbit/airbitsite.jpg" alt="Overview" width={1304} height={727} className=" rounded-2xl" />

              </div>
            </div>
          </section>

          {/* Process */}
          <section id="process" aria-labelledby="process-title" className="pb-24 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>

                <DualLineHeading
                  className="md:min-w-[360px]"
                  blink
                  topLine="Process."
                  bottomLine="How I Kick Things Off."
                />


                <IntroTextWrapper className="">
                  <p>
                    My initial work with Airbit was define what was missing first:<br /> A unified design language.
                  </p>
                  <p>To kick that off, I’ve presented a methodology document I’ve put together for Airbit, which outlined a Design Language development supported by a general Design System. You can preview it below:</p>

                </IntroTextWrapper>

              </SectionHeaderWrapper>

              <ProcessCarousel slides={processSlides} breakout="full" lightbox autoScroll />

              <SectionHeaderWrapper className="pt-28">

                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"

                  bottomLine="Shaping the DS for Airbit Studio."
                />


                <IntroTextWrapper>
                  <p>
                    Once our roadmaps are defined, I started setting up the design layouts and DS structure for the use across multiple areas of the Platform, initial work starting from Studio, which is the backend for Airbit producers.
                  </p>
                  <p className="pt-0 text-muted-foreground">

                    Airbit Studio is where everyone manages their music for sale, includes multiple wizards to enable smooth and seamless experience across every step.
                  </p>
                </IntroTextWrapper>

              </SectionHeaderWrapper>
              <div className="relative mt-12">
                <div className="flex flex-col gap-6">

                  <Lightbox images={[
                    { src: "/works/airbit/studio1.png", alt: "Coin Request Midjourney Explorations" },
                    { src: "/works/airbit/studio2.png", alt: "Coin Request Design - Welcome Screen" },
                  ]}>
                    <Image src="/works/airbit/studio1.png" alt="Coin Request Design - Welcome Screen" width={1536} height={1087} className="w-full h-auto rounded-2xl" />
                    <Image src="/works/airbit/studio2.png" alt="Coin Request Design - Welcome Screen" width={1536} height={1087} className="w-full h-auto rounded-2xl" />
                  </Lightbox>

                </div>
              </div>
            </div>
          </section>

          {/* Extend */}
          <section id="extend" aria-labelledby="extend-title" className="pb-24 bg-white dark:bg-zinc-950 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>

                <DualLineHeading
                  className="md:min-w-[360px]"
                  blink
                  topLine="Extend."
                  bottomLine="Marketplace & Landings."
                />


                <IntroTextWrapper className="">
                  <p>
                    On the user facing side, Airbit had multiple marketplaces that needed a face lift. I’ve continued the work on designing the overall look and feel and functionality of those marketplaces, aligning the components designs with the design system.
                  </p>
                  <p>I’ve also helped Marketing team with the landing pages needed for different use cases.</p>

                </IntroTextWrapper>

              </SectionHeaderWrapper>




              <div className="relative mt-12">
                <div data-nav-theme="dark" className="flex flex-col gap-6">

                  <Lightbox images={[
                    { src: "/works/airbit/abitmp.jpg", alt: "Coin Request Midjourney Explorations" },
                    { src: "/works/airbit/abitlandings.jpg", alt: "Coin Request Design - Welcome Screen" },
                  ]}>
                    <Image src="/works/airbit/abitmp.jpg" alt="Coin Request Design - Welcome Screen" width={1536} height={1087} className="w-full h-auto rounded-2xl" />
                    <Image src="/works/airbit/abitlandings.jpg" alt="Coin Request Design - Welcome Screen" width={1536} height={1087} className="w-full h-auto rounded-2xl" />
                  </Lightbox>

                </div>
              </div>
            </div>
          </section>

          {/* Outcome */}
          <section id="outcome" aria-labelledby="outcome-title" className="pb-24 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"
                  topLine="The Impact."
                  bottomLine="Productivity & Outcome."
                />

                <IntroTextWrapper>
                  <p>
                    My time in Airbit helped me not only reinforce my leadership skills, but also learn much about the vertical.
                  </p>
                  <p>
                    With a close collaboration with the product managers and stakeholders, we’ve been able to lay the foundations of a unified design across all platforms of the product.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
            </div>
          </section>
        </article>
        <WorkNavigation currentSlug="airbit" />
      </main>
      <Footer />
    </>
  );
}
