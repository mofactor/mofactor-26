import Image from "next/image";
import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ToptalBadge from "@/components/ToptalBadge";

export default function About() {
  return (
    <div className="about">
      {/* H2 in standard container */}
      <div className="container">
        <div className="md:grid md:grid-cols-12 md:gap-6">
          <div className="md:col-span-12">
            <h2 className="text-[30px] md:text-[36px] font-normal leading-[1.3]">
              <span className="text-body opacity-75 dark:text-body-dark">
                About me.
              </span>
              <br />
              <span className="text-black dark:text-white">
                Design that converts.
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Photo + text area in wider container */}
      <div data-nav-theme="dark" className="max-md:bg-black sm:w-full sm:max-w-full md:mx-auto md:px-12 lg:max-w-[1280px] xl:max-w-[1536px]">

        <div className="relative mt-12 md:mt-20">
          <div className="relative grid md:grid-cols-2 min-h-[80svh]">
            {/* Photo — absolute, spans full width behind both columns */}
            <div className="content-visibility-auto z-10 rounded-2xl  overflow-hidden max-md:order-1 md:absolute md:inset-0 relative">
              <Image
                src="/assets/about/onuro-right.jpg"
                alt="Onur Oztaskiran Portrait"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover max-md:hidden dark:hidden"
              />
              <Image
                src="/assets/about/onuro-right-dark.jpg"
                alt="Onur Oztaskiran Portrait"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover dark:max-md:hidden hidden dark:block"
              />
              <Image
                src="/assets/about/onuro-right.jpg"
                alt="Onur Oztaskiran Portrait Mobile"
                fill
                sizes="100vw"
                className="object-cover md:hidden dark:hidden"
              />
              <Image
                src="/assets/about/onuro-right-dark.jpg"
                alt="Onur Oztaskiran Portrait Mobile"
                fill
                sizes="100vw"
                className="object-cover md:hidden hidden dark:max-md:block"
              />
            </div>

            {/* Text — left column, overlays the photo */}
            <div className="relative z-10 flex items-center col-span-1 pt-16 pb-0 max-md:order-0 sm:px-12 md:col-start-1 md:py-32">
              <div className="flex flex-col max-sm:px-6 md:mx-auto md:max-w-[360px] md:px-0">
                <h3 className="mb-6 text-2xl text-white">
                  AI Native Designer. Maker. Design Thinker.
                </h3>
                <div className="prose leading-[1.65] text-white/80 [&>p]:mb-6 [&>p:last-child]:mb-0">
                  <p>
                    More than 15 years in design, I've taken key roles in shaping the digital presence of some of the most iconic platforms.
                  </p>
                  <p>
                    Having worked with cross-functional teams at various companies, I've practiced the importance of collaboration and communication in delivering successful projects.
                  </p>
                  <p>
                    My current focus is exploring how Artificial Intelligence can be used to
                    amplify our craft and accelerate the gap between idea and
                    execution.
                  </p>
                </div>
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    className="w-fit text-[14px] gap-3 py-5 !px-4 !border-none"
                    render={
                      <a
                        href="https://www.linkedin.com/in/onuro/"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <Linkedin className="size-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="ghost"
                    nativeButton={false}
                    className="w-fit text-white text-[14px] gap-3 py-5 !px-4 !border-none"
                    render={
                      <a
                        href="https://x.com/onuro"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    @onuro
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <ToptalBadge className="right-24 bottom-24 origin-bottom-right scale-60 hover:mix-blend-normal" />
        </div>
      </div>

    </div>
  );
}
