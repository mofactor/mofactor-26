import { Dribbble, Linkedin, Instagram, Github } from "lucide-react";
import ToptalBadge from "./ToptalBadge";

const socials = [
  {
    label: "X",
    href: "https://x.com/onuro",
    icon: (
      <svg className="size-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  { label: "Dribbble", href: "https://dribbble.com/onuro", icon: <Dribbble className="size-[18px]" /> },
  { label: "LinkedIn", href: "https://linkedin.com/in/onuro", icon: <Linkedin className="size-[18px]" /> },
  { label: "Instagram", href: "https://instagram.com/onurozt", icon: <Instagram className="size-[18px]" /> },
  { label: "GitHub", href: "https://github.com/onuro", icon: <Github className="size-[18px]" /> },
];

export default function Footer() {
  return (
    <footer className="pb-20 md:pb-32">
      <div className="container">

        {/* Bottom bar */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 pt-8">
          <div className="md:col-span-5 relative">
            <p className="text-sm text-zinc-400">
              &copy; 2026 Onur Oztaskiran.
            </p>
            {/* <ToptalBadge /> */}
          </div>
          <div className="md:col-span-4 md:col-start-9 flex justify-start md:justify-end gap-5">
            {socials.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Large centered logo */}
        <div className="flex justify-center pt-22">
          <svg
            viewBox="0 0 663 265"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-xl -mb-28 -mt-24 opacity-5"
          >
            <path
              d="M265 92.3775C265 106.765 282.51 113.842 292.507 103.495L381.886 10.9859C388.669 3.96493 398.013 0 407.776 0H639C652.255 0 663 10.7452 663 24V241C663 254.255 652.255 265 639 265H557.797C544.542 265 533.797 254.255 533.797 241V162.338C533.797 147.984 516.358 140.891 506.339 151.17L405.983 254.128C399.207 261.08 389.911 265 380.203 265H288C274.745 265 264 254.255 264 241V173.4C264 159.042 246.551 151.951 236.535 162.239L147.1 254.111C140.323 261.073 131.02 265 121.304 265H24C10.7452 265 0 254.255 0 241V24C0 10.7452 10.7452 0 24 0H241C254.255 0 265 10.7452 265 24V92.3775Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </footer>
  );
}
