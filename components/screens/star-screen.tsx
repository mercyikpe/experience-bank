"use client"

// STAR story create/edit — reached from /experience/[id]/star (create) and
// /experience/[id]/star/[storyId] (edit an existing one). Same form and
// draft logic either way; only the seed and the save behavior differ.

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { tags as tagVocabulary, blankStarDraft } from "@/lib/data"
import { generateStarDraft } from "@/lib/star"
import { useAppData } from "@/lib/app-data-context"
import { StarStoryForm } from "@/components/star-story-form"
import type { Experience, StarDraft } from "@/lib/types"

export function StarScreen({ experience, editingStoryId }: { experience: Experience; editingStoryId?: string }) {
  const router = useRouter()
  const { setExperiences } = useAppData()

  const editingStory = editingStoryId ? (experience.starStories || []).find((story) => story.id === editingStoryId) : undefined

  const [draft, setDraft] = useState<StarDraft>(() =>
    editingStory
      ? {
        theme: editingStory.theme,
        situation: editingStory.situation,
        task: editingStory.task,
        action: editingStory.action,
        result: editingStory.result,
      }
      : blankStarDraft
  )

  // Available themes: this experience's own tags first (most relevant),
  // then the rest of the vocabulary — any tag can still be picked.
  const themes = [...experience.tags, ...tagVocabulary.filter((tag) => !experience.tags.includes(tag))]

  // Selecting a theme (or hitting "Regenerate") always rebuilds the draft
  // from the current structured fields — deterministic, no AI involved —
  // so switching themes is safe to try until something looks right.
  const selectTheme = (theme: string) => setDraft({ theme, ...generateStarDraft(experience, theme) })
  const regenerate = () => {
    if (!draft.theme) return
    setDraft((current) => ({ theme: current.theme, ...generateStarDraft(experience, current.theme) }))
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.theme) return
    const now = new Date().toISOString()
    setExperiences((current) =>
      current.map((item) => {
        if (item.id !== experience.id) return item
        const existing = item.starStories || []
        if (editingStoryId) {
          return {
            ...item,
            starStories: existing.map((story) =>
              story.id === editingStoryId
                ? { ...story, theme: draft.theme, situation: draft.situation, task: draft.task, action: draft.action, result: draft.result, updatedAt: now }
                : story
            ),
          }
        }
        const newStory = {
          id: crypto.randomUUID(),
          theme: draft.theme,
          situation: draft.situation,
          task: draft.task,
          action: draft.action,
          result: draft.result,
          createdAt: now,
          updatedAt: now,
        }
        return { ...item, starStories: [newStory, ...existing] }
      })
    )
    toast(editingStoryId ? "STAR story updated" : "STAR story saved")
    router.push(`/experience/${experience.id}`)
  }

  return (
    <StarStoryForm
      draft={draft}
      setDraft={setDraft}
      themes={themes}
      editing={Boolean(editingStoryId)}
      hasGenerated={Boolean(draft.situation || draft.task || draft.action || draft.result)}
      onSelectTheme={selectTheme}
      onRegenerate={regenerate}
      onSave={save}
      onCancel={() => router.push(`/experience/${experience.id}`)}
    />
  )
}
