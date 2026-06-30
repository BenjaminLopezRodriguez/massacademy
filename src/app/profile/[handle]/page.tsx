import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";

import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import { ProfileView } from "@/app/profile/_components/profile-view";
import { api } from "@/trpc/server";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();

  if (!authed) {
    redirect("/api/auth/login");
  }

  const user = await getUser();

  if (!user?.id) {
    redirect("/api/auth/login");
  }

  if (handle !== "me") {
    notFound();
  }

  const joined = [user.given_name, user.family_name].filter(Boolean).join(" ");
  const displayName = joined.length > 0 ? joined : (user.email ?? "Expert");

  const profile = await api.user.getMyProfile({
    kindeId: user.id,
    displayName,
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 pt-28 pb-20 md:px-12">
        <ProfileView
          displayName={displayName}
          craft={profile.craft}
          bio={profile.bio}
          joinedAt={profile.joinedAt}
          adjacentExperts={profile.adjacentExperts}
          reputationScore={profile.reputationScore}
          skills={profile.skills}
          activity={profile.activity}
          readiness={profile.readiness}
          stage={profile.stage}
          stageNext={profile.stageNext}
          hasMomentum={profile.hasMomentum}
        />
      </main>
      <Footer />
    </>
  );
}
