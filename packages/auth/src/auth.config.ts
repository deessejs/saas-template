// Config for CLI - used only for schema generation
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { Pool } from "pg"

export const auth = betterAuth({
  // Same env var + fallback as runtime config (packages/auth/src/index.ts).
  // Without baseURL the CLI logs a warning and the generated schema can drift.
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(new Pool({ connectionString: process.env.DATABASE_URL }), {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Must match production config for correct schema generation
  experimental: {
    joins: true,
  },
}) as unknown as ReturnType<typeof betterAuth>
