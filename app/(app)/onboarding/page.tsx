"use client"

// Doubles as the first-run wizard and the "edit profile" screen — same as
// before, it always opens with whatever profile already exists, so there's
// no separate edit mode to track.

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { blankWorkHistoryRow, tags as tagVocabulary } from "@/lib/data"
import { extractResumeContent } from "@/lib/actions/import-resume"
import { useAppData } from "@/lib/app-data-context"
import { OnboardingForm } from "@/components/onboarding-form"
import type { UserProfile, WorkHistoryEntry } from "@/lib/types"

export default function OnboardingPage() {
  const router = useRouter()
  const { profile, setProfile, setExperiences } = useAppData()
  const [draft, setDraft] = useState<UserProfile>(profile)
  const [importingResume, setImportingResume] = useState(false)

  const setField = (field: "name" | "currentRole", value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  const addRow = () =>
    setDraft((current) => ({
      ...current,
      workHistory: [...current.workHistory, { ...blankWorkHistoryRow(), id: crypto.randomUUID() }],
    }))

  const updateRow = (id: string, field: keyof WorkHistoryEntry, value: string | null) =>
    setDraft((current) => ({
      ...current,
      workHistory: current.workHistory.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }))

  const removeRow = (id: string) =>
    setDraft((current) => ({ ...current, workHistory: current.workHistory.filter((row) => row.id !== id) }))

  // Work-history rows only append to this draft (reviewed before "Save
  // profile"). Draft experiences have no staging form, so they save
  // straight to the Career Bank tagged `source: "resume"` for review there.
  const importResume = async (file: File) => {
    setImportingResume(true)
    try {
      const formData = new FormData()
      formData.append("resume", file)
      const { workHistory, experiences: draftExperiences } = await extractResumeContent(formData, tagVocabulary)

      const existingKeys = new Set(draft.workHistory.map((row) => `${row.company.trim().toLowerCase()}|${row.startDate}`))
      const newWorkHistoryRows = workHistory
        .filter((row) => !existingKeys.has(`${row.company.trim().toLowerCase()}|${row.startDate}`))
        .map((row) => ({ ...row, id: crypto.randomUUID() }))

      if (newWorkHistoryRows.length) {
        setDraft((current) => ({ ...current, workHistory: [...current.workHistory, ...newWorkHistoryRows] }))
      }

      // A bullet's own date guess wins; otherwise fall back to the role
      // it's matched to (end date if the role's over, else start date) so
      // it at least lands in the right chronological neighborhood.
      const allKnownRoles = [...draft.workHistory, ...newWorkHistoryRows]
      const today = new Date().toISOString().slice(0, 10)
      const fallbackDateFor = (company: string) => {
        const role = allKnownRoles.find((row) => row.company.trim().toLowerCase() === company.trim().toLowerCase())
        return role ? role.endDate || role.startDate || today : today
      }

      const newExperiences = draftExperiences.map((row) => ({
        id: crypto.randomUUID(),
        title: row.title || row.description.slice(0, 60) || "From resume",
        description: row.description,
        impact: row.impact,
        date: row.date || fallbackDateFor(row.company),
        tags: row.tags,
        metadata: row.company ? { company: row.company } : undefined,
        aiDraftStructured: row.draftStructured,
        aiSuggestedFields: [
          "title",
          ...(row.tags.length ? ["tags"] : []),
          ...(row.company ? ["company"] : []),
          ...(row.impact ? ["impact"] : []),
        ],
        enrichmentStatus: "done" as const,
        source: "resume" as const,
      }))

      if (newExperiences.length) {
        setExperiences((current) => [...newExperiences, ...current])
      }

      if (!newWorkHistoryRows.length && !newExperiences.length) {
        toast("Nothing new to import — that resume matches what's already here")
        return
      }

      const parts = [
        newWorkHistoryRows.length ? `${newWorkHistoryRows.length} role${newWorkHistoryRows.length === 1 ? "" : "s"}` : "",
        newExperiences.length ? `${newExperiences.length} draft experience${newExperiences.length === 1 ? "" : "s"}` : "",
      ].filter(Boolean)
      toast(`Imported ${parts.join(" and ")} from your resume — review before saving`)
    } catch (error) {
      console.error("Resume import failed", error)
      toast(error instanceof Error ? error.message : "Couldn't read that resume")
    } finally {
      setImportingResume(false)
    }
  }

  const onSave = (event: React.FormEvent) => {
    event.preventDefault()
    setProfile(draft)
    toast("Profile saved")
    router.push("/profile")
  }

  const target = profile.name || profile.workHistory.length ? "/profile" : "/bank"

  return (
    <OnboardingForm
      draft={draft}
      setField={setField}
      addRow={addRow}
      updateRow={updateRow}
      removeRow={removeRow}
      onImportResume={importResume}
      importingResume={importingResume}
      onSave={onSave}
      onCancel={() => router.push(target)}
    />
  )
}
