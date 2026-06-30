import {
  LoginLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";

import { Logo } from "@/app/_components/logo";
import { UserAvatar } from "@/app/_components/user-avatar";
import { MY_PROFILE_PATH } from "@/lib/user-display";

export async function Header() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();
  const user = authed ? await getUser() : null;

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
        <nav className="flex items-center gap-8">
          <Link
            href="/feed"
            className="label transition-colors hover:text-accent"
          >
            Feed
          </Link>
          <Link
            href="/problems"
            className="label hidden transition-colors hover:text-accent sm:block"
          >
            Problems
          </Link>
          <Link
            href="/experts"
            className="label hidden transition-colors hover:text-accent md:block"
          >
            Experts
          </Link>
          <Link
            href="/companies"
            className="label hidden transition-colors hover:text-accent md:block"
          >
            Companies
          </Link>
          <Link
            href="/rooms"
            className="label hidden transition-colors hover:text-accent lg:block"
          >
            Rooms
          </Link>
          {authed && user ? (
            <div className="flex items-center gap-5">
              <Link
                href={MY_PROFILE_PATH}
                className="transition-opacity hover:opacity-80"
                aria-label="Your profile"
              >
                <UserAvatar
                  givenName={user.given_name}
                  familyName={user.family_name}
                  email={user.email}
                />
              </Link>
              <LogoutLink className="label text-ink-faint transition-colors hover:text-ink">
                Sign out
              </LogoutLink>
            </div>
          ) : (
            <LoginLink
              postLoginRedirectURL="/feed"
              className="label transition-colors hover:text-accent"
            >
              Sign in
            </LoginLink>
          )}
        </nav>
      </div>
    </header>
  );
}
