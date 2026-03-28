"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import HeroHeadline from "@/components/ui/HeroHeadline";
import Footer from "@/components/Footer";
import ProjectMeta from "@/components/ui/ProjectMeta";
import BlinkText from "@/components/ui/BlinkText";
import DualLineHeading from "@/components/ui/DualLineHeading";
import SectionHeaderWrapper from "@/components/ui/SectionHeaderWrapper";
import IntroTextWrapper from "@/components/ui/IntroTextWrapper";
import WorkNavigation from "@/components/WorkNavigation";
import ProcessCarousel from "@/components/ProcessCarousel";
import { Lightbox } from "@/components/ui/Lightbox";
import Image from "next/image";

const processSlides = Array.from({ length: 9 }, (_, i) => ({
  src: `/works/solitonic/branding/${i}.jpg`,
  alt: `Solitonic branding ${i + 1}`,
}));

export default function SolitonicPage() {
  return (
    <>
      <Header />
      <BottomNav items={[
        { label: "Intro", href: "#root" },
        { label: "Overview", href: "#overview" },
        { label: "Branding", href: "#branding" },
        { label: "Digital", href: "#digital" },
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
                    line1="Branding & Digital"
                    line2="For Solitonic" blink
                  />
                </div>
                <div className="text-muted-foreground-dark dark:text-muted-foreground md:col-span-4">
                  <BlinkText
                    text="Branding and digital design for Solitonic, a company that uses swarm intelligence to create better AI."
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
                      { label: "Role", value: "Brand & Digital Designer" },
                      { label: "Period", value: "2023" },
                      { label: "Skills Utilized", value: "Branding, 3D, Motion Design, Figma", asBadges: true },
                    ]}
                  />
                  <div data-nav-theme="dark" className="h-full w-full">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="rounded-2xl h-full w-full object-cover max-md:aspect-[1/1] md:aspect-[16/12]"
                    >
                      <source src="/works/solitonic/farm.webm" type="video/webm" />
                    </video>
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
                    Solitonic is a company that harnesses swarm intelligence to build better AI systems. I was brought on to shape the brand identity and digital presence — translating complex, research-driven technology into a visual language that feels both approachable and forward-thinking.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
              <div data-nav-theme="dark" className="grid grid-cols-1 md:grid-cols-3 pt-20 gap-6">

                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="rounded-2xl w-full object-cover"
                >
                  <source src="/works/solitonic/particles.webm" type="video/webm" />
                </video>
                <Image src="/works/solitonic/grid-solitonic2.jpg" alt="Overview" width={556} height={558} className=" aspect-square rounded-2xl" />
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="rounded-2xl w-full object-cover"
                >
                  <source src="/works/solitonic/sdrone2.webm" type="video/webm" />
                </video>
              </div>
              <div data-nav-theme="dark" className="pt-8 dark:mix-blend-screen">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="rounded-2xl w-full object-cover"
                >
                  <source src="/works/solitonic/drone-deconstruct.webm" type="video/webm" />
                </video>
              </div>

            </div>
          </section>

          {/* Branding */}
          <section id="branding" aria-labelledby="branding-title" className="pb-24 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper className="pb-12">
                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"
                  topLine="Branding."
                  bottomLine="The Brand Identity."
                />

                <IntroTextWrapper>
                  <p>
                    The branding and digital design work helped Solitonic establish a distinct visual identity in the competitive AI landscape, communicating the innovative nature of their swarm intelligence approach while maintaining clarity and professionalism.
                  </p>
                  <p>
                    Every element of the brand reflects the continuity and interconnected flow inherent to swarm intelligence — from the fluid mark that evokes coordinated movement to the carefully chosen typography that balances technical precision with forward-thinking energy, grounding the identity in the language of modern technology.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
              <ProcessCarousel slides={processSlides} breakout="full" lightbox autoScroll />
              <div data-nav-theme="dark" className="grid grid-cols-8 pt-20 gap-6">
                <Image src="/works/solitonic/solitonic-board.jpg" alt="Overview" width={556} height={558} className="w-full h-full object-cover col-span-2 rounded-2xl" />
                <Image src="/works/solitonic/solitonic-stripe.jpg" alt="Overview" width={556} height={558} className="w-full h-full object-cover col-span-6 rounded-2xl" />

              </div>
            </div>

          </section>

          <section id="digital" aria-labelledby="digital-title" className="pb-24 bg-white dark:bg-zinc-950 leading-relaxed">
            <div className="container">
              <SectionHeaderWrapper>
                <DualLineHeading
                  className="flex-1 md:min-w-[360px]"
                  topLine="Digital."
                  bottomLine="The Web Presence."
                />

                <IntroTextWrapper>
                  <p>
                    The website was designed to mirror the fluidity and intelligence at the core of Solitonic's technology — translating the brand's visual language into an interactive, scroll-driven experience that guides visitors through complex concepts with clarity and momentum.
                  </p>
                  <p>
                    Modern layouts, purposeful motion, and a restrained color palette keep the focus on the science while reinforcing credibility. Every interaction was crafted to feel seamless and intentional, giving Solitonic a digital presence as sophisticated as the systems they build.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
              <div data-nav-theme="dark" className="grid grid-cols-1 pt-20 gap-6">

                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="rounded-2xl w-full object-cover"
                >
                  <source src="/works/solitonic/sitescroll2.webm" type="video/webm" />
                </video>
                <Image src="/works/solitonic/site-laptop.jpg" alt="Overview" width={556} height={558} className="w-full object-cover rounded-2xl" />

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
                  bottomLine="The Boosting Effect."
                />

                <IntroTextWrapper>
                  <p>
                    The branding and digital design work helped Solitonic establish a distinct visual identity in the competitive AI landscape, communicating the innovative nature of their swarm intelligence approach while maintaining clarity and professionalism.
                  </p>
                  <p>
                    By unifying the visual language across brand collateral, motion assets, and the digital platform, the project gave Solitonic a cohesive foundation to confidently present their technology to investors, partners, and the broader research community — positioning them as a credible, design-forward player in the emerging swarm-AI space.
                  </p>
                </IntroTextWrapper>
              </SectionHeaderWrapper>
            </div>
          </section>
        </article>
        <WorkNavigation currentSlug="solitonic" />
      </main>
      <Footer />
    </>
  );
}
