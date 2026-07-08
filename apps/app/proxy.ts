import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@workspace/auth"

// Session type extended with activeOrganizationId from the organization plugin.
// The plugin adds this field to the session at runtime; the base Session type
// from better-auth does not include it, so we need to extend it here.
type SessionWithOrg = {
  activeOrganizationId?: string | null | undefined
  [key: string]: unknown
}

const PROTECTED_PREFIXES = [
  "/home",
  "/settings",
  "/onboarding",
  "/accept-invitation",
]
const AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]

export const config = {
  // Single matcher covering both directions of the auth gate.
  matcher: [
    "/home/:path*",
    "/settings/:path*",
    "/onboarding",
    "/accept-invitation",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  // Only call getSession when the route actually needs the gate decision.
  // Avoids a DB roundtrip on every static asset or unrelated request.
  if (!isProtected && !isAuthPage) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (isProtected && !session?.session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // After signup, databaseHooks auto-create an org and set activeOrganizationId.
  // Legacy sessions (pre-migration) have null — bounce them to /onboarding.
  // /accept-invitation is excluded: an invited user without an org must reach it.
  if (
    session?.session &&
    !(session.session as unknown as SessionWithOrg).activeOrganizationId &&
    pathname !== "/accept-invitation" &&
    !pathname.startsWith("/accept-invitation/")
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  if (isAuthPage && session?.session) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}