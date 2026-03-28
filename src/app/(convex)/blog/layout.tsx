import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Thoughts on design, development, and building digital products.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="container mx-auto min-h-screen px-6 pt-24 pb-16 md:px-12">
        {children}
      </main>
      <Footer />
    </>
  );
}
