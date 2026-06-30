import { TRPCError } from "@trpc/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  classifyExpertise,
  formatExpertiseLabel,
} from "@/server/community/categories";
import { ensureCategories, getCategoryRecord } from "@/server/community/seed";
import {
  getOrCreateSessionId,
  getSessionId,
} from "@/server/community/session";
import { applications, categories, roomMembers } from "@/server/db/schema";

export const communityRouter = createTRPCRouter({
  joinRoom: publicProcedure
    .input(
      z.object({
        expertise: z.string().min(1).max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureCategories(ctx.db);

      const sessionId = await getOrCreateSessionId();
      const matched = classifyExpertise(input.expertise);
      const category = await getCategoryRecord(ctx.db, matched.slug);

      if (!category) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Category not found.",
        });
      }

      const expertiseLabel = formatExpertiseLabel(input.expertise);

      await ctx.db
        .insert(roomMembers)
        .values({
          categoryId: category.id,
          sessionId,
          expertiseLabel,
        })
        .onConflictDoUpdate({
          target: [roomMembers.sessionId, roomMembers.categoryId],
          set: {
            expertiseLabel,
          },
        });

      return {
        categorySlug: category.slug,
        categoryName: category.name,
        expertiseLabel,
      };
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        categorySlug: z.string(),
        displayName: z.string().min(1).max(128),
        expertiseLabel: z.string().min(1).max(256).optional(),
        yearsExperience: z.number().int().min(0).max(80).optional(),
        bio: z.string().max(1000).optional(),
        intent: z.string().max(512).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await getOrCreateSessionId();
      const category = await getCategoryRecord(ctx.db, input.categorySlug);

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found.",
        });
      }

      const expertiseLabel = input.expertiseLabel
        ? formatExpertiseLabel(input.expertiseLabel)
        : input.displayName;

      await ctx.db
        .insert(roomMembers)
        .values({
          categoryId: category.id,
          sessionId,
          expertiseLabel,
          displayName: input.displayName,
          yearsExperience: input.yearsExperience,
          bio: input.bio,
          intent: input.intent,
        })
        .onConflictDoUpdate({
          target: [roomMembers.sessionId, roomMembers.categoryId],
          set: {
            displayName: input.displayName,
            yearsExperience: input.yearsExperience,
            bio: input.bio,
            intent: input.intent,
            ...(input.expertiseLabel && {
              expertiseLabel: formatExpertiseLabel(input.expertiseLabel),
            }),
          },
        });

      return { success: true };
    }),

  updateIntent: publicProcedure
    .input(
      z.object({
        categorySlug: z.string(),
        intent: z.string().min(1).max(512),
        expertiseLabel: z.string().min(1).max(256).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await getOrCreateSessionId();
      const category = await getCategoryRecord(ctx.db, input.categorySlug);

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found.",
        });
      }

      const expertiseLabel = input.expertiseLabel
        ? formatExpertiseLabel(input.expertiseLabel)
        : "Member";

      await ctx.db
        .insert(roomMembers)
        .values({
          categoryId: category.id,
          sessionId,
          expertiseLabel,
          intent: input.intent,
        })
        .onConflictDoUpdate({
          target: [roomMembers.sessionId, roomMembers.categoryId],
          set: { intent: input.intent },
        });

      return { success: true };
    }),

  submitApplication: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        email: z.string().email().max(256),
        expertise: z.string().min(1).max(256),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sessionId = await getSessionId();

      await ctx.db.insert(applications).values({
        sessionId: sessionId ?? undefined,
        name: input.name,
        email: input.email,
        expertise: input.expertise,
        message: input.message,
      });

      return { success: true };
    }),

  listRooms: publicProcedure.query(async ({ ctx }) => {
    await ensureCategories(ctx.db);

    const rows = await ctx.db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        memberCount: count(roomMembers.id),
      })
      .from(categories)
      .leftJoin(roomMembers, eq(categories.id, roomMembers.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return rows.map((row) => ({
      ...row,
      memberCount: Number(row.memberCount),
      id: Number(row.id),
    }));
  }),

  getRoom: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureCategories(ctx.db);

      const category = await getCategoryRecord(ctx.db, input.slug);

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found.",
        });
      }

      const sessionId = await getSessionId();
      const members = await ctx.db.query.roomMembers.findMany({
        where: eq(roomMembers.categoryId, category.id),
        orderBy: [desc(roomMembers.createdAt)],
      });

      const you = sessionId
        ? (members.find((member) => member.sessionId === sessionId) ?? null)
        : null;

      const profileComplete = Boolean(
        you?.displayName && you?.bio && you?.intent,
      );

      return {
        category: {
          slug: category.slug,
          name: category.name,
          description: category.description,
        },
        memberCount: members.length,
        you: you
          ? {
              expertiseLabel: you.expertiseLabel,
              displayName: you.displayName,
              yearsExperience: you.yearsExperience,
              bio: you.bio,
              intent: you.intent,
              joinedAt: you.createdAt,
              profileComplete,
            }
          : null,
        members: members.map((member) => ({
          id: member.id,
          expertiseLabel: member.expertiseLabel,
          displayName: member.displayName,
          yearsExperience: member.yearsExperience,
          bio: member.bio,
          intent: member.intent,
          joinedAt: member.createdAt,
          isYou: member.sessionId === sessionId,
        })),
      };
    }),

  classify: publicProcedure
    .input(z.object({ expertise: z.string().min(1).max(256) }))
    .query(({ input }) => {
      const matched = classifyExpertise(input.expertise);
      return {
        slug: matched.slug,
        name: matched.name,
        description: matched.description,
      };
    }),
});
