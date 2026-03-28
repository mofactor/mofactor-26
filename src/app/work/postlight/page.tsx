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

export default function PostlightPage() {
  return (
    <>
      <Header />
      <BottomNav items={[
        { label: "Intro", href: "#root" },
        { label: "Overview", href: "#overview" },
        { label: "Progress", href: "#progress" },
        { label: "Design", href: "#design" },
        { label: "Outcome", href: "#outcome" },
      ]} />
      <main>
        <article className="leading-relaxed">
          {/* Hero */}
          <section id="root" aria-labelledby="root-title" className="relative py-24">
            <div className="container relative">
              <header className="grid grid-cols-1 md:grid-cols-12 items-end gap-10 md:gap-6 pt-24 pb-20">
                <div className="md:col-span-8">
                  <HeroHeadline
                    line1="Revamping the Web Presence"
                    line2="For Postlight" blink
                  />
                </div>
                <div className="text-muted-foreground-dark dark:text-muted-foreground md:col-span-4">
                  <BlinkText
                    text="Redesigning the web presence for a digital strategy and engineering firm, later acquired by NTT DATA."
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
                      { label: "Role", value: "Senior Designer" },
                      { label: "Period", value: "2021 - 2022" },
                      { label: "Skills Utilized", value: "UI Design, UX Research, Design Systems, Prototyping, Figma", asBadges: true },
                    ]}
                  />
                  <div data-nav-theme="dark" className="h-full w-full">
                    <Image
                      src="/works/postlight/postlightcover.jpg"
                      alt="Postlight cover"
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
                    <a href="https://nttdata.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary transition-colors">Postlight</a> was product studio in New York with significant clients like Vice Media, New York City MTA, Bloomberg and Mailchimp, later acquired by NTT DATA. As their Senior Visual Designer, I have been responsible with completely redesigning the digital branding. A fresh new website design was phase one.
                  </p>
                  <p>

                    With the Postlight CEO Rich Ziade’s words:
                    “Don’t just make it look good, make it tell the stories with our clients”.

                    Researching many competitors and approaches, and understand how Postlight solved problems for their clients with solutions, I took on a journey to come up with a solid design solution. Started out with initial drafts and mockups.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
            </div>
            <div data-nav-theme="dark" className="pt-20 w-screen relative left-1/2 -translate-x-1/2">
              <Image src="/works/postlight/pl-ux-1.jpg" alt="Postlight UX exploration 1" width={1536} height={1087} className="w-full h-auto" />
            </div>
            <div className="w-screen relative left-1/2 -translate-x-1/2">
              <Image src="/works/postlight/pl-ux-2.jpg" alt="Postlight UX exploration 2" width={1536} height={1087} className="w-full h-auto" />
            </div>
          </section>

          {/* Process */}
          <section id="progress" aria-labelledby="progress-title" className="pb-24 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="md:min-w-[360px]"
                  blink
                  topLine="Progress."
                  bottomLine="Refinind the Design."
                />

                <IntroTextWrapper>
                  <p>
                    Postlight’s clients are big. Like, big big. After numerous explorations, it was obvious that going too creative and experimental will not work. The design needed to display the impact of Postlight’s success stories.
                  </p>
                  <p>While some bits of the design suggestions were provided by the Postlight’s branding agency Unfold, we ended up with repetitive visuals that had to be tackled. So I continued to iterate on the designs.</p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>

              <div className="relative mt-12">
                <div className="flex flex-col gap-6 bg-white py-8 rounded-2xl">
                  <Lightbox images={[
                    { src: "/works/postlight/pl-second-try.jpg", alt: "Postlight design iteration" },
                  ]}>

                    <Image src="/works/postlight/pl-second-try.jpg" alt="Postlight design iteration" width={1536} height={1087} className="w-full h-auto rounded-2xl" />
                  </Lightbox>
                </div>
              </div>
            </div>
          </section>

          {/* Design */}
          <section id="design" aria-labelledby="design-title" className="pb-24 bg-white dark:bg-zinc-950 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="md:min-w-[360px]"
                  blink
                  topLine="Design."
                  bottomLine="Visual System & Screens."
                />

                <IntroTextWrapper>
                  <p>
                    Postlight shareholders’ feedbacks helped grow the design exponentially. As we moved back and forth through the design process, we were able to define and apply improvements screen-by-screen.
                  </p>
                  <p>
                    After 2 months of work, a design language that is unique, storytelling and easy on the eye was the outcome.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
              <Image src="/works/postlight/Colors-and-Typo.png" alt="Postlight colors and typography system" width={1536} height={1087} className="mt-24 w-full h-auto dark:hidden rounded-2xl" />
              <Image src="/works/postlight/colors-and-typo-dark.png" alt="Postlight colors and typography system" width={1536} height={1087} className="mt-24 w-full h-auto hidden dark:block rounded-2xl" />
              <div data-nav-theme="dark" className="mt-20 w-screen bg-white pt-12 relative left-1/2 -translate-x-1/2">

                <Image src="/works/postlight/xdr-screens.jpg" alt="Postlight screen designs" width={1536} height={1087} className="w-full h-auto" />
                <Image src="/works/postlight/pl-final-tablets.jpg" alt="Postlight screen designs" width={1536} height={1087} className="w-full h-auto" />
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
                  bottomLine="And Outcome."
                />

                <IntroTextWrapper>
                  <p>

                    Overall design and relaunch of the website is highly welcomed by both the Postlight shareholders and their respected clients, as they were also involved for final approval of their cases, making me proud of the outcome.
                  </p>
                  <p>
                    Working closely with Postlight's leadership team reinforced my belief in building products where design and development inform each other from day one — resulting in a site that's as thoughtfully built as it is visually refined.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>

            </div>
          </section>
        </article>
        <WorkNavigation currentSlug="postlight" />
      </main>
      <Footer />
    </>
  );
}
