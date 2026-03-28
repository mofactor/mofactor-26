import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile App Design for Wadi Grocery",
  description:
    "Designing a seamless mobile grocery shopping experience for one of the Middle East's leading online supermarkets.",
  openGraph: {
    title: "Mobile App Design for Wadi Grocery",
    description:
      "Designing a seamless mobile grocery shopping experience for one of the Middle East's leading online supermarkets.",
    url: "/work/wadi-grocery",
    images: [
      { url: "/works/wadi-grocery/wg-hero.jpg", width: 1800, height: 1000 },
      {
        url: "/og?title=Wadi+Grocery&subtitle=Mobile+App+Design",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile App Design for Wadi Grocery",
    description:
      "Designing a seamless mobile grocery shopping experience for one of the Middle East's leading online supermarkets.",
    images: ["/works/wadi-grocery/wg-hero.jpg"],
  },
};

export default function WadiGroceryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
