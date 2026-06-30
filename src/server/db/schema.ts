import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTableCreator,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `massacademy_${name}`);

// ─── Rooms (categories / lenses) ─────────────────────────────────────────────

export const categories = createTable(
  "category",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    slug: d.varchar({ length: 64 }).notNull(),
    name: d.varchar({ length: 128 }).notNull(),
    description: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [uniqueIndex("category_slug_idx").on(t.slug)],
);

export const roomMembers = createTable(
  "room_member",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    categoryId: d
      .integer()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    sessionId: d.varchar({ length: 64 }).notNull(),
    expertiseLabel: d.varchar({ length: 256 }).notNull(),
    displayName: d.varchar({ length: 128 }),
    yearsExperience: d.integer(),
    bio: d.text(),
    intent: d.varchar({ length: 512 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("room_member_category_idx").on(t.categoryId),
    uniqueIndex("room_member_session_category_idx").on(
      t.sessionId,
      t.categoryId,
    ),
  ],
);

// ─── Patterns — universal cross-domain archetypes ─────────────────────────────

export const patterns = createTable(
  "pattern",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    slug: d.varchar({ length: 64 }).notNull(),
    name: d.varchar({ length: 128 }).notNull(),
    description: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [uniqueIndex("pattern_slug_idx").on(t.slug)],
);

// ─── Problems ─────────────────────────────────────────────────────────────────

export const problemStateEnum = pgEnum("problem_state", [
  "emerging",
  "validating",
  "solution_exploration",
  "prototype",
  "company_forming",
  "operating",
]);

export const problems = createTable(
  "problem",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull(),
    categoryId: d
      .integer()
      .references(() => categories.id, { onDelete: "set null" }),
    sessionId: d.varchar({ length: 64 }),
    authorName: d.varchar({ length: 128 }),
    // Derived projections — source of truth is the event stream.
    // momentumScore: rate of graph activity (observations, evidence, cross-domain)
    // confidenceScore: quality and weight of evidence attached
    // Both recomputed by service; manually settable during early dev.
    state: problemStateEnum().notNull().default("emerging"),
    momentumScore: d.integer().notNull().default(0),
    momentumDelta: d.integer().notNull().default(0),
    confidenceScore: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("problem_category_idx").on(t.categoryId),
    index("problem_state_idx").on(t.state),
    index("problem_momentum_idx").on(t.momentumScore),
    index("problem_created_at_idx").on(t.createdAt),
  ],
);

export const problemPatterns = createTable(
  "problem_pattern",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    problemId: d
      .integer()
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    patternId: d
      .integer()
      .notNull()
      .references(() => patterns.id, { onDelete: "cascade" }),
    linkedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("problem_pattern_problem_idx").on(t.problemId),
    index("problem_pattern_pattern_idx").on(t.patternId),
    uniqueIndex("problem_pattern_unique_idx").on(t.problemId, t.patternId),
  ],
);

// Immutable event stream — source of truth for all graph activity on a problem.
// State, momentum, confidence, reputation, AI all derive from this.
export const problemEvents = createTable(
  "problem_event",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    problemId: d
      .integer()
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    // ObservationAdded | EvidenceAdded | PatternLinked | CrossDomainMatchDetected
    // IdeaProposed | IdeaValidated | PrototypeShared | ContributorJoined | StateTransitioned
    eventType: d.varchar({ length: 64 }).notNull(),
    actorSessionId: d.varchar({ length: 64 }),
    actorName: d.varchar({ length: 128 }),
    summary: d.varchar({ length: 512 }).notNull(),
    metadata: jsonb(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("problem_event_problem_idx").on(t.problemId),
    index("problem_event_type_idx").on(t.eventType),
    index("problem_event_created_at_idx").on(t.createdAt),
  ],
);

// ─── Observations — first-class; may exist before a Problem ──────────────────

export const postTypeEnum = pgEnum("post_type", [
  "observation",
  "idea",
  "request",
  "customer_insight",
  "case_study",
  "prototype",
  "milestone",
  "question",
  "hiring",
  "funding",
  "workflow",
  "problem_report",
]);

