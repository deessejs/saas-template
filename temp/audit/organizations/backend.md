# Auth + `organization` Plugin — Backend Analysis

**Date:** 2026-07-07
**Scope:** `packages/auth`, `packages/database`, `packages/api` (the server-side packages). The companion document `frontend.md` covers `apps/app`.
**Method:** Read-only analysis of the repo + official better-auth documentation research via `fresh` (better-auth.com + the official `better-auth/skills` GitHub repo). No code was modified.

---

## Outline

- [1. Executive summary](#1-executive-summary)
- [2. State of the stack (read-only findings)](#2-state-of-the-stack-read-only-findings)
  - [2.1 `packages/auth`](#21-packagesauth)
  - [2.2 `packages/database`](#22-packagesdatabase)
  - [2.3 `packages/api`](#23-packagesapi)
- [3. Better-auth `organization` plugin — server-side view](#3-better-auth-organization-plugin--server-side-view)
  - [3.1 Database impact](#31-database-impact)
  - [3.2 Server API surface (`auth.api.*`)](#32-server-api-surface-authapi)
  - [3.3 Active organization — the central concept](#33-active-organization--the-central-concept)
  - [3.4 RBAC — static vs dynamic](#34-rbac--static-vs-dynamic)
  - [3.5 Invitation flow (backend side)](#35-invitation-flow-backend-side)
  - [3.6 Server-relevant known limitations](#36-server-relevant-known-limitations)
- [4. Integration impact on the backend packages](#4-integration-impact-on-the-backend-packages)
  - [4.1 `packages/auth/src/index.ts` (runtime)](#41-packagesauthsrcindexts-runtime)
  - [4.2 `packages/auth/src/auth.config.ts` (CLI subset)](#42-packagesauthsrcauthconfigts-cli-subset)
  - [4.3 `packages/database`](#43-packagesdatabase)
  - [4.4 `packages/api`](#44-packagesapi)
  - [4.5 Tests](#45-tests)
- [5. Prioritized recommendations (backend)](#5-prioritized-recommendations-backend)
  - [P0 — Blockers for the plugin to function at all](#p0--blockers-for-the-plugin-to-function-at-all)
  - [P1 — Quality / correctness](#p1--quality--correctness)
  - [P2 — Polish](#p2--polish)
  - [P3 — Optional but valuable](#p3--optional-but-valuable)
- [6. References](#6-references)

---

## 1. Executive summary

The current `saas-template` ships a **single-tenant, user-centric** auth model (email/password + reserved-but-unused OAuth + reserved-but-unused mailer). Going multi-tenant — i.e. letting users belong to multiple organizations with roles, invitations, members, and teams — means adding better-auth's `organization` plugin.

**Complexity:** low-to-medium. The plugin is well-documented, the Drizzle schema-generation workflow is already wired, and the oRPC/Hono pattern is in place.

**Decision:** signup auto-creates an org via `databaseHooks.session.create.before`. This is the Vercel pattern. No `/onboarding` mandatory stop for first-time users. Invited users are set to their active org via `organizationHooks.afterAcceptInvitation`. See `temp/audit/onboarding/README.md` for the full decision record.

**Backend risk areas:**

1. **Drift between `auth.config.ts` (CLI subset) and `packages/auth/src/index.ts` (runtime)** — the plugin must be added to **both**, otherwise `auth:generate` will produce a schema that does not match production. Extract plugin config to `organizationConfig.ts` to avoid drift.
2. **Sessions table will be migrated** — adding `activeOrganizationId` to the `session` table requires `ALTER TABLE session ADD COLUMN active_organization_id DEFAULT NULL`; existing sessions return `null` until re-authentication.
3. **`afterAcceptInvitation` must call `setActiveOrganization`** — better-auth does not auto-set the active org after accepting an invitation. The hook is the insertion point.
4. **Mailer is not yet wired** — `sendInvitationEmail` is mandatory for the invitation flow; this is the same blocker that today breaks `forgotPassword` and `verifyEmail`.

---

## 2. State of the stack (read-only findings)

### 2.1 `packages/auth`

| Aspect | State | Notes |
|---|---|---|
| `src/index.ts` (runtime) | ✅ | `emailAndPassword`, `nextCookies`, `experimental.joins`, 7-day session, `useSecureCookies` |
| `src/auth.config.ts` (CLI subset) | ⚠ Drift risk | Must be kept in sync with `index.ts` for schema generation; no compile-time guard |
| `src/plugins/index.ts` | ❌ Empty | No `organization` plugin registered |
| `src/types.ts` | ❌ Empty placeholder | File unused; can be removed or populated |
| `tests/setup.ts` | ✅ | better-auth `testUtils` plugin + postgres-js on `TEST_DATABASE_URL` |
| `tests/session.test.ts` | ⚠ Half-coverage | Unit tests run always; integration tests skip if no DB |
| `tests/providers.test.ts` | ❌ Placeholder | `expect(true).toBe(true)` |

### 2.2 `packages/database`

| Aspect | State | Notes |
|---|---|---|
| `src/client.ts` | ✅ | Serverless-tuned pool: `prepare:false`, `max:10`, `idle:20s`, `max_lifetime:30min` |
| `src/schema/auth.ts` | ✅ | 4 better-auth tables (`user`, `session`, `account`, `verification`) + relations |
| `src/tables/index.ts` | ❌ Empty | No business-domain tables yet |
| `drizzle/0000_*.sql` | ✅ Single migration | Captures the 4 auth tables; new migration needed for `organization` |
| `drizzle.config.ts` | ✅ | Points to `./src/schema/index.ts` |
| `tests/setup.ts` | ✅ | pg-mem fallback + postgres-js on `TEST_DATABASE_URL` |
| `tests/schema.test.ts` | ⚠ Smoke only | Only checks column presence, not types/nullability/defaults |
| `tests/queries.test.ts` | ❌ Placeholder | `expect(1+1).toBe(2)` |

### 2.3 `packages/api`

| Aspect | State | Notes |
|---|---|---|
| `src/index.ts` (Hono app) | ✅ | CORS, logger, `/health`, `/ready`, `/auth/*`, `/rpc/*` |
| `src/router/index.ts` | ✅ | `appRouter = { user: userRouter }` |
| `src/router/context.ts` | ✅ | `BaseContext { headers }`, `AuthContext { session, user }` |
| `src/router/middlewares/auth.ts` | ⚠ Weak error | Throws `Error("Authentication required")` instead of `ORPCError("UNAUTHORIZED")` |
| `src/router/user.ts` | ❌ Stubs | All 4 procedures are `// TODO: Implement with @workspace/database` |
| `tests/setup.ts` | ✅ | Exports test `auth` + `createRPCHandler()` helper |
| `tests/routes.test.ts` | ❌ Fake | Tests throwaway Hono apps, not the real `api` |
| `tests/validation.test.ts` | ⚠ Decoupled | Tests Zod schemas only, does not exercise oRPC procedures |

---

## 3. Better-auth `organization` plugin — server-side view

Source: [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization) + official [better-auth/skills organization skill](https://github.com/better-auth/skills).

> *"The organization plugin allows you to manage your organization's members and teams."*

It is a **multi-tenant workspace model** layered on top of better-auth's user model. A single user can belong to N organizations with different roles in each.

### 3.1 Database impact

**New tables (auto-generated by `better-auth generate`):**

| Table | Required | Fields |
|---|---|---|
| `organization` | ✅ | `id`, `name`, `slug`, `logo?`, `metadata?`, `createdAt` |
| `member` | ✅ | `id`, `userId` (FK), `organizationId` (FK), `role` (CSV string), `createdAt` |
| `invitation` | ✅ | `id`, `email`, `inviterId` (FK), `organizationId` (FK), `role?`, `status`, `createdAt`, `expiresAt` |
| `team` | opt-in (`teams.enabled`) | `id`, `name`, `organizationId` (FK), `createdAt` |
| `teamMember` | opt-in | `id`, `teamId` (FK), `userId` (FK) |
| `organizationRole` | opt-in (`dynamicAccessControl.enabled`) | `id`, `organizationId` (FK), `role`, `permission` |

**New columns on `session`:**

| Column | Required | Purpose |
|---|---|---|
| `activeOrganizationId` | ✅ | The org the user is currently working in (scoping default) |
| `activeTeamId` | opt-in | Same for teams, if enabled |

### 3.2 Server API surface (`auth.api.*`)

Every endpoint of the plugin is invokable server-side from RSC, server actions, route handlers, or oRPC procedures. Excerpt:

```ts
await auth.api.createOrganization({ body: { name, slug, metadata }, headers: await headers() })
await auth.api.setActiveOrganization({ body: { organizationId }, headers: await headers() })
await auth.api.listMembers({ query: { organizationId }, headers: await headers() })
await auth.api.inviteMember({ body: { email, role, organizationId }, headers: await headers() })
await auth.api.acceptInvitation({ body: { invitationId }, headers: await headers() })
await auth.api.hasPermission({ body: { permissions: { project: ["create"] } }, headers: await headers() })
// ... ~25 more endpoints
```

Note: `addMember` is **server-only** by design (to add a user without sending an invitation). For invitations, you must use `createInvitation` → email → `acceptInvitation`.

### 3.3 Active organization — the central concept

> *"Active organization is the workspace the user is currently working on. By default when the user is signed in the active organization is set to `null`."*

- Stored in `session.activeOrganizationId`
- Many endpoints fall back to it when `organizationId` is omitted
- `setActiveOrganization` modifies the session (visible to all subsequent calls)
- The same value is observable from `auth.api.getSession({ headers })`, so a single call lets a server action or oRPC procedure know which org the user is in

### 3.4 RBAC — static vs dynamic

**Static (default):** roles defined at build time, shareable between server and client.

```ts
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, adminAc } from "better-auth/plugins/organization/access"

const statement = { ...defaultStatements, project: ["create","update","delete"] } as const
const ac = createAccessControl(statement)

const owner  = ac.newRole({ project: ["create","update","delete"] })
const admin  = ac.newRole({ project: ["create","update"], ...adminAc.statements })
const member = ac.newRole({ project: ["create"] })

// passed to both the server plugin and the client plugin
plugins: [organization({ ac, roles: { owner, admin, member } })]
```

⚠ When you redefine `admin` or `member`, you **overwrite** the default permissions. To keep them, spread `adminAc.statements` / `memberAc.statements`.

**Dynamic (opt-in):** roles stored in DB (`organizationRole` table), created at runtime by admins. Tradeoff: `checkRolePermission` (static, client-side) cannot see them; you must call `hasPermission` (server roundtrip).

### 3.5 Invitation flow (backend side)

```
1. admin → inviteMember({ email, role, organizationId })    [server]
2. plugin INSERTs invitation row (status: pending, expiresAt)
3. plugin calls your sendInvitationEmail({ email, organization, inviter, invitation })
4. you send an email with a link: https://app.com/accept-invitation?id=<invitationId>
5. user clicks → /accept-invitation page                    [frontend]
6. acceptInvitation({ invitationId })                       [server]
   plugin checks session.user.email === invitation.email
7. plugin INSERTs member row, updates invitation.status = "accepted"
8. afterAcceptInvitation hook fires → setActiveOrganization → activeOrganizationId set in session
```

⚠ `sendInvitationEmail` is **mandatory** — without it, invitations are created in DB but no email is sent.

⚠ Default invitation IDs are opaque (better-auth's built-in generator). If you use predictable IDs (`generateId: "serial"`, custom), set `requireEmailVerificationOnInvitation: true` to prevent a logged-in user from accepting an invitation that does not match their email.

### 3.6 Server-relevant known limitations

- **`activeOrganizationId` can be lost with `customSession`** (issue #3233) — not currently enabled, but flag for future.
- **Owner protection:** "The last owner cannot be removed / cannot leave / cannot be demoted." Transfer ownership first.
- **Multi-roles stored as CSV string** in the `member.role` column, not a JSON array. The plugin handles this transparently; do not write custom SQL against that column without parsing.
- **`addMember` is server-only** — to add a user without an invitation, call `auth.api.addMember` from a server context (no session headers required when `userId` is passed).

---

## 4. Integration impact on the backend packages

### 4.1 `packages/auth/src/index.ts` (runtime)

Add to the existing `plugins` array (currently just `[nextCookies()]`):

```ts
import { organization } from "better-auth/plugins"

plugins: [
  organization({
    // Auto-create org on every signup — no mandatory /onboarding step
    // Hook fires before the session is written; set activeOrganizationId here
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            // create default org (name from user.name, auto slug)
            // return { ...session, activeOrganizationId: newOrg.id }
          },
        },
      },
    },
    // Auto-set active org after accepting an invitation
    organizationHooks: {
      afterAcceptInvitation: async ({ member, user, organization }) => {
        await auth.api.setActiveOrganization({
          body: { organizationId: organization.id },
          headers: ..., // pass session headers
        })
      },
    },
    sendInvitationEmail: async ({ email, organization, inviter, invitation }) => {
      // MUST be implemented — current project has no mailer wired
    },
    requireEmailVerificationOnInvitation: true,   // RECOMMENDED
    // creatorRole: "owner",                   // default — keep
    // invitationExpiresIn: 60 * 60 * 24 * 7,  // default 48h — extend if desired
    // teams: { enabled: true, maximumTeams: 20 }   // deferred to v2
    // ac, roles — deferred to v2 (static default roles for v1)
  }),
  nextCookies(),                  // MUST stay last per docs
]
```

> **Note on `nextCookies()`:** it must stay **last** in the plugins array per better-auth docs. It handles writing session cookies (including `activeOrganizationId`) back to the response.

### 4.2 `packages/auth/src/auth.config.ts` (CLI subset)

⚠ **Must be updated in parallel.** This file is the input to `better-auth generate` and must contain the same `organization(...)` declaration (or a faithful subset of it) so the generated schema matches production.

Concrete options:
- (a) Add the full plugin declaration here too — risk of drift.
- (b) Refactor: extract `organization({...})` into a shared `organizationConfig.ts` imported by both `index.ts` and `auth.config.ts`. Eliminates drift.
- (c) Document explicitly in `auth.config.ts` the deltas from `index.ts`.

Recommendation: option (b) — a small refactor, one file of truth.

### 4.3 `packages/database`

Regenerate after the plugin is added:

```bash
pnpm --filter @workspace/auth auth:generate
pnpm --filter @workspace/database db:generate
pnpm --filter @workspace/database db:migrate
```

Result:
- 3–6 new tables in `src/schema/auth.ts` (depending on teams/dynamic AC toggles)
- 1–2 new columns on the `session` table
- A new migration file in `drizzle/0001_*.sql`
- Drizzle relations for the new tables

⚠ The `ALTER TABLE session ADD COLUMN active_organization_id` will invalidate existing sessions on deploy (cookies still valid but `getSession` will return null until re-login). Plan a logout-on-deploy or a column-default approach.

⚠ The pg-mem block in `tests/setup.ts` hardcodes DDL for the 4 existing auth tables. It must be extended to include the new tables or the integration tests will fail with "relation does not exist".

### 4.4 `packages/api`

- **Add an `organization` router** (or expose `auth.api.organization.*` through oRPC). The current `user` router is a good template.
- **New `organizationMiddleware`** — reads `session.activeOrganizationId`, optionally calls `auth.api.getFullOrganization` once, injects `{ session, user, activeOrganization, activeOrganizationId }` into the oRPC context.
- **Replace `Error` with `ORPCError("UNAUTHORIZED")`** in the existing `authMiddleware` (independent of org plugin, but good cleanup).
- **Connect procedures to real DB** — the 4 user procedures are currently mocks; with org in scope, the patterns multiply (e.g. `listMembers` becomes a real `auth.api.listMembers` passthrough, or a direct Drizzle query if you want fine-grained control).

### 4.5 Tests

- **`packages/auth/tests/setup.ts`** — verify the test auth instance works with `organization` enabled. May need to add new fields to pg-mem's inline DDL.
- **`packages/database/tests/setup.ts`** — extend the pg-mem DDL block with the new tables.
- **Add a `organization.test.ts`** — cover: create org, set active, invite, accept, permission check, owner protection, last-owner-cannot-leave.
- **Add API tests** that use the existing `createRPCHandler()` helper to exercise the new `organization` router.

---

## 5. Prioritized recommendations (backend)

### P0 — Blockers for the plugin to function at all

1. **Wire a mailer** (`sendInvitationEmail` and the existing `sendResetPassword` / `sendVerificationEmail`). Pick a provider (Resend / Postmark / SMTP) and add it to `@workspace/env` and `packages/auth`. The plugin's invitation flow is unusable without this.
2. **Add the plugin to `auth.config.ts` too.** Otherwise `auth:generate` will produce a schema missing the new tables. Extract the plugin config to `organizationConfig.ts` imported by both files.
3. **Extend `pg-mem` DDL in `packages/database/tests/setup.ts`** so integration tests do not crash on the new tables.
4. **`afterAcceptInvitation` hook must call `setActiveOrganization`** — better-auth does not auto-set the active org after invitation acceptance. The hook is the only insertion point.

### P1 — Quality / correctness

4. **Replace `throw new Error(...)` with `throw new ORPCError("UNAUTHORIZED", ...)`** in `packages/api/src/router/middlewares/auth.ts`. The current code returns an untyped error to oRPC clients.
5. **Wire the 4 user procedures** in `packages/api/src/router/user.ts` to real Drizzle queries (the project is at ~40% implementation per the prior audit).
6. **Add `organizationMiddleware`** to `packages/api` so protected procedures can read `activeOrganizationId` without each one re-implementing the lookup.
7. **Replace fake tests** (`providers.test.ts`, `routes.test.ts`, `queries.test.ts`, `validation.test.ts`) with real coverage.

### P2 — Polish

8. **Remove empty placeholders**: `packages/auth/src/types.ts`, `packages/auth/src/plugins/index.ts` (if still empty after plugin registration), `packages/database/src/tables/index.ts` (or populate it).
9. **Add `requireEmailVerificationOnInvitation: true`** unless you have a specific reason not to.
10. **Plan the session-column migration** (deploy strategy for `ALTER TABLE session ADD COLUMN active_organization_id`).
11. **Pin `latest` versions in `pnpm-workspace.yaml`** (catalog specs) to semver ranges to avoid surprise breaking changes on `pnpm install`.

### P3 — Optional but valuable

12. **Add `ac` + static roles** to the plugin config if you want `checkRolePermission` for client-side conditional UI without roundtrips.
13. **Add teams** (`teams.enabled: true`) if you actually need sub-org grouping. If not, leave it off — smaller surface, fewer tests to write.
14. **Dynamic access control** only if admins must create roles at runtime. Otherwise static is enough and dramatically simpler.
15. **Drop the `as unknown as ReturnType<typeof betterAuth>` casts** in `auth.config.ts` and `index.ts` — these are version-fragility sentinels; resolve the underlying type mismatch.

---

## 6. References

- [Better Auth — Organization plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth — Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth — Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth skills — organization](https://github.com/better-auth/skills/tree/main/better-auth/organization) (official `SKILL.md`)
- [Discussion #4927 — server actions vs client SDK](https://github.com/better-auth/better-auth/discussions/4927) (confirms `auth.api` + server actions is the canonical Next.js pattern)
- [Issue #3233 — `activeOrganizationId` lost with `customSession`](https://github.com/better-auth/better-auth/issues/3233)
- [Issue #7005 — `getActiveOrganization` semantics](https://github.com/better-auth/better-auth/issues/7005)
- [Prior audit — `backend-packages-audit.md`](../backend-packages-audit.md) (2026-07-06) — baseline of the current stack
- [Companion document — `frontend.md`](./frontend.md) (apps/app side)

---

*Generated from a read-only analysis session; no source files were modified.*
