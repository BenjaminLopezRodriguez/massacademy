import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { RoomIntentForm } from "@/app/rooms/[slug]/_components/room-intent-form";
import { api } from "@/trpc/server";

function formatJoinedDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let room;
  try {
    room = await api.community.getRoom({ slug });
  } catch {
    notFound();
  }

  const membersWithIntent = room.members.filter((m) => m.intent);
  const showIntentForm = room.you && !room.you.intent;

  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
          <p className="label">Your room</p>
          <h1 className="mt-6 max-w-2xl font-serif text-4xl tracking-[-0.02em] text-ink md:text-5xl">
            {room.category.name}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-[1.7] text-ink-muted md:text-lg">
            {room.category.description}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-ink-muted">
            <span>
              {room.memberCount}{" "}
              {room.memberCount === 1 ? "person" : "people"} here
            </span>
            {room.you && (
              <>
                <span className="text-ink-faint">·</span>
                <span>
                  You joined as{" "}
                  <span className="text-ink">{room.you.expertiseLabel}</span>
                </span>
              </>
            )}
          </div>

          {room.you && !room.you.profileComplete && (
            <div className="mt-10 rounded-sm border border-rule p-6 md:p-8">
              <p className="label">Getting started</p>
              <ol className="mt-4 space-y-2 text-sm text-ink-muted">
                <li className={room.you.displayName ? "text-ink-faint line-through" : "text-ink"}>
                  1. Complete your profile
                </li>
                <li className={room.you.intent ? "text-ink-faint line-through" : "text-ink"}>
                  2. Share what you&apos;re working on
                </li>
                <li>3. Meet others in your field</li>
              </ol>
            </div>
          )}

          {showIntentForm && (
            <RoomIntentForm
              categorySlug={slug}
              defaultIntent={room.you?.intent}
            />
          )}

          {membersWithIntent.length > 0 && (
            <div className="mt-14">
              <p className="label">What people are working on</p>
              <ul className="mt-6 divide-y divide-rule border-y border-rule">
                {membersWithIntent.map((member) => (
                  <li key={member.id} className="py-5">
                    <p className="text-base text-ink">
                      {member.displayName ?? member.expertiseLabel}
                      {member.isYou && (
                        <span className="ml-2 text-sm text-ink-faint">(you)</span>
                      )}
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                      {member.intent}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {room.members.length > 0 && (
            <div className="mt-14">
              <p className="label">People in this room</p>
              <ul className="mt-6 divide-y divide-rule border-y border-rule">
                {room.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-start justify-between gap-6 py-5"
                  >
                    <div>
                      <p className="text-base text-ink md:text-lg">
                        {member.displayName ?? member.expertiseLabel}
                        {member.isYou && (
                          <span className="ml-2 text-sm text-ink-faint">(you)</span>
                        )}
                      </p>
                      {member.displayName && (
                        <p className="mt-1 text-sm text-ink-muted">
                          {member.expertiseLabel}
                          {member.yearsExperience != null &&
                            ` · ${member.yearsExperience} years`}
                        </p>
                      )}
                      {member.bio && (
                        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                          {member.bio}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm text-ink-faint">
                      {formatJoinedDate(member.joinedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {room.members.length === 0 && (
            <p className="mt-14 text-base text-ink-muted">
              You&apos;re the first person in this room. Others in your field
              will find you here.
            </p>
          )}

          <div className="mt-16 border-t border-rule pt-10">
            <p className="text-sm text-ink-muted">
              Ready to go further?{" "}
              <Link
                href="/#apply"
                className="text-ink underline-offset-4 hover:underline"
              >
                Apply to the incubator
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
