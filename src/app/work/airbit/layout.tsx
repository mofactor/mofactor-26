import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "End-to-End Design for Airbit",
  description:
    "Head of Design at Airbit — defining the visual language, design system, and product experience for the world's leading beats marketplace.",
  openGraph: {
    title: "End-to-End Design for Airbit",
    description:
      "Head of Design at Airbit — defining the visual language, design system, and product experience for the world's leading beats marketplace.",
    url: "/work/airbit",
    images: [
      { url: "/works/airbit/airbitcover.jpg", width: 1800, height: 1000 },
      {
        url: "/og?title=Airbit&subtitle=End-to-End+Product+Design",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "End-to-End Design for Airbit",
    description:
      "Head of Design at Airbit — defining the visual language, design system, and product experience for the world's leading beats marketplace.",
    images: ["/works/airbit/airbitcover.jpg"],
  },
};

export default function AirbitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
