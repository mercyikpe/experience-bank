// Auth gate + server-side data fetch for every route in the app — the
// data is already in the initial HTML, so there's no client-side loading
// flash on reload, and a real redirect for anyone not signed in.

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getInitialData, syncExperiences, syncProfile } from "@/lib/actions/data"
import { blankProfile, starterExperiences } from "@/lib/data"
import { AppDataProvider } from "@/lib/app-data-context"
import { AppShell } from "@/components/app-shell"
import type { Experience, UserProfile } from "@/lib/types"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { experiences: serverExperiences, profile: serverProfile, isNewAccount, avatarUrl } = await getInitialData()

  // A brand-new account starts from the starter demo content; any
  // pre-login localStorage data gets swapped in client-side by
  // AppDataProvider.
  let initialExperiences: Experience[] = serverExperiences
  let initialProfile: UserProfile = serverProfile
  if (isNewAccount) {
    initialExperiences = starterExperiences
    initialProfile = blankProfile
    // Persist the starter row now so it isn't silently re-created on reload.
    await Promise.all([syncExperiences(initialExperiences), syncProfile(initialProfile)])
  }

  return (
    <AppDataProvider
      initialExperiences={initialExperiences}
      initialProfile={initialProfile}
      initialAvatarUrl={avatarUrl}
      isNewAccount={isNewAccount}
    >
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  )
}
