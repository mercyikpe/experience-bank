"use client"

// Quick Capture, shared by the new-entry route (/) and the edit route
// (/experience/[id]/edit) — same form and save/enrich logic, seeded
// differently based on whether `editingExperience` is set.

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { blankDraft, tags as tagVocabulary } from "@/lib/data"
import { autoFillExperience, inferDate, inferTags } from "@/lib/autofill"
import { enrichExperience } from "@/lib/actions/enrich"
import { useAppData } from "@/lib/app-data-context"
import { CaptureForm } from "@/components/capture-form"
import type { Draft, Experience } from "@/lib/types"

export function CaptureScreen({
  editingExperience,
  initialDescription,
}: {
  editingExperience?: Experience
  initialDescription?: string
}) {
  const router = useRouter()
  const { profile, setExperiences } = useAppData()
  const [draft, setDraft] = useState<Draft>(() =>
    editingExperience
      ? {
        title: editingExperience.title,
        description: editingExperience.description,
        impact: editingExperience.impact,
        date: editingExperience.date,
        tags: editingExperience.tags,
      }
      : { ...blankDraft, description: initialDescription || "" }
  )

  const setField = (field: keyof Draft, value: string) => setDraft((current) => ({ ...current, [field]: value }))
  const toggleTag = (tag: string) =>
    setDraft((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }))

  const suggestTags = () => {
    const text = `${draft.title} ${draft.description} ${draft.impact}`
    const suggestions = inferTags(text)
    setDraft((current) => ({
      ...current,
      tags: [...new Set([...current.tags, ...(suggestions.length ? suggestions : ["Ownership", "Problem Solving"])])],
    }))
    toast("Suggested tags added — adjust anything you like")
  }

  // Fires the LLM enrichment call and folds the result into the experience
  // once it resolves — the async half of save() below.
  const runEnrichment = (id: string, description: string, workHistory: typeof profile.workHistory) => {
    enrichExperience(description, tagVocabulary, workHistory)
      .then((result) => {
        setExperiences((current) =>
          current.map((experience) =>
            experience.id !== id
              ? experience
              : {
                ...experience,
                title: result.title || experience.title,
                tags: result.tags,
                impact: result.impact || experience.impact,
                metadata: result.company ? { ...experience.metadata, company: result.company } : experience.metadata,
                aiDraftStructured: result.draftStructured,
                aiSuggestedFields: [
                  "title",
                  ...(result.tags.length ? ["tags"] : []),
                  ...(result.company ? ["company"] : []),
                  ...(result.impact ? ["impact"] : []),
                ],
                enrichmentStatus: "done",
              }
          )
        )
      })
      .catch((error) => {
        console.error("AI enrichment failed, falling back to deterministic auto-fill", error)
        const auto = autoFillExperience(description, profile)
        setExperiences((current) =>
          current.map((experience) =>
            experience.id !== id
              ? experience
              : {
                ...experience,
                title: auto.title || experience.title,
                tags: auto.tags,
                ...(auto.metadata ? { metadata: { ...experience.metadata, ...auto.metadata } } : {}),
                aiSuggestedFields: [
                  "title",
                  ...(auto.tags.length ? ["tags"] : []),
                  ...(auto.metadata ? ["company"] : []),
                ],
                enrichmentStatus: "done",
              }
          )
        )
        toast("Couldn't reach AI enrichment — filled in with quick heuristics instead")
      })
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()

    if (editingExperience) {
      // Editing is an implicit confirmation of everything in the form, so
      // it clears any "AI guessed this" flags.
      const id = editingExperience.id
      const item = { ...draft, id, aiSuggestedFields: [], enrichmentStatus: "done" as const }
      setExperiences((current) => current.map((experience) => (experience.id === id ? { ...experience, ...item } : experience)))
      toast("Experience updated")
      router.push(`/experience/${id}`)
      return
    }

    // A brand-new capture: save instantly with a placeholder title and
    // deterministic date, then enrich in the background.
    const id = crypto.randomUUID()
    const date = inferDate(draft.description)
    const placeholderTitle = draft.description.trim().replace(/\s+/g, " ").slice(0, 60) || "New experience"
    const item = {
      ...draft,
      id,
      title: placeholderTitle,
      date,
      tags: [] as string[],
      aiSuggestedFields: [] as string[],
      enrichmentStatus: "pending" as const,
    }
    setExperiences((current) => [item, ...current])
    toast("Saved — filling in the details…")
    runEnrichment(id, draft.description, profile.workHistory)
    router.push(`/experience/${id}`)
  }

  // Fresh capture: just clear the form. Editing: return to the entry
  // instead of leaving a blank form on its URL.
  const cancel = () => {
    if (editingExperience) {
      router.push(`/experience/${editingExperience.id}`)
    } else {
      setDraft(blankDraft)
    }
  }

  return (
    <section className="mx-2 grid max-w-162.5 grid-cols-1" aria-label="Experience capture workspace">
      <CaptureForm
        draft={draft}
        editing={Boolean(editingExperience)}
        setField={setField}
        toggleTag={toggleTag}
        suggestTags={suggestTags}
        clear={cancel}
        save={save}
      />
    </section>
  )
}
