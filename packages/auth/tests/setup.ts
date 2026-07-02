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

// Test database connection
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL!
const pool = postgres(testDatabaseUrl, { max: 1 })
const db = drizzle(pool)

// Test auth instance with testUtils
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
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
