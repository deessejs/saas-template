# SaaS Onboarding Strategy — Better-Auth Organization Plugin

**Date:** 2026-07-08
**Scope:** Pre-implementation decision document. No code written. The goal is to answer the five structural questions that must be resolved before writing the first line of the `organization` plugin integration.
**Inputs:** Official better-auth docs (better-auth.com/docs/plugins/organization), YuSMP B2B SaaS onboarding patterns (2026), Tenet SaaS onboarding UX best practices (2026), prior `temp/audit/organizations/` backend + frontend audits.

---

## Outline

- [1. What better-auth says — and does not say](#1-what-better-auth-says--and-does-not-say)
- [2. The five structural decisions](#2-the-five-structural-decisions)
  - [2.1 Signup → first org: auto or manual?](#21-signup--first-org-auto-or-manual)
  - [2.2 Zero-org state: forbidden or allowed?](#22-zero-org-state-forbidden-or-allowed)
  - [2.3 Invitation path: does a user need their own org to join one?](#23-invitation-path-does-a-user-need-their-own-org-to-join-one)
  - [2.4 Session migration: how to handle existing sessions?](#24-session-migration-how-to-handle-existing-sessions)
  - [2.5 Active organization: when to set it and when to check it?](#25-active-organization-when-to-set-it-and-when-to-check-it)
- [3. Cross-cutting implications of each choice](#3-cross-cutting-implications-of-each-choice)
- [4. Proposed opinionated defaults](#4-proposed-opinionated-defaults)
- [5. Recommended order](#5-recommended-order)

---

## 1. What better-auth says — and does not say

### What the plugin does for you

The `organization` plugin provides:

- **Tables:** `organization`, `member`, `invitation`, opt-in `team`, opt-in `teamMember`, opt-in `organizationRole`
- **Session column:** `activeOrganizationId` (required), opt-in `activeTeamId`
- **API surface:** ~30 server endpoints (`auth.api.*`) + ~20 client methods (`authClient.organization.*`)
- **Hooks:** `before/afterCreateOrganization`, `before/afterAddMember`, `before/afterCreateInvitation`, `before/afterAcceptInvitation`, etc.
- **RBAC:** static (`ac` + custom roles) or dynamic (DB-stored roles)
- **Session linkage:** `activeOrganizationId` is stored server-side in the `session` row, mirrored client-side via nanostores

### What the plugin does NOT do

The plugin deliberately does **not** prescribe:

- **When to create the first organization** — you choose: auto on signup, or manually after
- **What a zero-org user can see** — the plugin returns `activeOrganizationId = null`; it's your gate logic
- **The onboarding UX** — the docs show the API, not the flow
- **Billing or plan gating** — `organizationLimit` and `membershipLimit` exist, but you wire them
- **Email delivery** — `sendInvitationEmail` is a required callback you must implement; better-auth calls it but does not send anything

> The plugin is a data and API layer, not a UX flow. This is the same gap that exists in the codebase today — the primitives are wired, the UX is missing. The onboarding decision is your first UX decision, and it shapes every subsequent one.

---

## 2. The five structural decisions

### 2.1 Signup → first org: auto or manual?

**Option A — Auto-create on signup**

```
User signs up
  → email verification (better-auth email verification)
  → databaseHooks.session.create.before fires
  → create a default org (e.g. "Acme")
  → set activeOrganizationId = new org.id
  → user lands in /home with a real workspace
```

- **Pros:** activation rate maximised — user reaches first value immediately. No onboarding page needed. Recommended by YuSMP: *"Workspace-first, not user-first. Create the workspace, then invite."*
- **Cons:** every signup creates an org, even for users who will be invited to a different one. A user who receives an invitation and signs up will have two orgs (their auto-created one + the invited one).
- **Technical:** use `databaseHooks.session.create.before` to auto-create org in a hook, before the session is written. This requires `creatorRole: "owner"` and `organizationLimit` gating if you want to limit free-tier users.

**Option B — Manual on `/onboarding`**

```
User signs up
  → email verification
  → lands on /onboarding
  → fills org name + slug form
  → createOrganizationAction → redirect to /home
```

- **Pros:** explicit first action, clear CTA. Better for products where org name is meaningful (team name matters). Enables slug choice before data exists.
- **Cons:** adds a mandatory step, increases time-to-value. YuSMP benchmarks show every step before first value drops activation rate.
- **Technical:** simpler to implement initially. Harder to enforce (you must gate all protected routes until an org exists).

**Option C — Hybrid**

```
User signs up
  → auto-creates a "personal" org (invisible, no invite capability)
  → lands in /home
  → can create a "real" org later via org-switcher
```

- **Pros:** zero friction for activation, with a path to create a named org later. Linear uses this pattern.
- **Cons:** two types of orgs to manage in the data model. `creatorRole: "admin"` on the personal org (not owner), so it can't be deleted without consequences. Requires `organizationLimit` gating.

**Recommendation:** **Option B for v1** — explicit `/onboarding` page. It is the simplest to reason about, the safest for the invitation edge case, and the most consistent with the better-auth docs pattern. Option A is the better long-term target (YuSMP workspace-first principle), but it requires a `databaseHooks` integration that is more complex to test.

---

### 2.2 Zero-org state: forbidden or allowed?

This determines what `activeOrganizationId = null` means in your system.

**Option A — Forbidden (strict gate)**

```
Any protected route hit without activeOrganizationId
  → redirect to /onboarding (create)
```

- Every authenticated user must have an active org. `/home`, `/settings/organization/*`, and all domain pages are gated.
- `proxy.ts` does the check after `getSession`.
- Simpler mental model: `activeOrganizationId === null` is always an error state.
- Safe for products where org-scoping is fundamental (B2B SaaS).

**Option B — Allowed (soft gate)**

```
activeOrganizationId === null is a valid state
  → user can browse a personal/solo dashboard
  → org creation prompted via a banner or empty state, not a redirect
  → invitation acceptance joins the invited org without requiring prior org
```

- The user's own content lives at the user level, not org level. Org is additive.
- Requires distinguishing user-scoped resources from org-scoped resources everywhere.
- Better for products that start personal and grow to team (Notion personal → Notion teams).

**Recommendation:** **Option A for v1** — strict gate. It is the safer default, simpler to implement, and matches the B2B SaaS pattern. `activeOrganizationId === null` as an error state means every page can assume an org context exists, which simplifies data fetching (no conditional org null checks everywhere).

---

### 2.3 Invitation path: does a user need their own org to join one?

This is the most nuanced decision, and it is **independent of the signup/org choice**.

With better-auth, an invitation works like this:

```
1. Admin (in an existing org) → inviteMember({ email, role })
   → invitation row created (status: pending, expiresAt)
   → sendInvitationEmail({ email, organization, inviter, invitation })
     → email contains: https://app.com/accept-invitation?id=<invitationId>

2. Invited user clicks the link:
   a. If not signed in → signs up → verifies email
   b. If signed in but wrong account → signs out → signs in with correct account
   c. If signed in with correct account → lands on /accept-invitation?id=xxx

3. acceptInvitation({ invitationId })
   → better-auth checks: session.user.email === invitation.email
   → if match: INSERT member row, UPDATE invitation.status = "accepted"
   → user is now a member of the org
```

**Key insight:** Step 3 **does not require the user to have their own org first.** `acceptInvitation` joins the invited org directly, regardless of whether `activeOrganizationId` is null.

This means:

- If you chose Option A (zero-org forbidden), the invited user will:
  - Click the link
  - Be redirected to `/onboarding` (no active org)
  - But `acceptInvitation` is a separate flow — it should NOT be gated by the org requirement
  - After accepting, `activeOrganizationId` is still null (the invitation sets the membership, not the active org)

**The critical implication:** accepting an invitation does NOT set `activeOrganizationId`. The user becomes a member but still lands on `/onboarding` unless you explicitly call `setActiveOrganization` after `acceptInvitation`.

**Three paths for the invited user:**

| Path | What happens | activeOrganizationId |
|---|---|---|
| A — New signup, no org, accepts invitation | Signs up → email verified → `/accept-invitation?id=` → member → `/home` → redirected to `/onboarding` (still null) | `null` — needs explicit `setActive` |
| B — Existing user, no org, accepts invitation | Already logged in → `/accept-invitation?id=` → member → `/home` → redirected to `/onboarding` | `null` — needs explicit `setActive` |
| C — Existing user, has org, accepts invitation | Already logged in → `/accept-invitation?id=` → member → `/home` → sees both orgs in switcher | already set (unchanged) |

**Decision required:** Should `acceptInvitation` automatically call `setActiveOrganization` to the joined org?

- **Yes (recommended):** user is immediately productive in the org they joined. One less step.
- **No:** user keeps their previous active org context, joins silently. Better for users who belong to multiple orgs.

**Implementation note:** `acceptInvitation` in better-auth does NOT auto-set the active org. You must do it in your server action or in `organizationHooks.afterAcceptInvitation`. Use `auth.api.setActiveOrganization` in a `afterAcceptInvitation` hook — it runs server-side, no extra roundtrip.

---

### 2.4 Session migration: how to handle existing sessions?

Adding `activeOrganizationId` to the `session` table requires `ALTER TABLE session ADD COLUMN active_organization_id`. This migration has a specific consequence:

> Existing session cookies remain valid. But `getSession()` will return `null` for them (the column is absent or null in the DB) until the user re-authenticates.

**Three migration strategies:**

| Strategy | What | Pros | Cons |
|---|---|---|---|
| **Maintenance window** | Freeze logins, run migration, announce re-login | Clean, no surprise redirects | Churn: all users are logged out simultaneously |
| **Graceful degradation** | Migration runs, `getSession` returns null → redirect to `/login?reason=re-auth` | One-time churn per user | All users hit `/login` on first visit post-deploy |
| **Default column** | Add column as `DEFAULT NULL`, migration is non-breaking | Zero churn at deploy time | `activeOrganizationId` is null for old sessions until `setActive` is called |

**Recommendation:** **Default column** (`DEFAULT NULL`, no `NOT NULL`). The migration is non-breaking. Old sessions land in the zero-org state (which redirects to `/onboarding` per the chosen strategy). The user goes through `/onboarding` once, and their session is updated.

**Timing:** run the migration before the onboarding page is live. If `/onboarding` does not exist yet and users land there with `null` active org, they hit a blank or broken page. Sequence matters.

---

### 2.5 Active organization: when to set it and when to check it?

**When to set it:**

| Trigger | How | Location |
|---|---|---|
| Org creation (`createOrganization`) | better-auth auto-sets `activeOrganizationId` in the session cookie via `nextCookies()` | After `createOrganizationAction` succeeds |
| Invitation acceptance (`acceptInvitation`) | NOT auto-set — must call explicitly | `afterAcceptInvitation` hook or in `acceptInvitationAction` server action |
| Org switcher selection | Client-side `authClient.organization.setActive({ organizationId })` | In `org-switcher.tsx` |
| Session creation (optional) | `databaseHooks.session.create.before` | In `organization()` plugin config |
| Leave org (`leaveOrganization`) | Set `activeOrganizationId` to next org in user's list, or null | After `leaveOrganization` succeeds |

**When to check it:**

| Location | What | Action if null |
|---|---|---|
| `proxy.ts` | After `getSession`, check `session.session.activeOrganizationId` | Redirect to `/onboarding` if on a protected route |
| Layout RSC (`(protected)/layout.tsx`) | Optionally read `activeOrganization` for sidebar data | No redirect needed if proxy handles it |
| oRPC procedures | `organizationMiddleware` reads `activeOrganizationId` from session | `ORPCError("UNAUTHORIZED")` or inject null into context |
| Page-level RSC | Read `auth.api.getFullOrganization({ headers })` | `notFound()` if `organizationId` in URL does not match session membership |

**Critical note on `proxy.ts`:** The check must **exclude `/accept-invitation`** — an invited user without an active org must be able to reach it. The check should be:

```
if (path !== "/accept-invitation" && !path.startsWith("/accept-invitation/")) {
  if (no active org && path requires org) → redirect to /onboarding
}
```

The better-auth docs explicitly note that `setActive` can be managed **client-side only** (no session write required for the active org to be observable via the nanostore-backed hook). However, for the proxy to check it server-side, the session cookie must be updated — which `nextCookies()` handles automatically.

---

## 3. Cross-cutting implications of each choice

### Decision matrix

| | Auto-create on signup (A) | Manual /onboarding (B) | Hybrid (C) |
|---|---|---|---|
| **Complexity** | High (hooks + cleanup) | Low | Medium |
| **Activation rate** | Highest | Medium | High |
| **Invitation edge case** | User has 2 orgs | Clean | Moderate |
| **Recommended for** | Products where every user needs an org immediately | v1 of any B2B SaaS | Personal → team products |

### The invitation edge case (the hardest interaction)

When a user who auto-created an org (Option A) receives an invitation:

1. They have `activeOrganizationId = "my-acme"` (their auto-created org)
2. They accept the invitation for "client-corp"
3. They are now a member of "client-corp" but `activeOrganizationId` is still "my-acme"
4. They do NOT see "client-corp" in their sidebar until they switch orgs

**Solution for Option A:** after `acceptInvitation`, check `listOrganizations` — if the user now belongs to more than one org, prompt to switch. The org-switcher shows all memberships regardless.

**This edge case is eliminated with Option B** — a user without an org who accepts an invitation should have their active org set to the invited org. One `setActive` call in `afterAcceptInvitation` resolves it cleanly.

---

## 4. Proposed opinionated defaults

These are the choices that minimise complexity for v1 while leaving room to evolve:

### Decision record

| # | Question | Answer | Rationale |
|---|---|---|---|
| D1 | Signup → first org | **Manual via `/onboarding`** | Simplest to implement, safest for invitation edge case |
| D2 | Zero-org state | **Forbidden (strict gate)** | All protected pages assume org context exists |
| D3 | Invitation → needs own org first | **No** | `acceptInvitation` works without org; set `activeOrganizationId` in `afterAcceptInvitation` hook |
| D4 | Accept invitation → auto-set active org | **Yes** | User is immediately productive in the org they joined |
| D5 | Session migration | **Default column `NULL`, deploy before `/onboarding` is live** | Zero churn, only users who hit `/onboarding` are affected |
| D6 | When to set `activeOrganizationId` | **`createOrganization` (auto via plugin) + `afterAcceptInvitation` hook** | Two insertion points cover both paths |
| D7 | Where to check it | **`proxy.ts` (all protected routes except `/accept-invitation`)** | Single gate, server-side, consistent |
| D8 | RBAC | **Static (default roles)** | Dynamic adds `organizationRole` table and complexity — deferred to v2 |
| D9 | Teams | **Off** | Smaller surface for v1. Add `teams.enabled: true` when real team scoping is needed |
| D10 | `requireEmailVerificationOnInvitation` | **`true`** | Safer: prevents an invited email from being claimed by a different account before verification |

### The resulting user flows

**Flow 1 — Self-signup (dominant path)**

```
/signup
  → verify email
  → redirect to /onboarding
  → fill name + slug form
  → createOrganization → activeOrganizationId set by plugin
  → redirect to /home
  → sidebar: org-switcher shows 1 org
```

**Flow 2 — Invitation (second path)**

```
/accept-invitation?id=xxx
  → not logged in → /signup → verify email → /accept-invitation?id=xxx
  → logged in → acceptInvitation (email match checked by plugin)
    → afterAcceptInvitation hook: setActiveOrganization to invited org
  → redirect to /home
  → sidebar: org-switcher shows 1 org (the one they were invited to)
```

**Flow 3 — Existing user accepts second invitation**

```
/home (active org: Acme)
  → email: "join Client Corp" invitation link
  → /accept-invitation?id=yyy
  → acceptInvitation
    → afterAcceptInvitation hook: setActiveOrganization to Client Corp
  → redirect to /home
  → sidebar: org-switcher shows [Acme, Client Corp]
```

---

## 5. Recommended order

The decisions above must be sequenced correctly because later steps depend on earlier ones being live.

### Phase 0 — Decisions (this document)

Resolve the five questions above before writing any code. The answers above are the proposed defaults.

### Phase 1 — Backend foundation (1–2 days)

1. Add `organization` plugin to `packages/auth/src/index.ts`
2. Add `organization` plugin to `packages/auth/src/auth.config.ts` (same config — extract to `organizationConfig.ts` to avoid drift)
3. Add `sendInvitationEmail` to the plugin config (wire the mailer — currently missing for all flows)
4. Run `pnpm --filter @workspace/auth auth:generate`
5. Run `pnpm --filter @workspace/database db:generate && db:migrate`
6. Add `afterAcceptInvitation` hook with `setActiveOrganization`
7. Set `requireEmailVerificationOnInvitation: true`
8. Extend pg-mem DDL in `packages/database/tests/setup.ts` and `packages/auth/tests/setup.ts`
9. Add `organizationMiddleware` to `packages/api` (reads `session.activeOrganizationId`, injects into oRPC context)

### Phase 2 — `/onboarding` minimum (0.5 day)

1. Create `app/(protected)/onboarding/page.tsx`
   - `?id=` → `AcceptInvitationCard`
   - no `id` → `CreateOrganizationForm`
   - if `activeOrganizationId` already set → redirect `/home`
2. Wire `createOrganizationAction` + `acceptInvitationAction` server actions
3. Update `proxy.ts`:
   - add `/onboarding` to `PROTECTED_PREFIXES`
   - add `/accept-invitation` to protected routes
   - check `activeOrganizationId` after `getSession`
   - exclude `/accept-invitation` from the null-check redirect
4. Verify: signup → `/onboarding` → create org → `/home` ✅

### Phase 3 — Org switcher (0.5 day)

1. Add `organizationClient()` to `lib/auth-client.ts`
2. Replace decorative `team-switcher.tsx` with `org-switcher.tsx`
   - `useListOrganizations` → list all memberships
   - `useActiveOrganization` → current selection
   - `organization.setActive` → on selection
   - If 0 orgs → "Create organization" links to `/onboarding`
3. Wire `SidebarBackAction` in `AppSidebar`

### Phase 4 — Settings org (1–2 days)

1. `app/(protected)/settings/organization/layout.tsx` + hub `page.tsx`
2. `/settings/organization/general` + `updateOrganizationAction`
3. `/settings/organization/members` + `inviteMemberAction`, `updateMemberRoleAction`, `removeMemberAction`
4. `/settings/organization/invitations` + `cancelInvitationAction`
5. `/settings/organization/billing` (placeholder only — Stripe deferred)

### Phase 5 — Polish (0.5 day)

1. `error.tsx` and `loading.tsx` boundaries
2. `not-found.tsx`
3. `global-error.tsx`
4. Replace fake `SessionsTable` + `ConnectedAccountsList` with real better-auth data
5. Write `packages/auth/tests/organization.test.ts`

---

## References

- [Better Auth — Organization plugin](https://better-auth.com/docs/plugins/organization) (full API reference)
- [Better Auth — Organization skill](https://github.com/better-auth/skills/tree/main/better-auth/organization) (official `SKILL.md`)
- YuSMP Group — *B2B SaaS Onboarding Patterns* (2026-01-04) — activation rate benchmarks, PLG vs sales-led decision matrix
- Tenet — *SaaS Onboarding UX Best Practices* (2026-02-23) — UX patterns, action-driven checklists, low-friction entry
- `temp/audit/organizations/backend.md` (2026-07-07) — backend integration inventory
- `temp/audit/organizations/frontend.md` (2026-07-07) — frontend page plan and code samples
