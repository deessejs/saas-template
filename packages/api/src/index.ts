import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { auth } from "@workspace/auth"
import { RPCHandler } from "@orpc/server/fetch"
import { serverEnv } from "@workspace/env/server"
import { appRouter } from "./router/index.js"

// Catch-all is mounted at /api/[[...route]] in apps/app, so all incoming
// requests have an /api prefix. basePath('/api') makes Hono match those
// patterns correctly without changing the route definitions below.
const api = new Hono().basePath("/api")

// CORS middleware (single source of truth, validated at the env-package boundary)
api.use(
  "*",
  cors({ origin: serverEnv.ALLOWED_ORIGINS, credentials: true }),
)

// Logging middleware
api.use("*", logger())

// Health check
api.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
api.get("/ready", async (c) => {
  try {
    return c.json({ status: "ready" })
  } catch {
    return c.json({ status: "not ready" }, 503)
  }
})

// Mount better-auth on /auth/*
api.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw)
})

// Mount oRPC on /rpc/*
const rpcHandler = new RPCHandler(appRouter)

api.on(["POST", "GET"], "/rpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: { headers: c.req.raw.headers },
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }

  return c.json({ error: "Not found" }, 404)
})

// Named exports for Next.js integration
export { api }
export { rpcHandler }

// Re-export types and router for client usage
export { appRouter } from "./router/index.js"
