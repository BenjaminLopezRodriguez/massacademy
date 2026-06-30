import type { MetadataRoute } from "next";

import { CATEGORIES } from "@/server/community/categories";
import { db } from "@/server/db";
import { problems } from "@/server/db/schema";

const BASE = "https://www.mass.academy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allProblems = await db.select({ id: problems.id }).from(problems);

  const statics: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/feed`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/problems`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/rooms`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/experts`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/companies`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const problemPages: MetadataRoute.Sitemap = allProblems.map((p) => ({
    url: `${BASE}/problems/${p.id}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const roomPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE}/rooms/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...statics, ...problemPages, ...roomPages];
}
