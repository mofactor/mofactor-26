import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Revamping the Web Presence for Postlight",
  description:
    "Redesigning the digital branding and website for Postlight, a product studio later acquired by NTT DATA, serving clients like Bloomberg and Vice Media.",
  openGraph: {
    title: "Revamping the Web Presence for Postlight",
    description:
      "Redesigning the digital branding and website for Postlight, a product studio later acquired by NTT DATA, serving clients like Bloomberg and Vice Media.",
    url: "/work/postlight",
    images: [
      {
        url: "/works/postlight/pl-final-tablets.jpg",
        width: 1536,
        height: 1087,
      },
      {
        url: "/og?title=Postlight&subtitle=Web+Presence+Redesign",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revamping the Web Presence for Postlight",
    description:
      "Redesigning the digital branding and website for Postlight, a product studio later acquired by NTT DATA, serving clients like Bloomberg and Vice Media.",
    images: ["/works/postlight/pl-final-tablets.jpg"],
  },
};

export default function PostlightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
