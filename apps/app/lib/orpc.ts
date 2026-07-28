import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { appRouter } from "@workspace/api/router"

// Catch-all is mounted at /api/[[...route]] in apps/app/app/api/[[...route]]/route.ts,
// and Hono is configured with basePath('/api') in packages/api/src/index.ts:41.
// Internal Hono routes are still defined as '/rpc/*' (and the RPCHandler uses
// `prefix: '/rpc'`), so the client URL must include the /api prefix or every
// request 404s at the Next.js catch-all before reaching Hono.
const link = new RPCLink({
  url: "/api/rpc",
})

// Type the client with the router
export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)
