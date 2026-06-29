"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

export function RoomIntentForm({
  categorySlug,
  defaultIntent,
}: {
  categorySlug: string;
  defaultIntent?: string | null;
}) {
  const router = useRouter();
  const [intent, setIntent] = useState(defaultIntent ?? "");
  const [saved, setSaved] = useState(false);

  const updateIntent = api.community.updateIntent.useMutation({
    onSuccess: () => {
      setSaved(true);
      router.refresh();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = intent.trim();
    if (!value || updateIntent.isPending) return;
    updateIntent.mutate({ categorySlug, intent: value });
  }

  if (saved) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 rounded-sm border border-rule bg-paper p-6 md:p-8"
    >
      <p className="label">Introduce yourself</p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
        Tell the room what you&apos;re building or exploring. This is how people
        in your field find each other.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Label htmlFor="room-intent">What are you working on?</Label>
        <Textarea
          id="room-intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={3}
          placeholder="e.g. Permitting software for commercial electricians in Texas"
          required
          className="resize-none rounded-sm border-rule"
        />
      </div>
      <Button
        type="submit"
        disabled={updateIntent.isPending || !intent.trim()}
        className="mt-4 h-10 rounded-sm bg-accent px-6 text-accent-foreground hover:bg-accent/90"
      >
        {updateIntent.isPending ? "Saving…" : "Share with the room"}
      </Button>
    </form>
  );
}
