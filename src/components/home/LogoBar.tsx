"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { animate, stagger, spring } from "animejs";

const LOGO_URLS: { [key: string]: string } = {
  "flux.svg": "/assets/logos/flux.svg",
  "udemy.svg": "/assets/logos/udemy.svg",
  "automattic.svg": "/assets/logos/automattic.svg",
  "writercom.svg": "/assets/logos/writercom.svg",
  "bandlab.svg": "/assets/logos/bandlab.svg",
  "solitonic.svg": "/assets/logos/solitonic.svg",
  "kibar.svg": "/assets/logos/kibar.svg",
  "nttdata.svg": "/assets/logos/nttdata.svg",
  "airbit.svg": "/assets/logos/airbit.svg",
  "fountn.svg": "/assets/logos/fountn.svg",
  "postlight.svg": "/assets/logos/postlight.svg",
  "dynex.svg": "/assets/logos/dynex.svg",
  "rebolt.svg": "/assets/logos/rebolt.svg",
};

const logoSets = [
  ["bandlab.svg", "automattic.svg", "udemy.svg", "writercom.svg", "solitonic.svg", "nttdata.svg"],
  ["rebolt.svg", "flux.svg", "airbit.svg", "kibar.svg", "fountn.svg", "dynex.svg"],
  ["nttdata.svg", "bandlab.svg", "writercom.svg", "postlight.svg", "fountn.svg", "automattic.svg"]
];

export default function LogoBar() {
  const [activeRow, setActiveRow] = useState(0);
  const [rowSets, setRowSets] = useState([0, 1]);
  const animatingRef = useRef(false);
  const activeRowRef = useRef(0);
  const row0Ref = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);

  const startTransition = useCallback(() => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const current = activeRowRef.current;
    const exitRef = current === 0 ? row0Ref : row1Ref;
    const enterRef = current === 0 ? row1Ref : row0Ref;
    const exitItems = exitRef.current?.children;
    const enterItems = enterRef.current?.children;

    if (!exitItems?.length || !enterItems?.length) return;

    // Exit: flip forward and fade out (top to bottom)
    animate(exitItems, {
      translateY: [0, 20],
      rotateX: [0, 90],
      opacity: [1, 0],
      filter: ["blur(0px)", "blur(4px)"],
      duration: 600,
      delay: stagger(100),
      ease: spring({ stiffness: 125, damping: 15, mass: 0 }),
    });

    // Enter: flip in from above (top to bottom)
    animate(enterItems, {
      translateY: [-20, 0],
      rotateX: [-90, 0],
      opacity: [0, 1],
      filter: ["blur(2px)", "blur(0px)"],
      duration: 600,
      delay: stagger(100),
      ease: spring({ stiffness: 75, damping: 15, mass: 1 }),
      onComplete: () => {
        const newActive = current === 0 ? 1 : 0;
        activeRowRef.current = newActive;
        setActiveRow(newActive);
        animatingRef.current = false;

        setRowSets((prev) => {
          const next = [...prev];
          const currentNextSetIndex = next[newActive];
          next[current] = (currentNextSetIndex + 1) % logoSets.length;
          return next;
        });
      },
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!animatingRef.current) {
        startTransition();
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [startTransition]);

  return (
    <div className="flex justify-center dark:invert">
      <div className="logo-container">
        {[0, 1].map((rowIndex) => (
          <div
            key={rowIndex}
            className="grid h-10 w-full place-items-center"
            style={{ gridArea: "1 / 1" }}
          >
            <div
              ref={rowIndex === 0 ? row0Ref : row1Ref}
              className="flex w-full items-center justify-between"
              style={{ perspective: 1000 }}
            >
              {logoSets[rowSets[rowIndex]].map((logo, index) => (
                <div
                  key={`r${rowIndex}-${index}`}
                  className={`max-h-[20px] max-w-[95px] shrink-0 items-center md:max-h-[32px] md:max-w-[145px] ${index >= 3 ? "hidden md:flex" : "flex"}`}
                  style={{
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    transformOrigin: "center center !important",
                    opacity: activeRow === rowIndex ? 1 : 0,
                  }}
                >
                  <img
                    src={LOGO_URLS[logo]}
                    alt={logo.replace(/[-_]\d*\.svg/, "")}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
