import { ORPCError } from "@orpc/server"
import { auth } from "@workspace/auth"
import { base } from "../context.js"
import type { AuthContext } from "../context.js"

// Auth middleware - adds session and user to context
export const authMiddleware = base.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers })

  if (!session?.session || !session?.user) {
    // Throw using plain Error for simplicity - oRPC will handle it
    throw new Error("Authentication required")
  }

  return next({
    context: {
      ...context,
      session: session.session,
      user: session.user,
    } as AuthContext,
  })
})
