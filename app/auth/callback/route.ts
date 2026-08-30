import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Google redirects back here with a `code` after the person approves
// sign-in; we exchange it for a Supabase session (sets the auth cookies)
// and send them on into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
