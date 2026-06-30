import { eq } from "drizzle-orm";

import { CATEGORIES } from "@/server/community/categories";
import type { db } from "@/server/db";
import { categories, patterns } from "@/server/db/schema";

// ─── Categories ───────────────────────────────────────────────────────────────

export async function ensureCategories(database: typeof db) {
  for (const category of CATEGORIES) {
    await database
      .insert(categories)
      .values({
        slug: category.slug,
        name: category.name,
        description: category.description,
      })
      .onConflictDoNothing({ target: categories.slug });
  }
}

export async function getCategoryRecord(database: typeof db, slug: string) {
  return database.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

const PATTERNS = [
  {
    slug: "information-handoff",
    name: "Information Handoff",
    description:
      "Structured information that exists in one system must be re-entered into a human transition process. Appears wherever parties change at shift, season, or phase boundaries.",
  },
  {
    slug: "scheduling",
    name: "Scheduling",
    description:
      "Allocating limited resources (time, people, equipment) across competing demands under uncertainty.",
  },
  {
    slug: "inspection",
    name: "Inspection",
    description:
      "Systematically verifying that physical or digital objects meet defined standards, often at scale.",
  },
  {
    slug: "prediction",
    name: "Prediction",
    description:
      "Forecasting future states from historical signals — yield, demand, failure, outcome.",
  },
  {
    slug: "resource-allocation",
    name: "Resource Allocation",
    description:
      "Distributing finite resources (budget, personnel, inventory) to maximize outcomes across competing priorities.",
  },
  {
    slug: "coordination",
    name: "Coordination",
    description:
      "Synchronizing the actions of multiple independent parties toward a shared goal without a central authority.",
  },
] as const;

export async function ensurePatterns(database: typeof db) {
  for (const pattern of PATTERNS) {
    await database
      .insert(patterns)
      .values(pattern)
      .onConflictDoNothing({ target: patterns.slug });
  }
}
