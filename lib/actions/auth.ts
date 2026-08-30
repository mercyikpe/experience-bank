"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function resolveOrigin() {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https")
  return `${protocol}://${host}`
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = await resolveOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        // Forces Google's account chooser instead of silently reusing
        // whichever Google session happens to be active in the browser.
        prompt: "select_account",
      },
    },
  })

  if (error || !data.url) {
    redirect("/auth/auth-code-error")
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
