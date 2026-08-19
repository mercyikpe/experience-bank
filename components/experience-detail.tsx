"use client"

import { ArrowRight, Pencil, Trash2 } from "lucide-react"
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
}: {
  experience?: Experience
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
  onCreateStar: () => void
  onEditStar: (id: string) => void
  onDeleteStar: (id: string) => void
}) {
  if (!experience) {
    return (
      <Card className="detail-card mt-5 p-7">
        <div className="py-[22px] text-center text-[#8991a1]">Select an experience to see its details.</div>
      </Card>
    )
  }

  const structured = experience.structured || {}
  const metadata = experience.metadata || {}
  const score = getCompletenessScore(experience)
  const flags = getCompletenessFlags(experience)
  const hasAnyStructure = score > 0
  const scopeEntries = Object.entries(SCOPE_LABELS).filter(([key]) => metadata[key as keyof typeof metadata]?.trim())
  const dateRange = [formatDate(experience.date), metadata.dateEnd ? formatDate(metadata.dateEnd) : null]
    .filter(Boolean)
    .join(" – ")

  return (
    <Card className="detail-card mt-5 grid grid-cols-[1.5fr_.75fr] gap-9 p-7 max-[900px]:grid-cols-1 max-[900px]:gap-6 max-[600px]:p-[22px]">
      <div>
        <div className="flex items-center gap-2 text-[11px] text-[#737b8b]">
          EXPERIENCE DETAIL <span>•</span> {dateRange}
        </div>
        <h2 className="my-[9px] mb-4 text-2xl tracking-[-.03em]">{experience.title}</h2>

        <CompletenessBadges flags={flags} />

        <div className="grid gap-[19px]">
          {STRUCTURE_SECTIONS.map(([key, label, hint]) => (
            <div className="border-b border-[var(--color-border-hairline)] pb-[17px]" key={key}>
              <h3 className="mb-[7px] text-xs">{label}</h3>
              {structured[key]?.trim() ? (
                <p className="m-0 whitespace-pre-line text-[13px] leading-[1.55] text-[var(--color-body-fg)]">
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

        <details className="mt-6 border-t border-[var(--color-border-hairline)] pt-[18px]">
          <summary className="cursor-pointer text-xs font-bold text-[var(--color-muted-fg)]">
            Original capture (preserved as written)
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-[1.65] text-[#454d5f]">{experience.description}</p>
          {experience.impact && (
            <div className="mt-[22px] border-l-[3px] border-[#8a74f3] py-1.5 pl-[14px]">
              <p className="m-0 mb-1 text-[11px] font-bold text-[#6349d9]">WHY IT MATTERED</p>
              <span className="text-[13px] leading-[1.5] text-[#555c6d]">{experience.impact}</span>
            </div>
          )}
        </details>
      </div>

      <aside className="border-l border-[var(--color-border-panel)] pl-7 max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:pl-0 max-[900px]:pt-5">
        <h3 className="mb-[13px] text-xs">SKILLS & THEMES</h3>
        <div className="flex flex-wrap gap-[7px]">
          {experience.tags.length ? (
            experience.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
          ) : (
            <p className="m-0 text-xs italic text-[#a3a9b8]">Not added yet.</p>
          )}
        </div>

        <h3 className="mt-7 mb-[13px] text-xs">WHO WORKED ON THIS</h3>
        {experience.collaborators?.length ? (
          <div className="flex flex-wrap gap-[7px]">
            {experience.collaborators.map((person) => (
              <Badge key={person}>{person}</Badge>
            ))}
          </div>
        ) : (
          <p className="m-0 text-xs italic text-[#a3a9b8]">Not added yet.</p>
        )}

        <h3 className="mt-7 mb-[13px] text-xs">DETAILS</h3>
        {metadata.company || metadata.project || metadata.team || scopeEntries.length ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-[10px] gap-y-1">
            {metadata.company && (
              <>
                <dt className="text-[11px] font-semibold text-[var(--color-subtle-fg)]">Company</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata.company}</dd>
              </>
            )}
            {metadata.project && (
              <>
                <dt className="text-[11px] font-semibold text-[var(--color-subtle-fg)]">Project</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata.project}</dd>
              </>
            )}
            {metadata.team && (
              <>
                <dt className="text-[11px] font-semibold text-[var(--color-subtle-fg)]">Team</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata.team}</dd>
              </>
            )}
            {scopeEntries.map(([key, label]) => (
              <span className="contents" key={key}>
                <dt className="text-[11px] font-semibold text-[var(--color-subtle-fg)]">{label}</dt>
                <dd className="m-0 text-xs text-[#454d5f]">{metadata[key as keyof typeof metadata]}</dd>
              </span>
            ))}
          </dl>
        ) : (
          <p className="m-0 text-xs italic text-[#a3a9b8]">Not added yet.</p>
        )}

        <h3 className="mt-7 mb-[13px] text-xs">STRUCTURE</h3>
        <p className="mb-[18px] text-xs leading-[1.5] text-[var(--color-subtle-fg)]">
          {hasAnyStructure
            ? `${score}% complete — keep filling this in for stronger STAR stories later.`
            : "Add context, ownership, actions, and outcome to strengthen this story."}
        </p>
        <Button className="mb-[18px] w-full" onClick={onComplete}>
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
