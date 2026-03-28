"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Phone } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import Marquee from "@/components/ui/Marquee";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export default function Header() {
  const [time, setTime] = useState("");
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const londonTime = now.toLocaleTimeString("en-GB", {
        timeZone: "Europe/London",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTime(londonTime);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="pointer-events-none fixed w-full top-4 z-50 h-16 w-full mix-blend-exclusion">
      <nav className="relative z-50 container h-full">
        <div className="grid h-full grid-cols-2 items-center gap-6 md:grid-cols-12">
          {/* Logo */}
          <div className="pointer-events-auto flex items-center justify-start md:col-span-6">
            <a href="/" className="text-zinc-50">
              <svg
                width="54"
                height="22"
                viewBox="0 0 663 265"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M265 92.3775C265 106.765 282.51 113.842 292.507 103.495L381.886 10.9859C388.669 3.96493 398.013 0 407.776 0H639C652.255 0 663 10.7452 663 24V241C663 254.255 652.255 265 639 265H557.797C544.542 265 533.797 254.255 533.797 241V162.338C533.797 147.984 516.358 140.891 506.339 151.17L405.983 254.128C399.207 261.08 389.911 265 380.203 265H288C274.745 265 264 254.255 264 241V173.4C264 159.042 246.551 151.951 236.535 162.239L147.1 254.111C140.323 261.073 131.02 265 121.304 265H24C10.7452 265 0 254.255 0 241V24C0 10.7452 10.7452 0 24 0H241C254.255 0 265 10.7452 265 24V92.3775Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>



          {/* Right side - Time & Theme toggle */}
          <div className="pointer-events-auto flex items-center justify-end space-x-4 md:col-span-6">
            <div className="flex items-center gap-2">
              {/* Marquee */}
              <div className="hidden md:flex items-center md:col-span-6 max-w-64 overflow-hidden bg-zinc-900 rounded-md py-1">
                {/* <Marquee speed={32} pauseOnHover mask className="[--marquee-gap:0.5rem] py-0.5 text-sm tracking-wider text-zinc-100">
                  <span>Kelebrating Monofactor's 22nd birthday</span>
                  <span> &bull; </span>
                  <span>Celebrating Monofactor's 22nd birthday</span>
                  <span> &bull; </span>
                </Marquee> */}
              </div>
              <button
                type="button"
                data-cal-link="onuro/30-min-intro-call"
                data-cal-config='{"layout":"month_view"}'
                className="hidden md:inline-flex items-center gap-2.5 rounded-md bg-transparent px-3 py-1 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-950 cursor-pointer"
              >
                <Phone size={14} strokeWidth={2} />
                Book a Call
                                                                                                        </button>
              {mounted && (
                <div className="inline-flex items-center gap-2  px-2 py-1">
                  <Sun
                    size={14}
                    strokeWidth={2}
                    className={cn(
                      "cursor-pointer transition-colors duration-200",
                      isDark ? "text-zinc-500" : "text-zinc-50",
                    )}
                    onClick={() => isDark && toggleTheme()}
                    aria-hidden="true"
                  />
                  <Switch
                    checked={isDark}
                    onCheckedChange={toggleTheme}
                    aria-label="Toggle between dark and light mode"
                    className="bg-zinc-50 data-[checked]:bg-zinc-50 dark:bg-zinc-50 dark:data-[checked]:bg-zinc-50 [&_span]:bg-zinc-900 [&_span]:data-[checked]:bg-zinc-900"
                  />
                  <Moon
                    size={14}
                    strokeWidth={2}
                    className={cn(
                      "cursor-pointer transition-colors duration-200",
                      isDark ? "text-zinc-100" : "text-zinc-500",
                    )}
                    onClick={() => !isDark && toggleTheme()}
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
