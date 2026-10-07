// next/navigation + next/link for the admin SPA, backed by wouter. Same call
// signatures, so admin components only swap their import path. Links and pushes
// outside /nexus do a full page load (the public site isn't part of the SPA).
import { useMemo, type AnchorHTMLAttributes } from "react";
import { Link as WouterLink, useLocation, useParams as useWouterParams } from "wouter";

const isAdminPath = (href: string) => href === "/nexus" || href.startsWith("/nexus/");

export function useRouter() {
  const [, navigate] = useLocation();
  return useMemo(
    () => ({
      push: (href: string) => (isAdminPath(href) ? navigate(href) : window.location.assign(href)),
      replace: (href: string) =>
        isAdminPath(href) ? navigate(href, { replace: true }) : window.location.replace(href),
      back: () => window.history.back(),
    }),
    [navigate],
  );
}

export function usePathname(): string {
  return useLocation()[0];
}

export function useParams<T extends Record<string, string>>(): T {
  return useWouterParams() as T;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Link({ href, target, ...props }: LinkProps) {
  if (!isAdminPath(href) || target) return <a href={href} target={target} {...props} />;
  return <WouterLink href={href} {...props} />;
}
