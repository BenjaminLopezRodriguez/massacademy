"use client";

import { useRef, useState } from "react";

import { FeedChip } from "@/app/feed/_components/feed-chip";
import { api } from "@/trpc/react";

type Room = { slug: string; name: string; categoryId?: number };

const POST_TYPES = [
  { value: "observation", label: "Observation" },
  { value: "idea", label: "Idea" },
  { value: "request", label: "Request" },
  { value: "customer_insight", label: "Customer Insight" },
  { value: "case_study", label: "Case Study" },
  { value: "prototype", label: "Prototype" },
  { value: "milestone", label: "Milestone" },
  { value: "question", label: "Question" },
  { value: "hiring", label: "Hiring" },
  { value: "funding", label: "Funding" },
  { value: "workflow", label: "Workflow" },
  { value: "problem_report", label: "Problem Report" },
] as const;

type PostType = (typeof POST_TYPES)[number]["value"];

function getMentionQuery(text: string, cursor: number): string | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@([^@\n]*)$/);
  return match ? (match[1] ?? "") : null;
}

export function PostForm({
  defaultName,
  rooms,
}: {
  defaultName?: string;
  rooms: Room[];
  plain?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [cursor, setCursor] = useState(0);
  const [name, setName] = useState(defaultName ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [postType, setPostType] = useState<PostType>("observation");
  const [done, setDone] = useState(false);

  const mentionQuery = getMentionQuery(content, cursor);
  const showMentions = mentionQuery !== null;

  const filteredRooms = showMentions
    ? rooms.filter((r) => r.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : [];

  const post = api.problem.postObservation.useMutation({
    onSuccess: () => {
      setContent("");
      setCategoryId(undefined);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    },
  });

  function syncCursor() {
    const el = textareaRef.current;
    if (el) setCursor(el.selectionStart);
  }

  function selectRoom(room: Room) {
    const el = textareaRef.current;
    if (!el) return;

    const pos = el.selectionStart;
    const before = content.slice(0, pos);
    const atIndex = before.lastIndexOf("@");
    if (atIndex === -1) return;

    const next = `${content.slice(0, atIndex)}@${room.name} ${content.slice(pos)}`;
    setContent(next);
    setCategoryId(room.categoryId);
    setCursor(atIndex + room.name.length + 2);

    requestAnimationFrame(() => {
      el.focus();
      const nextPos = atIndex + room.name.length + 2;
      el.setSelectionRange(nextPos, nextPos);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !name.trim() || post.isPending) return;
    post.mutate({ content: content.trim(), authorName: name.trim(), categoryId, postType });
  }

  const canPost = content.trim().length >= 10 && name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="border-b border-rule pb-6">
      <div className="flex flex-wrap gap-x-5 gap-y-1 pb-4">
        {POST_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setPostType(t.value)}
            className={`label transition-colors ${postType === t.value ? "text-ink" : "text-ink-faint hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setCursor(e.target.selectionStart);
        }}
        onSelect={syncCursor}
        onKeyUp={syncCursor}
        onClick={syncCursor}
        placeholder="What did you observe? Type @ to tag an industry…"
        rows={3}
        className="w-full resize-none bg-transparent font-serif text-2xl leading-relaxed text-ink outline-none placeholder:text-ink-faint"
      />

      {showMentions && filteredRooms.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filteredRooms.map((room) => (
            <button
              key={room.slug}
              type="button"
              onClick={() => selectRoom(room)}
              className="cursor-pointer border-0 bg-transparent p-0"
            >
              <FeedChip label="Industry">{room.name}</FeedChip>
            </button>
          ))}
        </div>
      )}

      {(content.trim() || !defaultName) && (
        <div className="mt-4 flex items-center justify-between gap-4">
          {!defaultName && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="max-w-xs rounded-sm border border-rule bg-paper px-4 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ink-faint"
            />
          )}
          <div className={defaultName ? "ml-auto" : ""}>
            {post.error && (
              <p className="mb-2 text-xs text-red-600">Something went wrong. Try again.</p>
            )}
            <button
              type="submit"
              disabled={post.isPending || !canPost}
              className="label text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
            >
              {done ? "Posted" : post.isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
