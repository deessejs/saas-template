import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { auth } from "@workspace/auth"
import { RPCHandler } from "@orpc/server/fetch"
import { appRouter } from "./router/index.js"

const api = new Hono()

// CORS middleware (single source of truth)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000", "http://localhost:3001"]
api.use("*", cors({ origin: allowedOrigins, credentials: true }))

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

// Mount better-auth on /api/auth/*
api.on(["POST", "GET"], "/api/auth/*", (c) => {
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

export default api
