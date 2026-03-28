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
