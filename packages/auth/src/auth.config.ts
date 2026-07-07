// Config for CLI - used only for schema generation
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { Pool } from "pg"
import { serverEnv } from "@workspace/env/server"

export const auth = betterAuth({
  // Env values come from the same validated schema as the runtime config
  // (packages/auth/src/index.ts), so generated schema cannot drift from
  // production.
  baseURL: serverEnv.BETTER_AUTH_URL,
  database: drizzleAdapter(new Pool({ connectionString: serverEnv.DATABASE_URL }), {
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
