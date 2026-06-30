"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/trpc/react";

type Panel = "observation" | "evidence" | "idea" | null;

const subtypes = ["interview", "research", "measurement", "experiment", "prototype", "document"] as const;

export function ActionsPanel({
  problemId,
  categoryId,
  defaultName,
}: {
  problemId: number;
  categoryId?: number;
  defaultName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Panel>(null);
  const [name, setName] = useState(defaultName ?? "");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [subtype, setSubtype] = useState<typeof subtypes[number]>("interview");
  const [verdict, setVerdict] = useState<"supports" | "challenges" | "neutral">("supports");

  function reset() {
    setOpen(null);
    setContent("");
    setTitle("");
  }

  const addObs = api.problem.addObservation.useMutation({
    onSuccess: () => { reset(); router.refresh(); },
  });
  const addEv = api.problem.addEvidence.useMutation({
    onSuccess: () => { reset(); router.refresh(); },
  });
  const addIdea = api.problem.addIdea.useMutation({
    onSuccess: () => { reset(); router.refresh(); },
  });

  const pending = addObs.isPending || addEv.isPending || addIdea.isPending;
  const error = addObs.error ?? addEv.error ?? addIdea.error;

  function openPanel(panel: Panel) {
    setOpen((prev) => (prev === panel ? null : panel));
    setContent("");
    setTitle("");
  }

  return (
    <div className="space-y-3">
      {/* Name field — shared across all forms */}
      {open && (
        <div className="mb-4">
          <label className="label block">Your name</label>
          <input
            className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-ink focus:outline-none"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      {/* Add observation */}
      <button
        className="w-full rounded-sm border border-ink px-4 py-3 text-sm text-ink transition-colors hover:bg-ink hover:text-paper"
        onClick={() => openPanel("observation")}
      >
        {open === "observation" ? "Cancel" : "Add observation"}
      </button>

      {open === "observation" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addObs.mutate({ problemId, categoryId, content, authorName: name });
          }}
        >
          <textarea
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-ink focus:outline-none"
            placeholder="What have you seen in the field? Be specific — observations with concrete details gain more signal."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={10}
          />
          <button
            type="submit"
            disabled={pending || !name.trim() || !content.trim()}
            className="w-full rounded-sm border border-ink bg-ink px-4 py-2 text-sm text-paper transition-opacity disabled:opacity-40"
          >
            {addObs.isPending ? "Submitting…" : "Submit observation"}
          </button>
        </form>
      )}

      {/* Contribute evidence */}
      <button
        className="w-full rounded-sm border border-rule px-4 py-3 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
        onClick={() => openPanel("evidence")}
      >
        {open === "evidence" ? "Cancel" : "Contribute evidence"}
      </button>

      {open === "evidence" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addEv.mutate({ problemId, categoryId, title, content, contributorName: name, subtype, verdict });
          }}
        >
          <div className="flex gap-2">
            <select
              className="rounded-sm border border-rule bg-paper px-2 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
              value={subtype}
              onChange={(e) => setSubtype(e.target.value as typeof subtypes[number])}
            >
              {subtypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className="rounded-sm border border-rule bg-paper px-2 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
              value={verdict}
              onChange={(e) => setVerdict(e.target.value as "supports" | "challenges" | "neutral")}
            >
              <option value="supports">supports</option>
              <option value="challenges">challenges</option>
              <option value="neutral">neutral</option>
            </select>
          </div>
          <input
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-ink focus:outline-none"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-ink focus:outline-none"
            placeholder="Describe the evidence — source, methodology, key finding."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={10}
          />
          <button
            type="submit"
            disabled={pending || !name.trim() || !title.trim() || !content.trim()}
            className="w-full rounded-sm border border-ink bg-ink px-4 py-2 text-sm text-paper transition-opacity disabled:opacity-40"
          >
            {addEv.isPending ? "Submitting…" : "Submit evidence"}
          </button>
        </form>
      )}

      {/* Propose an idea */}
      <button
        className="w-full rounded-sm border border-rule px-4 py-3 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
        onClick={() => openPanel("idea")}
      >
        {open === "idea" ? "Cancel" : "Propose an idea"}
      </button>

      {open === "idea" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addIdea.mutate({ problemId, title, description: content, authorName: name });
          }}
        >
          <input
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-ink focus:outline-none"
            placeholder="Idea title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder-ink-faint focus:border-ink focus:outline-none"
            placeholder="Describe the proposed solution and why it addresses the problem."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={10}
          />
          <button
            type="submit"
            disabled={pending || !name.trim() || !title.trim() || !content.trim()}
            className="w-full rounded-sm border border-ink bg-ink px-4 py-2 text-sm text-paper transition-opacity disabled:opacity-40"
          >
            {addIdea.isPending ? "Submitting…" : "Submit idea"}
          </button>
        </form>
      )}

      {error && (
        <p className="text-xs text-red-600">{error.message}</p>
      )}
    </div>
  );
}
