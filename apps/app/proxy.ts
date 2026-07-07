import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@workspace/auth"

export const config = {
  matcher: ["/home/:path*", "/settings/:path*"],
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/home") || pathname.startsWith("/settings")) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}
