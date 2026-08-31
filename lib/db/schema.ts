import { sql } from "drizzle-orm"
import { jsonb, pgSchema, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import type { Metadata, StructuredFields } from "@/lib/types"

// Reference to Supabase's built-in auth.users table, so our tables can carry
// a real foreign key to it. This is NOT managed by drizzle-kit — see the
// `schemaFilter: ["public"]` in drizzle.config.ts, which keeps generate/push
// from ever trying to create or alter the `auth` schema. Supabase owns that
// table entirely; we just point at it.
const authSchema = pgSchema("auth")
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
})

// One row per signed-in user. The row's own id IS the auth user id (1:1),
// so there's never an ambiguous "which profile is mine" lookup.
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  currentRole: text("current_role").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const workHistoryEntries = pgTable("work_history_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  company: text("company").notNull().default(""),
  title: text("title").notNull().default(""),
  // Kept as free-form text (e.g. "2024-05") rather than a `date` column to
  // match what the app already produces/consumes — see Experience.date below.
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date"), // null means "current", same convention as WorkHistoryEntry.endDate
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  impact: text("impact").notNull().default(""),
  date: text("date").notNull().default(""),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  // Situation/Challenge/Role/What You Did/Outcome from "Complete this
  // experience" — additive on top of the raw capture, so it stays nullable
  // and partial rather than a fixed set of required columns.
  structured: jsonb("structured").$type<Partial<StructuredFields>>(),
  collaborators: text("collaborators")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  metadata: jsonb("metadata").$type<Partial<Metadata>>(),
  // Field names on this row that were AI/auto-filled rather than typed by
  // hand — drives the "we guessed this" affordance; cleared on manual edit.
  aiSuggestedFields: text("ai_suggested_fields")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  // "pending" while enrichment is in flight, "done" once resolved.
  enrichmentStatus: text("enrichment_status").notNull().default("done"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const starStories = pgTable("star_stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  experienceId: uuid("experience_id")
    .notNull()
    .references(() => experiences.id, { onDelete: "cascade" }),
  // Denormalized alongside experienceId so RLS policies can check
  // `auth.uid() = user_id` directly on this table without a join.
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default(""),
  situation: text("situation").notNull().default(""),
  task: text("task").notNull().default(""),
  action: text("action").notNull().default(""),
  result: text("result").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
