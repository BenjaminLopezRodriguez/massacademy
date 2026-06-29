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

export function HeroPrompt() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [intent, setIntent] = useState("");

  const joinRoom = api.community.joinRoom.useMutation({
    onSuccess: (data) => {
      setDisplayName("");
      setYearsExperience("");
      setBio("");
      setIntent("");
      setJoinResult(data);
    },
  });

  const updateProfile = api.community.updateProfile.useMutation({
    onSuccess: (_data, variables) => {
      setJoinResult(null);
      router.push(`/rooms/${variables.categorySlug}`);
    },
  });

  function handleExpertiseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expertise = value.trim();
    if (!expertise || joinRoom.isPending) return;
    joinRoom.mutate({ expertise });
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinResult || updateProfile.isPending) return;

    const years = yearsExperience.trim();
    updateProfile.mutate({
      categorySlug: joinResult.categorySlug,
      displayName: displayName.trim(),
      expertiseLabel: joinResult.expertiseLabel,
      yearsExperience: years ? Number(years) : undefined,
      bio: bio.trim() || undefined,
      intent: intent.trim() || undefined,
    });
  }

  function handleSkip() {
    if (!joinResult) return;
    const slug = joinResult.categorySlug;
    setJoinResult(null);
    router.push(`/rooms/${slug}`);
  }

  function handleClose() {
    handleSkip();
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
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
        onClose={handleClose}
        title="Create your profile"
      >
        {joinResult && (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
            <div>
              <p className="label">Your room</p>
              <p className="mt-2 text-lg text-ink">{joinResult.categoryName}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Joining as{" "}
                <span className="text-ink">{joinResult.expertiseLabel}</span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profile-name" className="label">
                Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How should we address you?"
                required
                autoFocus
                className="h-11 w-full border border-rule bg-paper px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink-faint"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profile-years" className="label">
                Years in your field
              </label>
              <input
                id="profile-years"
                type="number"
                min={0}
                max={80}
                value={yearsExperience}
                onChange={(event) => setYearsExperience(event.target.value)}
                placeholder="e.g. 18"
                className="h-11 w-full border border-rule bg-paper px-4 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink-faint"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profile-bio" className="label">
                What only comes from doing the work?
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="What apprentices get wrong, what clients keep asking, what templates miss."
                rows={4}
                className="w-full resize-none border border-rule bg-paper px-4 py-3 text-[0.9375rem] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink-faint"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="profile-intent" className="label">
                What are you working on?
              </label>
              <textarea
                id="profile-intent"
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                placeholder="A sentence is enough. A tool, a product, a side project, anything built from what you know."
                rows={2}
                className="w-full resize-none border border-rule bg-paper px-4 py-3 text-[0.9375rem] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink-faint"
              />
            </div>

            {updateProfile.error && (
              <p className="text-sm text-ink-muted">
                Could not save your profile. Please try again.
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={updateProfile.isPending || !displayName.trim()}
                className="inline-flex h-11 items-center justify-center bg-accent px-7 text-[0.8125rem] font-medium tracking-[0.02em] text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
              >
                {updateProfile.isPending ? "Saving…" : "Continue to room"}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Skip for now
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
