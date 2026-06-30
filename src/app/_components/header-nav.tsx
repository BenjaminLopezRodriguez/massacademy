"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderAccountMenu } from "@/app/_components/header-account-menu";

type HeaderNavProps = {
  authed: boolean;
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
  profilePath: string;
};

const links = [
  { href: "/feed", label: "Feed", show: "always" },
  { href: "/problems", label: "Problems", show: "sm" },
  { href: "/rooms", label: "Rooms", show: "md" },
  { href: "/experts", label: "Experts", show: "lg" },
  { href: "/companies", label: "Companies", show: "lg" },
] as const;

const showClass: Record<string, string> = {
  always: "block",
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
};

export function HeaderNav({
  authed,
  givenName,
  familyName,
  email,
  profilePath,
}: HeaderNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 md:gap-8">
      {links.map(({ href, label, show }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`label transition-colors ${showClass[show]} ${active ? "text-ink" : "text-ink-faint hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
      <HeaderAccountMenu
        authed={authed}
        givenName={givenName}
        familyName={familyName}
        email={email}
        profilePath={profilePath}
      />
    </nav>
  );
}
