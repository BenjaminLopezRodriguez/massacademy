import Link from "next/link";

import { ApplyForm } from "@/app/_components/apply-form";
import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { HeroPrompt } from "@/app/_components/hero-prompt";

const whatYouGet = [
  {
    num: "01",
    name: "Advisor",
    body: "Someone in your corner on strategy and what to build. You stay the expert.",
  },
  {
    num: "02",
    name: "Build",
    body: "We turn your know-how into software and agents. You don't write code.",
  },
  {
    num: "03",
    name: "Investors",
    body: "Introductions when you're ready to raise.",
  },
] as const;

const expertTypes = [
  "Electricians.",
  "Lawyers.",
  "Therapists.",
  "Artists.",
  "Plumbers.",
  "Nurses.",
  "Accountants.",
  "Teachers.",
  "Welders.",
  "Pilots.",
  "Geologists.",
  "Mechanics.",
] as const;

const exploreSteps = [
  "Enter your craft",
  "Join your field's room",
  "See what peers are building",
] as const;

const buildSteps = [
  "Apply",
  "We read every application personally",
  "Work together: advise, build, raise",
] as const;

function Section({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-rule">
      <div className="mx-auto max-w-5xl px-6 py-28 md:px-12 md:py-36">
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 pt-28 pb-28 md:px-12 md:pt-36">
          <h1 className="max-w-2/3 font-serif text-[2.75rem] leading-[1.02] tracking-[-0.02em] text-ink md:text-[4.5rem] lg:text-[5.25rem]">
            What you love can&apos;t be copied.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-[1.7] text-ink-muted md:text-lg">
            For people who&apos;ve put in the years and take pride in their
            craft. Join your field&apos;s room, or apply to build from what you
            know.
          </p>
          <div className="mt-10 flex w-full flex-col gap-6">
            <HeroPrompt />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href="#how-it-works"
                className="inline-flex h-11 items-center justify-center px-2 text-[0.8125rem] text-ink-muted transition-colors hover:text-accent"
              >
                How it works
              </Link>
              <Link
                href="#apply"
                className="inline-flex h-11 items-center justify-center px-2 text-[0.8125rem] text-ink-muted transition-colors hover:text-accent"
              >
                Apply to the program
              </Link>
            </div>
          </div>
        </section>

        {/* Program */}
        <Section id="program">
          <div className="max-w-3xl">
            <p className="font-serif text-3xl leading-[1.15] tracking-[-0.01em] text-ink md:text-[2.5rem]">
              What is Mass Academy?
            </p>
            <p className="mt-6 max-w-lg text-base leading-[1.7] text-ink-muted md:text-lg">
              Mass Academy is a program for people who&apos;ve mastered a craft
              and want to turn that knowledge into software or agents. We advise,
              we build, and we introduce you to investors. You don&apos;t write
              code. You don&apos;t need a pitch deck.
            </p>
          </div>

          <div className="mt-20 max-w-3xl">
            <p className="font-serif text-2xl leading-snug tracking-[-0.01em] text-ink md:text-3xl">
              What you get
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {whatYouGet.map((item) => (
              <div
                key={item.num}
                className="flex flex-col gap-4 rounded-sm p-8 md:p-10"
              >
                <span className="label tabular-nums">{item.num}</span>
                <p className="font-serif text-xl leading-snug text-ink md:text-2xl">
                  {item.name}
                </p>
                <p className="text-sm leading-[1.75] text-ink-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-10 font-serif text-xl leading-snug text-ink md:text-2xl">
            Up to 15% equity. In return, you get an advisor.
          </p>
        </Section>

        {/* Who It's For */}
        <Section id="who">
          <div className="max-w-3xl">
            <p className="font-serif text-3xl leading-[1.15] tracking-[-0.01em] text-ink md:text-[2.5rem]">
              People who&apos;ve put in the reps.
            </p>
            <p className="mt-6 max-w-lg text-base leading-[1.7] text-ink-muted md:text-lg">
              No MBA. No coding bootcamp. No pitch deck. We&apos;re looking for
              people who love what they do, have spent years in the work, and
              know their craft inside out.
            </p>
          </div>
          <ul className="mt-12 grid gap-x-16 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
            {expertTypes.map((type) => (
              <li
                key={type}
                className="font-serif text-xl text-ink md:text-2xl"
              >
                {type}
              </li>
            ))}
          </ul>
          <p className="mt-14 max-w-lg text-base leading-[1.7] text-ink-muted md:text-lg">
            If you&apos;ve spent your career learning things that only come from
            doing the work, Mass Academy was built for you.
          </p>
        </Section>

        {/* How It Works */}
        <Section id="how-it-works">
          <div className="max-w-3xl">
            <p className="font-serif text-3xl leading-[1.15] tracking-[-0.01em] text-ink md:text-[2.5rem]">
              How it works
            </p>
          </div>
          <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <p className="label">Explore</p>
              <ol className="mt-6 max-w-sm">
                {exploreSteps.map((step, index) => (
                  <li
                    key={step}
                    className="grid grid-cols-[2rem_1fr] items-baseline gap-x-4 border-b border-rule py-5 last:border-b-0"
                  >
                    <span className="label tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-lg leading-snug text-ink md:text-xl">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="label">Build</p>
              <ol className="mt-6 max-w-sm">
                {buildSteps.map((step, index) => (
                  <li
                    key={step}
                    className="grid grid-cols-[2rem_1fr] items-baseline gap-x-4 border-b border-rule py-5 last:border-b-0"
                  >
                    <span className="label tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-lg leading-snug text-ink md:text-xl">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>

        {/* Apply */}
        <Section id="apply">
          <div className="max-w-lg">
            <h2 className="font-serif text-3xl tracking-[-0.01em] text-ink md:text-[2.5rem]">
              Apply
            </h2>
            <p className="mt-6 text-base leading-[1.7] text-ink-muted md:text-lg">
              Up to 15% equity for an advisor. We help you build software and
              agents and introduce you to investors. Tell us what you&apos;re
              working on.
            </p>
            <p className="mt-4 text-base leading-[1.7] text-ink-muted md:text-lg">
              It&apos;s never too early to apply.
            </p>
            <ApplyForm />
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}
