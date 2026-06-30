#!/usr/bin/env node
// MassAcademy agent-ready TUI
// Usage: pnpm tui             (interactive)
//        pnpm tui --json      (NDJSON stdout — agent mode)
//        pnpm tui --test      (headless self-check)

import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { desc, eq, ilike, or } from "drizzle-orm";
import * as schema from "../src/server/db/schema";

// ── DB (only DATABASE_URL needed — bypasses Next.js env validation) ───────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing. Load .env.local or set the var.");
  process.exit(1);
}
const conn = postgres(DATABASE_URL);
const db = drizzle(conn, { schema });

// ── Types ──────────────────────────────────────────────────────────────────────
type Problem = {
  id: number;
  title: string;
  state: string;
  momentumScore: number;
  momentumDelta: number;
  confidenceScore: number;
  category: { slug: string; name: string } | null;
  patterns: string[];
};

type ProblemDetail = Problem & {
  description: string;
  events: Array<{ id: number; eventType: string; actorName: string | null; summary: string }>;
  observations: Array<{ id: number; authorName: string | null; content: string }>;
  evidence: Array<{ id: number; title: string; subtype: string; verdict: string; content: string }>;
  ideas: Array<{ id: number; title: string; validation: string; description: string | null }>;
};

type FeedItem = {
  id: number;
  type: "observation" | "evidence";
  content: string;
  title: string | null;
  authorName: string | null;
  problemTitle: string | null;
};

type Tab = "obs" | "evidence" | "ideas" | "events";
type View = "problems" | "feed";
type Panel = "list" | "detail";

// ── Queries ───────────────────────────────────────────────────────────────────
async function loadProblems(filter = ""): Promise<Problem[]> {
  const rows = await db.query.problems.findMany({
    with: { category: true, problemPatterns: { with: { pattern: true } } },
    where: filter
      ? or(ilike(schema.problems.title, `%${filter}%`), ilike(schema.problems.description, `%${filter}%`))
      : undefined,
    orderBy: [desc(schema.problems.momentumScore)],
    limit: 50,
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    state: p.state,
    momentumScore: p.momentumScore,
    momentumDelta: p.momentumDelta,
    confidenceScore: p.confidenceScore,
    category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
    patterns: p.problemPatterns.map((pp) => pp.pattern.name),
  }));
}

async function loadDetail(id: number): Promise<ProblemDetail | null> {
  const p = await db.query.problems.findFirst({
    where: eq(schema.problems.id, id),
    with: {
      category: true,
      problemPatterns: { with: { pattern: true } },
      events: { orderBy: [desc(schema.problemEvents.createdAt)], limit: 15 },
      observationProblems: { with: { observation: true }, limit: 10 },
      evidenceProblems: { with: { evidence: true }, limit: 10 },
      ideaProblems: { with: { idea: true }, limit: 10 },
    },
  });
  if (!p) return null;
  return {
    id: p.id, title: p.title, description: p.description,
    state: p.state, momentumScore: p.momentumScore,
    momentumDelta: p.momentumDelta, confidenceScore: p.confidenceScore,
    category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
    patterns: p.problemPatterns.map((pp) => pp.pattern.name),
    events: p.events.map((e) => ({ id: e.id, eventType: e.eventType, actorName: e.actorName, summary: e.summary })),
    observations: p.observationProblems.map((op) => ({ id: op.observation.id, authorName: op.observation.authorName, content: op.observation.content })),
    evidence: p.evidenceProblems.map((ep) => ({ id: ep.evidence.id, title: ep.evidence.title, subtype: ep.evidence.subtype, verdict: ep.verdict, content: ep.evidence.content })),
    ideas: p.ideaProblems.map((ip) => ({ id: ip.idea.id, title: ip.idea.title, validation: ip.idea.validation, description: ip.idea.description })),
  };
}

