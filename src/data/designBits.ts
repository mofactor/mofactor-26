export type DesignBitSlide = {
  src: string;
  fullSrc: string;
  alt: string;
};

export type DesignBitItem = {
  title: string;
  description?: string;
  date: string | null;
  category: string;
  readTime?: string;
  comingSoon: boolean;
  slides?: DesignBitSlide[];
  navTheme?: "dark" | "light";
  video?: string;
  videoClassName?: string;
  images?: { src: string; fullSrc: string; alt: string; type: string }[];
};

export const designBitsItems: DesignBitItem[] = [
  {
    title: "K-Rides AI Assistant",
    description: "Live AI Assistant for K-Rides.com.tr, generated with Nano Banana Pro, finalized in Photoshop.",
    date: null,
    category: "AI-Gen Agent Visual",
    navTheme: "dark",
    comingSoon: false,
    images: [
      {
        src: "/bits/k-rides/k-rides-assistant.jpg",
        fullSrc: "/bits/k-rides/k-rides-assistant.jpg",
        alt: "K-Rides AI Assistant",
        type: "photo",
      },
    ],
  },
  {
    title: "BandLab Marketplace",
    description: "A full refresh of the BandLab Marketplace, with interactive function prototypes and mobile-first design.",
    date: null,
    category: "Facelift",
    comingSoon: false,
    slides: [
      {
        src: "/bits/bandlab/slide-bl-1.webp",
        fullSrc: "/bits/bandlab/full-bl-1.webp",
        alt: "BandLab Design 1",
      },
      {
        src: "/bits/bandlab/slide-bl-2.webp",
        fullSrc: "/bits/bandlab/full-bl-2.webp",
        alt: "BandLab Design 2",
      },
      {
        src: "/bits/bandlab/slide-bl-3.webp",
        fullSrc: "/bits/bandlab/full-bl-3.webp",
        alt: "BandLab Design 3",
      },
    ],
  },
  {
    title: "AI Bits",
    description: "AI-generated visuals — experimental image generation explorations",
    date: null,
    category: "AI-Gen Visuals",
    navTheme: "dark",
    comingSoon: false,
    slides: [
      {
        src: "/bits/ai-bits/aigen1.avif",
        fullSrc: "/bits/ai-bits/aigen1.avif",
        alt: "AI Generated Visual 1",
      },
      {
        src: "/bits/ai-bits/aigen2.avif",
        fullSrc: "/bits/ai-bits/aigen2.avif",
        alt: "AI Generated Visual 2",
      },
      {
        src: "/bits/ai-bits/aigen3.avif",
        fullSrc: "/bits/ai-bits/aigen3.avif",
        alt: "AI Generated Visual 3",
      },
      {
        src: "/bits/ai-bits/aigen4.avif",
        fullSrc: "/bits/ai-bits/aigen4.avif",
        alt: "AI Generated Visual 4",
      },
      {
        src: "/bits/ai-bits/aigen5.avif",
        fullSrc: "/bits/ai-bits/aigen5.avif",
        alt: "AI Generated Visual 5",
      },
      {
        src: "/bits/ai-bits/aigen6.avif",
        fullSrc: "/bits/ai-bits/aigen6.avif",
        alt: "AI Generated Visual 6",
      },
      {
        src: "/bits/ai-bits/aigen7.avif",
        fullSrc: "/bits/ai-bits/aigen7.avif",
        alt: "AI Generated Visual 7",
      },
      {
        src: "/bits/ai-bits/aigen8.avif",
        fullSrc: "/bits/ai-bits/aigen8.avif",
        alt: "AI Generated Visual 8",
      },
      {
        src: "/bits/ai-bits/aigen9.avif",
        fullSrc: "/bits/ai-bits/aigen9.avif",
        alt: "AI Generated Visual 9",
      },
    ],
  },
  {
    title: "Fountn Home Revisit",
    description: "Designed 100% in the browser w Claude AI. Once propped up, took an additional run to make it production ready.",
    date: null,
    category: "Nav and Slider Update",
    navTheme: "dark",
    comingSoon: false,
    images: [
      {
        src: "/bits/fountn/fountn.webp",
        fullSrc: "/bits/fountn/fountn-full.webp",
        alt: "Fountn Nav and Slider Update",
        type: "photo",
      },
    ],
  },
  {
    title: "Liquid Text Swap",
    description: "Transition experiment with SVG Filter",
    date: null,
    category: "Experiment",
    comingSoon: false,
    navTheme: "dark",
    video: "/bits/liquid-text/lqtext.webm",
    videoClassName: "dark:mix-blend-screen",
  },
  {
    title: "Cortina",
    description: "Motion Storyboard Design for Cortina — an INDG Client",
    date: null,
    category: "Motion Storyboard Design",
    navTheme: "dark",
    comingSoon: false,
    slides: [
      {
        src: "/bits/cortina/0.webp",
        fullSrc: "/bits/cortina/0.jpg",
        alt: "Cortina Design 1",
      },
      {
        src: "/bits/cortina/1.webp",
        fullSrc: "/bits/cortina/1.jpg",
        alt: "Cortina Design 2",
      },
      {
        src: "/bits/cortina/2.webp",
        fullSrc: "/bits/cortina/2.jpg",
        alt: "Cortina Design 3",
      },
      {
        src: "/bits/cortina/3.webp",
        fullSrc: "/bits/cortina/3.jpg",
        alt: "Cortina Design 4",
      },
      {
        src: "/bits/cortina/4.webp",
        fullSrc: "/bits/cortina/4.jpg",
        alt: "Cortina Design 5",
      },
      {
        src: "/bits/cortina/5.webp",
        fullSrc: "/bits/cortina/5.jpg",
        alt: "Cortina Design 6",
      },
      {
        src: "/bits/cortina/6.webp",
        fullSrc: "/bits/cortina/6.jpg",
        alt: "Cortina Design 7",
      },
      {
        src: "/bits/cortina/7.webp",
        fullSrc: "/bits/cortina/7.jpg",
        alt: "Cortina Design 8",
      },
      {
        src: "/bits/cortina/8.webp",
        fullSrc: "/bits/cortina/8.jpg",
        alt: "Cortina Design 9",
      },
    ],
  },
];
