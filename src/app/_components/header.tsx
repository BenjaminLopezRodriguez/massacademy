import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";

import { HeaderNav } from "@/app/_components/header-nav";
import { HeaderTitle } from "@/app/_components/header-title";
import { Logo } from "@/app/_components/logo";
import { MY_PROFILE_PATH } from "@/lib/user-display";

export async function Header() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = Boolean(await isAuthenticated());
  const user = authed ? await getUser() : null;

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-paper">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 md:px-12">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink transition-colors hover:text-ink-muted"
        >
          <Logo size="md" priority />
          <HeaderTitle />
        </Link>
        <HeaderNav
          authed={authed}
          givenName={user?.given_name}
          familyName={user?.family_name}
          email={user?.email}
          profilePath={MY_PROFILE_PATH}
        />
      </div>
    </header>
  );
}
