import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"

export const auth = betterAuth({
  // Security: always set explicitly
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.ALLOWED_ORIGINS?.split(",") ?? []),
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
