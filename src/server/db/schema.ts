import { relations } from "drizzle-orm";
import { index, pgTableCreator, uniqueIndex } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `massacademy_${name}`);

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
    uniqueIndex("room_member_session_category_idx").on(t.sessionId, t.categoryId),
  ],
);

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

export const categoriesRelations = relations(categories, ({ many }) => ({
  members: many(roomMembers),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  category: one(categories, {
    fields: [roomMembers.categoryId],
    references: [categories.id],
  }),
}));
