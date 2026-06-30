import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";

export default function CompaniesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
        <p className="label">Companies</p>
        <h1 className="mt-4 font-serif text-4xl tracking-[-0.02em] text-ink md:text-5xl">
          Companies forming
        </h1>
        <p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-muted">
          Companies emerge from the graph when a problem reaches the
          company_forming state — enough evidence, validated ideas, and experts
          aligned around a solution.
        </p>
        <p className="mt-14 text-sm text-ink-faint">
          No companies yet. They appear here when a problem accumulates
          sufficient signal and experts organize around a solution.
        </p>
      </main>
      <Footer />
    </>
  );
}
