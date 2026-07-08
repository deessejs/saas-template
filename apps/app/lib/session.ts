import { headers } from "next/headers"
import { auth } from "@workspace/auth"

/**
 * Read the current better-auth session from server-side request headers.
 *
 * Returns `null` when no valid session cookie is present (or when the session
 * has expired). Server components and server actions should `await` this and
 * handle the null case — the proxy.ts middleware already redirects unauth'd
 * users away from (protected) routes, so in practice this returns the user
 * object, but defensive callers should still check.
 *
 * Use this in server components (layouts, pages) and server actions.
 * For client components, use `authClient.useSession()` from
 * `@/lib/auth-client` instead.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}