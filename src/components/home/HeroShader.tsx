"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/hooks/useTheme";
import WarpedNoiseShader from "./WarpedNoiseShader";

const AscendShader = dynamic(() => import("./AscendShader"), { ssr: false });

export default function HeroShader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [supportsWebGPU, setSupportsWebGPU] = useState(true);

  useEffect(() => {
    setSupportsWebGPU(!!navigator.gpu);
  }, []);

  return (
    <>
      <div className="absolute inset-0 z-11 bg-gradient-to-b from-zinc-100 dark:hidden mix-blend-overlay to-transparent h-72 w-full" />
      <div className="absolute inset-0 -z-10 overflow-hidden mix-blend-hard-light dark:mix-blend-color-dodge opacity-100 [mask-image:linear-gradient(to_bottom,black_0%,transparent_95%)] dark:[mask-image:linear-gradient(to_bottom,black_0%,transparent_100%)]">
        <AscendShader
          className="dark:block"
          offsetX={-0.075} offsetY={-0.05} speed={1.25} scale={1.5} rocketScale={1} highpower={true}
          density={1} drift={0}
          interactive interactiveStrength={16}
          warmColor={isDark ? "var(--color-zinc-600)" : "#111"}
          coolColor={isDark ? "var(--color-zinc-500)" : "var(--color-neutral-700)"} />
        {/* warmColor={isDark ? "var(--color-zinc-600)" : "var(--color-neutral-950)"}
          coolColor={isDark ? "var(--color-zinc-500)" : "var(--color-neutral-800)"} /> */}
        {/* <WarpedNoiseShader
          className=""
          scale={2} speed={0.5} contrast={4} noiseDetail={1}
          colorDark={isDark ? "#27272a" : "#10101D"}
          colorLight={isDark ? "#3f3f46" : "#cccccc"}
          colorIntensity={2} /> */}
        {/* {supportsWebGPU ? (
          <AscendShader
            className="dark:block"
            offsetX={-0.075} offsetY={-0.05} speed={1.25} scale={1.5} rocketScale={1} highpower={true}
            density={1} drift={0.5}
            interactive interactiveStrength={16}
            warmColor={isDark ? "var(--color-zinc-600)" : "var(--color-neutral-950)"}
            coolColor={isDark ? "var(--color-zinc-500)" : "var(--color-neutral-800)"} />
        ) : (
          
          <WarpedNoiseShader
            className="hidden"
            scale={2} speed={0.5} contrast={4} noiseDetail={1}
            colorDark={isDark ? "#27272a" : "#10101D"}
            colorLight={isDark ? "#3f3f46" : "#cccccc"}
            colorIntensity={2} />
        )} */}
      </div>
    </>
  );
}
