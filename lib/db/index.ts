import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// The direct Postgres connection string from your Supabase project
// (Project Settings → Database → Connection string → URI, "Transaction"
// pooler mode works fine). Falls back to a placeholder so `next build`
// doesn't fail before this is configured — any real query will error
// clearly until DATABASE_URL is set in .env.local.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/placeholder"

// `prepare: false` is required when connecting through Supabase's pooler
// (pgbouncer in transaction mode doesn't support prepared statements) and is
// harmless on a direct connection too.
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
