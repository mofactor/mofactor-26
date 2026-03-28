"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroHeadline from "@/components/ui/HeroHeadline";
import Footer from "@/components/Footer";
import Image from "next/image";
import ProjectMeta from "@/components/ui/ProjectMeta";
import BlinkText from "@/components/ui/BlinkText";
import DualLineHeading from "@/components/ui/DualLineHeading";
import ProcessCarousel from "@/components/ProcessCarousel";
import { Lightbox } from "@/components/ui/Lightbox";
import { Card } from "@/components/ui/Card";
import SectionHeaderWrapper from "@/components/ui/SectionHeaderWrapper";
import IntroTextWrapper from "@/components/ui/IntroTextWrapper";
import WorkNavigation from "@/components/WorkNavigation";

const processSlides = Array.from({ length: 15 }, (_, i) => ({
  src: `/works/flux/presentation/${i}.jpg`,
  alt: `Flux presentation ${i + 1}`,
}));

export default function FluxPage() {
  return (
    <>
      <Header />
      <BottomNav items={[
        { label: "Intro", href: "#root" },
        { label: "Overview", href: "#overview" },
        { label: "Process", href: "#process" },
        { label: "AI Utilization", href: "#ai-utilization" },
        { label: "Outcome", href: "#outcome" },
      ]} />
      <main>
        {/* Hero */}
        <article className="leading-">
          <section id="root" aria-labelledby="root-title" className="relative py-24">

            <div className="container relative">
              {/* Header */}
              <header className="grid grid-cols-1 md:grid-cols-12 items-end gap-10 md:gap-6 pt-24 pb-20">
                <div className="md:col-span-8">
                  <HeroHeadline
                    line1="Enhancing Design with AI"
                    line2="For the Flux Network" blink
                  />
                </div>
                <div className="text-muted-foreground-dark dark:text-muted-foreground md:col-span-4">
                  <BlinkText
                    text="Leading and transforming design for the blockchain powered compute and cloud infrastructure, utilizing Artificial Intelligence to enhance the design process and outcomes."
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
              {/* Video container */}
              <div className="flex flex-col md:flex-row items-start justify-center">

                <div className="relative w-full space-y-6 md:overflow-hidden">
                  <ProjectMeta
                    variant="grid"
                    className="max-w-full md:max-w-[380px] relative md:absolute md:top-6 md:left-6 z-10"
                    items={[
                      { label: "Role", value: "Creative Lead" },
                      { label: "Period", value: "2024 - 2025" },
                      { label: "Skills Utilized", value: "UI Design, AI, Product Optimization, Blender, Figma, Spline", asBadges: true },
                    ]}
                  />
                  <div data-nav-theme="dark" className="h-full w-full">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="rounded-2xl h-full w-full object-cover max-md:aspect-[1/1] md:aspect-[16/8.5]"
                    >
                      <source src="/works/flux/introsmaller2.webm" type="video/webm" />
                    </video>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Overview — leading-relaxed for the body text line height*/}
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
                    When I joined Flux, the company was already powering decentralized compute for thousands of node operators worldwide. What started as a blockchain-native infrastructure was rapidly evolving into a full-stack cloud platform — one where design needed to match the ambition of the technology.
                  </p>
                  <p>
                    I led the creative direction across the ecosystem: marketing sites, product and app layouts. By integrating AI tools into the design workflow — from generative imagery in Midjourney to 3D prototyping in Spline and Blender — I was able to move faster, explore more directions, and deliver work that elevated the brand across every touchpoint.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>

              <div data-nav-theme="dark" className="grid grid-cols-1 md:grid-cols-3 pt-20 gap-6">


                <Image src="/works/flux/two.png" alt="Overview" width={556} height={558} className=" rounded-2xl" />
                <Image src="/works/flux/one.png" alt="Overview" width={556} height={558} className=" rounded-2xl" />
                <Image src="/works/flux/three.png" alt="Overview" width={556} height={558} className="rounded-2xl" />
                <Image src="/works/flux/test2.jpg" alt="Overview" width={756} height={181} className="w-full md:col-span-3 rounded-2xl" />
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


                <IntroTextWrapper className="pb-20">
                  <p>
                    From deployment and and customer purchase journeys to marketing and product design, I enhanced the creative direction across the Flux ecosystem.
                  </p>
                  <p>
                    One of the first things I proposed is to implement a more frictionless deployment process for the Flux Cloud web application to improve the conversion rates without having to heavily refactor the existing front end.
                  </p>
                  <p className="md:pt-16 -mb-12 md:-mb-28 text-muted-foreground">
                    I've prepared a presentation to showcase quick wins over the existing outdated and poorly performing design and presented it to the team, .
                  </p>
                </IntroTextWrapper>

              </SectionHeaderWrapper>

              <ProcessCarousel slides={processSlides} breakout="full" lightbox autoScroll />

              <SectionHeaderWrapper className="pt-28">

                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"

                  bottomLine="Multi Product Design Work with AI."
                />


                <IntroTextWrapper>
                  <p>
                    I've also worked with various teams and stakeholders to deliver design across a range of products within the Flux ecosystem, incorporating AI into the design process to deliver effective designs in a short amount of time.
                  </p>
                  <p className="pt-16 text-muted-foreground">
                    Implemented spaceman themed crypto payment request platform, generating branded visuals via Midjourney.
                  </p>
                </IntroTextWrapper>

              </SectionHeaderWrapper>
              <div data-nav-theme="dark" className="relative mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <Lightbox images={[
                    { src: "/works/flux/mj-spaceman-cropped.jpg", alt: "Coin Request Midjourney Explorations" },
                    { src: "/works/flux/coinrequest-1.jpg", alt: "Coin Request Design - Welcome Screen" },
                    { src: "/works/flux/coinrequest-2.jpg", alt: "Coin Request Design - Welcome Screen" },
                  ]}>
                    <Image src="/works/flux/mj-spaceman-cropped.jpg" alt="Coin Request Midjourney Explorations" width={1294} height={460} className="md:col-span-2 w-full h-auto dark:border dark:border-2 dark:border-zinc-950 rounded-2xl" />
                    <Image src="/works/flux/coinrequest-1.jpg" alt="Coin Request Design - Welcome Screen" width={1536} height={1087} className="w-full h-auto dark:border dark:border-2 dark:border-zinc-950 rounded-2xl" />
                    <Image src="/works/flux/coinrequest-2.jpg" alt="Coin Request Design - Welcome Screen" width={1536} height={1087} className="w-full h-auto dark:border dark:border-2 dark:border-zinc-950 rounded-2xl" />
                  </Lightbox>

                </div>
              </div>
            </div>
          </section>
          {/* AI Utilization */}
          <section id="ai-utilization" aria-labelledby="ai-utilization-title" className="pb-24 bg-white dark:bg-zinc-950 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>

                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"
                  thinkingWords={["Blending", "Designing", "Clauding"]}
                  thinkingPosition="after"
                  blink
                  topLine="Pushing AI."
                  bottomLine="For Max Productivity."
                />


                <IntroTextWrapper>
                  <p>

                    <BlinkText text="I've helped speed up the process of marketing department by utilizing AI tools such as Nano Banana Pro, Claude and MidJourney from generating branded visuals from single source blender render to building quick and simple web apps that reduce costs and time." timingConfig={{
                      fadeTime: 0.35,
                      randomHoldMax: 0.3,
                      blinkTimeMax: 1,
                    }} />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Designed and modeled the original Blender render that was later used as a visual reference to AI image generation tools to create a series of follow up marketing visuals.
                  </p>
                </IntroTextWrapper>

              </SectionHeaderWrapper>
              <div data-nav-theme="dark" className="relative mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <Lightbox images={[
                    { src: "/works/flux/blender-flux2.jpg", alt: "Original Flux Blender Render" },
                    { src: "/works/flux/mj2.jpg", alt: "MidJourney generated visuals + minor edits" },
                    { src: "/works/flux/mj1.jpg", alt: "MidJourney generated visuals + minor edits" },
                    { src: "/works/flux/og-cloud.jpg", alt: "MidJourney generated visuals + minor edits" },
                    { src: "/works/flux/og-cloud2.jpg", alt: "MidJourney generated visuals + minor edits" },
                    { src: "/works/flux/og-cloud3.jpg", alt: "MidJourney generated visuals + minor edits" },
                  ]}>
                    <Image src="/works/flux/blender-flux2.jpg" alt="Original Flux Blender Render" width={1800} height={800} className="md:col-span-2 w-full h-auto dark:border rounded-2xl" />
                    <Image src="/works/flux/mj2.jpg" alt="MidJourney generated visuals + minor edits" width={1694} height={485} className="md:col-span-2 w-full h-auto dark:border rounded-2xl" />
                    <Image src="/works/flux/mj1.jpg" alt="MidJourney generated visuals + minor edits" width={1728} height={1080} className="w-full h-auto dark:border rounded-2xl" />
                    <Image src="/works/flux/og-cloud.jpg" alt="MidJourney generated visuals + minor edits" width={1200} height={750} className="w-full h-auto dark:border rounded-2xl" />
                    <Image src="/works/flux/og-cloud2.jpg" alt="MidJourney generated visuals + minor edits" width={1800} height={1125} className="w-full h-auto dark:border rounded-2xl" />
                    <Image src="/works/flux/og-cloud3.jpg" alt="MidJourney generated visuals + minor edits" width={1800} height={1125} className="w-full h-auto dark:border rounded-2xl" />

                  </Lightbox>

                </div>
              </div>
              <SectionHeaderWrapper>

                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"

                  bottomLine="Taking AI Further."
                />


                <IntroTextWrapper>
                  <p>
                    We used to have Figma seats paid for every Marketing team just to edit the text on the above visuals and export to post into socials. So I've built a mini app that eliminates the need for Figma, replicating the process in the app.
                  </p>
                  <p className="pt-16 text-muted-foreground">
                    Based on original Figma design template, I've built the BannerMaker app for marketing so they can populate the social media visuals with ease. <a href="https://bannermaker.app.runonflux.io/" target="_blank" rel="noopener noreferrer" className="underline">See Live here</a>.
                  </p>
                </IntroTextWrapper>


              </SectionHeaderWrapper>
              <Card className="w-full rounded-2xl mt-6 md:mt-12">
                <Lightbox images={[
                  { src: "/works/flux/bannermaker.png", alt: "Original Flux Blender Render" },
                ]}>
                  <Image src="/works/flux/bannermaker.png" alt="Original Flux Blender Render" width={1728} height={964} className=" w-full h-auto dark:border rounded-2xl" />
                </Lightbox>
              </Card>
              <SectionHeaderWrapper className="pb-16">

                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"

                  bottomLine="Various Designs."
                />

                <div className="grid gap-6 lg:grid-cols-6">
                  <div className="lg:col-span-6 lg:col-start-2">
                    <div className="text-[18px] space-y-12 lg:text-[22px] ">
                      <p>
                        I've also worked on the redesign of the platform websites, also utilizing the AI aided visuals.
                      </p>

                    </div>
                  </div>
                </div>


              </SectionHeaderWrapper>

              <div data-nav-theme="dark" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Lightbox images={[
                  { src: "/works/flux/home.jpg", alt: "Original Flux Blender Render" },
                  { src: "/works/flux/pouw2.jpg", alt: "MidJourney generated visuals + minor edits" },
                  { src: "/works/flux/rewards.jpg", alt: "Original Flux Blender Render" },
                  { src: "/works/flux/resources.jpg", alt: "Original Flux Blender Render" },
                ]}>
                  <Image src="/works/flux/home.jpg" alt="Original Flux Blender Render" width={756} height={436} className="w-full h-auto dark:border rounded-2xl" />
                  <Image src="/works/flux/pouw2.jpg" alt="Original Flux Blender Render" width={1512} height={873} className="w-full h-auto dark:border rounded-2xl" />
                  <Image src="/works/flux/rewards.jpg" alt="Original Flux Blender Render" width={1512} height={873} className="w-full h-auto dark:border rounded-2xl" />
                  <Image src="/works/flux/resources.jpg" alt="Original Flux Blender Render" width={1512} height={873} className="w-full h-auto dark:border rounded-2xl" />


                </Lightbox>
              </div>
            </div>
          </section>
          <section id="outcome" className="pb-24 leading-relaxed">
            <div className="container">

              <SectionHeaderWrapper>

                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"
                  topLine="The Impact."
                  bottomLine="Productivity & Outcome."
                />

                <IntroTextWrapper>
                  <p>
                    The work spanned the full Flux ecosystem: Product flows, marketing sites, and internal tooling. All delivered at a pace made possible by integrating AI at every step. A streamlined deployment UX improved conversion rates with minimal engineering lift. The BannerMaker app cut Figma licensing costs for the marketing team and gave them full creative autonomy.
                  </p>
                  <p>A Blender-to-Midjourney visual pipeline kept branded content flowing consistently across channels. The result: a brand and product suite that now looks and feels as ambitious as the technology behind it.</p>
                </IntroTextWrapper>


              </SectionHeaderWrapper>
            </div>
          </section>

        </article>
        <WorkNavigation currentSlug="flux" />
      </main>
      <Footer />
    </>
  );
}
