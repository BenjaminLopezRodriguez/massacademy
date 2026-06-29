import Link from "next/link";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { api } from "@/trpc/server";

export default async function RoomsPage() {
  const rooms = await api.community.listRooms();

  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
          <p className="label">Community</p>
          <h1 className="mt-6 max-w-2xl font-serif text-4xl tracking-[-0.02em] text-ink md:text-5xl">
            Find your room
          </h1>
          <p className="mt-6 max-w-xl text-base leading-[1.7] text-ink-muted md:text-lg">
            Every field has a room. Join people who&apos;ve mastered the same
            craft and see what they&apos;re building.
          </p>

          <ul className="mt-14 divide-y divide-rule border-y border-rule">
            {rooms.map((room) => (
              <li key={room.slug}>
                <Link
                  href={`/rooms/${room.slug}`}
                  className="flex items-start justify-between gap-6 py-6 transition-colors hover:bg-black/5"
                >
                  <div>
                    <p className="font-serif text-xl text-ink md:text-2xl">
                      {room.name}
                    </p>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                      {room.description}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-ink-faint">
                    {room.memberCount}{" "}
                    {room.memberCount === 1 ? "person" : "people"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
