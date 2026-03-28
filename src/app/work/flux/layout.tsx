import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enhancing Design with AI for Flux Network",
  description:
    "Leading creative direction across the Flux blockchain ecosystem — product flows, marketing sites, and AI-powered design tooling.",
  openGraph: {
    title: "Enhancing Design with AI for Flux Network",
    description:
      "Leading creative direction across the Flux blockchain ecosystem — product flows, marketing sites, and AI-powered design tooling.",
    url: "/work/flux",
    images: [
      { url: "/works/flux/og-cloud.jpg", width: 1200, height: 750 },
      {
        url: "/og?title=Flux+Network&subtitle=AI-Enhanced+Design+Leadership",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enhancing Design with AI for Flux Network",
    description:
      "Leading creative direction across the Flux blockchain ecosystem — product flows, marketing sites, and AI-powered design tooling.",
    images: ["/works/flux/og-cloud.jpg"],
  },
};

export default function FluxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
