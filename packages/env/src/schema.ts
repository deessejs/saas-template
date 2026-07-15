import { z } from "zod"

/**
 * Server-side env contract.
 *
 * Required in every runtime that imports `@workspace/env/server`:
 *   - DATABASE_URL          Postgres connection string
 *   - BETTER_AUTH_SECRET    >=32 chars. Generate: openssl rand -base64 32
 *
 * Optional (defaults shown):
 *   - NODE_ENV              "development" | "test" | "production"
 *   - TEST_DATABASE_URL     Falls back to DATABASE_URL when unset
 *   - BETTER_AUTH_URL       Defaults to http://localhost:3000
 *   - AUTH_SECRET           Alias for BETTER_AUTH_SECRET (resolved at the
 *                           package boundary, so call sites only see the
 *                           resolved value)
 *   - ALLOWED_ORIGINS       CSV. Defaults to localhost dev origins.
 */

const csv = z
  .string()
  .transform((s) => s.split(",").map((p) => p.trim()).filter(Boolean))

export const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "Run: openssl rand -base64 32 (>= 32 chars required)"),
  AUTH_SECRET: z.string().min(32).optional(),
  ALLOWED_ORIGINS: csv.default([]),

  // Mailer — Resend (prod)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .email()
    .default("onboarding@resend.dev"),
  RESEND_FROM_NAME: z.string().min(1).default("SaaS Template"),

  // Mailer — transport selector
  //   "console" (default) → logs to stdout, zero infrastructure
  //   "resend"            → production, uses RESEND_API_KEY
  MAIL_TRANSPORT: z
    .enum(["console", "resend"])
    .default("console"),
})

/**
 * Client-side env contract. Only NEXT_PUBLIC_* values, safe to bundle to the
 * browser. Values are inlined at build time by the bundler.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("SaaS Template"),
  NEXT_PUBLIC_APP_DESCRIPTION: z
    .string()
    .min(1)
    .default("SaaS application built with Next.js and shared UI components"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
})

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>
