// Config for CLI - used only for schema generation
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { Pool } from "pg"

export const auth = betterAuth({
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
})
