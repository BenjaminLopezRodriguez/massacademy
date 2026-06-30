import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { ActionsPanel } from "@/app/problems/[id]/_components/actions-panel";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { api } from "@/trpc/server";

// ─── State config ─────────────────────────────────────────────────────────────

const stateConfig = {
  emerging: {
    label: "Emerging",
    description: "Observations accumulating — pattern not yet confirmed",
    colorClass: "text-ink-faint",
  },
  validating: {
    label: "Validating",
    description: "Evidence being collected — signal strengthening",
    colorClass: "text-amber-700",
  },
  solution_exploration: {
    label: "Solution Exploration",
    description: "Ideas being tested against evidence",
    colorClass: "text-blue-600",
  },
  prototype: {
    label: "Prototype",
    description: "Solutions being actively built",
    colorClass: "text-purple-700",
  },
  company_forming: {
    label: "Company Forming",
    description: "Team organizing around this problem",
    colorClass: "text-accent",
  },
  operating: {
    label: "Operating",
    description: "Company launched and building",
    colorClass: "text-emerald-700",
  },
} as const;

// ─── Event timeline config ────────────────────────────────────────────────────

const eventConfig: Record<string, { label: string; symbol: string; colorClass: string }> = {
  ObservationAdded: { label: "Observation", symbol: "○", colorClass: "text-ink-faint" },
  EvidenceAdded: { label: "Evidence", symbol: "◆", colorClass: "text-emerald-700" },
  PatternLinked: { label: "Pattern Linked", symbol: "⬡", colorClass: "text-accent" },
  CrossDomainMatchDetected: { label: "Cross-Domain Match", symbol: "↔", colorClass: "text-blue-600" },
  IdeaValidated: { label: "Idea Validated", symbol: "✓", colorClass: "text-emerald-700" },
  PrototypeShared: { label: "Prototype", symbol: "▲", colorClass: "text-purple-700" },
  ContributorJoined: { label: "Expert Joined", symbol: "+", colorClass: "text-ink-muted" },
  StateTransitioned: { label: "State Changed", symbol: "→", colorClass: "text-accent" },
};

const stageFlow = ["Observation", "Problem", "Evidence", "Idea", "Company"] as const;

const ideaValidationConfig: Record<string, { label: string; colorClass: string }> = {
  proposed: { label: "Proposed", colorClass: "text-ink-faint" },
  validating: { label: "Being validated", colorClass: "text-amber-700" },
  validated: { label: "Validated", colorClass: "text-emerald-700" },
  refuted: { label: "Refuted", colorClass: "text-red-600" },
};

// ─── Signal bar (CSS only, no dep) ───────────────────────────────────────────

