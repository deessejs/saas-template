import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

// `@next/env` ships as CJS. Use createRequire for a reliable interop path
// that works from both ESM consumers and the generated CJS output, without
// relying on TypeScript's esModuleInterop shenanigans.
const require = createRequire(import.meta.url)
const { loadEnvConfig } = require("@next/env") as {
  loadEnvConfig: (
    projectDir: string,
    expand?: boolean,
  ) => { combinedEnv: Record<string, string | undefined>; loadedEnvFiles: unknown[] }
}

/**
 * Single-process guard. `loadEnvConfig` is idempotent in practice (it returns
 * the cached result on subsequent calls), but the flag avoids any surprise
 * when both the setupFile and a config file import the env module.
 */
let loaded = false

/**
 * Loads the repo-root .env files into process.env. Safe to call multiple times.
 *
 * - In Next.js apps, Next already calls `loadEnvConfig` at startup; this is a
 *   no-op equivalent.
 * - In drizzle-kit / better-auth CLI scripts, this is the only loader.
 * - In vitest, this runs once per process via the `setupFiles` entry.
 *
 * Precedence matches Next.js: `.env.local` > `.env.{NODE_ENV}` > `.env`.
 */
export function loadRepoEnv(): void {
  if (loaded) return

  // Walk up to the repo root (the dir that contains pnpm-workspace.yaml).
  // Works whether called from packages/*, apps/*, scripts/, or the root.
  const projectDir = process.cwd()
  const repoRoot = findRepoRoot(projectDir)
  loadEnvConfig(repoRoot, true)
  loaded = true
}

function findRepoRoot(start: string): string {
  let dir = path.resolve(start)
  const { root } = path.parse(dir)
  while (dir !== root) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir
    dir = path.dirname(dir)
  }
  return start
}
