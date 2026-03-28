"use client";

import { useAdminSession } from "@/hooks/useAdminSession";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Home, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout } = useAdminSession();
  const { theme, toggleTheme, mounted } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/nexus/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/nexus/login");
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Login page renders without the admin shell
  if (isLoginPage) return children;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-925">
        <div className="text-sm text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push("/nexus/login");
  };

  const navLinkClass = (active: boolean) =>
    `flex size-9 items-center justify-center rounded-lg transition-colors ${
      active
        ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
        : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
    }`;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed left-4 top-6 flex h-[calc(100vh-2rem)] w-fit flex-col items-center rounded-lg">
        <div className="bg-white dark:bg-zinc-900 shadow-border p-2 rounded-lg">
          <Link
            href="/nexus"
            className="flex h-8 w-full items-center justify-center border-b border-zinc-200 dark:border-zinc-800"
          >
            <Image
              src="/assets/mflogo.svg"
              alt="Monofactor"
              width={18}
              height={7}
              className="dark:invert-0 invert"
            />
          </Link>

          <nav className="flex flex-1 flex-col items-center gap-1 py-3 pb-0">
            <Link
              href="/nexus"
              title="Posts"
              className={navLinkClass(pathname === "/nexus" || pathname.startsWith("/nexus/posts"))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.5 7H8.5M12.499 11H8.49902" />
                <path d="M20 22H6C4.89543 22 4 21.1046 4 20M4 20C4 18.8954 4.89543 18 6 18H20V2H6C4.89543 2 4 2.89543 4 4V20Z" />
                <path d="M19.5 18C19.5 18 18.5 18.7628 18.5 20C18.5 21.2372 19.5 22 19.5 22" />
              </svg>
            </Link>
            <Link
              href="/nexus/files"
              title="Files"
              className={navLinkClass(pathname.startsWith("/nexus/files"))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 16V4C18 2.89543 17.1046 2 16 2H4C2.89543 2 2 2.89543 2 4V16C2 17.1046 2.89543 18 4 18H16C17.1046 18 18 17.1046 18 16Z" />
                <path d="M18 6H20C21.1046 6 22 6.89543 22 8V20C22 21.1046 21.1046 22 20 22H8C6.89543 22 6 21.1046 6 20V18" />
                <path d="M2 11.1185C2.61902 11.0398 3.24484 11.001 3.87171 11.0023C6.52365 10.9533 9.11064 11.6763 11.1711 13.0424C13.082 14.3094 14.4247 16.053 15 18" />
                <path d="M12.9998 7H13.0088" />
              </svg>
            </Link>
            <Link
              href="/"
              title="View Site"
              className="flex size-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
            >
              <Home className="size-4" />
            </Link>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-1 border-t border-zinc-200 py-3 dark:border-zinc-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={mounted ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
            className="text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
          >
            {mounted && theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Log out"
            className="text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-16 flex-1 p-8">{children}</main>
    </div>
  );
}
