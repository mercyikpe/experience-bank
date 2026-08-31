"use client"

import { useRouter } from "next/navigation"
import { useAppData } from "@/lib/app-data-context"
import { ProfileView } from "@/components/profile-view"

export default function ProfilePage() {
  const router = useRouter()
  const { profile, experiences } = useAppData()

  return (
    <ProfileView
      profile={profile}
      experiences={experiences}
      onEdit={() => router.push("/onboarding")}
      onSelectExperience={(id) => router.push(`/experience/${id}`)}
      onAddEntry={(company) => router.push(company.trim() ? `/?company=${encodeURIComponent(company.trim())}` : "/")}
    />
  )
}
