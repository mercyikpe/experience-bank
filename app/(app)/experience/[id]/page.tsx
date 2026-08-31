"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppData } from "@/lib/app-data-context"
import { ExperienceDetail } from "@/components/experience-detail"
import { toast } from "sonner"

export default function ExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { experiences, setExperiences } = useAppData()
  const selected = experiences.find((item) => item.id === id)

  useEffect(() => {
    if (!selected) router.replace("/bank")
  }, [selected, router])

  const removeExperience = () => {
    if (!selected) return
    setExperiences((current) => current.filter((item) => item.id !== selected.id))
    toast("Experience deleted")
    router.push("/bank")
  }

  // Lets someone fix a wrong/missing AI company match from the detail
  // view; clears the "AI guessed this" flag since editing confirms it.
  const updateCompany = (company: string) => {
    if (!selected) return
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selected.id
          ? item
          : {
            ...item,
            metadata: { ...item.metadata, company },
            aiSuggestedFields: (item.aiSuggestedFields || []).filter((field) => field !== "company"),
          }
      )
    )
    toast("Company updated")
  }

  // "Yes, that's right" on the AI company-match prompt — clears the
  // unconfirmed flag but leaves the value untouched.
  const confirmCompany = () => {
    if (!selected) return
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selected.id
          ? item
          : { ...item, aiSuggestedFields: (item.aiSuggestedFields || []).filter((field) => field !== "company") }
      )
    )
    toast("Got it — company confirmed")
  }

  const deleteStarStory = (storyId: string) => {
    if (!selected) return
    setExperiences((current) =>
      current.map((item) =>
        item.id !== selected.id ? item : { ...item, starStories: (item.starStories || []).filter((story) => story.id !== storyId) }
      )
    )
    toast("STAR story deleted")
  }

  if (!selected) return null

  return (
    <div className="mx-2 max-w-240">
      <ExperienceDetail
        experience={selected}
        onEdit={() => router.push(`/experience/${selected.id}/edit`)}
        onDelete={removeExperience}
        onComplete={() => router.push(`/experience/${selected.id}/complete`)}
        onCreateStar={() => router.push(`/experience/${selected.id}/star`)}
        onEditStar={(storyId) => router.push(`/experience/${selected.id}/star/${storyId}`)}
        onDeleteStar={deleteStarStory}
        onUpdateCompany={updateCompany}
        onConfirmCompany={confirmCompany}
      />
    </div>
  )
}
