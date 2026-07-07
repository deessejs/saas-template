import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"
import { serverEnv } from "@workspace/env/server"

export const auth = betterAuth({
  // Env values come from the validated @workspace/env/server schema.
  // Aliases (AUTH_SECRET) and fallbacks (BETTER_AUTH_URL) are resolved at
  // the env-package boundary, so call sites only see canonical values.
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    ...serverEnv.ALLOWED_ORIGINS,
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  advanced: {
    useSecureCookies: true,
  },

  experimental: {
    joins: true,
  },

  plugins: [nextCookies()],
}) as unknown as ReturnType<typeof betterAuth>

// Type exports for consumers
export type AuthInstance = typeof auth
export type { Session, User } from "better-auth"
