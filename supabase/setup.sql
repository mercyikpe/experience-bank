-- Run this in the Supabase SQL Editor AFTER applying the Drizzle migration
-- (drizzle/0000_blushing_gunslinger.sql — via `npm run db:push` or by pasting
-- it in first). This file adds everything Drizzle doesn't manage: Row Level
-- Security, and the trigger that provisions a profile row on signup.
--
-- Idempotent: safe to run again if it fails partway or you need to re-apply
-- it (e.g. after resetting the database) — every create is preceded by a
-- drop/replace so re-running never hits "already exists" errors.

-- ── Row Level Security ──────────────────────────────────────────────────
-- Every table is scoped to the signed-in user. Without these policies, RLS
-- being *enabled* with zero policies means "nobody can read or write
-- anything" (safe default) — these policies are what actually let each user
-- see and change their own rows, and only their own.

alter table public.profiles enable row level security;
alter table public.work_history_entries enable row level security;
alter table public.experiences enable row level security;
alter table public.star_stories enable row level security;

drop policy if exists "profiles: owner full access" on public.profiles;
create policy "profiles: owner full access"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "work_history_entries: owner full access" on public.work_history_entries;
create policy "work_history_entries: owner full access"
  on public.work_history_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "experiences: owner full access" on public.experiences;
create policy "experiences: owner full access"
  on public.experiences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "star_stories: owner full access" on public.star_stories;
create policy "star_stories: owner full access"
  on public.star_stories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Auto-provision a profile row on signup ──────────────────────────────
-- Fires after Supabase Auth creates a new auth.users row (i.e. right after
-- someone signs in with Google for the first time) and inserts a matching,
-- initially-empty profiles row — so app code never has to special-case
-- "does this user have a profile yet?".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Keep updated_at current ─────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_experiences_updated_at on public.experiences;
create trigger set_experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

drop trigger if exists set_star_stories_updated_at on public.star_stories;
create trigger set_star_stories_updated_at
  before update on public.star_stories
  for each row execute function public.set_updated_at();
