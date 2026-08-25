"use client"

import { ArrowRight, Plus, Sparkles, Trash2 } from "lucide-react"
import type { UserProfile, WorkHistoryEntry } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function OnboardingForm({
  draft,
  setField,
  addRow,
  updateRow,
  removeRow,
  onSave,
  onCancel,
}: {
  draft: UserProfile
  setField: (field: "name" | "currentRole", value: string) => void
  addRow: () => void
  updateRow: (id: string, field: keyof WorkHistoryEntry, value: string | null) => void
  removeRow: (id: string) => void
  onSave: (event: React.FormEvent) => void
  onCancel: () => void
}) {
  return (
    <Card className="structure-card mx-2 mb-8 max-w-190 p-7">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-white">
          <Sparkles size={17} />
        </div>
        <div>
          <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
            YOUR PROFILE
          </p>
          <h2 className="m-0 text-[17px] tracking-[-.02em]">Tell us about your work</h2>
        </div>
      </div>
      <p className="my-5 text-[13px] leading-[1.45] text-(--color-muted-fg)">
        This is optional, but it&apos;s what lets Career Bank connect what you capture to where it happened —
        like knowing a story about a security audit belongs to your time at a specific company. Skip it
        now and add it whenever you like.
      </p>

      <form onSubmit={onSave}>
        <h3 className="mt-0 mb-3.5 border-t-0 pt-0 text-xs tracking-[.06em] text-(--color-subtle-fg) uppercase">
          About you
        </h3>
        <div className="mb-4.25 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Name</span>
            <Input value={draft.name} onChange={(event) => setField("name", event.target.value)} placeholder="e.g. Jordan Lee" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold">Current role</span>
            <Input
              value={draft.currentRole}
              onChange={(event) => setField("currentRole", event.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
          </label>
        </div>

        <h3 className="mt-6.5 mb-3.5 border-t border-(--color-border-hairline) pt-4.5 text-xs tracking-[.06em] text-(--color-subtle-fg) uppercase">
          Work history
        </h3>

        {draft.workHistory.length ? (
          <div className="mb-4.25 grid gap-4">
            {draft.workHistory.map((row, index) => (
              <div
                key={row.id}
                className="rounded-[10px] border border-(--color-border-hairline) p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-(--color-subtle-fg)">ROLE {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove this role"
                    className="grid h-7 w-7 place-items-center rounded-lg text-(--color-danger-fg) hover:bg-[#fdf3f3]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">Company</span>
                    <Input
                      value={row.company}
                      onChange={(event) => updateRow(row.id, "company", event.target.value)}
                      placeholder="e.g. Shopify"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">Title</span>
                    <Input
                      value={row.title}
                      onChange={(event) => updateRow(row.id, "title", event.target.value)}
                      placeholder="e.g. Backend Engineer"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold">Start date</span>
                    <Input
                      type="date"
                      value={row.startDate}
                      onChange={(event) => updateRow(row.id, "startDate", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center justify-between text-xs font-bold">
                      <span>End date</span>
                      <span className="flex items-center gap-1.5 text-[11px] font-normal text-(--color-muted-fg)">
                        <input
                          type="checkbox"
                          checked={row.endDate === null}
                          onChange={(event) => updateRow(row.id, "endDate", event.target.checked ? null : "")}
                          className="h-3 w-3"
                        />
                        I currently work here
                      </span>
                    </span>
                    <Input
                      type="date"
                      value={row.endDate ?? ""}
                      disabled={row.endDate === null}
                      onChange={(event) => updateRow(row.id, "endDate", event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4.25 rounded-[10px] border border-dashed border-(--color-border-soft) px-4 py-6 text-center text-[13px] text-(--color-subtle-fg)">
            No work history yet — add a role so entries you capture can be matched to where they happened.
          </div>
        )}

        <button
          type="button"
          onClick={addRow}
          className="mb-4.25 flex items-center gap-1.25 border-0 bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
        >
          <Plus size={12} />
          Add another role
        </button>

        <div className="flex justify-end gap-2.25 border-t border-(--color-border-hairline) pt-4.5">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save profile <ArrowRight size={15} />
          </Button>
        </div>
      </form>
    </Card>
  )
}