async function loadFeed(): Promise<FeedItem[]> {
  const [obs, evs] = await Promise.all([
    db.query.observations.findMany({
      with: { observationProblems: { with: { problem: true }, limit: 1 } },
      orderBy: [desc(schema.observations.createdAt)],
      limit: 25,
    }),
    db.query.evidence.findMany({ orderBy: [desc(schema.evidence.createdAt)], limit: 25 }),
  ]);
  return [
    ...obs.map((o): FeedItem => ({
      id: o.id, type: "observation", content: o.content, title: null,
      authorName: o.authorName,
      problemTitle: o.observationProblems[0]?.problem.title ?? null,
    })),
    ...evs.map((e): FeedItem => ({
      id: e.id, type: "evidence", content: e.content, title: e.title,
      authorName: e.contributorName, problemTitle: null,
    })),
  ].sort((a, b) => 0).slice(0, 40); // ponytail: sort dropped — no createdAt on joined obj
}

// ── Agent / headless modes ────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes("--json")) {
  const items = await loadProblems();
  process.stdout.write(JSON.stringify({ type: "list", items }) + "\n");
  process.stderr.write(JSON.stringify({ status: "ok", count: items.length }) + "\n");
  await conn.end();
  process.exit(0);
}

if (args.includes("--test")) {
  const items = await loadProblems();
  const first = items[0];
  if (first) await loadDetail(first.id);
  process.stdout.write("ok\n");
  await conn.end();
  process.exit(0);
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATE_COLOR: Record<string, string> = {
  emerging: "yellow", validating: "cyan", solution_exploration: "blue",
  prototype: "magenta", company_forming: "green", operating: "greenBright",
};

const TABS: Tab[] = ["obs", "evidence", "ideas", "events"];

// ── Components ────────────────────────────────────────────────────────────────
function Bar({ v, w = 8 }: { v: number; w?: number }) {
  const f = Math.round(Math.min(Math.max(v, 0), 100) / 100 * w);
  return <Text>{"█".repeat(f)}{"░".repeat(w - f)}</Text>;
}

function Help({ onClose }: { onClose: () => void }) {
  useInput((ch, key) => { if (key.escape || ch === "?" || ch === "q") onClose(); });
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1} width={52}>
      <Text bold color="cyan"> MassAcademy — Key Reference </Text>
      <Text> </Text>
      <Text bold>Navigation</Text>
      <Text>  j/↓  k/↑     move list</Text>
      <Text>  Tab           switch panel (list ↔ detail)</Text>
      <Text>  1 / 2         Problems / Feed view</Text>
      <Text>  Esc           back / clear filter</Text>
      <Text> </Text>
      <Text bold>Detail tabs (when in detail panel)</Text>
      <Text>  o  e  i  v   obs / evidence / ideas / events</Text>
      <Text> </Text>
      <Text bold>Actions</Text>
      <Text>  /             filter problems</Text>
      <Text>  r             refresh</Text>
      <Text>  ?             this screen</Text>
      <Text>  q             quit</Text>
      <Text> </Text>
      <Text bold>Agent</Text>
      <Text>  pnpm tui --json   NDJSON, no UI</Text>
      <Text>  pnpm tui --test   headless self-check</Text>
      <Text> </Text>
      <Text dimColor>Press ?, Esc, or q to close</Text>
    </Box>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const { exit } = useApp();
  const cols = process.stdout.columns ?? 120;
  const lw = Math.floor(cols * 0.36);
  const dw = cols - lw - 5;

  const [view, setView] = useState<View>("problems");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [cursor, setCursor] = useState(0);
  const [feedCursor, setFeedCursor] = useState(0);
  const [tab, setTab] = useState<Tab>("obs");
  const [panel, setPanel] = useState<Panel>("list");
  const [filter, setFilter] = useState("");
  const [filtering, setFiltering] = useState(false);
  const [draft, setDraft] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [status, setStatus] = useState("loading…");

  const refreshProblems = useCallback(async (f = filter) => {
    setStatus("loading…");
    try {
      const data = await loadProblems(f);
      setProblems(data);
      setCursor(0);
      setDetail(null);
      setStatus(`${data.length} problems`);
    } catch (e) { setStatus(`error: ${String(e)}`); }
  }, [filter]);

  const refreshFeed = useCallback(async () => {
    setStatus("loading…");
    try {
      const data = await loadFeed();
      setFeed(data);
      setFeedCursor(0);
      setStatus(`${data.length} items`);
    } catch (e) { setStatus(`error: ${String(e)}`); }
  }, []);

  useEffect(() => { void refreshProblems(); }, []); // eslint-disable-line

  useEffect(() => {
    if (view !== "problems" || problems.length === 0) return;
    const sel = problems[cursor];
    if (!sel) return;
    setDetail(null);
    void loadDetail(sel.id).then((d) => setDetail(d));
  }, [cursor, problems, view]);

  useInput((ch, key) => {
    if (showHelp) return;

    // Filter input mode
    if (filtering) {
      if (key.return) {
        setFilter(draft); setFiltering(false);
        void refreshProblems(draft);
      } else if (key.escape) {
        setFiltering(false); setDraft(filter);
      } else if (key.backspace || key.delete) {
        setDraft((d) => d.slice(0, -1));
      } else if (ch && !key.ctrl && !key.meta) {
        setDraft((d) => d + ch);
      }
      return;
    }

    if (ch === "q") { void conn.end().then(() => exit()); return; }
    if (ch === "?") { setShowHelp(true); return; }
    if (ch === "r") { view === "problems" ? void refreshProblems() : void refreshFeed(); return; }
    if (ch === "1") { setView("problems"); void refreshProblems(); return; }
    if (ch === "2") { setView("feed"); void refreshFeed(); return; }
    if (ch === "/") { setFiltering(true); setDraft(filter); return; }
    if (key.tab) { setPanel((p) => p === "list" ? "detail" : "list"); return; }
    if (key.escape) { setFilter(""); setDraft(""); void refreshProblems(""); return; }

    const listLen = view === "problems" ? problems.length : feed.length;
    const cur = view === "problems" ? cursor : feedCursor;
    const setCur = view === "problems" ? setCursor : setFeedCursor;

    if (panel === "list") {
      if ((ch === "j" || key.downArrow) && cur < listLen - 1) setCur(cur + 1);
      if ((ch === "k" || key.upArrow) && cur > 0) setCur(cur - 1);
      if (key.return) setPanel("detail");
    } else {
      if (ch === "o") setTab("obs");
      if (ch === "e") setTab("evidence");
      if (ch === "i") setTab("ideas");
      if (ch === "v") setTab("events");
      if (key.escape || ch === "k" || key.upArrow) setPanel("list");
    }
  });

  if (showHelp) return <Help onClose={() => setShowHelp(false)} />;

  const selP = problems[cursor];
  const selF = feed[feedCursor];

  return (
    <Box flexDirection="column" width={cols}>
      {/* Header */}
      <Box paddingX={1}>
        <Text bold color="cyan">MassAcademy </Text>
        <Text color={view === "problems" ? "whiteBright" : "gray"}>[1]Problems </Text>
        <Text color={view === "feed" ? "whiteBright" : "gray"}>[2]Feed  </Text>
        {filtering
          ? <Text color="yellow">/{draft}_</Text>
          : filter
            ? <Text color="yellow">/{filter} <Text dimColor>[Esc clear]</Text></Text>
            : <Text dimColor>/:filter  ?:help  q:quit</Text>
        }
      </Box>

      {/* Panels */}
      <Box>
        {/* List panel */}
        <Box
          flexDirection="column"
          width={lw}
          borderStyle="single"
          borderColor={panel === "list" ? "cyan" : "gray"}
        >
          {view === "problems" && problems.map((p, i) => (
            <Text key={p.id} wrap="truncate">
              <Text color={i === cursor ? "cyanBright" : undefined}>{i === cursor ? "▶" : " "} </Text>
              <Text color={STATE_COLOR[p.state] ?? "white"}>{p.state.slice(0, 5)} </Text>
              <Text color={i === cursor ? "white" : "gray"}>{p.title.slice(0, lw - 10)}</Text>
            </Text>
          ))}
          {view === "feed" && feed.map((f, i) => (
            <Text key={`${f.type}-${f.id}`} wrap="truncate">
              <Text color={i === feedCursor ? "cyanBright" : undefined}>{i === feedCursor ? "▶" : " "} </Text>
              <Text color={f.type === "observation" ? "yellow" : "magenta"}>{f.type.slice(0, 3)} </Text>
              <Text color={i === feedCursor ? "white" : "gray"}>{(f.title ?? f.content).slice(0, lw - 8)}</Text>
            </Text>
          ))}
          {problems.length === 0 && view === "problems" && <Text dimColor> {status}</Text>}
          {feed.length === 0 && view === "feed" && <Text dimColor> {status}</Text>}
        </Box>

        {/* Detail panel */}
        <Box
          flexDirection="column"
          width={dw}
          borderStyle="single"
          borderColor={panel === "detail" ? "cyan" : "gray"}
          paddingX={1}
        >
          {view === "problems" && selP && (
            <>
              <Text bold wrap="truncate">{selP.title}</Text>
              <Box gap={2}>
                <Text>state:<Text color={STATE_COLOR[selP.state] ?? "white"}> {selP.state}</Text></Text>
                {selP.category && <Text>cat:<Text color="blue"> {selP.category.name}</Text></Text>}
              </Box>
              <Text>
                momentum: <Bar v={selP.momentumScore} /> {selP.momentumScore}
                {selP.momentumDelta > 0 && <Text color="green"> +{selP.momentumDelta}</Text>}
                {selP.momentumDelta < 0 && <Text color="red"> {selP.momentumDelta}</Text>}
              </Text>
              <Text>confidence: <Bar v={selP.confidenceScore} color="blue" /> {selP.confidenceScore}</Text>
              {selP.patterns.length > 0 && <Text dimColor>patterns: {selP.patterns.join(", ")}</Text>}

              {/* Tab bar */}
              <Box marginTop={1}>
                {TABS.map((t) => (
                  <Text key={t} color={tab === t ? "cyan" : "gray"}> [{t[0]}]{t.slice(1)}</Text>
                ))}
              </Box>

              {!detail && <Text dimColor> loading…</Text>}

              {detail && tab === "obs" && (
                detail.observations.length === 0
                  ? <Text dimColor> no observations</Text>
                  : detail.observations.map((o) => (
                      <Text key={o.id} wrap="truncate">• {o.content.slice(0, dw - 3)}</Text>
                    ))
              )}
              {detail && tab === "evidence" && (
                detail.evidence.length === 0
                  ? <Text dimColor> no evidence</Text>
                  : detail.evidence.map((e) => (
                      <Box key={e.id} flexDirection="column">
                        <Text wrap="truncate">
                          • <Text bold>{e.title}</Text>
                          <Text color={e.verdict === "supports" ? "green" : e.verdict === "challenges" ? "red" : "gray"}> [{e.verdict}]</Text>
                        </Text>
                        <Text dimColor wrap="truncate">  {e.content.slice(0, dw - 4)}</Text>
                      </Box>
                    ))
              )}
              {detail && tab === "ideas" && (
                detail.ideas.length === 0
                  ? <Text dimColor> no ideas</Text>
                  : detail.ideas.map((i) => (
                      <Box key={i.id} flexDirection="column">
                        <Text wrap="truncate">• <Text bold>{i.title}</Text> <Text color="cyan">[{i.validation}]</Text></Text>
                        {i.description && <Text dimColor wrap="truncate">  {i.description.slice(0, dw - 4)}</Text>}
                      </Box>
                    ))
              )}
              {detail && tab === "events" && (
                detail.events.length === 0
                  ? <Text dimColor> no events</Text>
                  : detail.events.map((e) => (
                      <Text key={e.id} wrap="truncate">
                        • <Text color="yellow">{e.eventType}</Text> {e.summary.slice(0, dw - e.eventType.length - 5)}
                      </Text>
                    ))
              )}
            </>
          )}

          {view === "feed" && selF && (
            <>
              <Text bold color={selF.type === "observation" ? "yellow" : "magenta"}>[{selF.type}]</Text>
              {selF.title && <Text bold wrap="truncate">{selF.title}</Text>}
              <Text wrap="wrap">{selF.content.slice(0, dw * 3)}</Text>
              {selF.authorName && <Text dimColor>— {selF.authorName}</Text>}
              {selF.problemTitle && <Text>problem: <Text color="cyan">{selF.problemTitle}</Text></Text>}
            </>
          )}

          {view === "problems" && !selP && <Text dimColor> {status}</Text>}
        </Box>
      </Box>

      {/* Status bar */}
      <Box paddingX={1}>
        <Text dimColor>{status} | j/k:nav tab:panel</Text>
        {view === "problems" && panel === "detail" && <Text dimColor> o/e/i/v:tabs</Text>}
        <Text dimColor> 1/2:view r:refresh ?:help q:quit</Text>
      </Box>
    </Box>
  );
}

render(<App />);
