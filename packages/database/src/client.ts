import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { serverEnv } from "@workspace/env/server"
import * as schema from "./schema/index.js"

// Serverless-friendly defaults:
//   prepare: false  → required behind PgBouncer / Neon pooler (extended-query
//                     protocol incompatible with transaction-mode pooling).
//   max: 10         → cap per Lambda/worker. Tune to provider limits.
//   idle_timeout    → reap idle connections (0 = never, foot-gun in serverless).
//   max_lifetime    → recycle long-lived connections (0 = forever, foot-gun).
const pool = postgres(serverEnv.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

export const db = drizzle(pool, { schema })
