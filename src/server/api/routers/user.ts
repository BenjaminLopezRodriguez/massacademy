import { desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  evidence,
  ideas,
  observations,
  problems,
  roomMembers,
  users,
} from "@/server/db/schema";

function scoreReadiness(value: number, cap: number) {
  return Math.min(100, Math.round((value / cap) * 100));
}

function deriveStage(
  observationCount: number,
  evidenceCount: number,
  problemCount: number,
  ideaCount: number,
) {
  if (ideaCount > 0) return "Solution Exploration";
  if (problemCount > 0) return "Problem Validation";
  if (evidenceCount >= 3) return "Customer Discovery";
  if (observationCount > 0) return "Observation";
  return "Getting Started";
}

export const userRouter = createTRPCRouter({
  upsert: publicProcedure
    .input(
      z.object({
        kindeId: z.string().min(1),
        email: z.string().email().optional(),
        displayName: z.string().optional(),
        craft: z.string().max(256).optional(),
        role: z
          .enum(["domain_expert", "investor", "operator", "builder"])
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(users)
        .values({
          kindeId: input.kindeId,
          email: input.email,
          displayName: input.displayName,
          craft: input.craft,
          role: input.role,
        })
        .onConflictDoUpdate({
          target: users.kindeId,
          set: {
            ...(input.email && { email: input.email }),
            ...(input.displayName && { displayName: input.displayName }),
            ...(input.craft && { craft: input.craft }),
            ...(input.role && { role: input.role }),
            updatedAt: new Date(),
          },
        });
      return { ok: true };
    }),

  getByKindeId: publicProcedure
    .input(z.object({ kindeId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.users.findFirst({
        where: eq(users.kindeId, input.kindeId),
      });
    }),

  getMyProfile: publicProcedure
    .input(
      z.object({
        kindeId: z.string().min(1),
        displayName: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.kindeId, input.kindeId),
      });

      const safeDisplayName =
        input.displayName !== "Expert" && input.displayName.trim().length > 0
          ? input.displayName
          : null;

      const [memberRows, observationRows, evidenceRows, problemRows, ideaRows] =
        safeDisplayName
          ? await Promise.all([
              ctx.db.query.roomMembers.findMany({
                where: ilike(roomMembers.displayName, safeDisplayName),
                with: { category: true },
                orderBy: [desc(roomMembers.createdAt)],
              }),
              ctx.db.query.observations.findMany({
                where: ilike(observations.authorName, safeDisplayName),
                orderBy: [desc(observations.createdAt)],
                limit: 20,
              }),
              ctx.db.query.evidence.findMany({
                where: ilike(evidence.contributorName, safeDisplayName),
                orderBy: [desc(evidence.createdAt)],
                limit: 20,
              }),
              ctx.db.query.problems.findMany({
                where: ilike(problems.authorName, safeDisplayName),
                orderBy: [desc(problems.createdAt)],
                limit: 20,
              }),
              ctx.db.query.ideas.findMany({
                where: ilike(ideas.authorName, safeDisplayName),
                orderBy: [desc(ideas.createdAt)],
                limit: 20,
              }),
            ])
          : [[], [], [], [], []];

      const primaryMember = memberRows[0] ?? null;
      const craft = user?.craft ?? primaryMember?.expertiseLabel ?? "Expert";
      const bio =
        primaryMember?.bio ??
        primaryMember?.intent ??
        (user?.craft
          ? `${user.craft} building on Mass Academy.`
          : "Building on Mass Academy.");

      const skills = memberRows.length
        ? memberRows.map((member) => ({
            label: member.expertiseLabel,
            years: member.yearsExperience,
            endorsed: 0,
          }))
        : user?.craft
          ? [{ label: user.craft, years: null as number | null, endorsed: 0 }]
          : [];

      const activity = [
        ...observationRows.map((row) => ({
          id: `observation-${row.id}`,
          type: "observation" as const,
          content: row.content,
          createdAt: row.createdAt,
        })),
        ...evidenceRows.map((row) => ({
          id: `evidence-${row.id}`,
          type: "evidence" as const,
          content: row.content,
          createdAt: row.createdAt,
        })),
        ...problemRows.map((row) => ({
          id: `problem-${row.id}`,
          type: "problem" as const,
          content: row.description,
          createdAt: row.createdAt,
        })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 12);

      const observationCount = observationRows.length;
      const evidenceCount = evidenceRows.length;
      const problemCount = problemRows.length;
      const ideaCount = ideaRows.length;
      const contributionCount =
        observationCount + evidenceCount + problemCount + ideaCount;

      const reputationScore = Math.min(
        99,
        40 +
          observationCount * 4 +
          evidenceCount * 6 +
          problemCount * 10 +
          ideaCount * 5,
      );

      const readiness = {
        domainExpertise: scoreReadiness(
          primaryMember?.yearsExperience ?? (user?.craft ? 5 : 0),
          20,
        ),
        customerDiscovery: scoreReadiness(evidenceCount, 5),
        execution: scoreReadiness(ideaCount + problemCount, 4),
        productValidation: scoreReadiness(
          problemRows.filter((p) => p.state !== "emerging").length,
          2,
        ),
      };

      const categoryIds = new Set(
        memberRows.map((member) => member.categoryId),
      );
      let adjacentExperts = 0;
      if (categoryIds.size > 0) {
        const peers = await ctx.db.query.roomMembers.findMany({
          columns: { id: true, displayName: true, categoryId: true },
        });
        adjacentExperts = peers.filter(
          (peer) =>
            categoryIds.has(peer.categoryId) &&
            peer.displayName?.toLowerCase() !==
              input.displayName.toLowerCase(),
        ).length;
      }

      const stage = deriveStage(
        observationCount,
        evidenceCount,
        problemCount,
        ideaCount,
      );

      const stageNext =
        stage === "Getting Started"
          ? "Post your first observation from a room or the feed."
          : stage === "Observation"
            ? "Link observations to a problem or add evidence."
            : stage === "Customer Discovery"
              ? "Document more customer interviews as Evidence linked to your Problem."
              : stage === "Problem Validation"
                ? "Propose an idea or gather more supporting evidence."
                : "Share what you are building with peers in your room.";

      return {
        user,
        craft,
        bio,
        skills,
        activity,
        reputationScore,
        readiness,
        stage,
        stageNext,
        adjacentExperts,
        contributionCount,
        joinedAt: user?.createdAt ?? primaryMember?.createdAt ?? new Date(),
        hasMomentum: contributionCount > 0,
      };
    }),
});
