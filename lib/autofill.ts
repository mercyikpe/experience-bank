// Deterministic AI auto-fill for Quick Capture — no LLM calls, per the
// product doc's decision to extend the same rule-based approach already
// used for tag suggestions and STAR generation. Every field this produces
// stays editable afterward; nothing here is final.

import { tags } from "./data"
import type { UserProfile, WorkHistoryEntry } from "./types"

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]

const MONTH_ABBR: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Short label from the raw capture — first sentence, trimmed to a
 * reasonable length. Never invents content that isn't in the text. */
export function inferTitle(description: string): string {
  const text = description.trim()
  if (!text) return ""

  const firstSentence = text.match(/^[^.!?\n]+[.!?]?/)
  let title = (firstSentence ? firstSentence[0] : text).trim().replace(/[.!?]+$/, "")

  const MAX_LENGTH = 70
  if (title.length > MAX_LENGTH) {
    const truncated = title.slice(0, MAX_LENGTH)
    const lastSpace = truncated.lastIndexOf(" ")
    title = (lastSpace > 40 ? truncated.slice(0, lastSpace) : truncated).trim() + "…"
  }

  return title.charAt(0).toUpperCase() + title.slice(1)
}

/** Picks up explicit dates/timeframes mentioned in the text (month names,
 * years, "yesterday"/"last month"/etc.); falls back to today when nothing
 * is found — it never leaves the field blank. */
export function inferDate(text: string, now: Date = new Date()): string {
  const lower = text.toLowerCase()

  if (/\byesterday\b/.test(lower)) {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return toISODate(d)
  }
  if (/\btoday\b/.test(lower)) return toISODate(now)
  if (/\blast week\b/.test(lower)) {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    return toISODate(d)
  }
  if (/\blast quarter\b/.test(lower)) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 3)
    return toISODate(d)
  }
  if (/\blast month\b/.test(lower)) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - 1)
    return toISODate(d)
  }
  if (/\blast year\b/.test(lower)) {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() - 1)
    return toISODate(d)
  }

  const monthPattern = new RegExp(`\\b(${MONTHS.join("|")}|${Object.keys(MONTH_ABBR).join("|")})\\b`, "i")
  const monthMatch = lower.match(monthPattern)
  if (monthMatch) {
    const raw = monthMatch[1].toLowerCase()
    const monthIndex = MONTHS.includes(raw) ? MONTHS.indexOf(raw) : MONTH_ABBR[raw]
    if (monthIndex !== undefined) {
      const yearMatch = lower.match(/\b(20\d{2})\b/)
      let year = yearMatch ? parseInt(yearMatch[1], 10) : now.getFullYear()
      // No explicit year and the month hasn't happened yet this year — assume they mean last year.
      if (!yearMatch && monthIndex > now.getMonth()) year -= 1
      return toISODate(new Date(year, monthIndex, 1))
    }
  }

  const yearOnlyMatch = lower.match(/\b(20\d{2})\b/)
  if (yearOnlyMatch) return toISODate(new Date(parseInt(yearOnlyMatch[1], 10), 0, 1))

  return toISODate(now)
}

const TAG_KEYWORDS: Record<string, string[]> = {
  Performance: ["performance", "latency", "slow", "speed", "optimi"],
  Backend: ["query", "queries", "database", " api", "backend", "server"],
  Leadership: ["led ", "leading", "lead the", "mentor", "manage"],
  Reliability: ["outage", "incident", "reliab", "downtime", "on-call", "oncall"],
  Communication: ["partner", "stakeholder", "present", "communicat"],
  "Customer Impact": ["customer", "user "],
  "Problem Solving": ["problem", "investigated", "issue", "debug", "root cause"],
  Ownership: ["owned", "ownership", "drove", "independently", "end-to-end", "end to end"],
  Collaboration: ["collaborat", "cross-functional", "cross functional", "partnered", "teamed up"],
  Mentoring: ["mentor", "coach", "onboard"],
  "Systems Design": ["architecture", "system design", "scalab", "designed a"],
  Process: ["process", "workflow", "playbook"],
}

/** Tags actually supported by mentions in the text — no forced fallback,
 * so a capture with nothing recognizable simply gets no tags rather than
 * a guess. (The manual "Suggest tags" button in edit mode adds its own
 * fallback on top of this for when someone explicitly asks for a nudge.) */
export function inferTags(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `
  return tags.filter((tag) => (TAG_KEYWORDS[tag] || []).some((keyword) => lower.includes(keyword)))
}

/** Matches a capture to a company from the user's work history — an
 * explicit mention ("...at Shopify...") is a strong signal and wins
 * outright; otherwise, if the capture's date falls inside exactly one
 * role's date range, that's treated as an unambiguous weak match. Two or
 * more overlapping roles, or no match at all, is left unassigned rather
 * than guessed. */
export function matchCompany(description: string, date: string, workHistory: WorkHistoryEntry[]): WorkHistoryEntry | null {
  const lower = description.toLowerCase()
  const explicit = workHistory.find((entry) => entry.company.trim() && lower.includes(entry.company.trim().toLowerCase()))
  if (explicit) return explicit

  const candidate = new Date(date)
  const byDate = workHistory.filter((entry) => {
    if (!entry.startDate) return false
    const start = new Date(entry.startDate)
    const end = entry.endDate ? new Date(entry.endDate) : new Date()
    return candidate >= start && candidate <= end
  })
  return byDate.length === 1 ? byDate[0] : null
}

export type AutoFillResult = {
  title: string
  date: string
  tags: string[]
  metadata?: { company: string }
}

export function autoFillExperience(description: string, profile: UserProfile): AutoFillResult {
  const date = inferDate(description)
  const match = matchCompany(description, date, profile.workHistory)
  return {
    title: inferTitle(description),
    date,
    tags: inferTags(description),
    ...(match ? { metadata: { company: match.company } } : {}),
  }
}
