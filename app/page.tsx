"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { blankDraft, blankProfile, blankStarDraft, blankWorkHistoryRow, emptyCompletion, starterExperiences, tags as tagVocabulary } from "@/lib/data"
import { generateStarDraft } from "@/lib/star"
import { autoFillExperience, inferDate, inferTags } from "@/lib/autofill"
import { getInitialData, syncExperiences, syncProfile } from "@/lib/actions/data"
import { enrichExperience } from "@/lib/actions/enrich"
import type { CompletionDraft, Draft, Experience, Screen, StarDraft, UserProfile, WorkHistoryEntry } from "@/lib/types"
import { AppSidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CaptureForm } from "@/components/capture-form"
import { ExperienceBank } from "@/components/experience-bank"
import { ExperienceDetail } from "@/components/experience-detail"
import { CompleteExperienceForm } from "@/components/complete-experience-form"
import { StarStoryForm } from "@/components/star-story-form"
import { OnboardingForm } from "@/components/onboarding-form"
import { ProfileView } from "@/components/profile-view"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const STORAGE_KEY = "experience-bank-items"
const PROFILE_STORAGE_KEY = "career-bank-profile"

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(blankProfile)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [screen, setScreen] = useState<Screen>("capture")

  // Load this account's data from the server on mount (client-only — the
  // fetch needs the signed-in session, and effects are how we bring async
  // data into state after render). A brand-new account (nothing saved
  // server-side yet) adopts whatever's still sitting in this browser's
  // localStorage from using the app before signing in — a one-time
  // migration — otherwise it falls back to the starter demo content so it
  // isn't empty on day one. A returning account's server data always wins;
  // localStorage is never consulted again after this.
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const { experiences: serverExperiences, profile: serverProfile, isNewAccount, avatarUrl: accountAvatarUrl } = await getInitialData()
          let initialExperiences = serverExperiences
          let initialProfile = serverProfile

          if (isNewAccount) {
            const storedExperiences = window.localStorage.getItem(STORAGE_KEY)
            const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
            const localExperiences = storedExperiences ? (JSON.parse(storedExperiences) as Experience[]) : null
            const localProfile = storedProfile ? (JSON.parse(storedProfile) as UserProfile) : null

            if (localExperiences || localProfile) {
              initialExperiences = localExperiences || starterExperiences
              initialProfile = localProfile || blankProfile
              await Promise.all([syncExperiences(initialExperiences), syncProfile(initialProfile)])
              window.localStorage.removeItem(STORAGE_KEY)
              window.localStorage.removeItem(PROFILE_STORAGE_KEY)
            } else {
              initialExperiences = starterExperiences
            }
          }

          if (cancelled) return
          setExperiences(initialExperiences)
          setSelectedId(initialExperiences[0]?.id)
          setProfile(initialProfile)
          setAvatarUrl(accountAvatarUrl)
          // Deliberately not persisted (session-only): work history is central to
          // how experiences get grouped by company, so a reload should surface
          // this nudge again until a role is actually added — dismissing it only
          // clears the current view, not the underlying "still missing" state.
          setHydrated(true)
        } catch (error) {
          console.error("Failed to load Career Bank data", error)
          if (!cancelled) toast("Couldn't load your Career Bank — try refreshing the page.")
        }
      })()
    return () => {
      cancelled = true
    }
  }, [])

  // Whole-array sync on every change, same shape as the localStorage effect
  // this replaced: these only fire on discrete save/delete actions (never
  // per-keystroke), so pushing the full current array each time is cheap
  // and keeps every mutation site above untouched.
  useEffect(() => {
    if (hydrated) syncExperiences(experiences).catch(() => toast("Couldn't save — check your connection"))
  }, [experiences, hydrated])

  useEffect(() => {
    if (hydrated) syncProfile(profile).catch(() => toast("Couldn't save your profile — check your connection"))
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

  // Fires the real (LLM-backed) enrichment call for a freshly-saved capture
  // and folds the result back into that one experience when it resolves.
  // Runs after the save has already navigated the person to the detail
  // view — this is the async half of saveExperience below, split out so
  // save itself can stay a plain synchronous state update.
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
        // Never leave an experience stuck "enriching…" — fall back to the
        // same deterministic heuristics Quick Capture used before this was
        // built, so the field still gets filled in, just less precisely.
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
        notify("Couldn't reach AI enrichment — filled in with quick heuristics instead")
      })
  }

  const saveExperience = (event: React.FormEvent) => {
    event.preventDefault()

    if (editingId) {
      // Edits come from the full form, which already collects every field
      // explicitly, so those are used as typed instead of re-guessed.
      // Editing is an implicit confirmation of everything in that form, so
      // it clears any "AI guessed this" flags from a previous auto-fill
      // pass and can't be mid-enrichment (enrichment only ever starts from
      // a brand-new capture).
      const id = editingId
      const item = { ...draft, id, aiSuggestedFields: [], enrichmentStatus: "done" as const }
      setExperiences((current) => current.map((experience) => (experience.id === id ? { ...experience, ...item } : experience)))
      setSelectedId(id)
      setDraft(blankDraft)
      setEditingId(null)
      setScreen("detail")
      notify("Experience updated")
      return
    }

    // A brand-new capture: save instantly with just what's deterministic
    // and free (date inference is a cheap regex match, so there's no
    // reason to make that async too) and a plain placeholder title, then
    // kick off the real AI enrichment in the background. The experience
    // shows up right away with an "enriching…" state; title/tags/company/
    // impact fill in moments later when runEnrichment's call resolves.
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
    setSelectedId(id)
    setDraft(blankDraft)
    setEditingId(null)
    setScreen("detail")
    notify("Saved — filling in the details…")
    runEnrichment(id, draft.description, profile.workHistory)
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

  // A lightweight correction path for a wrong (or missing) AI company match
  // — lets someone fix it right from the detail view instead of routing
  // through the full "Complete this experience" flow just to change one
  // field. Also clears the "AI guessed this" flag, since a manual edit is
  // itself the confirmation.
  const updateCompany = (company: string) => {
    if (!selected) return
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selected.id
          ? item
          : {
            ...item,
            metadata: { ...item.metadata, company },
            aiSuggestedFields: (item.aiSuggestedFields || []).filter((field) => field !== "company"),
          }
      )
    )
    notify("Company updated")
  }

  // "Yes, that's right" on the AI company-match prompt — same as a manual
  // edit for bookkeeping purposes (clears the "unconfirmed" flag) but
  // leaves the value untouched, since there's nothing to correct.
  const confirmCompany = () => {
    if (!selected) return
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selected.id
          ? item
          : { ...item, aiSuggestedFields: (item.aiSuggestedFields || []).filter((field) => field !== "company") }
      )
    )
    notify("Got it — company confirmed")
  }

  // Onboarding is optional and never gates capture — it's reachable any time
  // via the sidebar settings icon (through the profile page), or via the
  // Career Bank nudge below, and always opens with whatever profile already
  // exists so it doubles as an edit screen, not just a first-run wizard.
  const startOnboarding = () => {
    setProfileDraft(profile)
    setScreen("onboarding")
  }

  // The sidebar settings icon lands here — a read view of the profile and
  // work history, with entries grouped under whichever company they're
  // matched to. Editing happens through the same onboarding form as before.
  const startProfile = () => setScreen("profile")

  const viewExperienceFromProfile = (id: string) => {
    setSelectedId(id)
    setScreen("detail")
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
    setScreen("profile")
    notify("Profile saved")
  }

  const dismissNudge = () => {
    setNudgeDismissed(true)
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar screen={screen} setScreen={setScreen} onSettingsClick={startProfile} profile={profile} avatarUrl={avatarUrl} />
      <MobileNav screen={screen} setScreen={setScreen} onSettingsClick={startProfile} profile={profile} avatarUrl={avatarUrl} />
      <main className="mx-auto w-[min(1360px,calc(100%-122px))] px-3 pt-13.5 pb-15 max-[900px]:w-[calc(100%-82px)] max-[900px]:pt-8 max-[600px]:w-full max-[600px]:px-3.5 max-[600px]:pt-6 max-[600px]:pb-24">
        <header className="mx-2 mb-8 flex items-start justify-between gap-7.5 max-[600px]:block max-[600px]:mb-5.5">
          <div>
            <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
              YOUR CAREER BANK
            </p>
            <h1 className="m-0 max-w-155 font-serif text-[34px] leading-[1.13] tracking-[-.035em] max-[600px]:text-[29px]">
              Turn your work into stories worth telling.
            </h1>
          </div>
          {screen === "capture" ? (
            <Button variant="ghost" className="mt-4" onClick={() => setScreen("bank")}>
              View career bank <ArrowRight size={15} />
            </Button>
          ) : screen === "bank" ? (
            <Button
              className="mt-4 "
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
            <Button variant="ghost" className="mt-4" onClick={() => setScreen("bank")}>
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
            onCancel={() => setScreen(profile.name || profile.workHistory.length ? "profile" : "bank")}
          />
        )}

        {screen === "profile" && (
          <ProfileView
            profile={profile}
            experiences={experiences}
            onEdit={startOnboarding}
            onSelectExperience={viewExperienceFromProfile}
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
          <section className="mx-2 grid max-w-162.5 grid-cols-1" aria-label="Experience capture workspace">
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
          <section className="mx-2 grid grid-cols-1" aria-label="Experience capture workspace">
            {!profile.workHistory.length && !nudgeDismissed && (
              <div className="mb-4 md:flex items-center gap-3 rounded-xl border border-(--color-tag-border) bg-(--color-tag-bg) px-4 py-3">
                <p className="m-0 flex-1 text-[13px] text-(--color-tag-fg)">
                  Add your work history so entries can be matched to where they happened — e.g. a story about
                  a security audit automatically linked to your time at that company.
                </p>
                <div className="mt-4 flex justify-between align-items-center md:flex-none md:mt-0">
                  <Button size="sm" onClick={startOnboarding}>
                    Add work history
                  </Button>
                  <button
                    type="button"
                    onClick={dismissNudge}
                    aria-label="Dismiss"
                    className="grid h-7 w-7 flex-none place-items-center rounded-lg text-(--color-tag-fg) hover:bg-white/60"
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
          <div className="mx-2 max-w-240">
            <ExperienceDetail
              experience={selected}
              onEdit={startEdit}
              onDelete={removeExperience}
              onComplete={startComplete}
              onCreateStar={startCreateStar}
              onEditStar={startEditStar}
              onDeleteStar={deleteStarStory}
              onUpdateCompany={updateCompany}
              onConfirmCompany={confirmCompany}
            />
          </div>
        )}
      </main>
    </div>
  )
}
