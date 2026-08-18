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

export type Screen = "capture" | "bank" | "detail" | "complete"

export type CompletenessTone = "warning" | "success" | "info"

export type CompletenessFlag = {
  id: string
  tone: CompletenessTone
  label: string
}
