export interface WorkItem {
  title: string;
  description: string;
  href: string;
  featured?: boolean;
  videoSrc?: string;
  videoPoster?: string;
  logoSrc?: string;
  hoverSrc?: string;
  darkHover?: boolean;
  logoClassName?: string;
}

export const works: WorkItem[] = [
  {
    title: "Flux",
    description:
      "Leading and transforming design for the blockchain powered compute and cloud infrastructure.",
    href: "/work/flux",
    featured: true,
    videoSrc: "/works/flux/introsmaller2.webm",
  },
  {
    title: "Fountible",
    description:
      "Designing and building a design tool whose canvas is real React and Tailwind, so the design is the code.",
    href: "/work/fountible",
    logoSrc: "/assets/logos/fountible.svg",
    logoClassName: "w-[16%]",
    hoverSrc: "/assets/work/fountible/grid-fountible.webp",
    darkHover: true,
  },
  {
    title: "NickAI",
    description:
      "Product design for an agentic trading platform, from the design system and chat widgets to mobile and web.",
    href: "/work/nickai",
    logoSrc: "/assets/logos/nickai.svg",
    logoClassName: "w-[40%]",
    hoverSrc: "/assets/work/nickai/grid-nickai.webp",
    darkHover: true,
  },
  {
    title: "GBO Vision",
    description:
      "A bilingual site for an enterprise AI company, with a live particle face that talks back.",
    href: "/work/gbo-vision",
    logoSrc: "/assets/logos/gbo-vision.svg",
    logoClassName: "w-[40%]",
    hoverSrc: "/assets/work/gbo-vision/grid-gbo.webp",
    darkHover: true,
  },
  {
    title: "Hastam",
    description:
      "Product and web design for an AI receptionist that answers the phone for clinics.",
    href: "/work/hastam",
    logoSrc: "/assets/logos/hastam.svg",
    logoClassName: "w-[40%]",
    hoverSrc: "/assets/work/hastam/grid-hastam.webp",
    darkHover: true,
  },
  {
    title: "Kollektor",
    description:
      "Voice AI design for a phone agent that calls in Turkish for collection teams, firm in tone and under the operator's control.",
    href: "/work/kollektor",
    logoSrc: "/assets/logos/kollektor.svg",
    logoClassName: "w-[16%]",
    hoverSrc: "/assets/work/kollektor/grid-kollektor.webp",
    darkHover: true,
  },
  {
    title: "Airbit",
    description:
      "End-to-end design for the world's leading marketplace for beats, enabling creators to sell music globally.",
    href: "/work/airbit",
    logoSrc: "/assets/logos/airbit.svg",
    hoverSrc: "/assets/work/airbit/grid-airbit-2.jpg",
  },
  {
    title: "Solitonic",
    description:
      "Branding and digital design for Solitonic, a company that uses swarm intelligence to create better AI.",
    href: "/work/solitonic",
    logoSrc: "/assets/logos/solitonic.svg",
    videoSrc: "/works/solitonic/sdrone.webm",
    videoPoster: "/works/solitonic/sdrone-poster.webp",
    darkHover: true,
  },
  {
    title: "Postlight",
    description:
      "Led design across products and platforms at the digital strategy and engineering firm, later acquired by NTT DATA.",
    href: "/work/postlight",
    logoSrc: "/assets/logos/postlight.svg",
    hoverSrc: "/assets/work/postlight/grid-postlight2.webp",
  },
  {
    title: "Wadi Grocery",
    description:
      "Mobile app design for Wadi Grocery, crafting a seamless grocery shopping experience for the Middle East market.",
    href: "/work/wadi-grocery",
    logoSrc: "/assets/logos/grocery-logo.svg",
    logoClassName: "w-[30%]",
    hoverSrc: "/assets/work/wadi-grocery/grid-wadigrocery.webp",
  },
];
