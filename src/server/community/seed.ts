import { eq } from "drizzle-orm";

import { CATEGORIES } from "@/server/community/categories";
import type { db } from "@/server/db";
import { categories } from "@/server/db/schema";

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

export async function getCategoryRecord(
  database: typeof db,
  slug: string,
) {
  return database.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
}
