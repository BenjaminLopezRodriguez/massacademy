import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { FeedChip } from "@/app/feed/_components/feed-chip";
import { PostForm } from "@/app/feed/_components/post-form";
import { OnboardingSync } from "@/app/profile/_components/onboarding-sync";
import { api } from "@/trpc/server";

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

function evidenceChipLabel(count: number, subtype?: string | null) {
  if (subtype === "interview") {
    return count === 1 ? "1 supporting interview" : `${count} supporting interviews`;
  }
  return count === 1 ? "1 supporting record" : `${count} supporting records`;
}

type FeedProblem = {
  id: number;
  title: string;
  description: string;
  momentumScore: number;
  category: { slug: string; name: string } | null;
  patterns: { name: string; slug: string }[];
  evidenceCount: number;
};

function PatternCallout({ problem }: { problem: FeedProblem }) {
  const tags = [
    ...problem.patterns.map((p) => p.name),
    ...(problem.category ? [problem.category.name] : []),
  ];

  return (
    <li className="border-b border-rule py-10">
      <div className="bg-orange-50 px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="label text-ink-faint">Pattern detected</span>
          {tags.map((tag) => (
            <span key={tag} className="label text-ink-faint">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-5 max-w-2xl font-serif text-xl leading-relaxed text-ink">
          {problem.description}
        </p>
        <Link
          href={`/problems/${problem.id}`}
          className="mt-5 inline-block text-sm text-accent transition-colors hover:text-accent/80"
        >
          View the problem →
        </Link>
      </div>
    </li>
  );
}

export default async function FeedPage() {
  const [items, rooms] = await Promise.all([
    api.problem.activityFeed({ limit: 20 }),
    api.community.listRooms(),
  ]);

  const { getUser, isAuthenticated } = getKindeServerSession();
  const authed = await isAuthenticated();
  let defaultName: string | undefined;
  let kindeUser: { id: string; email?: string | null } | null = null;
  if (authed) {
    const user = await getUser();
    if (user?.id) kindeUser = { id: user.id, email: user.email };
    const joined = [user?.given_name, user?.family_name].filter(Boolean).join(" ");
    defaultName = joined.length > 0 ? joined : (user?.email ?? undefined);
  }

  const roomsForForm = rooms.map((r) => ({ slug: r.slug, name: r.name, categoryId: r.id }));

  const patternShown = new Set<number>();

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-6 pt-24 pb-24 md:px-8">
        <PostForm defaultName={defaultName} rooms={roomsForForm} />

        {items.length === 0 ? (
          <p className="mt-16 text-sm text-ink-faint">
            Nothing yet. Post an observation to start the feed.
          </p>
        ) : (
          <ol>
            {items.flatMap((item) => {
              const typeLabel =
                item.type === "evidence"
                  ? "Evidence"
                  : (item.postType
                      ? item.postType
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())
                      : "Observation");
              const problem = item.problem;
              const footerTags = problem?.patterns.map((p) => p.name) ?? [];
              const showPatternCallout =
                problem &&
                problem.patterns.length > 0 &&
                !patternShown.has(problem.id);

              if (showPatternCallout) patternShown.add(problem.id);

              const entry = (
                <li key={`${item.type}-${item.id}`} className="border-b border-rule py-10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="label text-ink-faint shrink-0">{typeLabel}</span>
                      {problem && (
                        <>
                          <span className="shrink-0 text-xs text-ink-faint">→</span>
                          <Link
                            href={`/problems/${problem.id}`}
                            className="label truncate text-ink transition-colors hover:text-accent"
                          >
                            {problem.title}
                          </Link>
                        </>
                      )}
                    </div>
                    <span className="label shrink-0 text-ink-faint">
                      {timeAgo(new Date(item.createdAt))}
                    </span>
                  </div>

                  <p className="mt-6 font-serif text-2xl leading-relaxed text-ink">
                    {item.content}
                  </p>

                  {item.type === "observation" && problem && problem.evidenceCount > 0 && (
                    <p className="mt-4 text-sm text-ink-muted">
                      {problem.evidenceCount}{" "}
                      {problem.evidenceCount === 1 ? "expert has" : "experts have"} contributed
                      evidence to this problem.
                    </p>
                  )}

                  {item.type === "observation" && problem && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      <FeedChip label="Problem" href={`/problems/${problem.id}`}>
                        {problem.title}
                      </FeedChip>
                      {problem.evidenceCount > 0 && (
                        <FeedChip label="Evidence" href={`/problems/${problem.id}`}>
                          {evidenceChipLabel(problem.evidenceCount)}
                        </FeedChip>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      {item.authorName && (
                        <span className="text-sm font-medium text-ink">{item.authorName}</span>
                      )}
                      {item.category && (
                        <span className="text-sm text-ink-muted">{item.category.name}</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      {footerTags.length > 0 && (
                        <div className="hidden flex-wrap justify-end gap-3 sm:flex">
                          {footerTags.map((tag) => (
                            <span key={tag} className="label text-ink-faint">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {problem && (
                        <span className="label text-accent">↑ {problem.momentumScore}</span>
                      )}
                    </div>
                  </div>
                </li>
              );

              if (showPatternCallout && problem) {
                return [entry, <PatternCallout key={`pattern-${problem.id}`} problem={problem} />];
              }
              return [entry];
            })}
          </ol>
        )}
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
