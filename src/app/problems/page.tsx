import Link from "next/link";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { api } from "@/trpc/server";

const stateColors: Record<string, string> = {
  emerging: "text-ink-faint",
  validating: "text-amber-700",
  solution_exploration: "text-blue-600",
  prototype: "text-purple-700",
  company_forming: "text-accent",
  operating: "text-emerald-700",
};

export default async function ProblemsPage() {
  const problems = await api.problem.list({ limit: 100 });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
        <p className="label text-red-600">Problems</p>
        <h1 className="mt-4 font-serif text-4xl tracking-[-0.02em] text-ink md:text-5xl">
          Known problems
        </h1>
        <p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-muted">
          Problems discovered through field observation. Each one is tracked by
          momentum and confidence — earned through evidence, not declared.
        </p>

        {problems.length === 0 ? (
          <p className="mt-14 text-sm text-ink-faint">
            No problems yet. Submit an observation from a problem page to begin
            the knowledge graph.
          </p>
        ) : (
          <ul className="mt-14 divide-y divide-rule border-y border-rule">
            {problems.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/problems/${p.id}`}
                  className="flex items-start justify-between gap-8 py-6 transition-colors hover:bg-black/[0.02]"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      {p.category && (
                        <span className="label text-ink-faint">
                          {p.category.name}
                        </span>
                      )}
                      {p.patterns.map((pat) => (
                        <span key={pat} className="label text-ink-faint">
                          {pat}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-base font-medium text-ink">
                      {p.title}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <span
                        className={`label ${stateColors[p.state] ?? "text-ink-faint"}`}
                      >
                        {p.state.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-ink-faint">
                        Confidence {p.confidenceScore}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`font-serif text-2xl ${p.momentumScore >= 70 ? "text-accent" : "text-ink-faint"}`}
                    >
                      {p.momentumScore}
                    </p>
                    {p.momentumDelta !== 0 && (
                      <p
                        className={`text-xs ${p.momentumDelta > 0 ? "text-accent" : "text-red-600"}`}
                      >
                        {p.momentumDelta > 0 ? "▲" : "▼"}{" "}
                        {Math.abs(p.momentumDelta)}
                      </p>
                    )}
                  </div>
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
