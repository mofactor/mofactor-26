import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import DevEditorLoader from "@/editor/DevEditorLoader";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://monofactor.com"
  ),
  title: {
    default: "Monofactor: AI Native Senior Product Designer Onur Oztaskiran Portfolio",
    template: "%s — Monofactor",
  },
  description:
    "A digital portfolio of Onur Oztaskiran, AI Native Senior Product Designer & Creative Director.",
  openGraph: {
    type: "website",
    siteName: "Monofactor",
    locale: "en_US",
    title: "Monofactor: AI Native Senior Product Designer Onur Oztaskiran Portfolio",
    description:
      "A digital portfolio of Onur Oztaskiran, AI Native Senior Product Designer & Creative Director.",
    url: "https://monofactor.com",
    images: [
      {
        url: "/OG/Home-OG.jpg",
        width: 1200,
        height: 630,
        alt: "Monofactor — Onur Oztaskiran Portfolio",
      },
      {
        url: "/og?title=Monofactor&subtitle=Portfolio+of+Onur+Oztaskiran",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@onuro",
    creator: "@onuro",
    title: "Monofactor: AI Native Senior Product Designer Onur Oztaskiran Portfolio",
    description:
      "A digital portfolio of Onur Oztaskiran, AI Native Senior Product Designer & Creative Director.",
    images: ["/OG/Home-OG.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/kmj5qkr.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Monofactor",
                  url: "https://monofactor.com",
                },
                {
                  "@type": "Person",
                  name: "Onur Oztaskiran",
                  url: "https://monofactor.com",
                  jobTitle: "AI Native Principal Product Designer & Creative Director",
                  sameAs: [
                    "https://dribbble.com/onuro",
                    "https://linkedin.com/in/onuro",
                    "https://instagram.com/onurozt",
                    "https://github.com/onuro",
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="selection:bg-zinc-700 selection:text-white dark:selection:bg-zinc-1000">
        {children}
        <DevEditorLoader />
        <Script
          id="cal-embed"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", {origin:"https://app.cal.com"});`,
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HK8XV9BFHX"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-HK8XV9BFHX');`}
        </Script>
      </body>
    </html>
  );
}
