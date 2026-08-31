"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppData } from "@/lib/app-data-context"
import { StarScreen } from "@/components/screens/star-screen"

export default function EditStarPage({ params }: { params: Promise<{ id: string; storyId: string }> }) {
  const { id, storyId } = use(params)
  const router = useRouter()
  const { experiences } = useAppData()
  const experience = experiences.find((item) => item.id === id)

  useEffect(() => {
    if (!experience) router.replace("/bank")
  }, [experience, router])

  if (!experience) return null

  return <StarScreen experience={experience} editingStoryId={storyId} />
}
