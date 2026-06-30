"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Sheet } from "@/app/_components/sheet";
import { api } from "@/trpc/react";

type JoinResult = {
  categorySlug: string;
  categoryName: string;
  expertiseLabel: string;
};

type Role = "domain_expert" | "investor" | "operator" | "builder";

const roles: { value: Role; label: string; description: string }[] = [
  { value: "domain_expert", label: "Domain expert", description: "I've mastered a craft or field" },
  { value: "investor", label: "Investor", description: "I back founders building from expertise" },
  { value: "operator", label: "Operator", description: "I run businesses or operations" },
  { value: "builder", label: "Builder", description: "I build products and software" },
];

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=600; samesite=lax`;
}

export function HeroPrompt() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const joinRoom = api.community.joinRoom.useMutation({
    onSuccess: (data) => {
      setJoinResult(data);
      setSelectedRole(null);
    },
  });

  function handleExpertiseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expertise = value.trim();
    if (!expertise || joinRoom.isPending) return;
    joinRoom.mutate({ expertise });
  }

  function handleContinue() {
    if (!joinResult || !selectedRole) return;
    setCookie("pending_craft", value.trim());
    setCookie("pending_role", selectedRole);
    setCookie("pending_category", joinResult.categorySlug);
    window.location.href =
      "/api/auth/register?post_login_redirect_url=" +
      encodeURIComponent("/feed");
  }

  function handleExplore() {
    if (!joinResult) return;
    const slug = joinResult.categorySlug;
    setJoinResult(null);
    router.push(`/rooms/${slug}`);
  }

  return (
    <>
      <form onSubmit={handleExpertiseSubmit} className="w-full max-w-xl">
        <label htmlFor="hero-prompt" className="sr-only">
          Describe your expertise
        </label>
        <div className="relative">
          <input
            id="hero-prompt"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="What's your craft? Electrician, lawyer, illustrator…"
            disabled={joinRoom.isPending}
            className="h-12 w-full rounded-full border border-rule bg-paper px-5 pr-14 text-[0.9375rem] text-ink shadow-[0_2px_12px_rgba(0,0,0,0.06)] outline-none transition-shadow placeholder:text-ink-faint focus:border-ink-faint focus:shadow-[0_4px_20px_rgba(0,0,0,0.08)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={joinRoom.isPending || !value.trim()}
            aria-label="Join your room"
            className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {joinRoom.error && (
          <p className="mt-3 text-sm text-ink-muted">
            Something went wrong. Please try again.
          </p>
        )}
      </form>

      <Sheet
        open={joinResult !== null}
        onClose={handleExplore}
        title="One quick thing"
      >
        {joinResult && (
          <div className="flex flex-col gap-8">
            <div>
              <p className="label">Your room</p>
              <p className="mt-2 text-lg text-ink">{joinResult.categoryName}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Joining as{" "}
                <span className="text-ink">{joinResult.expertiseLabel}</span>
              </p>
            </div>

            <div>
              <p className="label">What best describes you?</p>
              <div className="mt-4 space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`w-full rounded-sm border px-4 py-3 text-left transition-colors ${
                      selectedRole === role.value
                        ? "border-ink bg-ink text-paper"
                        : "border-rule text-ink hover:border-ink"
                    }`}
                  >
                    <p className="text-sm font-medium">{role.label}</p>
                    <p className={`mt-0.5 text-xs ${selectedRole === role.value ? "text-paper/70" : "text-ink-faint"}`}>
                      {role.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={!selectedRole}
                onClick={handleContinue}
                className="inline-flex h-11 items-center justify-center bg-accent px-7 text-[0.8125rem] font-medium tracking-[0.02em] text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
              >
                Create account →
              </button>
              <button
                type="button"
                onClick={handleExplore}
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Explore without signing up
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
