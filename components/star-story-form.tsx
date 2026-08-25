"use client"

import { ArrowRight, RefreshCw, Sparkles } from "lucide-react"
import type { StarDraft, StarFields } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STAR_FIELDS: [keyof StarFields, string, string, string][] = [
  ["situation", "S", "Situation", "The context — what was going on, and what was at stake?"],
  ["task", "T", "Task", "What you were responsible for and the challenge you faced."],
  ["action", "A", "Action", "The specific decisions and steps you took."],
  ["result", "R", "Result", "What changed because of it — numbers help."],
]

export function StarStoryForm({
  draft,
  setDraft,
  themes,
  editing,
  hasGenerated,
  onSelectTheme,
  onRegenerate,
  onSave,
  onCancel,
}: {
  draft: StarDraft
  setDraft: (updater: (current: StarDraft) => StarDraft) => void
  themes: string[]
  editing: boolean
  hasGenerated: boolean
  onSelectTheme: (theme: string) => void
  onRegenerate: () => void
  onSave: (event: React.FormEvent) => void
  onCancel: () => void
}) {
  const setField = (key: keyof StarFields, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))

  return (
    <Card className="structure-card mx-2 mb-8 max-w-190 p-7">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-white">
          <Sparkles size={17} />
        </div>
        <div>
          <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
            STAR STORY
          </p>
          <h2 className="m-0 text-[17px] tracking-[-.02em]">
            {editing ? "Edit this STAR story" : "Generate a STAR story"}
          </h2>
        </div>
        <span className="ml-auto rounded-[20px] bg-(--color-success-bg) px-2.25 py-1.25 text-[10px] font-bold text-(--color-success-fg)">
          Draft
        </span>
      </div>
      <p className="my-5 text-[13px] leading-[1.45] text-(--color-muted-fg)">
        Pick the interview theme this story should lead with. We&apos;ll draft Situation / Task / Action /
        Result from what you&apos;ve already written — nothing here is final until you save it.
      </p>

      <div className="mb-6">
        <span className="mb-2 block text-xs font-bold">Interview theme</span>
        <div className="flex flex-wrap gap-1.75">
          {themes.map((theme) => (
            <button type="button" key={theme} onClick={() => onSelectTheme(theme)}>
              <Badge variant={draft.theme === theme ? "tag-selected" : "tag"} className="cursor-pointer">
                {theme}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {!draft.theme ? (
        <div>
          <div className="rounded-[10px] border border-dashed border-(--color-border-soft) px-4 py-6 text-center text-[13px] text-(--color-subtle-fg)">
            Choose a theme above to draft the story.
          </div>
          <div className="mt-4.5 flex justify-end border-t border-(--color-border-hairline) pt-4.5">
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSave}>
          <div className="mb-4 flex items-center justify-between border-t border-(--color-border-hairline) pt-4.5">
            <h3 className="m-0 text-xs tracking-[.06em] text-(--color-subtle-fg) uppercase">
              {hasGenerated ? "Edit the draft" : "Draft"}
            </h3>
            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1.25 border-0 bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
            >
              <RefreshCw size={12} />
              Regenerate from theme
            </button>
          </div>

          <div className="grid gap-4.25">
            {STAR_FIELDS.map(([key, letter, label, hint]) => (
              <label key={key} className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold">
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold text-white",
                      "bg-[linear-gradient(145deg,#7d67ff,#503bd8)]"
                    )}
                  >
                    {letter}
                  </span>
                  {label}
                </span>
                <Textarea
                  className="structure-area min-h-23.75"
                  value={draft[key]}
                  onChange={(event) => setField(key, event.target.value)}
                  placeholder={hint}
                />
              </label>
            ))}
          </div>

          <div className="mt-5.5 flex justify-end gap-2.25 border-t border-(--color-border-hairline) pt-4.5">
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {editing ? "Update story" : "Save STAR story"} <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
