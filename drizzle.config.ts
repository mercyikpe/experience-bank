import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Never let drizzle-kit generate/push touch Supabase's own `auth` schema —
  // we only reference auth.users for a foreign key, we don't own that table.
  schemaFilter: ["public"],
})
