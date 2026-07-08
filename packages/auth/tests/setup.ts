/**
 * Auth test utilities
 *
 * Provides test auth instance with testUtils + organization plugins.
 * Import this in your tests instead of the production auth.
 */
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { organization, testUtils } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"
import { organizationPluginOptions } from "../src/auth"

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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Reset your password",
        react: templates.ResetPassword({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "reset-password" }],
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Verify your email",
        react: templates.VerifyEmail({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "verify-email" }],
      })
    },
  },
  plugins: [
    organization(organizationPluginOptions),
    testUtils(),
  ],
})

// Export types
export type TestHelpers = Awaited<ReturnType<typeof auth.$context>>["test"]
