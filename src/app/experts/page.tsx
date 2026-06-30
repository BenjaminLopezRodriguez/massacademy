import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";

export default function ExpertsPage() {
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
        <p className="mt-14 text-sm text-ink-faint">
          No expert profiles yet. Profiles are built from graph activity, not
          sign-ups. Contribute to a problem to begin.
        </p>
      </main>
      <Footer />
    </>
  );
}
