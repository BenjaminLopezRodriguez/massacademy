import Link from "next/link";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { api } from "@/trpc/server";

function formatJoinedDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

export default async function ExpertsPage() {
  const experts = await api.user.list();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
        <p className="label">Experts</p>
        <h1 className="mt-4 font-serif text-4xl tracking-[-0.02em] text-ink md:text-5xl">
          Domain experts
        </h1>
        <p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-muted">
          Expert profiles emerge from contributions — observations, evidence,
          and ideas linked to real problems. The more signal contributed, the
          clearer the profile becomes.
        </p>

        {experts.length === 0 ? (
          <p className="mt-14 text-sm text-ink-faint">
            No expert profiles yet. Profiles are built from graph activity, not
            sign-ups. Contribute to a problem to begin.
          </p>
        ) : (
          <ul className="mt-14 divide-y divide-rule border-y border-rule">
            {experts.map((expert) => (
              <li key={expert.kindeId} className="py-5">
                <Link href={`/profile/${expert.kindeId}`} className="group block">
                  <p className="font-serif text-lg text-ink group-hover:underline underline-offset-4">
                    {expert.displayName}
                  </p>
                  {expert.craft && (
                    <p className="mt-1 text-sm text-ink-muted">{expert.craft}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-faint">
                    Joined {formatJoinedDate(expert.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
