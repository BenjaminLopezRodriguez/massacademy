import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { PostForm } from "@/app/feed/_components/post-form";
import { OnboardingSync } from "@/app/profile/_components/onboarding-sync";
import { api } from "@/trpc/server";

const stateColors: Record<string, string> = {
  emerging: "text-ink-faint",
  validating: "text-amber-700",
  solution_exploration: "text-blue-600",
  prototype: "text-purple-700",
  company_forming: "text-accent",
  operating: "text-emerald-700",
};

export default async function FeedPage() {
  const [problems, rooms] = await Promise.all([
    api.problem.list({ limit: 20 }),
    api.community.listRooms(),
  ]);

  const { getUser, isAuthenticated } = getKindeServerSession();
  const authed = await isAuthenticated();
  let defaultName: string | undefined;
  let kindeUser: { id: string; email?: string | null } | null = null;
  if (authed) {
    const user = await getUser();
    if (user?.id) {
      kindeUser = { id: user.id, email: user.email };
    }
    const joined = [user?.given_name, user?.family_name].filter(Boolean).join(" ");
    defaultName = joined.length > 0 ? joined : (user?.email ?? undefined);
  }

  const roomsForForm = rooms.map((r) => ({ slug: r.slug, name: r.name, categoryId: r.id }));

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-20 md:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[200px_1fr_280px]">
          {/* Left: lens nav */}
          <aside className="lg:pt-8">
            <p className="label">Lenses</p>
            <nav className="mt-4">
              {rooms.map((room) => (
                <Link
                  key={room.slug}
                  href={`/rooms/${room.slug}`}
                  className="flex items-center justify-between py-2 text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  <span>{room.name}</span>
                  {room.memberCount > 0 && (
                    <span className="text-xs text-ink-faint">{room.memberCount}</span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Center: problems feed */}
          <main>
            <div className="flex items-center justify-between border-b border-rule pb-6">
              <h1 className="font-serif text-2xl text-ink">Problems</h1>
              <PostForm defaultName={defaultName} rooms={roomsForForm} />
            </div>

            {problems.length === 0 ? (
              <p className="mt-10 text-sm text-ink-faint">
                No problems yet. Be the first to submit an observation.
              </p>
            ) : (
              problems.map((p) => (
                <article key={p.id} className="border-b border-rule py-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="label text-red-600">Problem</span>
                      {p.category && (
                        <Link
                          href={`/rooms/${p.category.slug}`}
                          className="label text-ink-faint transition-colors hover:text-accent"
                        >
                          {p.category.name}
                        </Link>
                      )}
                    </div>
                    <span
                      className={`label shrink-0 ${p.momentumScore >= 70 ? "text-accent" : "text-ink-faint"}`}
                    >
                      ↑ {p.momentumScore}
                    </span>
                  </div>

                  <Link href={`/problems/${p.id}`} className="group">
                    <h2 className="mt-3 text-base font-medium text-ink transition-colors group-hover:text-accent">
                      {p.title}
                    </h2>
                  </Link>

                  {p.patterns.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {p.patterns.map((pattern) => (
                        <span key={pattern} className="label text-ink-faint">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-4">
                    <span
                      className={`label ${stateColors[p.state] ?? "text-ink-faint"}`}
                    >
                      {p.state.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-ink-faint">
                      Confidence {p.confidenceScore}
                    </span>
                    {p.momentumDelta !== 0 && (
                      <span
                        className={`text-xs ${p.momentumDelta > 0 ? "text-accent" : "text-red-600"}`}
                      >
                        {p.momentumDelta > 0 ? "▲" : "▼"}{" "}
                        {Math.abs(p.momentumDelta)} this week
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </main>

          {/* Right: digest */}
          <aside className="space-y-10 lg:pt-8">
            <div>
              <p className="label">Gaining Signal</p>
              <ul className="mt-4 space-y-3">
                {problems.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/problems/${p.id}`}
                      className="group flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-ink-muted transition-colors group-hover:text-ink">
                        {p.title}
                      </span>
                      <span className="label shrink-0 text-accent">
                        ↑ {p.momentumScore}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
      {kindeUser && defaultName && (
        <OnboardingSync
          kindeId={kindeUser.id}
          email={kindeUser.email ?? null}
          displayName={defaultName}
        />
      )}
    </>
  );
}
