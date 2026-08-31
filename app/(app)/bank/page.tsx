"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { useAppData } from "@/lib/app-data-context"
import { ExperienceBank } from "@/components/experience-bank"
import { Button } from "@/components/ui/button"

export default function BankPage() {
  const router = useRouter()
  const { experiences, profile, nudgeDismissed, dismissNudge } = useAppData()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

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

  return (
    <section className="mx-2 grid grid-cols-1" aria-label="Experience capture workspace">
      {!profile.workHistory.length && !nudgeDismissed && (
        <div className="mb-4 md:flex items-center gap-3 rounded-xl border border-(--color-tag-border) bg-(--color-tag-bg) px-4 py-3">
          <p className="m-0 flex-1 text-[13px] text-(--color-tag-fg)">
            Add your work history so entries can be matched to where they happened — e.g. a story about
            a security audit automatically linked to your time at that company.
          </p>
          <div className="mt-4 flex justify-between align-items-center md:flex-none md:mt-0">
            <Button size="sm" onClick={() => router.push("/onboarding")}>
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
        selectedId={undefined}
        setSelectedId={(id) => router.push(`/experience/${id}`)}
        filters={filters}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        search={search}
        setSearch={setSearch}
        total={experiences.length}
      />
    </section>
  )
}