function SignalBar({ history }: { history: number[] }) {
  const max = Math.max(...history, 1);
  return (
    <div className="flex items-end gap-1" aria-hidden>
      {history.map((val, i) => {
        const h = Math.max(3, Math.round((val / max) * 24));
        const isLast = i === history.length - 1;
        return (
          <div
            key={i}
            className={`w-5 rounded-sm transition-all ${isLast ? "bg-accent" : "bg-rule"}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) notFound();

  let problem;
  try {
    problem = await api.problem.getById({ id: numId });
  } catch {
    notFound();
  }

  const state = stateConfig[problem.state];
  const stageIndex = ["emerging", "validating", "solution_exploration", "prototype", "company_forming"].indexOf(problem.state);
  const currentStageIndex = Math.min(Math.max(stageIndex, 0), 4);

  // Signal history derived from event timestamps (6-week buckets)
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const rawHistory = Array.from({ length: 6 }, (_, i) => {
    const start = now - (6 - i) * weekMs;
    const end = now - (5 - i) * weekMs;
    return problem.events.filter(
      (e) => e.createdAt.getTime() >= start && e.createdAt.getTime() < end,
    ).length;
  });
  const signalHistory: number[] = rawHistory.every((n) => n === 0)
    ? [0, 0, 0, 0, 0, 1]
    : rawHistory;

  // Real data from DB
  const observations = problem.observations;
  const evidenceItems = problem.evidence;
  const ideaItems = problem.ideas;

  // Kinde user name for pre-filling forms
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const defaultName = kindeUser
    ? [kindeUser.given_name, kindeUser.family_name].filter(Boolean).join(" ")
    : undefined;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
        {/* Header ─────────────────────────────────────────────────────────── */}
        <div className="border-b border-rule pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="label text-red-600">Problem</span>
            {problem.category && (
              <Link
                href={`/rooms/${problem.category.slug}`}
                className="label transition-colors hover:text-accent"
              >
                Relevant in {problem.category.name}
              </Link>
            )}
          </div>

          <h1 className="mt-5 font-serif text-4xl leading-[1.1] tracking-[-0.02em] text-ink md:text-5xl">
            {problem.title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-[1.75] text-ink-muted">
            {problem.description}
          </p>

          {/* State + emergence ──────────────────────────────────────────────── */}
          <div className="mt-8 flex flex-wrap items-start gap-10">
            <div>
              <p className="label">State</p>
              <p className={`mt-2 text-lg font-medium ${state.colorClass}`}>
                {state.label}
              </p>
              <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-ink-faint">
                {state.description}
              </p>
            </div>

            <div>
              <p className="label">Momentum</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-serif text-4xl text-ink">
                  {problem.momentumScore}
                </span>
                {problem.momentumDelta !== 0 && (
                  <span
                    className={`text-sm ${problem.momentumDelta > 0 ? "text-accent" : "text-red-600"}`}
                  >
                    {problem.momentumDelta > 0 ? "▲" : "▼"}{" "}
                    {Math.abs(problem.momentumDelta)} this week
                  </span>
                )}
              </div>
              <div className="mt-2">
                <SignalBar history={signalHistory} />
              </div>
            </div>

            <div>
              <p className="label">Confidence</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-serif text-4xl text-ink">
                  {problem.confidenceScore}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">evidence quality</p>
            </div>

            {problem.patterns.length > 0 && (
              <div>
                <p className="label">
                  {problem.patterns.length === 1 ? "Pattern" : "Patterns"}
                </p>
                <div className="mt-2 space-y-2">
                  {problem.patterns.map((pattern) => (
                    <div key={pattern.id}>
                      <span className="inline-block rounded-sm border border-ink/20 px-3 py-1.5 text-sm font-medium text-ink">
                        {pattern.name}
                      </span>
                      <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-ink-faint">
                        {pattern.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stage flow */}
          <div className="mt-8 flex flex-wrap items-center">
            {stageFlow.map((stage, i) => (
              <div key={stage} className="flex items-center">
                <span
                  className={`text-xs ${
                    i === currentStageIndex
                      ? "font-medium text-ink"
                      : i < currentStageIndex
                        ? "text-ink-faint line-through"
                        : "text-ink-faint"
                  }`}
                >
                  {stage}
                </span>
                {i < stageFlow.length - 1 && (
                  <span className="mx-3 text-xs text-ink-faint">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="space-y-14">
            {/* Problem Timeline — real data ─────────────────────────────────── */}
            {problem.events.length > 0 && (
              <section>
                <p className="label">Timeline</p>
                <p className="mt-1 text-xs text-ink-faint">
                  How knowledge accumulated on this problem
                </p>
                <ol className="mt-5 space-y-0">
                  {problem.events.map((event, i) => {
                    const cfg = eventConfig[event.eventType] ?? {
                      label: event.eventType,
                      symbol: "·",
                      colorClass: "text-ink-faint",
                    };
                    const isLast = i === problem.events.length - 1;
                    return (
                      <li key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className={`mt-0.5 text-sm ${cfg.colorClass}`}>
                            {cfg.symbol}
                          </span>
                          {!isLast && (
                            <div className="mt-1 w-px flex-1 bg-rule" />
                          )}
                        </div>
                        <div className={`pb-6 ${isLast ? "" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className={`label ${cfg.colorClass}`}>
                              {cfg.label}
                            </span>
                            <span className="text-xs text-ink-faint">
                              {formatEventDate(event.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                            {event.summary}
                          </p>
                          {event.actorName && (
                            <p className="mt-1 text-xs text-ink-faint">
                              {event.actorName}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* Observations — real ─────────────────────────────────────────── */}
            {observations.length > 0 && (
              <section>
                <p className="label">Observations ({observations.length})</p>
                <p className="mt-1 text-xs text-ink-faint">
                  What experts have seen in the field
                </p>
                <ul className="mt-5 divide-y divide-rule">
                  {observations.map((obs) => (
                    <li key={obs.id} className="py-5">
                      <p className="text-sm leading-relaxed text-ink">
                        {obs.content}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {obs.authorName && (
                          <span className="text-xs text-ink-faint">
                            {obs.authorName}
                          </span>
                        )}
                        <span className="text-xs text-ink-faint">·</span>
                        <span className="text-xs text-ink-faint">
                          {formatEventDate(obs.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Ideas — real ────────────────────────────────────────────────── */}
            {ideaItems.length > 0 && (
              <section>
                <p className="label">Ideas ({ideaItems.length})</p>
                <p className="mt-1 text-xs text-ink-faint">
                  Proposed solutions and hypotheses
                </p>
                <ul className="mt-5 divide-y divide-rule">
                  {ideaItems.map((idea) => {
                    const status = ideaValidationConfig[idea.validation] ?? {
                      label: idea.validation,
                      colorClass: "text-ink-faint",
                    };
                    return (
                      <li
                        key={idea.id}
                        className="flex items-start justify-between gap-6 py-5"
                      >
                        <div>
                          <p className="text-sm text-ink">{idea.title}</p>
                          {idea.description && (
                            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                              {idea.description}
                            </p>
                          )}
                        </div>
                        <span className={`label shrink-0 ${status.colorClass}`}>
                          {status.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Evidence — real ─────────────────────────────────────────────── */}
            {evidenceItems.length > 0 && (
              <section>
                <p className="label">Evidence ({evidenceItems.length})</p>
                <p className="mt-1 text-xs text-ink-faint">
                  Interviews, research, and validation
                </p>
                <ul className="mt-5 divide-y divide-rule">
                  {evidenceItems.map((ev) => (
                    <li key={ev.id} className="py-5">
                      <div className="flex items-center gap-3">
                        <span className="label text-emerald-700">
                          {ev.subtype}
                        </span>
                        <span
                          className={`label ${ev.verdict === "supports" ? "text-emerald-700" : ev.verdict === "challenges" ? "text-red-600" : "text-ink-faint"}`}
                        >
                          {ev.verdict}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-ink">
                        {ev.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        {ev.content}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {ev.contributorName && (
                          <span className="text-xs text-ink-faint">
                            {ev.contributorName}
                          </span>
                        )}
                        <span className="text-xs text-ink-faint">·</span>
                        <span className="text-xs text-ink-faint">
                          {formatEventDate(ev.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </div>

          {/* Right sidebar ─────────────────────────────────────────────────── */}
          <aside className="space-y-8">
            <ActionsPanel
              problemId={problem.id}
              categoryId={problem.category?.id}
              defaultName={defaultName}
            />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
