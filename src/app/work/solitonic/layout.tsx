import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding & Digital for Solitonic",
  description:
    "Brand identity and digital design for Solitonic, a company harnessing swarm intelligence to build better AI systems.",
  openGraph: {
    title: "Branding & Digital for Solitonic",
    description:
      "Brand identity and digital design for Solitonic, a company harnessing swarm intelligence to build better AI systems.",
    url: "/work/solitonic",
    images: [
      { url: "/works/solitonic/grid-solitonic.jpg", width: 1200, height: 630 },
      {
        url: "/og?title=Solitonic&subtitle=Branding+%26+Digital+Design",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Branding & Digital for Solitonic",
    description:
      "Brand identity and digital design for Solitonic, a company harnessing swarm intelligence to build better AI systems.",
    images: ["/works/solitonic/grid-solitonic.jpg"],
  },
};

export default function SolitonicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
