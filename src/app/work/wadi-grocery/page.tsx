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
import { Lightbox } from "@/components/ui/Lightbox";

export default function WadiGroceryPage() {
  return (
    <>
      <Header />
      <BottomNav items={[
        { label: "Intro", href: "#root" },
        { label: "Overview", href: "#overview" },
        { label: "Design", href: "#design" },
        { label: "Screens", href: "#screens" },
        { label: "Outcome", href: "#outcome" },
      ]} />
      <main>
        <article className="leading-">
          {/* Hero */}
          <section id="root" aria-labelledby="root-title" className="relative py-24">
            <div className="container relative">
              <header className="grid grid-cols-1 md:grid-cols-12 items-end gap-10 md:gap-6 pt-24 pb-20">
                <div className="md:col-span-8">
                  <HeroHeadline
                    line1="Mobile App Design"
                    line2="For Wadi Grocery" blink
                  />
                </div>
                <div className="text-muted-foreground-dark dark:text-muted-foreground md:col-span-4">
                  <BlinkText
                    text="Designing a seamless mobile grocery shopping experience for one of the Middle East's leading online supermarkets."
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
                      { label: "Role", value: "UI/UX Designer" },
                      { label: "Period", value: "2020 - 2021" },
                      { label: "Skills Utilized", value: "Mobile Design, UI Design, UX Research, Prototyping, Figma", asBadges: true },
                    ]}
                  />
                  <div data-nav-theme="dark" className="h-full w-full">
                    <Image
                      src="/works/wadi-grocery/wg-hero.jpg"
                      alt="Wadi Grocery hero"
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
                    Wadi Grocery is a mobile grocery delivery app serving the Middle East market. As the UI/UX Designer, I was responsible for crafting the end-to-end mobile experience — from browsing and product discovery to checkout and delivery tracking.
                  </p>
                  <p>
                    The goal was to create an intuitive, fast shopping experience that could handle thousands of products while keeping the interface clean and accessible.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
            </div>
            <div data-nav-theme="dark" className="pt-20 w-screen relative left-1/2 -translate-x-1/2">
              <Image src="/works/wadi-grocery/mobiles-wg.jpg" alt="Wadi Grocery mobile screens overview" width={1304} height={727} className="w-full" />
            </div>
          </section>

          {/* Design */}
          <section id="design" aria-labelledby="design-title" className="pb-24 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="md:min-w-[360px]"
                  blink
                  topLine="Design."
                  bottomLine="Typography & Color System."
                />

                <IntroTextWrapper>
                  <p>
                    Building a cohesive visual language was essential for the app. I defined a typography scale and color palette that balanced brand identity with readability and accessibility across all screen sizes.
                  </p>
                  <p>
                    The design system ensured consistency across every touchpoint — from product cards and category navigation to promotional banners and checkout flows.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>

              <div className="relative mt-24">
                <div className="flex flex-col gap-6">
                  <Image src="/works/wadi-grocery/wg-typo-colors.png" alt="Wadi Grocery typography and color system" width={1536} height={1087} className="w-full h-auto dark:hidden rounded-2xl" />
                  <Image src="/works/wadi-grocery/wg-typo-colors-dark.png" alt="Wadi Grocery typography and color system" width={1536} height={1087} className="w-full h-auto hidden dark:block rounded-2xl" />
                </div>
              </div>
            </div>
          </section>

          {/* Screens */}
          <section id="screens" aria-labelledby="screens-title" className="pb-24 bg-white dark:bg-zinc-950 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="md:min-w-[360px]"
                  blink
                  topLine="Screens."
                  bottomLine="Key App Interfaces."
                />

                <IntroTextWrapper>
                  <p>
                    The app features a streamlined shopping flow with intuitive product browsing, smart search, and a frictionless checkout process. Every screen was designed to minimize the steps between discovering a product and completing a purchase.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>

            </div>
            <div data-nav-theme="dark" className="mt-24 py-24 bg-white w-screen relative left-1/2 -translate-x-1/2">
              <Image src="/works/wadi-grocery/wg-iphone12s.jpg" alt="Wadi Grocery app screens on iPhone" width={1536} height={1087} className="w-full h-auto" />
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
                    The redesigned mobile experience brought a cleaner, more efficient shopping flow to Wadi Grocery users. The streamlined interface helped reduce friction in the purchase journey and improved overall usability.
                  </p>
                  <p>
                    This project reinforced my approach to mobile-first design — prioritizing speed, clarity, and ease of use in a high-frequency, content-heavy application.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
            </div>
          </section>
        </article>
        <WorkNavigation currentSlug="wadi-grocery" />
      </main>
      <Footer />
    </>
  );
}
