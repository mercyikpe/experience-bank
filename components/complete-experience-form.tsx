"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import type { CompletionDraft } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const STORY_FIELDS: [keyof CompletionDraft, string, string][] = [
  ["situation", "Situation / context", "What was at stake?"],
  ["challenge", "Challenge", "What made this hard or important?"],
  ["role", "Your role", "What did you personally own?"],
  ["actions", "What you did", "What decisions or tradeoffs did you make?"],
  ["outcome", "Outcome / impact", "What changed because of your work? Include numbers if you have them."],
]

export function CompleteExperienceForm({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: CompletionDraft
  setDraft: (updater: (current: CompletionDraft) => CompletionDraft) => void
  onSave: (event: React.FormEvent) => void
  onCancel: () => void
}) {
  const setField = (key: keyof CompletionDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }))

  return (
    <Card className="structure-card mx-2 mb-8 max-w-190 p-7">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-white">
          <Sparkles size={17} />
        </div>
        <div>
          <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
            COMPLETE THIS EXPERIENCE
          </p>
          <h2 className="m-0 text-[17px] tracking-[-.02em]">Build the evidence behind your story</h2>
        </div>
        <span className="ml-auto rounded-[20px] bg-(--color-success-bg) px-2.25 py-1.25 text-[10px] font-bold text-(--color-success-fg)">
          Draft
        </span>
      </div>
      <p className="my-5 text-[13px] leading-[1.45] text-(--color-muted-fg)">
        Your original capture stays exactly as you wrote it — these answers make it easier to find, trust, and
        turn into interview material later.
      </p>
      <form onSubmit={onSave}>
        <h3 className="mt-0 mb-3.5 border-t-0 pt-0 text-xs tracking-[.06em] text-(--color-subtle-fg) uppercase">
          Tell the story
        </h3>
        {STORY_FIELDS.map(([key, label, hint]) => (
          <label key={key} className="mb-4.25 block">
            <span className="mb-2 block text-xs font-bold">{label}</span>
            <Textarea
              className="min-h-21.25"
              value={draft[key]}
              onChange={(event) => setField(key, event.target.value)}
              placeholder={hint}
            />
          </label>
        ))}

        <label className="mb-4.25 block">
          <span className="mb-2 block text-xs font-bold">
            Who did you work with? <em className="font-normal text-(--color-faint-fg)">Optional</em>
          </span>
          <Input
            value={draft.collaborators}
            onChange={(event) => setField("collaborators", event.target.value)}
            placeholder="e.g. Alex (Data Eng), Priya (PM), Sam (SRE)"
          />
        </label>

        <h3 className="mt-6.5 mb-3.5 border-t border-(--color-border-hairline) pt-4.5 text-xs tracking-[.06em] text-(--color-subtle-fg) uppercase">
          Add the details
        </h3>
        <div className="mb-4.25 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
          <label className="block">
            <span className="mb-2 block text-xs font-bold">
              Company <em className="font-normal text-(--color-faint-fg)">Optional</em>
            </span>
            <Input value={draft.company} onChange={(event) => setField("company", event.target.value)} placeholder="e.g. Acme Corp" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold">
              Project <em className="font-normal text-(--color-faint-fg)">Optional</em>
            </span>
            <Input value={draft.project} onChange={(event) => setField("project", event.target.value)} placeholder="e.g. Audience Engine" />
          </label>
        </div>
        <div className="mb-4.25 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
          <label className="block">
            <span className="mb-2 block text-xs font-bold">
              Team <em className="font-normal text-(--color-faint-fg)">Optional</em>
            </span>
            <Input value={draft.team} onChange={(event) => setField("team", event.target.value)} placeholder="e.g. Backend, Data Platform" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold">
              End date <em className="font-normal text-(--color-faint-fg)">Optional — if this ran over time</em>
            </span>
            <Input type="date" value={draft.dateEnd} onChange={(event) => setField("dateEnd", event.target.value)} />
          </label>
        </div>

        <div className="flex justify-between">
          <span className="mb-2 block text-xs font-bold">
            Scope <em className="font-normal text-(--color-faint-fg)">Optional</em>
          </span>
        </div>
        <div className="mb-4.25 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Users affected</span>
            <Input value={draft.scopeUsers} onChange={(event) => setField("scopeUsers", event.target.value)} placeholder="e.g. 500K monthly users" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Revenue / cost impact</span>
            <Input value={draft.scopeRevenue} onChange={(event) => setField("scopeRevenue", event.target.value)} placeholder="e.g. $12K/month saved" />
          </label>
        </div>
        <div className="mb-4.25 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Systems involved</span>
            <Input value={draft.scopeSystems} onChange={(event) => setField("scopeSystems", event.target.value)} placeholder="e.g. Audience Engine, Postgres" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Team size</span>
            <Input value={draft.scopeTeamSize} onChange={(event) => setField("scopeTeamSize", event.target.value)} placeholder="e.g. 6 engineers" />
          </label>
        </div>

        <div className="flex justify-end gap-2.25 border-t border-(--color-border-hairline) pt-4.5">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save details <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </Card>
  )
}
