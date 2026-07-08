"use client"

import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { clientEnv } from "@workspace/env/client"

// TS2883: the inferred type of authClient references internal better-auth types
// that are not portable. A cast through Parameters<> is necessary.
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
})
