// Shared app configuration — used by all apps in the workspace.
// Override values with NEXT_PUBLIC_* env vars in .env or .env.local.

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "SaaS Template",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "SaaS application built with Next.js and shared UI components",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    home: "/",
    login: "/login",
    signup: "/signup",
    settings: "/settings",
  },
} as const

// Convenience exports
export const APP_NAME = APP_CONFIG.name
export const APP_URL = APP_CONFIG.url

export type AppConfig = typeof APP_CONFIG
