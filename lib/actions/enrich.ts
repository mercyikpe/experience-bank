"use server"

// LLM-backed enrichment for Quick Capture (title/tags/company/impact),
// alongside the deterministic fallback in lib/autofill.ts. Tags/company are
// constrained to enums via a strict JSON schema so the model can't invent
// a tag or company that isn't on file.

import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import type { WorkHistoryEntry } from "@/lib/types"

export type EnrichmentResult = {
  title: string
  tags: string[]
  company: string | null
  impact: string
}


const DEFAULT_MODEL = "gpt-5.6-luna"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in")
}

function buildInstructions(tagVocabulary: string[], workHistory: WorkHistoryEntry[]) {
  const companyList = workHistory
    .filter((entry) => entry.company.trim())
    .map((entry) => `- ${entry.company} (${entry.title || "role not given"}, ${entry.startDate || "?"} to ${entry.endDate || "current"})`)
    .join("\n")

  return `You extract structured fields from a first-person work-experience journal entry for a product that turns quick, unstructured captures into a structured career record. Every field you produce stays editable by the person afterward — nothing you return is final, so prefer leaving a field blank/null over guessing when you aren't confident.

- "title": a short, specific label (max ~70 characters) for what the entry describes, grounded in the person's own words. Do not invent details not implied by the text.
- "tags": zero or more entries chosen ONLY from the provided vocabulary. Include a tag only if the text clearly supports it.
- "company": if the text names, or clearly and unambiguously implies, one of the provided companies, return it; otherwise return null. Only match if genuinely confident — an unclear or ambiguous case should be null, not a guess.${companyList ? `\nCompanies on file (with their role and date range, for context):\n${companyList}` : "\n(No work history is on file for this person.)"}
- "impact": a short phrase capturing a concrete metric or measurable outcome mentioned in the text (e.g. "reduced checkout latency by 40%", "saved roughly $200k/year", "cut onboarding time from 2 weeks to 3 days"). Never invent a number that isn't in the text. Return an empty string "" if no metric or measurable outcome is mentioned.`
}

function buildSchema(tagVocabulary: string[], workHistory: WorkHistoryEntry[]) {
  const companyNames = [...new Set(workHistory.map((entry) => entry.company.trim()).filter(Boolean))]

  return {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      tags: {
        type: "array" as const,
        items: tagVocabulary.length ? { type: "string" as const, enum: tagVocabulary } : { type: "string" as const },
      },
      company: companyNames.length
        ? { type: ["string", "null"] as const, enum: [...companyNames, null] }
        : { type: "null" as const },
      impact: { type: "string" as const },
    },
    required: ["title", "tags", "company", "impact"],
    additionalProperties: false,
  }
}

// Defense in depth on top of the schema's enum constraints.
function sanitize(raw: unknown, tagVocabulary: string[], workHistory: WorkHistoryEntry[]): EnrichmentResult {
  const parsed = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>

  const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 120) : ""

  const tagSet = new Set(tagVocabulary.map((tag) => tag.toLowerCase()))
  const tagByLower = new Map(tagVocabulary.map((tag) => [tag.toLowerCase(), tag]))
  const tags = Array.isArray(parsed.tags)
    ? [
        ...new Set(
          parsed.tags
            .filter((tag): tag is string => typeof tag === "string")
            .map((tag) => tag.trim().toLowerCase())
            .filter((tag) => tagSet.has(tag))
            .map((tag) => tagByLower.get(tag)!)
        ),
      ]
    : []

  let company: string | null = null
  if (typeof parsed.company === "string" && parsed.company.trim()) {
    const guess = parsed.company.trim().toLowerCase()
    const match = workHistory.find((entry) => entry.company.trim().toLowerCase() === guess)
    company = match ? match.company : null
  }

  const impact = typeof parsed.impact === "string" ? parsed.impact.trim().slice(0, 300) : ""

  return { title, tags, company, impact }
}

export async function enrichExperience(
  description: string,
  tagVocabulary: string[],
  workHistory: WorkHistoryEntry[]
): Promise<EnrichmentResult> {
  await requireUser()

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const client = new OpenAI({ apiKey })

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    input: [
      { role: "system", content: buildInstructions(tagVocabulary, workHistory) },
      { role: "user", content: description },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "experience_enrichment",
        schema: buildSchema(tagVocabulary, workHistory),
        strict: true,
      },
    },
  })

  const content = response.output_text
  if (!content) throw new Error("Empty response from enrichment model")

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Enrichment model returned invalid JSON")
  }

  return sanitize(parsed, tagVocabulary, workHistory)
}
