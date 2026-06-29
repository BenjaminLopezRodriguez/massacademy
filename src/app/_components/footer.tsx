import Link from "next/link";

import { Logo } from "@/app/_components/logo";

const footerLinks = [
  { href: "/rooms", label: "Rooms" },
  { href: "/#program", label: "Program" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#apply", label: "Apply" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-14 md:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <p className="text-[0.8125rem] font-medium tracking-[0.04em] text-ink">
              Mass Academy
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="label transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="label">&copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
