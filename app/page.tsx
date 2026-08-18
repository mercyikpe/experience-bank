"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { blankDraft, emptyCompletion, starterExperiences, tags as tagVocabulary } from "@/lib/data"
import type { CompletionDraft, Draft, Experience, Screen } from "@/lib/types"
import { AppSidebar } from "@/components/sidebar"
import { CaptureForm } from "@/components/capture-form"
import { ExperienceBank } from "@/components/experience-bank"
import { ExperienceDetail } from "@/components/experience-detail"
import { CompleteExperienceForm } from "@/components/complete-experience-form"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "experience-bank-items"

export default function Home() {
  const [experiences, setExperiences] = useState<Experience[]>(starterExperiences)
  const [hydrated, setHydrated] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [draft, setDraft] = useState<Draft>(blankDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [completionDraft, setCompletionDraft] = useState<CompletionDraft>(emptyCompletion)
  const [screen, setScreen] = useState<Screen>("capture")

  // Load persisted experiences on mount (client-only — avoids SSR/localStorage mismatch).
  // Reading localStorage has to happen post-mount, so this necessarily sets
  // state from an effect rather than during render.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? (JSON.parse(stored) as Experience[]) : null
    const initial = parsed || starterExperiences
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration, unavoidable on mount
    setExperiences(initial)
    setSelectedId(initial[0]?.id)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences))
  }, [experiences, hydrated])

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
    const text = `${draft.title} ${draft.description} ${draft.impact}`.toLowerCase()
    const keywordsByTag: Record<string, string[]> = {
      Performance: ["performance", "latency", "slow"],
      Backend: ["query", "database", "api"],
      Leadership: ["led", "mentor"],
      Reliability: ["outage", "incident", "reliab"],
      Communication: ["partner", "stakeholder"],
      "Customer Impact": ["customer", "user"],
      "Problem Solving": ["problem", "investigated", "issue"],
    }
    const suggestions = tagVocabulary.filter((tag) => (keywordsByTag[tag] || []).some((word) => text.includes(word)))
    setDraft((current) => ({
      ...current,
      tags: [...new Set([...current.tags, ...(suggestions.length ? suggestions : ["Ownership", "Problem Solving"])])],
    }))
    notify("Suggested tags added — adjust anything you like")
  }

  const saveExperience = (event: React.FormEvent) => {
    event.preventDefault()
    const id = editingId || crypto.randomUUID()
    const item = { ...draft, id }
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

  return (
    <div className="flex min-h-screen">
      <AppSidebar screen={screen} setScreen={setScreen} />
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

        {screen === "capture" && (
          <section className="mx-auto grid max-w-[650px] grid-cols-1" aria-label="Experience capture workspace">
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
          <section className="mx-auto grid max-w-[960px] grid-cols-1" aria-label="Experience capture workspace">
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
          <div className="mx-auto max-w-[960px]">
            <ExperienceDetail experience={selected} onEdit={startEdit} onDelete={removeExperience} onComplete={startComplete} />
          </div>
        )}
      </main>
    </div>
  )
}
