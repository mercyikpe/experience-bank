"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppData } from "@/lib/app-data-context"
import { CaptureScreen } from "@/components/screens/capture-screen"

export default function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { experiences } = useAppData()
  const experience = experiences.find((item) => item.id === id)

  // A stale/bad link — nothing to edit, so send them somewhere real
  // instead of rendering a form bound to nothing. useEffect rather than a
  // render-time redirect() call, which next/navigation doesn't support
  // from inside a Client Component's render.
  useEffect(() => {
    if (!experience) router.replace("/bank")
  }, [experience, router])

  if (!experience) return null

  return <CaptureScreen editingExperience={experience} />
}
