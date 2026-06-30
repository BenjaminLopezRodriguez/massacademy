import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { ensureCategories, ensurePatterns } from "@/server/community/seed";
import {
  evidence,
  evidenceProblems,
  ideaProblems,
  ideas,
  observationProblems,
  observations,
  problemEvents,
  problems,
} from "@/server/db/schema";

async function seed(database: Parameters<typeof ensurePatterns>[0]) {
  await ensureCategories(database);
  await ensurePatterns(database);
}

export const problemRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await seed(ctx.db);

      const problem = await ctx.db.query.problems.findFirst({
        where: eq(problems.id, input.id),
        with: {
          category: true,
          events: { orderBy: [asc(problemEvents.createdAt)] },
          problemPatterns: { with: { pattern: true } },
          observationProblems: {
            with: { observation: true },
            orderBy: (op, { asc: a }) => [a(op.linkedAt)],
          },
          evidenceProblems: {
            with: { evidence: true },
            orderBy: (ep, { asc: a }) => [a(ep.linkedAt)],
          },
          ideaProblems: {
            with: { idea: true },
            orderBy: (ip, { asc: a }) => [a(ip.linkedAt)],
          },
        },
      });

      if (!problem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      return {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        state: problem.state,
        momentumScore: problem.momentumScore,
        momentumDelta: problem.momentumDelta,
        confidenceScore: problem.confidenceScore,
        createdAt: problem.createdAt,
        category: problem.category
          ? { slug: problem.category.slug, name: problem.category.name, id: problem.category.id }
          : null,
        patterns: problem.problemPatterns.map((pp) => ({
          id: pp.pattern.id,
          slug: pp.pattern.slug,
          name: pp.pattern.name,
          description: pp.pattern.description,
        })),
        events: problem.events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          actorName: e.actorName,
          summary: e.summary,
          createdAt: e.createdAt,
        })),
        observations: problem.observationProblems.map((op) => ({
          id: op.observation.id,
          authorName: op.observation.authorName,
          content: op.observation.content,
          createdAt: op.observation.createdAt,
        })),
        evidence: problem.evidenceProblems.map((ep) => ({
          id: ep.evidence.id,
          contributorName: ep.evidence.contributorName,
          subtype: ep.evidence.subtype,
          title: ep.evidence.title,
          content: ep.evidence.content,
          verdict: ep.verdict,
          createdAt: ep.evidence.createdAt,
        })),
        ideas: problem.ideaProblems.map((ip) => ({
          id: ip.idea.id,
          authorName: ip.idea.authorName,
          title: ip.idea.title,
          description: ip.idea.description,
          validation: ip.idea.validation,
          createdAt: ip.idea.createdAt,
        })),
      };
    }),

  list: publicProcedure
    .input(
      z.object({
        patternSlug: z.string().optional(),
        state: z
          .enum([
            "emerging",
            "validating",
            "solution_exploration",
            "prototype",
            "company_forming",
            "operating",
          ])
          .optional(),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      await seed(ctx.db);

      const rows = await ctx.db.query.problems.findMany({
        with: {
          category: true,
          problemPatterns: { with: { pattern: true } },
        },
        where: input.state ? eq(problems.state, input.state) : undefined,
        orderBy: (p, { desc }) => [desc(p.momentumScore)],
        limit: input.limit,
      });

      return rows.map((p) => ({
        id: p.id,
        title: p.title,
        state: p.state,
        momentumScore: p.momentumScore,
        momentumDelta: p.momentumDelta,
        confidenceScore: p.confidenceScore,
        category: p.category
          ? { slug: p.category.slug, name: p.category.name }
          : null,
        patterns: p.problemPatterns.map((pp) => pp.pattern.name),
      }));
    }),

  addObservation: publicProcedure
    .input(
      z.object({
        problemId: z.number().int().positive(),
        content: z.string().min(10).max(2000),
        authorName: z.string().min(1).max(128),
        categoryId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.query.problems.findFirst({
        where: eq(problems.id, input.problemId),
      });
      if (!problem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      const [obs] = await ctx.db
        .insert(observations)
        .values({
          content: input.content,
          authorName: input.authorName,
          categoryId: input.categoryId ?? problem.categoryId,
        })
        .returning({ id: observations.id });

      if (!obs) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db
        .insert(observationProblems)
        .values({ observationId: obs.id, problemId: input.problemId });

      await ctx.db.insert(problemEvents).values({
        problemId: input.problemId,
        eventType: "ObservationAdded",
        actorName: input.authorName,
        summary: `Observation: ${input.content.slice(0, 120)}${input.content.length > 120 ? "…" : ""}`,
      });

      return { id: obs.id };
    }),

  addEvidence: publicProcedure
    .input(
      z.object({
        problemId: z.number().int().positive(),
        subtype: z.enum(["interview", "research", "measurement", "experiment", "prototype", "document"]),
        title: z.string().min(1).max(256),
        content: z.string().min(10).max(5000),
        contributorName: z.string().min(1).max(128),
        verdict: z.enum(["supports", "challenges", "neutral"]).default("supports"),
        categoryId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.query.problems.findFirst({
        where: eq(problems.id, input.problemId),
      });
      if (!problem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      const [ev] = await ctx.db
        .insert(evidence)
        .values({
          contributorName: input.contributorName,
          subtype: input.subtype,
          title: input.title,
          content: input.content,
          categoryId: input.categoryId ?? problem.categoryId,
        })
        .returning({ id: evidence.id });

      if (!ev) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db
        .insert(evidenceProblems)
        .values({ evidenceId: ev.id, problemId: input.problemId, verdict: input.verdict });

      await ctx.db.insert(problemEvents).values({
        problemId: input.problemId,
        eventType: "EvidenceAdded",
        actorName: input.contributorName,
        summary: `${input.subtype}: ${input.title}`,
      });

      return { id: ev.id };
    }),

  addIdea: publicProcedure
    .input(
      z.object({
        problemId: z.number().int().positive(),
        title: z.string().min(1).max(256),
        description: z.string().min(10).max(5000),
        authorName: z.string().min(1).max(128),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const problem = await ctx.db.query.problems.findFirst({
        where: eq(problems.id, input.problemId),
      });
      if (!problem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found." });
      }

      const [idea] = await ctx.db
        .insert(ideas)
        .values({
          authorName: input.authorName,
          title: input.title,
          description: input.description,
        })
        .returning({ id: ideas.id });

      if (!idea) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.db
        .insert(ideaProblems)
        .values({ ideaId: idea.id, problemId: input.problemId });

      await ctx.db.insert(problemEvents).values({
        problemId: input.problemId,
        eventType: "IdeaProposed",
        actorName: input.authorName,
        summary: `Idea proposed: ${input.title}`,
      });

      return { id: idea.id };
    }),

  activityFeed: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const problemWith = {
        category: true,
        problemPatterns: { with: { pattern: true } },
        evidenceProblems: { columns: { id: true } },
      } as const;

      const [recentObs, recentEvidence] = await Promise.all([
        ctx.db.query.observations.findMany({
          with: {
            observationProblems: { with: { problem: { with: problemWith } }, limit: 1 },
            category: true,
          },
          orderBy: [desc(observations.createdAt)],
          limit: input.limit,
        }),
        ctx.db.query.evidence.findMany({
          with: {
            evidenceProblems: { with: { problem: { with: problemWith } }, limit: 1 },
            category: true,
          },
          orderBy: [desc(evidence.createdAt)],
          limit: input.limit,
        }),
      ]);

      function mapProblem(
        problem: (typeof recentObs)[number]["observationProblems"][number]["problem"],
      ) {
        return {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          momentumScore: problem.momentumScore,
          category: problem.category,
          patterns: problem.problemPatterns.map((pp) => ({
            name: pp.pattern.name,
            slug: pp.pattern.slug,
          })),
          evidenceCount: problem.evidenceProblems.length,
        };
      }

      const obsItems = recentObs.map((o) => ({
        type: "observation" as const,
        id: o.id,
        content: o.content,
        title: null as string | null,
        subtype: null as string | null,
        postType: o.postType,
        authorName: o.authorName,
        createdAt: o.createdAt,
        problem: o.observationProblems[0]?.problem
          ? mapProblem(o.observationProblems[0].problem)
          : null,
        category: o.category,
      }));

      const evItems = recentEvidence.map((e) => ({
        type: "evidence" as const,
        id: e.id,
        content: e.content,
        title: e.title,
        subtype: e.subtype as string,
        postType: null as string | null,
        authorName: e.contributorName,
        createdAt: e.createdAt,
        problem: e.evidenceProblems[0]?.problem
          ? mapProblem(e.evidenceProblems[0].problem)
          : null,
        category: e.category,
      }));

      return [...obsItems, ...evItems]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.limit);
    }),

  postObservation: publicProcedure
    .input(
      z.object({
        content: z.string().min(10).max(2000),
        authorName: z.string().min(1).max(128),
        categoryId: z.number().int().positive().optional(),
        postType: z.enum([
          "observation", "idea", "request", "customer_insight", "case_study",
          "prototype", "milestone", "question", "hiring", "funding", "workflow", "problem_report",
        ]).default("observation"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [obs] = await ctx.db
        .insert(observations)
        .values({
          content: input.content,
          authorName: input.authorName,
          categoryId: input.categoryId,
          postType: input.postType,
        })
        .returning({ id: observations.id });

      if (!obs) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { id: obs.id };
    }),
});
