"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { blankDraft, blankProfile, blankStarDraft, blankWorkHistoryRow, emptyCompletion, starterExperiences, tags as tagVocabulary } from "@/lib/data"
import { generateStarDraft } from "@/lib/star"
import { autoFillExperience, inferTags } from "@/lib/autofill"
import type { CompletionDraft, Draft, Experience, Screen, StarDraft, UserProfile, WorkHistoryEntry } from "@/lib/types"
import { AppSidebar } from "@/components/sidebar"
import { CaptureForm } from "@/components/capture-form"
import { ExperienceBank } from "@/components/experience-bank"
import { ExperienceDetail } from "@/components/experience-detail"
import { CompleteExperienceForm } from "@/components/complete-experience-form"
import { StarStoryForm } from "@/components/star-story-form"
import { OnboardingForm } from "@/components/onboarding-form"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const STORAGE_KEY = "experience-bank-items"
const PROFILE_STORAGE_KEY = "career-bank-profile"
const NUDGE_STORAGE_KEY = "career-bank-nudge-dismissed"

export default function Home() {
  const [experiences, setExperiences] = useState<Experience[]>(starterExperiences)
  const [hydrated, setHydrated] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [draft, setDraft] = useState<Draft>(blankDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [completionDraft, setCompletionDraft] = useState<CompletionDraft>(emptyCompletion)
  const [starDraft, setStarDraft] = useState<StarDraft>(blankStarDraft)
  const [editingStarId, setEditingStarId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile>(blankProfile)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(blankProfile)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [screen, setScreen] = useState<Screen>("capture")

  // Load persisted experiences on mount (client-only — avoids SSR/localStorage mismatch).
  // Reading localStorage has to happen post-mount, so this necessarily sets
  // state from an effect rather than during render.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? (JSON.parse(stored) as Experience[]) : null
    const initial = parsed || starterExperiences
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    const initialProfile = storedProfile ? (JSON.parse(storedProfile) as UserProfile) : blankProfile
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration, unavoidable on mount
    setExperiences(initial)
    setSelectedId(initial[0]?.id)
    setProfile(initialProfile)
    setNudgeDismissed(window.localStorage.getItem(NUDGE_STORAGE_KEY) === "true")
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences))
  }, [experiences, hydrated])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  }, [profile, hydrated])

  const selected = experiences.find((item) => item.id === selectedId)
  const filters = ["All", ...new Set(experiences.flatMap((item) => item.tags))]
  const visibleExperiences = useMemo(
    () =>
      experiences.filter(
        (item) =>
          (activeFilter === "All" || item.tags.includes(activeFilter)) &&
          `${item.title} ${item.description} ${item.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())
      ),
    [experiences, activeFilter, search]
  )

  const notify = (message: string) => toast(message)
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
    notify("Suggested tags added — adjust anything you like")
  }

  const saveExperience = (event: React.FormEvent) => {
    event.preventDefault()
    const id = editingId || crypto.randomUUID()
    // New captures come from the simplified form (description only) — the
    // deterministic auto-fill guesses title/date/tags/company from the raw
    // text. Edits come from the full form, which already collects every
    // field explicitly, so those are used as typed instead of re-guessed.
    const item = editingId
      ? { ...draft, id }
      : (() => {
          const auto = autoFillExperience(draft.description, profile)
          return {
            ...draft,
            id,
            title: auto.title,
            date: auto.date,
            tags: auto.tags,
            ...(auto.metadata ? { metadata: auto.metadata } : {}),
          }
        })()
    setExperiences((current) =>
      editingId
        ? current.map((experience) => (experience.id === id ? { ...experience, ...item } : experience))
        : [item, ...current]
    )
    setSelectedId(id)
    setDraft(blankDraft)
    setEditingId(null)
    setScreen("detail")
    notify(editingId ? "Experience updated" : "Experience saved to your Career Bank")
  }

  // Seeds the "Complete this experience" draft from whatever already
  // exists — including a first guess at Situation/Outcome pulled from the
  // raw capture, so people aren't re-typing what they already wrote.
  const startComplete = () => {
    if (!selected) return
    const s = selected.structured || {}
    const m = selected.metadata || {}
    setCompletionDraft({
      situation: s.situation || selected.description || "",
      challenge: s.challenge || "",
      role: s.role || "",
      actions: s.actions || "",
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
    })
    setScreen("complete")
  }

  // The raw capture (description/impact) is never touched here — only
  // structured/collaborators/metadata are written, so the original note
  // is always preserved underneath whatever gets added on top of it.
  const saveComplete = (event: React.FormEvent) => {
    event.preventDefault()
    const d = completionDraft
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selectedId
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
    setScreen("detail")
    notify("Experience details saved")
  }

  // Available themes for this experience: its own tags first (most relevant),
  // then the rest of the vocabulary — any tag can still be picked as a theme.
  const starThemes = selected
    ? [...selected.tags, ...tagVocabulary.filter((tag) => !selected.tags.includes(tag))]
    : tagVocabulary

  const startCreateStar = () => {
    if (!selected) return
    setStarDraft(blankStarDraft)
    setEditingStarId(null)
    setScreen("star")
  }

  const startEditStar = (id: string) => {
    if (!selected) return
    const story = (selected.starStories || []).find((item) => item.id === id)
    if (!story) return
    setStarDraft({ theme: story.theme, situation: story.situation, task: story.task, action: story.action, result: story.result })
    setEditingStarId(id)
    setScreen("star")
  }

  // Selecting a theme (or hitting "Regenerate") always rebuilds the draft
  // from the current structured fields — deterministic, no AI involved —
  // so switching themes is safe to try until something looks right.
  const selectStarTheme = (theme: string) => {
    if (!selected) return
    setStarDraft({ theme, ...generateStarDraft(selected, theme) })
  }

  const regenerateStar = () => {
    if (!selected || !starDraft.theme) return
    setStarDraft((current) => ({ theme: current.theme, ...generateStarDraft(selected, current.theme) }))
  }

  const saveStarStory = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected || !starDraft.theme) return
    const now = new Date().toISOString()
    setExperiences((current) =>
      current.map((item) => {
        if (item.id !== selectedId) return item
        const existing = item.starStories || []
        if (editingStarId) {
          return {
            ...item,
            starStories: existing.map((story) =>
              story.id === editingStarId
                ? { ...story, theme: starDraft.theme, situation: starDraft.situation, task: starDraft.task, action: starDraft.action, result: starDraft.result, updatedAt: now }
                : story
            ),
          }
        }
        const newStory = {
          id: crypto.randomUUID(),
          theme: starDraft.theme,
          situation: starDraft.situation,
          task: starDraft.task,
          action: starDraft.action,
          result: starDraft.result,
          createdAt: now,
          updatedAt: now,
        }
        return { ...item, starStories: [newStory, ...existing] }
      })
    )
    setEditingStarId(null)
    setScreen("detail")
    notify(editingStarId ? "STAR story updated" : "STAR story saved")
  }

  const deleteStarStory = (id: string) => {
    if (!selected) return
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selectedId ? item : { ...item, starStories: (item.starStories || []).filter((story) => story.id !== id) }
      )
    )
    notify("STAR story deleted")
  }

  const startEdit = () => {
    if (!selected) return
    setDraft({ title: selected.title, description: selected.description, impact: selected.impact, date: selected.date, tags: selected.tags })
    setEditingId(selected.id)
    setScreen("capture")
  }

  const removeExperience = () => {
    if (!selected) return
    const remaining = experiences.filter((item) => item.id !== selected.id)
    setExperiences(remaining)
    setSelectedId(remaining[0]?.id)
    setDraft(blankDraft)
    setEditingId(null)
    setScreen("bank")
    notify("Experience deleted")
  }

  // Onboarding is optional and never gates capture — it's reachable any time
  // via the sidebar settings icon, or via the Career Bank nudge below, and
  // always opens with whatever profile already exists so it doubles as an
  // edit screen, not just a first-run wizard.
  const startOnboarding = () => {
    setProfileDraft(profile)
    setScreen("onboarding")
  }

  const setProfileField = (field: "name" | "currentRole", value: string) =>
    setProfileDraft((current) => ({ ...current, [field]: value }))

  const addWorkHistoryRow = () =>
    setProfileDraft((current) => ({
      ...current,
      workHistory: [...current.workHistory, { ...blankWorkHistoryRow(), id: crypto.randomUUID() }],
    }))

  const updateWorkHistoryRow = (id: string, field: keyof WorkHistoryEntry, value: string | null) =>
    setProfileDraft((current) => ({
      ...current,
      workHistory: current.workHistory.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }))

  const removeWorkHistoryRow = (id: string) =>
    setProfileDraft((current) => ({ ...current, workHistory: current.workHistory.filter((row) => row.id !== id) }))

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault()
    setProfile(profileDraft)
    setScreen("bank")
    notify("Profile saved")
  }

  const dismissNudge = () => {
    setNudgeDismissed(true)
    window.localStorage.setItem(NUDGE_STORAGE_KEY, "true")
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar screen={screen} setScreen={setScreen} onSettingsClick={startOnboarding} />
      <main className="mx-auto w-[min(1360px,calc(100%-122px))] px-3 pt-[54px] pb-[60px] max-[900px]:w-[calc(100%-82px)] max-[900px]:pt-8 max-[600px]:w-full max-[600px]:px-3.5 max-[600px]:pt-6">
        <header className="mx-2 mb-8 flex items-start justify-between gap-[30px] max-[600px]:block max-[600px]:mb-[22px]">
          <div>
            <p className="mb-[7px] text-[11px] font-bold tracking-[.11em] text-[var(--color-muted-fg)]">
              YOUR CAREER BANK
            </p>
            <h1 className="m-0 max-w-[620px] font-serif text-[34px] leading-[1.13] tracking-[-.035em] max-[600px]:text-[29px]">
              Turn your work into stories worth telling.
            </h1>
          </div>
          {screen === "capture" ? (
            <Button variant="ghost" className="mt-2" onClick={() => setScreen("bank")}>
              View career bank <ArrowRight size={15} />
            </Button>
          ) : screen === "bank" ? (
            <Button
              onClick={() => {
                setDraft(blankDraft)
                setEditingId(null)
                setScreen("capture")
              }}
            >
              <Plus size={15} />
              Add new entry
            </Button>
          ) : (
            <Button variant="ghost" className="mt-2" onClick={() => setScreen("bank")}>
              <ArrowLeft size={15} />
              Back to Career Bank
            </Button>
          )}
        </header>

        {screen === "complete" && (
          <CompleteExperienceForm
            draft={completionDraft}
            setDraft={setCompletionDraft}
            onSave={saveComplete}
            onCancel={() => setScreen("detail")}
          />
        )}

        {screen === "onboarding" && (
          <OnboardingForm
            draft={profileDraft}
            setField={setProfileField}
            addRow={addWorkHistoryRow}
            updateRow={updateWorkHistoryRow}
            removeRow={removeWorkHistoryRow}
            onSave={saveProfile}
            onCancel={() => setScreen("bank")}
          />
        )}

        {screen === "star" && (
          <StarStoryForm
            draft={starDraft}
            setDraft={setStarDraft}
            themes={starThemes}
            editing={Boolean(editingStarId)}
            hasGenerated={Boolean(starDraft.situation || starDraft.task || starDraft.action || starDraft.result)}
            onSelectTheme={selectStarTheme}
            onRegenerate={regenerateStar}
            onSave={saveStarStory}
            onCancel={() => setScreen("detail")}
          />
        )}

        {screen === "capture" && (
          <section className="mx-2 grid max-w-[650px] grid-cols-1" aria-label="Experience capture workspace">
            <CaptureForm
              draft={draft}
              editing={Boolean(editingId)}
              setField={setField}
              toggleTag={toggleTag}
              suggestTags={suggestTags}
              clear={() => {
                setDraft(blankDraft)
                setEditingId(null)
              }}
              save={saveExperience}
            />
          </section>
        )}

        {screen === "bank" && (
          <section className="mx-2 grid max-w-240 grid-cols-1" aria-label="Experience capture workspace">
            {!profile.workHistory.length && !nudgeDismissed && (
              <div className="mb-4 md:flex items-center gap-3 rounded-xl border border-[var(--color-tag-border)] bg-[var(--color-tag-bg)] px-4 py-3">
                <p className="m-0 flex-1 text-[13px] text-[var(--color-tag-fg)]">
                  Add your work history so entries can be matched to where they happened — e.g. a story about
                  a security audit automatically linked to your time at that company.
                </p>
                <div className="mt-4 md:mt-0 flex items-center gap-2">
                  <Button size="sm" onClick={startOnboarding}>
                  Add work history
                </Button>
                <button
                  type="button"
                  onClick={dismissNudge}
                  aria-label="Dismiss"
                  className="grid h-7 w-7 flex-none place-items-center rounded-[8px] text-[var(--color-tag-fg)] hover:bg-white/60"
                >
                  <X size={14} />
                </button>
                </div>
              </div>
            )}
            <ExperienceBank
              experiences={visibleExperiences}
              selectedId={selectedId}
              setSelectedId={(id) => {
                setSelectedId(id)
                setScreen("detail")
              }}
              filters={filters}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              search={search}
              setSearch={setSearch}
              total={experiences.length}
            />
          </section>
        )}

        {screen === "detail" && (
          <div className="mx-2 max-w-[960px]">
            <ExperienceDetail
              experience={selected}
              onEdit={startEdit}
              onDelete={removeExperience}
              onComplete={startComplete}
              onCreateStar={startCreateStar}
              onEditStar={startEditStar}
              onDeleteStar={deleteStarStory}
            />
          </div>
        )}
      </main>
    </div>
  )
}
