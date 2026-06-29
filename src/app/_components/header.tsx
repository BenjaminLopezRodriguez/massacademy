import Link from "next/link";

import { Logo } from "@/app/_components/logo";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-paper">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink transition-colors hover:text-ink-muted"
        >
          <Logo size="md" priority />
          <span className="text-[0.8125rem] font-medium tracking-[0.04em]">
            Mass Academy
          </span>
        </Link>
        <nav className="flex items-center gap-10">
          <Link
            href="/rooms"
            className="label hidden transition-colors hover:text-accent sm:block"
          >
            Rooms
          </Link>
          <Link
            href="/#program"
            className="label hidden transition-colors hover:text-accent sm:block"
          >
            Program
          </Link>
          <Link
            href="/#how-it-works"
            className="label hidden transition-colors hover:text-accent sm:block"
          >
            How it works
          </Link>
          <Link
            href="/#apply"
            className="label transition-colors hover:text-accent"
          >
            Apply
          </Link>
        </nav>
      </div>
    </header>
  );
}