export const observations = createTable(
  "observation",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    authorSessionId: d.varchar({ length: 64 }),
    authorName: d.varchar({ length: 128 }),
    content: d.text().notNull(),
    postType: postTypeEnum().notNull().default("observation"),
    // Optional lens context — doesn't own the observation
    categoryId: d
      .integer()
      .references(() => categories.id, { onDelete: "set null" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("observation_author_idx").on(t.authorSessionId),
    index("observation_category_idx").on(t.categoryId),
    index("observation_created_at_idx").on(t.createdAt),
  ],
);

// Many-to-many: observations ↔ problems.
// Multiple observations can converge on the same problem;
// the same observation can reference multiple problems.
export const observationProblems = createTable(
  "observation_problem",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    observationId: d
      .integer()
      .notNull()
      .references(() => observations.id, { onDelete: "cascade" }),
    problemId: d
      .integer()
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    linkedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("obs_problem_obs_idx").on(t.observationId),
    index("obs_problem_problem_idx").on(t.problemId),
    uniqueIndex("obs_problem_unique_idx").on(t.observationId, t.problemId),
  ],
);

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const evidenceSubtypeEnum = pgEnum("evidence_subtype", [
  "interview",
  "research",
  "measurement",
  "experiment",
  "prototype",
  "document",
]);

export const evidenceVerdictEnum = pgEnum("evidence_verdict", [
  "supports",
  "challenges",
  "neutral",
]);

export const evidence = createTable(
  "evidence",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    contributorSessionId: d.varchar({ length: 64 }),
    contributorName: d.varchar({ length: 128 }),
    subtype: evidenceSubtypeEnum().notNull(),
    title: d.varchar({ length: 256 }).notNull(),
    content: d.text().notNull(),
    categoryId: d
      .integer()
      .references(() => categories.id, { onDelete: "set null" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("evidence_contributor_idx").on(t.contributorSessionId),
    index("evidence_subtype_idx").on(t.subtype),
    index("evidence_created_at_idx").on(t.createdAt),
  ],
);

export const evidenceProblems = createTable(
  "evidence_problem",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    evidenceId: d
      .integer()
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    problemId: d
      .integer()
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    verdict: evidenceVerdictEnum().notNull().default("supports"),
    linkedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("ev_problem_ev_idx").on(t.evidenceId),
    index("ev_problem_problem_idx").on(t.problemId),
    uniqueIndex("ev_problem_unique_idx").on(t.evidenceId, t.problemId),
  ],
);

// ─── Ideas ────────────────────────────────────────────────────────────────────

export const ideaValidationEnum = pgEnum("idea_validation", [
  "proposed",
  "validating",
  "validated",
  "refuted",
]);

export const evidenceIdeaVerdictEnum = pgEnum("evidence_idea_verdict", [
  "validates",
  "refutes",
  "partial",
]);

export const ideas = createTable(
  "idea",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    authorSessionId: d.varchar({ length: 64 }),
    authorName: d.varchar({ length: 128 }),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    validation: ideaValidationEnum().notNull().default("proposed"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("idea_author_idx").on(t.authorSessionId),
    index("idea_validation_idx").on(t.validation),
    index("idea_created_at_idx").on(t.createdAt),
  ],
);

export const ideaProblems = createTable(
  "idea_problem",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    ideaId: d
      .integer()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    problemId: d
      .integer()
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    linkedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("idea_problem_idea_idx").on(t.ideaId),
    index("idea_problem_problem_idx").on(t.problemId),
    uniqueIndex("idea_problem_unique_idx").on(t.ideaId, t.problemId),
  ],
);

// Evidence → Idea verdict (separate from evidence → problem verdict)
export const evidenceIdeas = createTable(
  "evidence_idea",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    evidenceId: d
      .integer()
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    ideaId: d
      .integer()
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    verdict: evidenceIdeaVerdictEnum().notNull().default("partial"),
    linkedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("ev_idea_ev_idx").on(t.evidenceId),
    index("ev_idea_idea_idx").on(t.ideaId),
    uniqueIndex("ev_idea_unique_idx").on(t.evidenceId, t.ideaId),
  ],
);

