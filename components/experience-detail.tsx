"use client"

import { useState } from "react"
import { ArrowRight, Pencil, Sparkles, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/data"
import { getCompletenessFlags, getCompletenessScore } from "@/lib/completeness"
import type { Experience, StructuredFields } from "@/lib/types"
import { CompletenessBadges } from "@/components/completeness-badges"
import { StarStoryList } from "@/components/star-story-list"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STRUCTURE_SECTIONS: [keyof StructuredFields, string, string][] = [
  ["situation", "Situation / context", "What was at stake?"],
  ["challenge", "Challenge", "What made this hard or important?"],
  ["role", "Your role", "What did you personally own?"],
  ["actions", "What you did", "What decisions or tradeoffs did you make?"],
  ["outcome", "Outcome / impact", "What changed because of your work?"],
]

const SCOPE_LABELS: Record<string, string> = {
  scopeUsers: "Users",
  scopeRevenue: "Revenue / cost",
  scopeSystems: "Systems",
  scopeTeamSize: "Team size",
}

export function ExperienceDetail({
  experience,
  onEdit,
  onDelete,
  onComplete,
  onCreateStar,
  onEditStar,
  onDeleteStar,
  onUpdateCompany,
  onConfirmCompany,
}: {
  experience?: Experience
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
  onCreateStar: () => void
  onEditStar: (id: string) => void
  onDeleteStar: (id: string) => void
  onUpdateCompany: (company: string) => void
  onConfirmCompany: () => void
}) {
  const [editingCompany, setEditingCompany] = useState(false)
  const [companyDraft, setCompanyDraft] = useState("")
  const [trackedId, setTrackedId] = useState(experience?.id)

  // Reset the inline company editor whenever a different experience is
  // selected, so a stale draft from the last one can't leak in. Adjusted
  // during render (guarded by the id comparison) rather than in an effect —
  // this is state derived from a prop change, not a sync with an external
  // system, so it doesn't need to wait for a render + effect round-trip.
  if (experience?.id !== trackedId) {
    setTrackedId(experience?.id)
    setEditingCompany(false)
    setCompanyDraft(experience?.metadata?.company || "")
  }

  if (!experience) {
    return (
      <Card className="detail-card mt-5 p-7">
        <div className="py-5.5 text-center text-[#8991a1]">Select an experience to see its details.</div>
      </Card>
    )
  }

  const structured = experience.structured || {}
  const metadata = experience.metadata || {}
  const aiSuggested = experience.aiSuggestedFields || []
  // An AI company match hasn't been confirmed or corrected yet — show the
  // active "right?" prompt instead of the passive value + badge below.
  const unconfirmedCompany = aiSuggested.includes("company") && Boolean(metadata.company) && !editingCompany
  const enriching = experience.enrichmentStatus === "pending"
  const score = getCompletenessScore(experience)
  const flags = getCompletenessFlags(experience)
  const hasAnyStructure = score > 0
  const scopeEntries = Object.entries(SCOPE_LABELS).filter(([key]) => metadata[key as keyof typeof metadata]?.trim())
  const dateRange = [formatDate(experience.date), metadata.dateEnd ? formatDate(metadata.dateEnd) : null]
    .filter(Boolean)
    .join(" – ")

  const saveCompany = () => {
    onUpdateCompany(companyDraft.trim())
    setEditingCompany(false)
  }

  return (
    <Card className="detail-card mt-5 grid grid-cols-[1.5fr_.75fr] gap-9 p-7 max-[900px]:grid-cols-1 max-[900px]:gap-6 max-[600px]:p-5.5">
      <div>
        <div className="flex items-center gap-2 text-[11px] text-[#737b8b]">
          EXPERIENCE DETAIL <span>•</span> {dateRange}
        </div>
        <h2 className={`my-2.25 text-2xl tracking-[-.03em] ${aiSuggested.length > 0 ? "mb-1" : "mb-4"}`}>
          {experience.title}
        </h2>

        {enriching ? (
          <p className="m-0 mb-4 flex items-center gap-1.25 text-[11px] text-(--color-accent)">
            <Sparkles size={11} className="animate-pulse" />
            We&apos;re filling in the title, tags, company, and impact — this&apos;ll update in a moment.
          </p>
        ) : (
          aiSuggested.length > 0 && (
            <p className="m-0 mb-4 flex items-center gap-1.25 text-[11px] text-(--color-faint-fg)">
              <Sparkles size={11} />
              Some of this was filled in automatically — use &quot;Edit capture&quot; to fix anything that&apos;s off.
            </p>
          )
        )}

        <CompletenessBadges flags={flags} />

        <div className="grid gap-4.75">
          {STRUCTURE_SECTIONS.map(([key, label, hint]) => (
            <div className="border-b border-(--color-border-hairline) pb-4.25" key={key}>
              <h3 className="mb-1.75 text-xs">{label}</h3>
              {structured[key]?.trim() ? (
                <p className="m-0 whitespace-pre-line text-[13px] leading-[1.55] text-(--color-body-fg)">
                  {structured[key]}
                </p>
              ) : (
                <p className="m-0 text-[13px] italic text-[#a3a9b8]">Not added yet — {hint}</p>
              )}
            </div>
          ))}
        </div>

        <StarStoryList
          stories={experience.starStories || []}
          onCreate={onCreateStar}
          onEdit={onEditStar}
          onDelete={onDeleteStar}
        />

        <details className="mt-6 border-t border-(--color-border-hairline) pt-4.5">
          <summary className="cursor-pointer text-xs font-bold text-(--color-muted-fg)">
            Original capture (preserved as written)
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-[1.65] text-[#454d5f]">{experience.description}</p>
          {experience.impact && (
            <div className="mt-5.5 border-l-[3px] border-[#8a74f3] py-1.5 pl-3.5">
              <p className="m-0 mb-1 text-[11px] font-bold text-[#6349d9]">WHY IT MATTERED</p>
              <span className="text-[13px] leading-normal text-[#555c6d]">{experience.impact}</span>
            </div>
          )}
        </details>
      </div>

      <aside className="border-l border-(--color-border-panel) pl-7 max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:pl-0 max-[900px]:pt-5">
        <h3 className="mb-3.25 text-xs">SKILLS & THEMES</h3>
        <div className="flex flex-wrap gap-1.75">
          {experience.tags.length ? (
            experience.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
          ) : enriching ? (
            <p className="m-0 text-xs italic text-(--color-faint-fg)">Enriching…</p>
          ) : (
            <p className="m-0 text-xs italic text-[#a3a9b8]">Not added yet.</p>
          )}
        </div>

        <h3 className="mt-7 mb-3.25 text-xs">WHO WORKED ON THIS</h3>
        {experience.collaborators?.length ? (
          <div className="flex flex-wrap gap-1.75">
            {experience.collaborators.map((person) => (
              <Badge key={person}>{person}</Badge>
            ))}
          </div>
        ) : (
          <p className="m-0 text-xs italic text-[#a3a9b8]">Not added yet.</p>
        )}

        <h3 className="mt-7 mb-3.25 text-xs">DETAILS</h3>

        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-(--color-subtle-fg)">Company</span>
            {!editingCompany && !unconfirmedCompany && !enriching && (
              <button
                type="button"
                onClick={() => {
                  setCompanyDraft(metadata.company || "")
                  setEditingCompany(true)
                }}
                className="border-0 bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
              >
                {metadata.company ? "Fix" : "Add"}
              </button>
            )}
          </div>
          {editingCompany ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <input
                autoFocus
                value={companyDraft}
                onChange={(event) => setCompanyDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && saveCompany()}
                placeholder="e.g. Shopify"
                className="h-8 flex-1 rounded-lg border border-(--color-border-hairline) px-2 text-xs outline-none focus:border-(--color-accent)"
              />
              <button
                type="button"
                onClick={saveCompany}
                className="border-0 bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingCompany(false)}
                className="border-0 bg-transparent p-0 text-[11px] text-(--color-faint-fg)"
              >
                Cancel
              </button>
            </div>
          ) : unconfirmedCompany ? (
            <div className="mt-1.5 rounded-lg border border-(--color-tag-border) bg-(--color-tag-bg) p-2.5">
              <p className="m-0 mb-2 flex items-start gap-1.25 text-[11px] leading-[1.4] text-(--color-tag-fg)">
                <Sparkles size={11} className="mt-0.5 flex-none" />
                We think this was at <strong>{metadata.company}</strong> — right?
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onConfirmCompany}
                  className="rounded-md bg-(--color-accent) px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  Yes, that&apos;s right
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyDraft(metadata.company || "")
                    setEditingCompany(true)
                  }}
                  className="rounded-md border border-(--color-tag-border) bg-transparent px-2.5 py-1 text-[11px] font-semibold text-(--color-tag-fg)"
                >
                  Not quite
                </button>
              </div>
            </div>
          ) : metadata.company ? (
            <div className="mt-0.75 flex items-center gap-1.5">
              <span className="text-xs text-[#454d5f]">{metadata.company}</span>
            </div>
          ) : enriching ? (
            <p className="m-0 mt-0.75 text-xs italic text-(--color-faint-fg)">Enriching…</p>
          ) : (
            <p className="m-0 mt-0.75 text-xs italic text-[#a3a9b8]">Not added yet.</p>
          )}
        </div>

        {metadata.project || metadata.team || scopeEntries.length ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1">
            {metadata.project && (
              <>
                <dt className="text-[11px] font-semibold text-(--color-subtle-fg)">Project</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata.project}</dd>
              </>
            )}
            {metadata.team && (
              <>
                <dt className="text-[11px] font-semibold text-(--color-subtle-fg)">Team</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata.team}</dd>
              </>
            )}
            {scopeEntries.map(([key, label]) => (
              <span className="contents" key={key}>
                <dt className="text-[11px] font-semibold text-(--color-subtle-fg)">{label}</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata[key as keyof typeof metadata]}</dd>
              </span>
            ))}
          </dl>
        ) : (
          <p className="m-0 text-xs italic text-[#a3a9b8]">Not added yet.</p>
        )}

        <h3 className="mt-7 mb-3.25 text-xs">STRUCTURE</h3>
        <p className="mb-4.5 text-xs leading-normal text-(--color-subtle-fg)">
          {hasAnyStructure
            ? `${score}% complete — keep filling this in for stronger STAR stories later.`
            : "Add context, ownership, actions, and outcome to strengthen this story."}
        </p>
        <Button className="mb-4.5 w-full" onClick={onComplete}>
          {hasAnyStructure ? "Edit details" : "Complete this experience"} <ArrowRight size={14} />
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Pencil size={14} />
            Edit capture
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </aside>
    </Card>
  )
}
