import { api, rpcHandler } from "@workspace/api"

// Force dynamic — this route imports the DB client which reads DATABASE_URL
// at module load. Next.js build-time page-data collection would crash without
// the env var; marking it dynamic defers evaluation to request time.
export const dynamic = "force-dynamic"

// Hono routes /auth/* (better-auth) and /rpc/* (oRPC) internally.
async function handleRequest(request: Request): Promise<Response> {
  // /auth/* → better-auth handler
  if (request.url.includes("/auth/")) {
    return api.fetch(request)
  }

  // /rpc/* → oRPC handler
  if (request.url.includes("/rpc/")) {
    const { response } = await rpcHandler.handle(request, {
      prefix: "/rpc",
      context: { headers: request.headers },
    })
    return response ?? new Response("Not found", { status: 404 })
  }

  // /health and /ready are handled by Hono's fetch
  return api.fetch(request)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = handleRequest as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = handleRequest as any
