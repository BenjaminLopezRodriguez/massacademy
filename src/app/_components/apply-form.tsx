"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

export function ApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expertise, setExpertise] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = api.community.submitApplication.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submit.isPending) return;

    submit.mutate({
      name: name.trim(),
      email: email.trim(),
      expertise: expertise.trim(),
      message: message.trim() || undefined,
    });
  }

  if (submitted) {
    return (
      <p className="mt-8 text-base leading-relaxed text-ink-muted">
        Received. We read every application personally and will be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="apply-name">Name</Label>
        <Input
          id="apply-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11 rounded-sm border-rule"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apply-email">Email</Label>
        <Input
          id="apply-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 rounded-sm border-rule"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apply-expertise">Your craft</Label>
        <Input
          id="apply-expertise"
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          placeholder="Electrician, lawyer, therapist…"
          required
          className="h-11 rounded-sm border-rule"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="apply-message">What do you want to build?</Label>
        <Textarea
          id="apply-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Optional. A sentence is enough."
          className="resize-none rounded-sm border-rule"
        />
      </div>
      {submit.error && (
        <p className="text-sm text-ink-muted">Something went wrong. Try again.</p>
      )}
      <Button
        type="submit"
        disabled={submit.isPending}
        className="h-11 w-fit rounded-sm bg-accent px-7 text-accent-foreground hover:bg-accent/90"
      >
        {submit.isPending ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
}
