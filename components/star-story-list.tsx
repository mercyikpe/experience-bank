"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import type { StarFields, StarStory } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const STAR_LABELS: [keyof StarFields, string, string][] = [
  ["situation", "S", "Situation"],
  ["task", "T", "Task"],
  ["action", "A", "Action"],
  ["result", "R", "Result"],
]

export function StarStoryList({
  stories,
  onCreate,
  onEdit,
  onDelete,
}: {
  stories: StarStory[]
  onCreate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="mt-6 border-t border-[var(--color-border-hairline)] pt-[18px]">
      <h3 className="m-0 mb-[15px] text-xs tracking-[.06em] text-[var(--color-subtle-fg)] uppercase">
        STAR stories {stories.length ? `(${stories.length})` : ""}
      </h3>

      {stories.length ? (
        <div className="grid gap-3">
          {stories.map((story) => (
            <details
              key={story.id}
              className="rounded-[10px] border border-[var(--color-border-hairline)] px-4 py-3 open:pb-4"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <Badge variant="info">{story.theme}</Badge>
                <span className="line-clamp-1 flex-1 text-[12px] text-[var(--color-subtle-fg)]">
                  {story.situation || "No situation drafted yet"}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onEdit(story.id)
                  }}
                  className="grid h-7 w-7 place-items-center rounded-[8px] text-[var(--color-subtle-fg)] hover:bg-[#f6f3ff] hover:text-[var(--color-accent)]"
                  aria-label={`Edit ${story.theme} STAR story`}
                >
                  <Pencil size={13} />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onDelete(story.id)
                  }}
                  className="grid h-7 w-7 place-items-center rounded-[8px] text-[var(--color-danger-fg)] hover:bg-[#fdf3f3]"
                  aria-label={`Delete ${story.theme} STAR story`}
                >
                  <Trash2 size={13} />
                </span>
              </summary>
              <div className="mt-3 grid gap-3 border-t border-[var(--color-border-hairline)] pt-3">
                {STAR_LABELS.map(([key, letter, label]) => (
                  <div key={key} className="flex gap-3">
                    <span className="grid h-5 w-5 flex-none place-items-center rounded-[6px] bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-[10px] font-bold text-white">
                      {letter}
                    </span>
                    <div>
                      <p className="m-0 mb-1 text-[11px] font-bold text-[var(--color-muted-fg)]">{label}</p>
                      <p className="m-0 whitespace-pre-line text-[13px] leading-[1.55] text-[var(--color-body-fg)]">
                        {story[key] || <span className="italic text-[#a3a9b8]">Not filled in yet.</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="m-0 text-[13px] italic text-[#a3a9b8]">
          No STAR stories yet — generate one to prep for interview themes like leadership or ownership.
        </p>
      )}

      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={onCreate}>
          <Plus size={14} />
          Generate STAR story
        </Button>
      </div>
    </div>
  )
}
