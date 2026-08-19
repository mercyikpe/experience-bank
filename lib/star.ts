// Deterministic STAR (Situation / Task / Action / Result) draft builder.
// No AI involved — this rearranges and lightly frames the structured fields
// (falling back to the raw capture where a field hasn't been filled in yet),
// so the same rules that power completeness guidance also power this.
// The "theme" just changes the framing sentence and which scope/metadata
// details get surfaced in the Result — the underlying facts never change.

import type { Experience, Metadata, StarFields } from "./types"

type ThemeConfig = {
  frame: string
  roleLabel: string
  resultKeys: (keyof Metadata)[]
  surfaceCollaborators: boolean
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  frame: "Reflecting on this experience,",
  roleLabel: "I was responsible for",
  resultKeys: [],
  surfaceCollaborators: false,
}

const THEME_CONFIG: Record<string, ThemeConfig> = {
  Leadership: {
    frame: "Leading through influence and decision-making,",
    roleLabel: "As the lead, I was responsible for",
    resultKeys: ["scopeTeamSize"],
    surfaceCollaborators: true,
  },
  Ownership: {
    frame: "Taking full ownership of a problem end-to-end,",
    roleLabel: "I personally owned",
    resultKeys: [],
    surfaceCollaborators: false,
  },
  Collaboration: {
    frame: "Working cross-functionally to align multiple teams,",
    roleLabel: "Working alongside others, I focused on",
    resultKeys: [],
    surfaceCollaborators: true,
  },
  Communication: {
    frame: "Communicating clearly with stakeholders under pressure,",
    roleLabel: "I was responsible for communicating",
    resultKeys: [],
    surfaceCollaborators: true,
  },
  Mentoring: {
    frame: "Investing in growing another engineer,",
    roleLabel: "As the mentor, I focused on",
    resultKeys: ["scopeTeamSize"],
    surfaceCollaborators: true,
  },
  Backend: {
    frame: "Digging into a backend and infrastructure problem,",
    roleLabel: "I was responsible for",
    resultKeys: ["scopeSystems"],
    surfaceCollaborators: false,
  },
  Performance: {
    frame: "Chasing down a performance regression,",
    roleLabel: "I was responsible for",
    resultKeys: ["scopeUsers", "scopeRevenue"],
    surfaceCollaborators: false,
  },
  "Systems Design": {
    frame: "Designing a system built to scale,",
    roleLabel: "I was responsible for",
    resultKeys: ["scopeSystems", "scopeUsers"],
    surfaceCollaborators: false,
  },
  "Problem Solving": {
    frame: "Diagnosing a hard, ambiguous problem,",
    roleLabel: "I was responsible for",
    resultKeys: [],
    surfaceCollaborators: false,
  },
  "Customer Impact": {
    frame: "Solving a problem that mattered directly to customers,",
    roleLabel: "I was responsible for",
    resultKeys: ["scopeUsers", "scopeRevenue"],
    surfaceCollaborators: false,
  },
  Reliability: {
    frame: "Restoring and protecting system reliability,",
    roleLabel: "I was responsible for",
    resultKeys: ["scopeSystems"],
    surfaceCollaborators: false,
  },
  Process: {
    frame: "Improving how the team works,",
    roleLabel: "I was responsible for",
    resultKeys: ["scopeTeamSize"],
    surfaceCollaborators: false,
  },
}

const SCOPE_LABELS: Record<string, string> = {
  scopeUsers: "Users",
  scopeRevenue: "Revenue / cost",
  scopeSystems: "Systems",
  scopeTeamSize: "Team size",
}

export function getThemeConfig(theme: string): ThemeConfig {
  return THEME_CONFIG[theme] || DEFAULT_THEME_CONFIG
}

export function generateStarDraft(experience: Experience, theme: string): StarFields {
  const s = experience.structured || {}
  const m = experience.metadata || {}
  const config = getThemeConfig(theme)

  const situationBase = s.situation?.trim() || experience.description?.trim() || ""
  const situationParts = [config.frame, situationBase].filter(Boolean)
  const contextLabel = [m.company, m.project].filter(Boolean).join(", ")
  if (contextLabel) situationParts.push(`This took place at ${contextLabel}.`)
  const situation = situationParts.join(" ")

  const role = s.role?.trim()
  const challenge = s.challenge?.trim()
  const taskParts: string[] = []
  if (role) taskParts.push(`${config.roleLabel} ${role}`.replace(/\s+/g, " ").trim())
  if (challenge) taskParts.push(`The key challenge was: ${challenge}`)
  const task = taskParts.join(" ")

  const action = s.actions?.trim() || ""

  const outcomeBase = s.outcome?.trim() || experience.impact?.trim() || ""
  const scopeBits = config.resultKeys
    .map((key) => (m[key]?.trim() ? `${SCOPE_LABELS[key]}: ${m[key]}` : null))
    .filter((bit): bit is string => Boolean(bit))
  const resultParts = [outcomeBase]
  if (scopeBits.length) resultParts.push(`${scopeBits.join(" · ")}.`)
  if (config.surfaceCollaborators && experience.collaborators?.length) {
    resultParts.push(`Partnered with ${experience.collaborators.join(", ")}.`)
  }
  const result = resultParts.filter(Boolean).join(" ")

  return { situation, task, action, result }
}
