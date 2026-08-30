# Backend setup (Supabase + Drizzle + Google sign-in)

Everything the app needs is already written — this is just the one-time setup
to point it at a real Supabase project. None of this runs until you do it.

## 1. Create the Supabase project

1. Go to https://supabase.com, create an account/org if needed, and create a
   new project. Pick any region close to you; note the database password you
   set (you'll need it for `DATABASE_URL` below).

## 2. Fill in your env vars

Copy the template and fill it in from the new project:

```
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project
  Settings → API.
- `DATABASE_URL` — Project Settings → Database → Connection string → URI
  (choose "Transaction pooler", port 6543 — Supabase's pooled connection,
  needed since serverless deploys can't hold direct Postgres connections
  open). Paste in the database password you set in step 1 where it says
  `[YOUR-PASSWORD]`.

`.env.local` is already git-ignored — it never gets committed.

## 3. Create the tables

With `DATABASE_URL` set, run:

```
npm run db:push
```

This reads `lib/db/schema.ts` and creates the `profiles`, `work_history_entries`,
`experiences`, and `star_stories` tables directly (it's a schema diff/push,
not a migration file — fine for a project at this stage). If you'd rather
apply it by hand, `drizzle/0000_blushing_gunslinger.sql` has the equivalent
SQL to paste into the Supabase SQL Editor instead.

## 4. Enable Row Level Security + the signup trigger

Open the Supabase SQL Editor and run everything in `supabase/setup.sql`. This
turns on Row Level Security (so, at the database level, nobody can read or
write another user's rows) and adds a trigger that creates an empty profile
row automatically the moment someone signs in for the first time.

## 5. Turn on Google sign-in

Two places need to agree with each other:

**Google Cloud Console** (https://console.cloud.google.com):
1. Create an OAuth 2.0 Client ID (APIs & Services → Credentials → Create
   Credentials → OAuth client ID → Web application).
   - Note: your `.gitignore` already has a line for a downloaded
     `client_secret_...apps.googleusercontent.com.json` file — if that's
     sitting somewhere on your machine from a previous attempt at this,
     you likely already have a client ID/secret and can skip straight to
     reusing it.
2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in your Supabase project URL).

**Supabase dashboard** (Authentication → Providers → Google):
1. Toggle it on.
2. Paste in the Client ID and Client Secret from Google Cloud.

## 6. Run it

```
npm run dev
```

Visit `/login` and sign in with Google. Middleware sends anyone unauthenticated
there automatically, so `/` now requires a session.

## What happens to data from before this was set up

If you'd already been using the app (data sitting in this browser's
localStorage from before sign-in existed), the first time a brand-new account
loads, it looks for that leftover local data and adopts it as that account's
data — pushing it to the server once and then leaving localStorage alone from
then on. A second browser, or clearing site data, will just show your real
synced data instead of starting over.

## Useful commands

- `npm run db:studio` — a local GUI (Drizzle Studio) for browsing/editing
  rows directly, handy while testing.
- `npm run db:generate` — regenerate the SQL migration file after changing
  `lib/db/schema.ts`.
