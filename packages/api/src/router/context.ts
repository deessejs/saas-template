import { os } from "@orpc/server"
import type { Session, User } from "better-auth"

// Context with request headers
export interface BaseContext {
  headers: Headers
}

// Auth context with session/user
export interface AuthContext extends BaseContext {
  session: Session
  user: User
}

// Base procedure with headers
export const base = os.$context<BaseContext>()
