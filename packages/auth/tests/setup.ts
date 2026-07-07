/**
 * Auth test utilities
 *
 * Provides test auth instance with testUtils plugin.
 * Import this in your tests instead of the production auth.
 */
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { testUtils } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"

// Test database connection
const pool = postgres(serverEnv.TEST_DATABASE_URL, { max: 1 })
const db = drizzle(pool)

// Test auth instance with testUtils
export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    testUtils(),
  ],
})

// Export types
export type TestHelpers = Awaited<ReturnType<typeof auth.$context>>["test"]
