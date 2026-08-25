"use client"

import { Search } from "lucide-react"
import { formatDate } from "@/lib/data"
import { getCompletenessColor } from "@/lib/completeness"
import type { Experience } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ExperienceBank({
  experiences,
  selectedId,
  setSelectedId,
  filters,
  activeFilter,
  setActiveFilter,
  search,
  setSearch,
  total,
}: {
  experiences: Experience[]
  selectedId: string | undefined
  setSelectedId: (id: string) => void
  filters: string[]
  activeFilter: string
  setActiveFilter: (tag: string) => void
  search: string
  setSearch: (value: string) => void
  total: number
}) {
  return (
    <Card className="bank-card overflow-hidden pt-6.5 pb-2.25" id="bank">
      <div className="flex items-center gap-3 px-6.25 pb-4.5">
        <div>
          <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
            YOUR LIBRARY
          </p>
          <h2 className="m-0 text-[17px] tracking-[-.02em]">Career Bank</h2>
        </div>
        <span className="ml-auto text-xs text-[#777f90]">{total} saved</span>
      </div>
      <div className="mx-6.25 mb-3.75 flex items-center rounded-lg border border-(--color-border-panel) px-2.5 text-[#8b93a4]">
        <Search size={15} />
        <input
          aria-label="Search experiences"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search experiences…"
          className="w-full border-0 bg-transparent py-2.75 pl-2 text-[13px] text-(--color-ink) outline-none placeholder:text-[#9299aa]"
        />
      </div>
      <div className="scroll-panel flex gap-3 overflow-auto border-b border-[#ececf2] px-6.25 pb-4 max-[600px]:grid max-[600px]:grid-flow-col max-[600px]:grid-rows-2">
        {filters.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={cn(
              "whitespace-nowrap border-0 bg-transparent px-0.5 pb-2.25 pt-1.5 text-[11px] font-semibold text-[#7d8495]",
              tag === activeFilter && "border-b-2 border-(--color-accent-4) text-[#5940dc]"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="scroll-panel max-h-114.25 overflow-auto">
        {experiences.length ? (
          experiences.map((item) => (
            <article
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "cursor-pointer border-b border-(--color-border-hairline) px-6.25 py-4.25 transition-colors hover:bg-[#faf9ff]",
                item.id === selectedId && "bg-[#faf9ff]"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.25 h-2 w-2 flex-none rounded-full"
                  style={{ background: getCompletenessColor(item) }}
                />
                <p className="m-0 text-[13px] font-bold">{item.title}</p>
                <time className="ml-auto whitespace-nowrap text-[10px] text-[#8a91a1]">
                  {formatDate(item.date)}
                </time>
              </div>
              <p className="my-1.25 ml-5 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-[1.4] text-[#777e8d]">
                {item.description}
              </p>
              <div className="ml-5 flex flex-wrap gap-1.25">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge variant="mini" key={tag}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="p-7 text-[13px] text-[#8991a1]">No experiences found. Try another search or tag.</p>
        )}
      </div>
    </Card>
  )
}
