"use client"

import { ArrowRight, Briefcase, Pencil, Plus, Sparkles } from "lucide-react"
import { formatDate } from "@/lib/data"
import { initials } from "@/lib/utils"
import type { Experience, UserProfile, WorkHistoryEntry } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"

const normalize = (value: string) => value.trim().toLowerCase()

function roleDateRange(row: WorkHistoryEntry) {
  const start = row.startDate ? formatDate(row.startDate) : "No start date"
  const end = row.endDate === null ? "Present" : row.endDate ? formatDate(row.endDate) : "No end date"
  return `${start} – ${end}`
}

function RoleCard({
  row,
  entries,
  onSelectExperience,
  onAddEntry,
}: {
  row: WorkHistoryEntry
  entries: Experience[]
  onSelectExperience: (id: string) => void
  onAddEntry: (company: string) => void
}) {
  return (
    <div className="rounded-xl border border-(--color-border-hairline) p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[15px] font-semibold tracking-[-.01em]">{row.company || "Untitled company"}</p>
          <p className="m-0 mt-0.75 text-[13px] text-(--color-muted-fg)">{row.title || "No title added"}</p>
        </div>
        <span className="mt-0.5 text-[11px] font-semibold text-(--color-subtle-fg)">{roleDateRange(row)}</span>
      </div>

      <div className="mt-3 border-t border-(--color-border-hairline) pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="m-0 text-[11px] font-bold tracking-[.06em] text-(--color-subtle-fg) uppercase">
            Entries from {row.company || "this role"}
          </p>
          <button
            type="button"
            onClick={() => onAddEntry(row.company)}
            className="flex flex-none items-center gap-1 border-0 bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
          >
            <Plus size={12} />
            Add entry
          </button>
        </div>
        {entries.length ? (
          <div className="grid gap-1.5">
            {entries.map((experience) => (
              <button
                type="button"
                key={experience.id}
                onClick={() => onSelectExperience(experience.id)}
                className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-(--color-body-fg) transition-colors hover:bg-(--color-tag-bg)"
              >
                <span className="block truncate">{experience.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="m-0 text-[12px] italic text-[#a3a9b8]">
            No entries linked yet — captures mentioning {row.company || "this company"} (or dated within this role) will show up here.
          </p>
        )}
      </div>
    </div>
  )
}

export function ProfileView({
  profile,
  experiences,
  onEdit,
  onSelectExperience,
  onAddEntry,
}: {
  profile: UserProfile
  experiences: Experience[]
  onEdit: () => void
  onSelectExperience: (id: string) => void
  onAddEntry: (company: string) => void
}) {
  const hasProfile = Boolean(profile.name || profile.currentRole || profile.workHistory.length)

  if (!hasProfile) {
    return (
      <Card className="structure-card mx-2 p-9 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-white">
          <Briefcase size={19} />
        </div>
        <h2 className="mt-4 mb-2 text-lg tracking-[-.02em]">Set up your profile</h2>
        <p className="mx-auto mb-5 max-w-105 text-[13px] leading-normal text-(--color-muted-fg)">
          Add your name and work history so Career Bank can connect what you capture to where it happened — like
          matching a story about a security audit to your time at a specific company.
        </p>
        <Button onClick={onEdit} className="mx-auto">
          Add your work info <ArrowRight size={15} />
        </Button>
        <form action={signOut} className="mt-4">
          <button type="submit" className="text-[12px] font-semibold text-(--color-faint-fg) hover:text-(--color-subtle-fg)">
            Sign out
          </button>
        </form>
      </Card>
    )
  }

  const unlinkedCount = experiences.filter((experience) => !experience.metadata?.company?.trim()).length

  return (
    <div className="mx-2 grid gap-5">
      <Card className="structure-card p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-13 w-13 flex-none place-items-center rounded-full border-2 border-[#f8ddc8] bg-[#f3b98b] text-[15px] font-semibold text-[#402e27]">
              {initials(profile.name || "?")}
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">YOUR PROFILE</p>
              <h1 className="m-0 text-xl tracking-[-.02em]">{profile.name || "Add your name"}</h1>
              <p className="m-0 mt-1 text-[13px] text-(--color-muted-fg)">
                {profile.currentRole || "No current role added yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil size={14} />
              Edit profile
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </Card>

      <Card className="structure-card p-7">
        <div className="mb-4 md:flex items-center justify-between">
          <h3 className="m-0 text-sm tracking-[.06em] font-bold uppercase">Work history</h3>
          {unlinkedCount > 0 && (
            <span className="flex items-center gap-1.25 text-[11px] text-(--color-faint-fg)">
              <Sparkles size={11} />
              {unlinkedCount} {unlinkedCount === 1 ? "entry isn't" : "entries aren't"} linked to a company yet
            </span>
          )}
        </div>

        {profile.workHistory.length ? (
          <div className="grid gap-3">
            {profile.workHistory.map((row) => (
              <RoleCard
                key={row.id}
                row={row}
                entries={experiences.filter(
                  (experience) => row.company.trim() && normalize(experience.metadata?.company || "") === normalize(row.company)
                )}
                onSelectExperience={onSelectExperience}
                onAddEntry={onAddEntry}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-(--color-border-soft) px-4 py-6 text-center text-[13px] text-(--color-subtle-fg)">
            No work history yet - add a role so entries you capture can be matched to where they happened.
          </div>
        )}
      </Card>
    </div>
  )
}
