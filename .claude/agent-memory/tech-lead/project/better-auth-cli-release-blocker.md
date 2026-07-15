---
name: better-auth-cli-release-blocker
description: 2026-07-13 release blocker: Better Auth runtime and Drizzle adapter are 1.6.23 while the schema generator still uses legacy @better-auth/cli 1.4.21
metadata:
  type: project
---

The template's documented `pnpm auth:generate` path is release-blocked because the application uses `better-auth@1.6.23` and `@better-auth/drizzle-adapter@1.6.23`, while `packages/auth` still invokes legacy `@better-auth/cli@1.4.21`.

**Why:** Better Auth changed its CLI package and database export layout after 1.4. Upstream warns that the old CLI can produce unexpected behavior with Better Auth `>=1.5`. The template asks every new user to generate and push the auth schema before starting development, so mismatched code generation can break onboarding or create schema/runtime drift.

**How to apply:** Do not run or recommend the current generator as safe. Align runtime, adapter, and supported `auth` CLI to one reviewed release line, generate into a temporary path in an isolated worktree, inspect the schema and SQL diff, then run auth integration tests against disposable PostgreSQL. Full evidence and acceptance criteria: `temp/issues/P0-001-better-auth-cli-runtime-version-mismatch.md`.

Related: [[packages-auth]], [[verify-high-severity-findings]], [[feedback-long-term-solutions]].
