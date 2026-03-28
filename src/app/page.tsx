import dynamic from "next/dynamic";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Hero from "@/components/home/Hero";
import HeroShader from "@/components/home/HeroShader";
import LogoBar from "@/components/home/LogoBar";
import WorkSection from "@/components/home/WorkSection";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

const DesignBits = dynamic(() => import("@/components/home/DesignBits"));
const About = dynamic(() => import("@/components/home/About"));
const Recommendations = dynamic(() => import("@/components/home/Recommendations"));
const Contact = dynamic(() => import("@/components/home/Contact"));
const BlogPosts = dynamic(() => import("@/components/home/BlogPosts"));

export default function Home() {
  return (
    <>
      <Header />
      {/* Toggle nav style: keep one, comment out the other */}
      {/* <Sidebar /> */   /* vertical — fixed left, desktop only (hidden md:block) */}
      <BottomNav /> {/* horizontal — fixed bottom, shown on all breakpoints */}
      <main>
        {/* Hero */}
        <div id="root" className="relative pt-32 pb-16 md:pt-48 md:pb-28 min-h-[40svh]">
          <HeroShader />
          <div className="container relative z-12">
            <div className="grid grid-cols-1 md:grid-cols-12 items-end gap-10 md:gap-6">
              <div className="md:col-span-8">
                <Hero />
              </div>
              <div className="md:col-span-4">
                <p className="text-muted-foreground-dark pb-2">
                  Welcome to Monofactor, portfolio of Onur Oztaskiran, a Senior Product Designer with 15+ years of experience in design and leadership.
                </p>
              </div>
            </div>
            <div className="mt-16 md:mt-28">
              <div className="md:grid md:grid-cols-12 md:gap-6">
                <div className="md:col-span-12">
                  <LogoBar />
                </div>
              </div>
              {/* <div className="mt-7 grid grid-cols-[1fr_auto_1fr] mx-6 items-end gap-3 md:gap-4">
                <div className="border-b border-l border-muted-foreground/30 mb-[0.35em] rounded-bl-xl h-6" />
                <p className="text-xs text-muted-foreground/80 text-center uppercase whitespace-nowrap">those are not fake</p>
                <div className="border-b border-r border-muted-foreground/30 mb-[0.35em] rounded-br-xl h-6" />
              </div> */}
            </div>
          </div>
        </div>

        {/* Work */}
        <div id="work" className=" rounded-t-4xl py-20 md:py-24 md:pt-16 dark:bg-transparent">
          <div className="container">
            <div className="md:grid md:grid-cols-12 md:gap-6">
              <div className="md:col-span-12">
                <WorkSection />
              </div>
            </div>
          </div>
        </div>

        {/* Design Bits */}
        <div id="designbits" className="bg-white dark:bg-zinc-950  py-20 md:py-32">
          <div className="container">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-12">
                <DesignBits />
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div id="about" className="py-24">
          <About />
        </div>

        {/* Recommendations */}
        <div id="recommendations" className="bg-white dark:bg-zinc-950  py-20 md:py-32">
          <div className="container">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-12">
                <Recommendations />
              </div>
            </div>
          </div>
        </div>

        {/* Journal & Contact */}
        <div id="journal" className="py-20 md:py-32">
          <div className="container">
            <BlogPosts />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="md:col-span-12">
                <Contact />
              </div>
            </div>
          </div>
        </div>


      </main>
      <Footer />
    </>
  );
}