// ─── Users (Kinde-authenticated) ─────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "domain_expert",
  "investor",
  "operator",
  "builder",
]);

export const users = createTable(
  "user",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    kindeId: d.varchar({ length: 128 }).notNull(),
    email: d.varchar({ length: 256 }),
    displayName: d.varchar({ length: 128 }),
    craft: d.varchar({ length: 256 }),
    role: userRoleEnum(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [uniqueIndex("user_kinde_id_idx").on(t.kindeId)],
);

// ─── Applications ─────────────────────────────────────────────────────────────

export const applications = createTable(
  "application",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    sessionId: d.varchar({ length: 64 }),
    name: d.varchar({ length: 128 }).notNull(),
    email: d.varchar({ length: 256 }).notNull(),
    expertise: d.varchar({ length: 256 }).notNull(),
    message: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("application_email_idx").on(t.email),
    index("application_created_at_idx").on(t.createdAt),
  ],
);

// Legacy placeholder
export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  members: many(roomMembers),
  problems: many(problems),
  observations: many(observations),
  evidence: many(evidence),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  category: one(categories, {
    fields: [roomMembers.categoryId],
    references: [categories.id],
  }),
}));

export const patternsRelations = relations(patterns, ({ many }) => ({
  problemPatterns: many(problemPatterns),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  category: one(categories, {
    fields: [problems.categoryId],
    references: [categories.id],
  }),
  events: many(problemEvents),
  problemPatterns: many(problemPatterns),
  observationProblems: many(observationProblems),
  evidenceProblems: many(evidenceProblems),
  ideaProblems: many(ideaProblems),
}));

export const problemPatternsRelations = relations(problemPatterns, ({ one }) => ({
  problem: one(problems, {
    fields: [problemPatterns.problemId],
    references: [problems.id],
  }),
  pattern: one(patterns, {
    fields: [problemPatterns.patternId],
    references: [patterns.id],
  }),
}));

export const problemEventsRelations = relations(problemEvents, ({ one }) => ({
  problem: one(problems, {
    fields: [problemEvents.problemId],
    references: [problems.id],
  }),
}));

export const observationsRelations = relations(observations, ({ one, many }) => ({
  category: one(categories, {
    fields: [observations.categoryId],
    references: [categories.id],
  }),
  observationProblems: many(observationProblems),
}));

export const observationProblemsRelations = relations(observationProblems, ({ one }) => ({
  observation: one(observations, {
    fields: [observationProblems.observationId],
    references: [observations.id],
  }),
  problem: one(problems, {
    fields: [observationProblems.problemId],
    references: [problems.id],
  }),
}));

export const evidenceRelations = relations(evidence, ({ one, many }) => ({
  category: one(categories, {
    fields: [evidence.categoryId],
    references: [categories.id],
  }),
  evidenceProblems: many(evidenceProblems),
  evidenceIdeas: many(evidenceIdeas),
}));

export const evidenceProblemsRelations = relations(evidenceProblems, ({ one }) => ({
  evidence: one(evidence, {
    fields: [evidenceProblems.evidenceId],
    references: [evidence.id],
  }),
  problem: one(problems, {
    fields: [evidenceProblems.problemId],
    references: [problems.id],
  }),
}));

export const ideasRelations = relations(ideas, ({ many }) => ({
  ideaProblems: many(ideaProblems),
  evidenceIdeas: many(evidenceIdeas),
}));

export const ideaProblemsRelations = relations(ideaProblems, ({ one }) => ({
  idea: one(ideas, {
    fields: [ideaProblems.ideaId],
    references: [ideas.id],
  }),
  problem: one(problems, {
    fields: [ideaProblems.problemId],
    references: [problems.id],
  }),
}));

export const evidenceIdeasRelations = relations(evidenceIdeas, ({ one }) => ({
  evidence: one(evidence, {
    fields: [evidenceIdeas.evidenceId],
    references: [evidence.id],
  }),
  idea: one(ideas, {
    fields: [evidenceIdeas.ideaId],
    references: [ideas.id],
  }),
}));
