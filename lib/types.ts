export type StructuredFields = {
  situation: string
  challenge: string
  role: string
  actions: string
  outcome: string
}

export type Metadata = {
  company: string
  project: string
  dateEnd: string
  team: string
  scopeUsers: string
  scopeRevenue: string
  scopeSystems: string
  scopeTeamSize: string
}

export type StarFields = {
  situation: string
  task: string
  action: string
  result: string
}

export type StarStory = StarFields & {
  id: string
  theme: string
  createdAt: string
  updatedAt: string
}

export type Experience = {
  id: string
  title: string
  description: string
  impact: string
  date: string
  tags: string[]
  structured?: Partial<StructuredFields>
  collaborators?: string[]
  metadata?: Partial<Metadata>
  starStories?: StarStory[]
}

export type Draft = {
  title: string
  description: string
  impact: string
  date: string
  tags: string[]
}

export type CompletionDraft = StructuredFields &
  Metadata & {
    collaborators: string
  }

export type StarDraft = StarFields & { theme: string }

export type WorkHistoryEntry = {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string | null // null means "current"
}

export type UserProfile = {
  name: string
  currentRole: string
  workHistory: WorkHistoryEntry[]
  // Later phases: targetRoles?: string[]; skills?: string[]; resumeText?: string
}

export type Screen = "capture" | "bank" | "detail" | "complete" | "star" | "onboarding"

export type CompletenessTone = "warning" | "success" | "info"

export type CompletenessFlag = {
  id: string
  tone: CompletenessTone
  label: string
}
