"use client";

import { useEffect } from "react";

import { api } from "@/trpc/react";

function getCookie(name: string): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : undefined;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function OnboardingSync({
  kindeId,
  email,
  displayName,
}: {
  kindeId: string;
  email: string | null;
  displayName: string | null;
}) {
  const upsert = api.user.upsert.useMutation();

  useEffect(() => {
    const craft = getCookie("pending_craft");
    const role = getCookie("pending_role") as
      | "domain_expert"
      | "investor"
      | "operator"
      | "builder"
      | undefined;

    deleteCookie("pending_craft");
    deleteCookie("pending_role");
    deleteCookie("pending_category");

    upsert.mutate({
      kindeId,
      email: email ?? undefined,
      displayName: displayName ?? undefined,
      craft: craft ?? undefined,
      role,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindeId]);

  return null;
}
