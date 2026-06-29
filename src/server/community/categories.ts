export type CategoryDefinition = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
};

export const CATEGORIES: CategoryDefinition[] = [
  {
    slug: "medical",
    name: "Medical & Mental Health",
    description:
      "Nurses, therapists, and clinicians who understand patients, psychology, and care, not just what the textbook says.",
    keywords: [
      "nursing",
      "nurse",
      "rn",
      "lpn",
      "physician",
      "doctor",
      "healthcare",
      "hospital",
      "clinical",
      "medical",
      "paramedic",
      "midwife",
      "surgeon",
      "pharmacist",
      "therapist",
      "therapy",
      "psychologist",
      "psychology",
      "counselor",
      "counseling",
      "mental health",
      "psychiatrist",
      "dentist",
      "medicine",
      "icu",
      "er",
      "pediatric",
    ],
  },
  {
    slug: "legal",
    name: "Legal & Compliance",
    description:
      "Lawyers and compliance professionals who know what statutes don't spell out: regulatory judgment, risk, and how rules actually get applied.",
    keywords: [
      "lawyer",
      "attorney",
      "legal",
      "compliance",
      "counsel",
      "paralegal",
      "litigation",
      "regulatory",
      "employment law",
      "corporate law",
      "contract",
      "general counsel",
    ],
  },
  {
    slug: "trades",
    name: "Skilled Trades",
    description:
      "Electricians, plumbers, welders, and contractors who know what the manual doesn't cover: permitting, safety, and how things actually get built.",
    keywords: [
      "electrician",
      "electric",
      "plumber",
      "mechanic",
      "hvac",
      "construction",
      "welding",
      "welder",
      "carpenter",
      "permitting",
      "contractor",
      "mason",
      "pipefitter",
      "ironworker",
    ],
  },
  {
    slug: "education",
    name: "Education",
    description:
      "Educators who understand classrooms, curriculum, and how people learn.",
    keywords: [
      "teacher",
      "teaching",
      "classroom",
      "professor",
      "educator",
      "principal",
      "tutor",
      "school",
      "curriculum",
      "instruction",
    ],
  },
  {
    slug: "aviation",
    name: "Aviation",
    description:
      "Aviators who understand flight operations, safety, and airspace.",
    keywords: [
      "pilot",
      "aviation",
      "flight",
      "airline",
      "aircraft",
      "atc",
      "captain",
      "copilot",
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    description:
      "Financial operators who understand accounting, audit, and capital.",
    keywords: [
      "accountant",
      "accounting",
      "finance",
      "audit",
      "auditor",
      "cpa",
      "bookkeeper",
      "tax",
      "treasury",
    ],
  },
  {
    slug: "earth-science",
    name: "Earth Science",
    description:
      "Geologists and field scientists who understand terrain and exploration.",
    keywords: [
      "geologist",
      "geology",
      "mineral",
      "exploration",
      "mining",
      "seismic",
      "hydrology",
      "geophysic",
    ],
  },
  {
    slug: "science",
    name: "Science",
    description:
      "Researchers who understand laboratories, methods, and discovery.",
    keywords: [
      "scientist",
      "research",
      "laboratory",
      "lab",
      "biologist",
      "chemist",
      "physicist",
      "researcher",
      "phd",
    ],
  },
  {
    slug: "creative",
    name: "Creative & Design",
    description:
      "Artists, designers, and makers who know what can't be templated: taste, composition, and how clients actually brief the work.",
    keywords: [
      "artist",
      "illustrator",
      "illustration",
      "designer",
      "design",
      "graphic design",
      "photographer",
      "photography",
      "creative director",
      "art director",
      "animator",
      "animation",
      "filmmaker",
      "writer",
      "copywriter",
      "musician",
      "composer",
      "sculptor",
      "painter",
      "ceramicist",
      "ux",
      "ui",
      "branding",
      "typographer",
      "studio",
      "creative",
    ],
  },
  {
    slug: "operations",
    name: "Operations",
    description:
      "Operators who understand systems, logistics, and how organizations run.",
    keywords: [
      "operator",
      "operations",
      "logistics",
      "supply chain",
      "plant manager",
      "foreman",
      "supervisor",
      "warehouse",
    ],
  },
];

const CATEGORY_BY_SLUG = new Map(
  CATEGORIES.map((category) => [category.slug, category]),
);

export function classifyExpertise(prompt: string): CategoryDefinition {
  const normalized = prompt.toLowerCase().trim();

  if (!normalized) {
    return CATEGORIES[0]!;
  }

  let bestMatch: CategoryDefinition | null = null;
  let bestScore = 0;

  for (const category of CATEGORIES) {
    for (const keyword of category.keywords) {
      if (normalized === keyword) {
        return category;
      }

      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = category;
        }
      }
    }
  }

  return bestMatch ?? CATEGORIES[CATEGORIES.length - 1]!;
}

export function getCategoryBySlug(slug: string) {
  return CATEGORY_BY_SLUG.get(slug) ?? null;
}

export function formatExpertiseLabel(prompt: string) {
  const trimmed = prompt.trim();
  if (!trimmed) return "Expert";

  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
