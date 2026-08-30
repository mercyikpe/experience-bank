import { createBrowserClient } from "@supabase/ssr"

// Client-side Supabase client — safe to use in "use client" components.
// Reads the public URL/anon key, which are meant to be exposed to the browser
// (data access is still gated by Postgres Row Level Security, not by this key
// being secret).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
