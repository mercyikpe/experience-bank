"use client"

// Cross-route app state: `experiences` and `profile`, seeded server-side
// by app/(app)/layout.tsx and shared here so routes don't refetch on
// every navigation. Screen-local state (drafts) stays in the page that
// owns it.

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { syncExperiences, syncProfile } from "@/lib/actions/data"
import type { Experience, UserProfile } from "@/lib/types"

const STORAGE_KEY = "experience-bank-items"
const PROFILE_STORAGE_KEY = "career-bank-profile"

type AppDataContextValue = {
  experiences: Experience[]
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>
  profile: UserProfile
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>
  avatarUrl: string | null
  nudgeDismissed: boolean
  dismissNudge: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({
  initialExperiences,
  initialProfile,
  initialAvatarUrl,
  isNewAccount,
  children,
}: {
  initialExperiences: Experience[]
  initialProfile: UserProfile
  initialAvatarUrl: string | null
  isNewAccount: boolean
  children: React.ReactNode
}) {
  const [experiences, setExperiences] = useState(initialExperiences)
  const [profile, setProfile] = useState(initialProfile)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)

  // Skip each sync effect's first run — the data just came from the
  // server, already in sync.
  const skipExperiencesSync = useRef(true)
  const skipProfileSync = useRef(true)

  useEffect(() => {
    if (skipExperiencesSync.current) {
      skipExperiencesSync.current = false
      return
    }
    syncExperiences(experiences).catch(() => toast("Couldn't save — check your connection"))
  }, [experiences])

  useEffect(() => {
    if (skipProfileSync.current) {
      skipProfileSync.current = false
      return
    }
    syncProfile(profile).catch(() => toast("Couldn't save your profile — check your connection"))
  }, [profile])

  // One-time migration for a brand-new account: adopt localStorage data
  // from before signing in. Client-only, so it can't happen in the
  // server layout — and runs after the sync effects above so their
  // skip-first-run flags have already flipped.
  useEffect(() => {
    if (!isNewAccount) return
    const storedExperiences = window.localStorage.getItem(STORAGE_KEY)
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    const localExperiences = storedExperiences ? (JSON.parse(storedExperiences) as Experience[]) : null
    const localProfile = storedProfile ? (JSON.parse(storedProfile) as UserProfile) : null
    if (!localExperiences && !localProfile) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only migration off browser storage, not derived render state
    if (localExperiences) setExperiences(localExperiences)
    if (localProfile) setProfile(localProfile)
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(PROFILE_STORAGE_KEY)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, deliberately
  }, [])

  return (
    <AppDataContext.Provider
      value={{
        experiences,
        setExperiences,
        profile,
        setProfile,
        avatarUrl: initialAvatarUrl,
        nudgeDismissed,
        dismissNudge: () => setNudgeDismissed(true),
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider")
  return ctx
}
