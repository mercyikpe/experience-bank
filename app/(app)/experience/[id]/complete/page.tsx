"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAppData } from "@/lib/app-data-context"
import { CompleteExperienceForm } from "@/components/complete-experience-form"
import type { CompletionDraft, Experience } from "@/lib/types"

// Seeds the draft, in order: anything already typed (`structured`), then
// AI's enrichment draft (`aiDraftStructured` / `impact`), then raw capture
// text as a last resort.
function seedFrom(selected: Experience): CompletionDraft {
  const s = selected.structured || {}
  const d = selected.aiDraftStructured || {}
  const m = selected.metadata || {}
  return {
    situation: s.situation || d.situation || selected.description || "",
    challenge: s.challenge || d.challenge || "",
    role: s.role || d.role || "",
    actions: s.actions || d.actions || "",
    outcome: s.outcome || selected.impact || "",
    collaborators: (selected.collaborators || []).join(", "),
    company: m.company || "",
    project: m.project || "",
    dateEnd: m.dateEnd || "",
    team: m.team || "",
    scopeUsers: m.scopeUsers || "",
    scopeRevenue: m.scopeRevenue || "",
    scopeSystems: m.scopeSystems || "",
    scopeTeamSize: m.scopeTeamSize || "",
  }
}

export default function CompleteExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { experiences } = useAppData()
  const selected = experiences.find((item) => item.id === id)

  useEffect(() => {
    if (!selected) router.replace("/bank")
  }, [selected, router])

  if (!selected) return null

  // Keyed on the experience's id so the seeded draft below is re-derived
  // (via remount, not an effect) if the id this route points at ever
  // changes without a full page reload.
  return <CompleteExperienceInner key={selected.id} experience={selected} />
}

function CompleteExperienceInner({ experience }: { experience: Experience }) {
  const router = useRouter()
  const { setExperiences } = useAppData()
  const [draft, setDraft] = useState<CompletionDraft>(() => seedFrom(experience))

  // The raw capture (description/impact) is never touched here — only
  // structured/collaborators/metadata are written, so the original note
  // is always preserved underneath whatever gets added on top of it.
  const onSave = (event: React.FormEvent) => {
    event.preventDefault()
    const d = draft
    setExperiences((current) =>
      current.map((item) =>
        item.id !== experience.id
          ? item
          : {
            ...item,
            structured: { situation: d.situation, challenge: d.challenge, role: d.role, actions: d.actions, outcome: d.outcome },
            collaborators: d.collaborators.split(",").map((name) => name.trim()).filter(Boolean),
            metadata: {
              company: d.company,
              project: d.project,
              dateEnd: d.dateEnd,
              team: d.team,
              scopeUsers: d.scopeUsers,
              scopeRevenue: d.scopeRevenue,
              scopeSystems: d.scopeSystems,
              scopeTeamSize: d.scopeTeamSize,
            },
          }
      )
    )
    toast("Experience details saved")
    router.push(`/experience/${experience.id}`)
  }

  return (
    <CompleteExperienceForm
      draft={draft}
      setDraft={setDraft}
      onSave={onSave}
      onCancel={() => router.push(`/experience/${experience.id}`)}
    />
  )
}
