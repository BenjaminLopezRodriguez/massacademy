import Link from "next/link";

import { LabelButton } from "@/components/label-button";
import { ProgressBar } from "@/components/progressbar";
import {
  formatJoinedYear,
  formatRelativeTime,
} from "@/lib/user-display";

type Skill = {
  label: string;
  years: number | null;
  endorsed: number;
};

type ActivityItem = {
  id: string;
  type: "observation" | "evidence" | "problem";
  content: string;
  createdAt: Date;
};

type Readiness = {
  domainExpertise: number;
  customerDiscovery: number;
  execution: number;
  productValidation: number;
};

type ProfileViewProps = {
  displayName: string;
  craft: string;
  bio: string;
  joinedAt: Date;
  adjacentExperts: number;
  reputationScore: number;
  skills: Skill[];
  activity: ActivityItem[];
  readiness: Readiness;
  stage: string;
  stageNext: string;
  hasMomentum: boolean;
};

const activityLabels = {
  observation: "Observation",
  evidence: "Evidence",
  problem: "Problem",
} as const;

function ReadinessBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-sm text-ink">{label}</span>
      <ProgressBar
        color="bg-accent"
        variant="representative"
        value={value}
        className="min-w-0 flex-1"
      />
      <span className="w-9 shrink-0 text-right text-sm tabular-nums text-ink-muted">
        {value}%
      </span>
    </div>
  );
}

export function ProfileView({
  displayName,
  craft,
  bio,
  joinedAt,
  adjacentExperts,
  reputationScore,
  skills,
  activity,
  readiness,
  stage,
  stageNext,
  hasMomentum,
}: ProfileViewProps) {
  return (
    <div>
      <div className="flex flex-col gap-8 border-b border-rule pb-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl tracking-[-0.02em] text-ink md:text-5xl">
            {displayName}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{bio}</p>
          <p className="mt-4 text-sm text-ink-faint">
            {craft}
            {" · "}
            Joined {formatJoinedYear(joinedAt)}
            {adjacentExperts > 0 && (
              <>
                {" · "}
                {adjacentExperts} adjacent expert
                {adjacentExperts === 1 ? "" : "s"} in graph
              </>
            )}
          </p>

          {skills.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-3">
              {skills.map((skill) => (
                <li key={skill.label}>
                  <LabelButton>
                    <span>{skill.label}</span>
                    {skill.years != null && (
                      <span className="font-normal text-ink-muted"> {skill.years} yrs</span>
                    )}
                    {skill.endorsed > 0 && (
                      <span className="font-normal text-emerald-600">
                        {skill.endorsed} endorsed
                      </span>
                    )}
                  </LabelButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-serif text-5xl tabular-nums text-ink">
            {reputationScore}
          </p>
          <p className="mt-1 text-sm text-ink-faint">reputation score</p>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_280px]">
        <section>
          <p className="label">Published</p>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm leading-relaxed text-ink-muted">
              Nothing published yet.{" "}
              <Link href="/feed" className="text-ink underline-offset-4 hover:underline">
                Share an observation
              </Link>{" "}
              or join a room to get started.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-rule border-y border-rule">
              {activity.map((item) => (
                <li key={item.id} className="py-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="label text-ink-faint">
                      {activityLabels[item.type]}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {item.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-sm border border-rule p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="label">Founder readiness</p>
              {hasMomentum && (
                <span className="text-xs font-medium text-accent">↑ Momentum</span>
              )}
            </div>
            <div className="mt-6 space-y-5">
              <ReadinessBar
                label="Domain Expertise"
                value={readiness.domainExpertise}
              />
              <ReadinessBar
                label="Customer Discovery"
                value={readiness.customerDiscovery}
              />
              <ReadinessBar label="Execution" value={readiness.execution} />
              <ReadinessBar
                label="Product Validation"
                value={readiness.productValidation}
              />
            </div>
          </div>

          <div className="rounded-sm border border-rule p-6">
            <p className="label">Current stage</p>
            <p className="mt-4 font-serif text-xl text-ink">{stage}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Next: {stageNext}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="h-11 rounded-sm border border-ink bg-ink text-sm font-medium text-paper transition-colors hover:bg-ink-muted"
            >
              Request introduction
            </button>
            <button
              type="button"
              className="h-11 rounded-sm border border-rule text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
            >
              Endorse expertise
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
