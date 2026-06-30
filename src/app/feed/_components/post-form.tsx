"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

type Room = { slug: string; name: string; categoryId?: number };

export function PostForm({
  defaultName,
  rooms,
}: {
  defaultName?: string;
  rooms: Room[];
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [name, setName] = useState(defaultName ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [done, setDone] = useState(false);

  const post = api.problem.postObservation.useMutation({
    onSuccess: () => {
      setContent("");
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setOpen(false);
      }, 1500);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !name.trim() || post.isPending) return;
    post.mutate({ content: content.trim(), authorName: name.trim(), categoryId });
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-5 text-[0.8125rem] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Post
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 rounded-sm border border-rule p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="label">New observation</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-faint hover:text-ink"
            >
              Cancel
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you observe? Describe the problem or friction you've seen…"
            rows={4}
            className="w-full rounded-sm border border-rule bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ink-faint resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-sm border border-rule bg-paper px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ink-faint"
            />
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-sm border border-rule bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-ink-faint"
            >
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r.slug} value={r.categoryId ?? ""}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {post.error && (
            <p className="text-xs text-red-600">Something went wrong. Try again.</p>
          )}

          <button
            type="submit"
            disabled={post.isPending || !content.trim() || !name.trim()}
            className="inline-flex h-9 items-center justify-center rounded-full bg-accent px-6 text-[0.8125rem] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {done ? "Posted ✓" : post.isPending ? "Posting…" : "Post observation"}
          </button>
        </form>
      )}
    </div>
  );
}
