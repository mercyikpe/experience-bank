"use server"

// Resume/CV import. One PDF upload sent to OpenAI's Responses API as a
// file input, one LLM call, two outputs: workHistory rows, and draft
// Experience entries from resume bullets (marked `source: "resume"`),
// each seeded with a first-pass STAR guess like lib/actions/enrich.ts.

import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

export type ImportedWorkHistoryRow = {
  company: string
  title: string
  startDate: string // "YYYY-MM-DD", first-of-month when only month/year is known
  endDate: string | null // null means "current"
}

export type ImportedExperienceRow = {
  title: string
  description: string
  impact: string
  date: string // "YYYY-MM-DD", best guess — falls back client-side if empty
  tags: string[]
  company: string
  draftStructured: {
    situation: string
    challenge: string
    role: string
    actions: string
  }
}

const DEFAULT_MODEL = "gpt-5.6-luna"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in")
}

function buildInstructions(tagVocabulary: string[]) {
  return `You read a resume/CV PDF for a product that builds a structured career record from it. Return two things.

1. "workHistory": one row per real employer role (skip education, certifications, skills sections, summaries).
   - "company": the employer's name, as written.
   - "title": the job title held in that role, as written.
   - "startDate": "YYYY-MM-DD". If only a month and year are given, use the 1st of that month. If only a year, use January 1st. Never invent a date the text doesn't imply.
   - "endDate": same format, or null if the resume marks it current/present/ongoing.

2. "experiences": one row per distinct accomplishment bullet under a role (skip generic responsibility statements with no concrete accomplishment — "managed a team" isn't one, "cut deploy time from 2 hours to 15 minutes" is). Each becomes a draft entry the person reviews and fleshes out later, so it's fine — expected, even — for some fields to come out thin.
   - "title": a short label for the accomplishment (max ~70 characters).
   - "description": the bullet rewritten in first person, past tense, 1-2 sentences, as if the person had just jotted it down themselves (e.g. "I redesigned the checkout flow, cutting cart abandonment by 15%."). Stay close to what the bullet actually says — don't add detail it doesn't contain.
   - "impact": a short phrase with the concrete metric/outcome from the bullet, or "" if the bullet has no number or measurable result.
   - "date": "YYYY-MM-DD" best guess for when this happened, using the same role's date range as a guide (e.g. the role's end date, or its start date if that's a better fit for the bullet). Return "" if you can't ground a guess in the text.
   - "tags": zero or more entries chosen ONLY from this vocabulary, only where clearly supported: ${tagVocabulary.join(", ") || "(none available)"}.
   - "company": which employer (from workHistory above) this bullet belongs to, as written there. "" if it can't be pinned to one.
   - "draftStructured": a first-pass STAR guess, each field 1-2 sentences, grounded only in the bullet text — leave a field "" rather than inventing detail.
     - "situation": the context or stakes at the time.
     - "challenge": what made it hard or important.
     - "role": what the person personally owned (often thin from a bullet alone — that's expected).
     - "actions": what they actually did.

If the document has no discernible work history or accomplishment bullets, return empty lists for the corresponding field.`
}

function buildSchema(tagVocabulary: string[]) {
  return {
    type: "object" as const,
    properties: {
      workHistory: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            company: { type: "string" as const },
            title: { type: "string" as const },
            startDate: { type: "string" as const },
            endDate: { type: ["string", "null"] as const },
          },
          required: ["company", "title", "startDate", "endDate"],
          additionalProperties: false,
        },
      },
      experiences: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            description: { type: "string" as const },
            impact: { type: "string" as const },
            date: { type: "string" as const },
            tags: {
              type: "array" as const,
              items: tagVocabulary.length ? { type: "string" as const, enum: tagVocabulary } : { type: "string" as const },
            },
            company: { type: "string" as const },
            draftStructured: {
              type: "object" as const,
              properties: {
                situation: { type: "string" as const },
                challenge: { type: "string" as const },
                role: { type: "string" as const },
                actions: { type: "string" as const },
              },
              required: ["situation", "challenge", "role", "actions"],
              additionalProperties: false,
            },
          },
          required: ["title", "description", "impact", "date", "tags", "company", "draftStructured"],
          additionalProperties: false,
        },
      },
    },
    required: ["workHistory", "experiences"],
    additionalProperties: false,
  }
}

function sanitizeWorkHistory(rows: unknown[]): ImportedWorkHistoryRow[] {
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => ({
      company: typeof row.company === "string" ? row.company.trim().slice(0, 120) : "",
      title: typeof row.title === "string" ? row.title.trim().slice(0, 120) : "",
      startDate: typeof row.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.startDate) ? row.startDate : "",
      endDate: typeof row.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.endDate) ? row.endDate : null,
    }))
    .filter((row) => row.company || row.title)
}

function sanitizeExperiences(rows: unknown[], tagVocabulary: string[]): ImportedExperienceRow[] {
  const tagSet = new Set(tagVocabulary.map((tag) => tag.toLowerCase()))
  const tagByLower = new Map(tagVocabulary.map((tag) => [tag.toLowerCase(), tag]))

  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    .map((row) => {
      const rawDraft = (row.draftStructured && typeof row.draftStructured === "object" ? row.draftStructured : {}) as Record<
        string,
        unknown
      >
      const field = (key: string) => (typeof rawDraft[key] === "string" ? (rawDraft[key] as string).trim().slice(0, 500) : "")

      const tags = Array.isArray(row.tags)
        ? [
            ...new Set(
              row.tags
                .filter((tag): tag is string => typeof tag === "string")
                .map((tag) => tag.trim().toLowerCase())
                .filter((tag) => tagSet.has(tag))
                .map((tag) => tagByLower.get(tag)!)
            ),
          ]
        : []

      return {
        title: typeof row.title === "string" ? row.title.trim().slice(0, 120) : "",
        description: typeof row.description === "string" ? row.description.trim().slice(0, 800) : "",
        impact: typeof row.impact === "string" ? row.impact.trim().slice(0, 300) : "",
        date: typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : "",
        tags,
        company: typeof row.company === "string" ? row.company.trim().slice(0, 120) : "",
        draftStructured: {
          situation: field("situation"),
          challenge: field("challenge"),
          role: field("role"),
          actions: field("actions"),
        },
      }
    })
    .filter((row) => row.description)
}

export async function extractResumeContent(
  formData: FormData,
  tagVocabulary: string[]
): Promise<{ workHistory: ImportedWorkHistoryRow[]; experiences: ImportedExperienceRow[] }> {
  await requireUser()

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const file = formData.get("resume")
  if (!(file instanceof File)) throw new Error("No resume file provided")
  if (file.size === 0) throw new Error("Empty file")
  if (file.type !== "application/pdf") throw new Error("Please upload a PDF resume")

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")

  const client = new OpenAI({ apiKey })

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: buildInstructions(tagVocabulary) },
          { type: "input_file", filename: file.name || "resume.pdf", file_data: `data:application/pdf;base64,${base64}` },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "resume_import",
        schema: buildSchema(tagVocabulary),
        strict: true,
      },
    },
  })

  const content = response.output_text
  if (!content) throw new Error("Empty response from import model")

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Import model returned invalid JSON")
  }

  const raw = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>
  const workHistory = sanitizeWorkHistory(Array.isArray(raw.workHistory) ? raw.workHistory : [])
  const experiences = sanitizeExperiences(Array.isArray(raw.experiences) ? raw.experiences : [], tagVocabulary)

  if (!workHistory.length && !experiences.length) throw new Error("Couldn't find any work history in that file")

  return { workHistory, experiences }
}
