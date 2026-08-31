// Pure, deterministic completeness checks — no AI involved. These exist to
// nudge someone toward a stronger record, not to judge or block them.

import type { CompletenessFlag, Experience, StructuredFields } from "./types"

const STRUCTURE_FIELDS: (keyof StructuredFields)[] = [
  "situation",
  "challenge",
  "role",
  "actions",
  "outcome",
]

export function getCompletenessScore(experience: Experience): number {
  const structured = experience.structured || {}
  const filled = STRUCTURE_FIELDS.filter((key) => structured[key]?.trim()).length
  return Math.round((filled / STRUCTURE_FIELDS.length) * 100)
}

export function getCompletenessFlags(experience: Experience): CompletenessFlag[] {
  const s = experience.structured || {}
  const d = experience.aiDraftStructured || {}
  const outcomeText = s.outcome?.trim() || experience.impact?.trim() || ""
  const flags: CompletenessFlag[] = []

  if (!outcomeText) {
    flags.push({ id: "outcome", tone: "warning", label: "Outcome is missing" })
  }
  if (!s.role?.trim()) {
    // "Review" rather than "Add" once AI has already drafted this field —
    // there's something waiting in "Complete this experience" to confirm,
    // not a blank field to start from scratch.
    flags.push({
      id: "role",
      tone: "warning",
      label: d.role?.trim() ? "Review your individual contribution" : "Add your individual contribution",
    })
  }
  if (!s.situation?.trim()) {
    flags.push({
      id: "situation",
      tone: "warning",
      label: d.situation?.trim() ? "Review context — what was at stake?" : "Add context — what was at stake?",
    })
  }
  if (!s.actions?.trim()) {
    flags.push({
      id: "actions",
      tone: "warning",
      label: d.actions?.trim() ? "Review what you actually did" : "Describe what you actually did",
    })
  }
  if (!experience.collaborators?.length) {
    flags.push({ id: "collaborators", tone: "info", label: "Add who you worked with" })
  }
  if (!experience.tags?.length) {
    flags.push({ id: "tags", tone: "info", label: "Add skills / theme tags" })
  }
  if (outcomeText && /\d/.test(outcomeText)) {
    flags.push({ id: "impact-evidence", tone: "success", label: "This has strong impact evidence" })
  }

  return flags
}

/** Dot color for the Career Bank list row — reflects how filled-in the
 * structured record is, independent of the row's selected/current state. */
export function getCompletenessColor(experience: Experience): string {
  const score = getCompletenessScore(experience)
  if (score >= 80) return "#1f9d55"
  if (score > 0) return "#e0a72e"
  return "#c7c9d6"
}
