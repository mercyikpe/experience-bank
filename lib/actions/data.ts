"use server"

import { and, eq, notInArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { experiences as experiencesTable, profiles, starStories, workHistoryEntries } from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"
import type { Experience, StarStory, UserProfile } from "@/lib/types"

// Every action here re-derives the signed-in user from the request's own
// Supabase session (never trusts an id passed in from the client) and scopes
// every query to it explicitly. That — not Postgres RLS — is what actually
// keeps one user's data from crossing into another's on this path: these
// Server Actions talk to Postgres directly over DATABASE_URL, which doesn't
// go through PostgREST/RLS the way a browser-side supabase-js call would.
// RLS (see supabase/setup.sql) is still enabled as a second layer, in case a
// table is ever queried straight from the client instead.
async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in")
  return user
}

async function requireUserId() {
  return (await requireUser()).id
}

export async function getInitialData(): Promise<{
  experiences: Experience[]
  profile: UserProfile
  isNewAccount: boolean
  avatarUrl: string | null
}> {
  const user = await requireUser()
  const userId = user.id
  // Google is the only provider today; it puts the account photo under
  // `avatar_url` (Supabase's normalized key) or `picture` (Google's own),
  // depending on exactly how the identity data came through — check both
  // rather than assuming one. Never persisted to our own `profiles` table:
  // it belongs to the auth identity, not the app's own profile data, and
  // would go stale there if the person changed their Google photo later.
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null

  const [profileRow, workHistoryRows, experienceRows, starStoryRows] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, userId) }),
    db.select().from(workHistoryEntries).where(eq(workHistoryEntries.userId, userId)),
    db.select().from(experiencesTable).where(eq(experiencesTable.userId, userId)),
    db.select().from(starStories).where(eq(starStories.userId, userId)),
  ])

  const storiesByExperience = new Map<string, StarStory[]>()
  for (const row of starStoryRows) {
    const list = storiesByExperience.get(row.experienceId) ?? []
    list.push({
      id: row.id,
      theme: row.theme,
      situation: row.situation,
      task: row.task,
      action: row.action,
      result: row.result,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })
    storiesByExperience.set(row.experienceId, list)
  }

  const experiences: Experience[] = experienceRows
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      impact: row.impact,
      date: row.date,
      tags: row.tags,
      structured: row.structured ?? undefined,
      collaborators: row.collaborators,
      metadata: row.metadata ?? undefined,
      starStories: storiesByExperience.get(row.id),
      aiSuggestedFields: row.aiSuggestedFields,
    }))

  const profile: UserProfile = {
    name: profileRow?.name ?? "",
    currentRole: profileRow?.currentRole ?? "",
    workHistory: workHistoryRows.map((row) => ({
      id: row.id,
      company: row.company,
      title: row.title,
      startDate: row.startDate,
      endDate: row.endDate,
    })),
  }

  // Used by the client to decide whether it's safe to migrate any
  // pre-login localStorage data up — only for an account that has never
  // saved anything server-side yet.
  const isNewAccount = experienceRows.length === 0 && !profileRow?.name && workHistoryRows.length === 0

  return { experiences, profile, isNewAccount, avatarUrl }
}

// Full-array upsert-and-prune, mirroring how this app already persisted to
// localStorage: write the whole current array back on every change, rather
// than tracking granular per-field diffs. Called from a useEffect keyed off
// the `experiences` state, same shape as the old localStorage effect.
export async function syncExperiences(experiences: Experience[]): Promise<void> {
  const userId = await requireUserId()

  await db.transaction(async (tx) => {
    const ids = experiences.map((exp) => exp.id)

    await (ids.length > 0
      ? tx.delete(experiencesTable).where(and(eq(experiencesTable.userId, userId), notInArray(experiencesTable.id, ids)))
      : tx.delete(experiencesTable).where(eq(experiencesTable.userId, userId)))

    for (const exp of experiences) {
      await tx
        .insert(experiencesTable)
        .values({
          id: exp.id,
          userId,
          title: exp.title,
          description: exp.description,
          impact: exp.impact,
          date: exp.date,
          tags: exp.tags,
          structured: exp.structured ?? null,
          collaborators: exp.collaborators ?? [],
          metadata: exp.metadata ?? null,
          aiSuggestedFields: exp.aiSuggestedFields ?? [],
        })
        .onConflictDoUpdate({
          target: experiencesTable.id,
          set: {
            title: exp.title,
            description: exp.description,
            impact: exp.impact,
            date: exp.date,
            tags: exp.tags,
            structured: exp.structured ?? null,
            collaborators: exp.collaborators ?? [],
            metadata: exp.metadata ?? null,
            aiSuggestedFields: exp.aiSuggestedFields ?? [],
            updatedAt: new Date(),
          },
        })

      const storyIds = (exp.starStories ?? []).map((story) => story.id)
      await (storyIds.length > 0
        ? tx.delete(starStories).where(and(eq(starStories.experienceId, exp.id), notInArray(starStories.id, storyIds)))
        : tx.delete(starStories).where(eq(starStories.experienceId, exp.id)))

      for (const story of exp.starStories ?? []) {
        await tx
          .insert(starStories)
          .values({
            id: story.id,
            experienceId: exp.id,
            userId,
            theme: story.theme,
            situation: story.situation,
            task: story.task,
            action: story.action,
            result: story.result,
          })
          .onConflictDoUpdate({
            target: starStories.id,
            set: {
              theme: story.theme,
              situation: story.situation,
              task: story.task,
              action: story.action,
              result: story.result,
              updatedAt: new Date(),
            },
          })
      }
    }
  })
}

// Same upsert-and-prune shape as syncExperiences, for the profile + its
// work-history rows.
export async function syncProfile(profile: UserProfile): Promise<void> {
  const userId = await requireUserId()

  await db.transaction(async (tx) => {
    await tx
      .insert(profiles)
      .values({ id: userId, name: profile.name, currentRole: profile.currentRole })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { name: profile.name, currentRole: profile.currentRole, updatedAt: new Date() },
      })

    const ids = profile.workHistory.map((entry) => entry.id).filter(Boolean)
    await (ids.length > 0
      ? tx.delete(workHistoryEntries).where(and(eq(workHistoryEntries.userId, userId), notInArray(workHistoryEntries.id, ids)))
      : tx.delete(workHistoryEntries).where(eq(workHistoryEntries.userId, userId)))

    for (const entry of profile.workHistory) {
      if (!entry.id) continue
      await tx
        .insert(workHistoryEntries)
        .values({
          id: entry.id,
          userId,
          company: entry.company,
          title: entry.title,
          startDate: entry.startDate,
          endDate: entry.endDate,
        })
        .onConflictDoUpdate({
          target: workHistoryEntries.id,
          set: { company: entry.company, title: entry.title, startDate: entry.startDate, endDate: entry.endDate },
        })
    }
  })
}
