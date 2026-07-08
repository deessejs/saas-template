# Auth + `organization` Plugin — Frontend Analysis

**Date:** 2026-07-07
**Scope:** `apps/app` (Next.js 16 App Router). The companion document `backend.md` covers `packages/auth`, `packages/database`, and `packages/api`.
**Method:** Read-only analysis of the repo + official better-auth documentation research via `fresh` (better-auth.com + the official `better-auth/skills` GitHub repo). No code was modified.

---

## Outline

- [1. Executive summary](#1-executive-summary)
- [2. State of the stack (read-only findings)](#2-state-of-the-stack-read-only-findings)
  - [2.1 `apps/app` (Next.js 16 App Router)](#21-appsapp-nextjs-16-app-router)
- [3. Better-auth `organization` plugin — client-side view](#3-better-auth-organization-plugin--client-side-view)
  - [3.1 Client API surface (`authClient.organization.*`)](#31-client-api-surface-authclientorganization)
  - [3.2 Active organization in the UI](#32-active-organization-in-the-ui)
  - [3.3 The `/accept-invitation` page](#33-the-accept-invitation-page)
  - [3.4 OAuth + the `organization` plugin (UI side)](#34-oauth--the-organization-plugin-ui-side)
  - [3.5 Client-relevant known limitations](#35-client-relevant-known-limitations)
- [4. Integration impact on `apps/app`](#4-integration-impact-on-appsapp)
  - [4.1 `lib/auth-client.ts`](#41-libauth-clientts)
  - [4.2 `proxy.ts`](#42-proxyts)
  - [4.3 `app/(protected)/` layout](#43-appprotected-layout)
  - [4.4 Server actions (new, following the canonical pattern)](#44-server-actions-new-following-the-canonical-pattern)
  - [4.5 Sidebar / nav-user](#45-sidebar--nav-user)
  - [4.6 Components to create](#46-components-to-create)
- [5. Pages to create in `apps/app`](#5-pages-to-create-in-appsapp)
  - [5.1 What already exists](#51-what-already-exists)
  - [5.2 P0 — Required to land the `organization` plugin](#52-p0--required-to-land-the-organization-plugin)
  - [5.3 P1 — Missing settings & standard SaaS surfaces](#53-p1--missing-settings--standard-saas-surfaces)
  - [5.4 P1 — Error and loading boundaries (Next.js App Router)](#54-p1--error-and-loading-boundaries-nextjs-app-router)
  - [5.5 P2 — Domain "business" pages (template-level)](#55-p2--domain-business-pages-template-level)
  - [5.6 P2 — Links that currently 404 from inside `apps/app`](#56-p2--links-that-currently-404-from-inside-appsapp)
  - [5.7 P3 — Support / contact](#57-p3--support--contact)
  - [5.8 Pages that do **not** belong in `apps/app`](#58-pages-that-do-not-belong-in-appsapp)
  - [5.9 Summary — page-count for a v1 post-plugin](#59-summary--page-count-for-a-v1-post-plugin)
- [6. Frontend-specific recommendations](#6-frontend-specific-recommendations)
  - [P0 — Required for the plugin to be usable from the UI](#p0--required-for-the-plugin-to-be-usable-from-the-ui)
  - [P1 — Quality / correctness](#p1--quality--correctness)
  - [P2 — Polish](#p2--polish)
  - [P3 — Optional but valuable](#p3--optional-but-valuable)
- [7. Detailed implementation plan](#7-detailed-implementation-plan)
  - [7.1 Approach & file tree](#71-approach--file-tree)
  - [7.2 `/onboarding` — combined page](#72-onboarding--combined-page)
    - [7.2.1 Two paths overview](#721-two-paths-overview)
    - [7.2.2 Path 1 — Onboarding server action](#722-path-1--onboarding-server-action)
    - [7.2.3 Path 2 — Sidebar dialog](#723-path-2--sidebar-dialog)
    - [7.2.4 Comparison](#724-comparison--when-to-use-which)
    - [7.2.5 Internal side effects](#725-internal-side-effects)
  - [7.3 `/settings/organization` — hub + layout](#73-settingsorganization--hub--layout)
  - [7.4 `/settings/organization/general`](#74-settingsorganizationgeneral)
  - [7.5 `/settings/organization/members`](#75-settingsorganizationmembers)
  - [7.6 `/settings/organization/invitations`](#76-settingsorganizationinvitations)
  - [7.7 `/settings/organization/billing`](#77-settingsorganizationbilling)
  - [7.8 Transversal changes](#78-transversal-changes)
  - [7.9 Order of implementation](#79-order-of-implementation)
  - [7.10 Validation plan](#710-validation-plan)
- [8. References](#8-references)

---

## 1. Executive summary

The current `apps/app` ships a **single-tenant, user-centric** UI (login / signup / forgot / reset / verify / home placeholder / settings). Going multi-tenant — i.e. letting users belong to multiple organizations with roles, invitations, members, and teams — means adding better-auth's `organization` plugin and exposing a real UI around it.

**Decision:** signup auto-creates an org via `databaseHooks.session.create.before`. `/onboarding` is NOT a mandatory stop for first-time users. Invited users are set to their active org via `organizationHooks.afterAcceptInvitation`. See `temp/audit/onboarding/README.md` for the full decision record.

**Complexity:** low-to-medium. The canonical Next.js server-action pattern is already in place, the proxy gate works, and `auth-client.ts` is the only entry point to extend.

**Frontend risk areas:**

1. **`proxy.ts` needs a new responsibility** — it currently only checks session presence. It must additionally check `session.activeOrganizationId` and bounce to `/onboarding` when a protected route requires an active org. `/accept-invitation` must be excluded from this redirect.
2. **No org switcher in the UI today.** The repo has a decorative `team-switcher.tsx` component that becomes the right slot. It shows the auto-created org immediately on first login.
3. **`/onboarding` exists as a fallback** — not the first stop after signup. Users land in `/home` directly. `/onboarding` handles: (a) legacy sessions post-migration, (b) creating additional orgs beyond the auto-created default.
4. **Many pages need to be created** — see section 5. Estimated ~27 pages for a complete post-plugin v1.

---

## 2. State of the stack (read-only findings)

### 2.1 `apps/app` (Next.js 16 App Router)

| Aspect | State | Notes |
|---|---|---|
| `proxy.ts` (Next 16 auth gate) | ✅ Wired | `auth.api.getSession` with cost-free short-circuit on unmatched paths |
| `lib/auth-client.ts` | ✅ Minimal but correct | `createAuthClient` on `NEXT_PUBLIC_APP_URL` |
| `lib/orpc.ts` | ✅ Typed end-to-end | `RouterClient<typeof appRouter>` |
| `app/api/[[...route]]/route.ts` | ✅ Catch-all Hono | Dispatches `/auth/*` and `/rpc/*` correctly |
| Server actions (login/signup/forgot/reset/logout) | ✅ Canonical pattern | `useActionState` + Zod + `auth.api.*` + `nextCookies` plugin |
| OAuth (Google/GitHub UI) | ⚠ UI only | Buttons present, no `socialProviders` config in `packages/auth` |
| Mailer (`sendResetPassword`, `sendVerificationEmail`) | ❌ Not configured | `forgotPassword` and `verifyEmail` flows silently fail |
| Organization-aware routes | ❌ Absent | No `/onboarding`, no `/accept-invitation`, no org switcher |
| Error / loading boundaries | ❌ Missing | No `error.tsx`, no `loading.tsx`, no `global-error.tsx`, no `not-found.tsx` |
| Real dashboard content | ❌ Placeholder | `/home` is a one-line "Welcome back" |

---

## 3. Better-auth `organization` plugin — client-side view

Source: [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization) + official [better-auth/skills organization skill](https://github.com/better-auth/skills).

### 3.1 Client API surface (`authClient.organization.*`)

```ts
const { data: orgs } = authClient.useListOrganizations()           // hook réactif
const { data: active } = authClient.useActiveOrganization()        // hook réactif

await authClient.organization.create({ name, slug, metadata })
await authClient.organization.setActive({ organizationId })
await authClient.organization.update({ data, organizationId })
await authClient.organization.delete({ organizationId })
await authClient.organization.inviteMember({ email, role, organizationId })
await authClient.organization.acceptInvitation({ invitationId })
await authClient.organization.cancelInvitation({ invitationId })
await authClient.organization.rejectInvitation({ invitationId })
await authClient.organization.listMembers({ query: { organizationId, limit, offset } })
await authClient.organization.removeMember({ memberIdOrEmail, organizationId })
await authClient.organization.updateMemberRole({ memberId, role, organizationId })
```

Plus a static helper for UI conditional rendering (no roundtrip):

```ts
const canDelete = authClient.organization.checkRolePermission({
  permissions: { organization: ["delete"] },
  role: "admin",
})
```

⚠ `checkRolePermission` is **static** and cannot see roles created via the dynamic access-control addon. For dynamic roles, use `authClient.organization.hasPermission(...)` (server roundtrip).

### 3.2 Active organization in the UI

> *"Active organization is the workspace the user is currently working on. By default when the user is signed in the active organization is set to `null`."*

- Stored in `session.activeOrganizationId` server-side, and mirrored client-side via the `useActiveOrganization` hook (nanostore-backed).
- `useActiveOrganization` returns `null` when no org is active — must handle the empty state explicitly.
- Can be set/cleared via `authClient.organization.setActive({ organizationId })` from any client component, and the change is reflected across components subscribed to the hook.
- A `proxy.ts` or layout RSC should also read `session.activeOrganizationId` to redirect users to `/onboarding` when a protected route requires an active org.

### 3.3 The `/accept-invitation` page

Standard pattern (server-rendered, then mutates):

```
1. Better-auth sends the email with link https://app.com/accept-invitation?id=<invitationId>
2. User clicks → page reads ?id= in searchParams
3. Page either:
   - calls auth.api.acceptInvitation({ body: { invitationId }, headers: await headers() })
     via a server action, then redirect("/home")
   - or calls authClient.organization.acceptInvitation({ invitationId }) from a client effect
4. Plugin checks: session.user.email === invitation.email
5. Plugin inserts member row, updates invitation.status = "accepted"
```

### 3.4 OAuth + the `organization` plugin (UI side)

If you later want to bind a social-login to a specific organization (e.g. an SSO-like flow per workspace), `authClient.signIn.social({ provider, callbackURL, organizationId })` accepts an `organizationId` parameter. For the current scope, the existing `LoginForm` / `SignupForm` OAuth buttons (`/login`, `/signup`) only need to gain the `socialProviders` config on the backend to start working.

### 3.5 Client-relevant known limitations

- **`useActiveOrganization` returns `null`** when no org is active. UI must handle the empty state (redirect to onboarding).
- **Multi-roles stored as CSV string** — `member.role` may be `"admin,member"`. The client SDK handles this transparently; do not split the string yourself.
- **Static vs dynamic RBAC** — if dynamic AC is enabled, prefer `hasPermission` over `checkRolePermission` for permission-gated UI.

---

## 4. Integration impact on `apps/app`

### 4.1 `lib/auth-client.ts`

Add `organizationClient()` to the `plugins` array. If custom RBAC, also pass `ac` and `roles` (re-imported from a shared module under `packages/auth` so server and client stay in sync):

```ts
"use client"

import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { ac, roles } from "@workspace/auth/permissions"   // deferred to v2
import { clientEnv } from "@workspace/env/client"

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],  // ac + roles added in v2 (dynamic RBAC)
})
```

The `authClient` is the client-side entry point for: `useListOrganizations`, `useActiveOrganization`, `organization.setActive` (org switcher), `organization.checkSlug` (slug availability check), `organization.acceptInvitation` (client-side call if preferred over server action).

### 4.2 `proxy.ts`

Extend both the matcher and the logic:

- Add `/onboarding`, `/settings/organization`, `/accept-invitation` to `PROTECTED_PREFIXES`.
- After `auth.api.getSession`, read `session.session.activeOrganizationId`. If the requested path is in a set of "requires-active-org" paths and no active org is set, redirect to `/onboarding`.
- **Exclude `/accept-invitation` from the `null` check** — an invited user without an active org must reach it to accept the invitation.
- `/onboarding` is NOT added to `AUTH_PREFIXES` — it is a protected route, not an auth page.

### 4.3 `app/(protected)/` layout

Inject an org-switcher into the protected layout:

- Use `authClient.useListOrganizations()` and `authClient.useActiveOrganization()`.
- Use `authClient.organization.setActive({ organizationId })` on selection.
- The repo already has a `components/sidebars/team-switcher.tsx` (currently decorative) — replace it with `org-switcher.tsx`.
- The org-switcher shows the auto-created personal org immediately on first login. "Create new organization" links to `/onboarding` (for additional orgs, not the first).

### 4.4 Server actions (new, following the canonical pattern)

Each new feature follows the existing `useActionState` + Zod + server action pattern already in `apps/app/app/(unprotected)/(auth)/actions.server.ts`. Concretely:

- `createOrganizationAction(prev, formData)` → `auth.api.createOrganization({ body, headers })` → `redirect("/home")` (for additional orgs, not the first — the first is created by `databaseHooks`)
- `acceptInvitationAction(prev, formData)` → `auth.api.acceptInvitation({ body, headers })` → `redirect("/home")` — `afterAcceptInvitation` hook sets active org server-side
- `inviteMemberAction(prev, formData)` → `auth.api.inviteMember({ body, headers })`
- `updateMemberRoleAction(prev, formData)` → `auth.api.updateMemberRole({ body, headers })`
- `removeMemberAction(formData)` → `auth.api.removeMember({ body, headers })`
- `cancelInvitationAction(formData)` → `auth.api.cancelInvitation({ body, headers })`
- `updateOrganizationAction(prev, formData)` → `auth.api.updateOrganization({ body, headers })`

`setActiveOrganizationAction` is **not needed** — the org-switcher calls `authClient.organization.setActive` client-side. The `afterAcceptInvitation` hook handles the server-side active org set.

### 4.5 Sidebar / nav-user

Wire the existing `team-switcher.tsx` to the real org-switcher; add an "Organization settings" link in the user menu (visible only when an active org exists).

### 4.6 Components to create

In addition to the pages listed in section 5, you will need:

- `components/organizations/create-organization-form.tsx`
- `components/organizations/invite-member-form.tsx`
- `components/organizations/members-table.tsx`
- `components/organizations/invitations-table.tsx`
- `components/organizations/organization-settings-form.tsx`
- `components/organizations/org-switcher.tsx` (replaces the decorative `team-switcher.tsx`)
- `components/organizations/accept-invitation-card.tsx`

All should be `"use client"` and use `useActionState` for parity with the auth forms.

---

## 5. Pages to create in `apps/app`

Inventory of pages that are **absent today** and would need to exist for a complete SaaS template — most of them become mandatory once the `organization` plugin is wired.

### 5.1 What already exists

| Route | Page |
|---|---|
| `/` | Redirect → `/login` |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` | Auth pages |
| `/home` | Placeholder "Welcome back" |
| `/settings` | Settings index |
| `/settings/profile`, `/settings/security` (+ `/password`), `/settings/sessions`, `/settings/connections` | User settings |
| `/settings/account` (+ `/email`, `/delete`) | Account settings |
| `/api/[[...route]]` | Catch-all Hono (auth + oRPC) |

### 5.2 P0 — Required to land the `organization` plugin

| Route | Purpose | Notes |
|---|---|---|
| `/onboarding/create-organization` | First-org creation flow | Server action calling `auth.api.createOrganization`; sets `activeOrganizationId` at the end |
| `/accept-invitation` | Accept an invitation | Reads `?id=` in `searchParams`, calls `auth.api.acceptInvitation`, redirects to `/home` |
| `/settings/organization` | Org hub | Layout with tabs / sections, scoped to the active org |
| `/settings/organization/general` | Edit org | Name, slug, logo, metadata (gated by `organization:update`) |
| `/settings/organization/members` | Member management | `listMembers`, `updateMemberRole`, `removeMember` (gated by `member:*` permissions) |
| `/settings/organization/invitations` | Pending invitations | `listInvitations`, `createInvitation`, `cancelInvitation` (gated by `invitation:*`) |
| `/settings/organization/billing` | Plan & billing | Not covered by better-auth — custom (Stripe) or third-party |

### 5.3 P1 — Missing settings & standard SaaS surfaces

| Route | Purpose | Why |
|---|---|---|
| `/settings/notifications` | Notification preferences | Per-channel (email/push/in-app) per category — standard SaaS table stakes |
| `/settings/appearance` | Theme, language, density | Theme is wired client-side (`next-themes` + `d` hotkey) but no UI to pick it |
| `/settings/api-keys` | API access tokens | Natural fit since oRPC is already public |
| `/settings/security` → 2FA sub-tab | Two-factor activation | better-auth ships a `twoFactor` plugin, not yet enabled |
| `/settings/activity` | User audit log | Recent logins / actions — reuses the `session` table |
| `/onboarding` | Fallback + additional org creation | Legacy sessions post-migration, creating additional orgs. Not the first stop. |

The `proxy.ts` currently redirects `/login` → `/home` when a session exists. It should also check `session.activeOrganizationId` and bounce to `/welcome` or `/onboarding/create-organization` when a protected route requires an active org.

### 5.4 P1 — Error and loading boundaries (Next.js App Router)

| File | Purpose |
|---|---|
| `app/(protected)/error.tsx` | Unhandled error boundary inside the authenticated shell |
| `app/(protected)/loading.tsx` | Suspense fallback for the dashboard |
| `app/(unprotected)/error.tsx` | Error boundary on public auth pages |
| `app/(unprotected)/loading.tsx` | Skeleton on login / signup |
| `app/global-error.tsx` | Root-level error boundary (full HTML reset) |
| `app/not-found.tsx` | Catch-all 404 |

### 5.5 P2 — Domain "business" pages (template-level)

These depend on the eventual domain, but for a generic SaaS template they are useful placeholders:

| Route | Purpose |
|---|---|
| `/home` (or `/dashboard`) enriched | Real dashboard with activity, KPIs, quick actions. Today it is a one-line placeholder |
| `/projects` (or `/[orgSlug]/projects`) | Projects of the active org |
| `/projects/[id]` | Project detail |
| `/search` | Global search (command palette UX) |
| `/notifications` | Notification inbox |
| `/notifications/[id]` | Single notification |

### 5.6 P2 — Links that currently 404 from inside `apps/app`

`signup-form.tsx` references two links that do not exist inside `apps/app`:

```tsx
<Link href="/terms">Terms of Service</Link>
<Link href="/privacy">Privacy Policy</Link>
```

Today these pages live in `apps/web` (the public marketing site). The right fix is one of:

- **Keep linking to `apps/web`** — recommended, that is the purpose of the web/app split
- **Mirror them** — add `app/(unprotected)/terms/page.tsx` and `app/(unprotected)/privacy/page.tsx` in `apps/app` if you want a fully self-contained authenticated app

Same observation for `/security`, `/cookies`, `/legal` if you reference them later.

### 5.7 P3 — Support / contact

| Route | Purpose |
|---|---|
| `/help` | Help index (deep-link to `apps/docs`) |
| `/support` | Contact form |

### 5.8 Pages that do **not** belong in `apps/app`

For the record, the following live in `apps/web` (public) or `apps/docs` (documentation):

- `/`, `/pricing`, `/features`, `/blog`, `/changelog`, `/about` → `apps/web`
- `/docs/**` → `apps/docs`
- `/terms`, `/privacy`, `/cookies`, `/legal`, `/security.txt` → `apps/web` (today)

If one of these ends up being created in `apps/app`, that is usually a sign the web/app split has a hole.

### 5.9 Summary — page-count for a v1 post-plugin

| Priority | Pages | Count |
|---|---|---|
| **P0** | `/onboarding/create-organization`, `/accept-invitation`, `/settings/organization/{general,members,invitations,billing}` | 6 |
| **P1** | `/settings/{notifications,appearance,api-keys,activity}`, 2FA sub-tab, `/onboarding`, `error.tsx` ×2, `loading.tsx` ×2, `global-error.tsx`, `not-found.tsx` | 12 |
| **P2** | Real `/home`, `/projects`, `/projects/[id]`, `/search`, `/notifications`, `/notifications/[id]` | 6 |
| **P3** | `/help`, `/support` | 2 |
| **Total** | | **~27 pages** |

---

## 6. Frontend-specific recommendations

These complement the backend recommendations in `backend.md`. They are all about `apps/app` only.

### P0 — Required for the plugin to be usable from the UI

1. **Update `proxy.ts`** to check `session.activeOrganizationId`. Redirect to `/onboarding` if null on a protected route. Exclude `/accept-invitation` from this redirect. Without this, signed-in users without an org hit `/home` in a broken state.
2. **`/onboarding` as fallback page** (see 7.2) — not the first stop after signup, but the safety net for legacy sessions post-migration and the path for creating additional orgs.
3. **`/accept-invitation` page** (see 7.2) — the invitation acceptance page. `afterAcceptInvitation` hook sets the active org server-side; the page just renders the confirmation and redirects.

### P1 — Quality / correctness

3. **`lib/auth-client.ts`** with `organizationClient()` (and `ac` + `roles` deferred to v2).
4. **Replace the decorative `team-switcher.tsx`** with `org-switcher.tsx` backed by `useListOrganizations` + `useActiveOrganization` + `setActive`. Shows the auto-created org immediately on first login.
5. **Add the 6 error/loading boundaries** (see 5.4) so the app degrades gracefully and Next can stream skeletons.
6. **Add the 4 P1 settings pages** (`/settings/notifications`, `/settings/appearance`, `/settings/api-keys`, `/settings/activity`) to round out the settings surface.

### P2 — Polish

8. **Build a real `/home` dashboard** instead of the one-line placeholder. The plugin hands you a `activeOrganization`; use it.
9. **Mirror or relink** the `/terms` and `/privacy` references in `signup-form.tsx` so they do not 404 from inside `apps/app`.
10. **Add 2FA sub-tab** under `/settings/security` (the better-auth `twoFactor` plugin exists, no new infrastructure required).
11. **`/welcome` page is not needed** — users reach `/home` directly on signup. Drop it.
12. **Centralize the org context** — `authClient.useActiveOrganization()` and `authClient.useListOrganizations()` are the nanostore-backed hooks. Use them directly instead of each component calling `getSession`.

### P3 — Optional but valuable

12. **Add the 6 P2 domain pages** (`/projects`, `/projects/[id]`, `/search`, `/notifications`, `/notifications/[id]`, enriched `/home`) to make the app feel finished.
13. **Add the 2 P3 support pages** (`/help`, `/support`).
14. **Replace the existing `apps/app/README.md`** (still the default `create-next-app` README) with project-specific documentation.

---

## 7. Detailed implementation plan

This section details a step-by-step plan to land the 6 P0 pages in one go: **1 combined `/onboarding` page** (fallback + additional org creation) plus **5 `/settings/organization/*` management pages**.

> **`/onboarding` is NOT the first stop after signup.** First-time users land in `/home` directly. The org is auto-created by `databaseHooks`. `/onboarding` serves two purposes: (1) fallback for legacy sessions post-migration, (2) path to create additional orgs beyond the auto-created default.

### 7.1 Approach & file tree

| Page | Type | Role |
|---|---|---|
| `/onboarding` | Combined | `?id=` → accept; otherwise → create |
| `/settings/organization` | Layout + hub | Sub-nav + redirect to `/general` |
| `/settings/organization/general` | Edit | Name, slug, logo, metadata |
| `/settings/organization/members` | List | Members + inline invitation |
| `/settings/organization/invitations` | List | Pending + cancel/resend |
| `/settings/organization/billing` | Placeholder | Plan, invoices (Stripe later) |

```
apps/app/
├── app/(protected)/
│   ├── onboarding/
│   │   ├── page.tsx                            [NEW]
│   │   └── actions.server.ts                   [NEW]
│   └── settings/organization/
│       ├── layout.tsx                          [NEW]
│       ├── page.tsx                            [NEW]  (hub → redirect /general)
│       ├── general/page.tsx                    [NEW]
│       ├── members/page.tsx                    [NEW]
│       ├── invitations/page.tsx                [NEW]
│       ├── billing/page.tsx                    [NEW]
│       └── actions.server.ts                   [NEW]
├── components/organizations/                   [NEW]
│   ├── create-organization-form.tsx
│   ├── accept-invitation-card.tsx
│   ├── org-settings-form.tsx
│   ├── members-table.tsx
│   ├── invite-member-form.tsx
│   ├── invitations-table.tsx
│   └── org-switcher.tsx                        (replaces team-switcher.tsx)
├── components/sidebars/team-switcher.tsx       [MODIFY]
├── lib/auth-client.ts                          [MODIFY]
└── proxy.ts                                    [MODIFY]
```

**~20 files** in total.

### 7.2 `/onboarding` — combined page

**RSC logic:**

```ts
// app/(protected)/onboarding/page.tsx
// This page is NOT shown to first-time users (databaseHooks auto-creates the org).
// It serves as fallback for legacy sessions post-migration and for creating
// additional orgs via the org-switcher.
const session = await auth.api.getSession({ headers: await headers() })
const id = searchParams.get("id")

if (id) {
  return <AcceptInvitationCard invitationId={id} />
}
if (session.session.activeOrganizationId) {
  // Already has an org — redirect to home (or show org list + "create another")
  redirect("/home")
}
return <CreateOrganizationForm />
```

**Server actions** (`onboarding/actions.server.ts`):

| Action | Validation | Better-auth call | Return |
|---|---|---|---|
| `createOrganizationAction(prev, formData)` | Zod: `name` 2+, `slug` kebab-case unique | `auth.api.createOrganization({ body, headers })` | `redirect("/home")` or `{ ok:false, fieldErrors }` |
| `acceptInvitationAction(prev, formData)` | Zod: `token` required | `auth.api.acceptInvitation({ body: { invitationId }, headers })` | `redirect("/home")` or `{ ok:false, message }` |

> Note: `createOrganizationAction` is for **additional orgs**, not the first. The first org is auto-created by `databaseHooks.session.create.before` on signup. `afterAcceptInvitation` already sets the active org server-side — `acceptInvitationAction` redirects to `/home` after acceptance.

**Components:**
- `create-organization-form.tsx` — `useActionState`, live slug suggestion, error if slug taken (via `authClient.organization.checkSlug` on client)
- `accept-invitation-card.tsx` — shows summary (org name, role, expiresAt) before accept button

**Permission:** Any logged-in user without `activeOrganizationId` (legacy sessions) or any user reaching `/onboarding` from the org-switcher to create another org.

#### 7.2.1 Two paths overview

There are **two paths** for creating an organization. Both call `auth.api.createOrganization` — they differ in **where the call happens** and **what happens after**.

| Path | Context | Pattern | UX |
|---|---|---|---|
| **1. Auto (signup)** | First-time user, no active org | `databaseHooks.session.create.before` | Automatic, no user action. User lands in `/home` directly. |
| **2. `/onboarding` (fallback)** | Legacy session, or user wants a second org | Server action + `redirect` | Reach `/onboarding` from org-switcher, fill form, redirected to `/home`. Only for additional orgs. |

#### 7.2.2 Path 2 — `/onboarding` server action (additional orgs)

The high-level flow is covered above. Here is the full implementation.

> This is **not** the path for first-time users. First-time users go through `databaseHooks` automatically.

**Zod schema** (recommended location: shared `app/(protected)/onboarding/schema.ts` so client and server use the same validation):

```ts
// app/(protected)/onboarding/schema.ts
import { z } from "zod"

export const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40, "Slug must be 40 characters or fewer")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only")
    .regex(/^[a-z0-9]/, "Slug must start with a letter or number")
    .regex(/[a-z0-9]$/, "Slug must end with a letter or number"),
  logo: z
    .string()
    .url("Logo must be a valid URL")
    .optional()
    .or(z.literal("")),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>
```

**Server action** (full version):

```ts
// app/(protected)/onboarding/actions.server.ts
"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@workspace/auth"
import { APIError } from "better-auth"
import { createOrgSchema } from "./schema"

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const tree = z.treeifyError(error) as {
    properties?: Record<string, { errors?: string[] }>
  }
  const fieldErrors: Record<string, string[]> = {}
  for (const [key, prop] of Object.entries(tree.properties ?? {})) {
    if (prop?.errors) fieldErrors[key] = prop.errors
  }
  return fieldErrors
}

export type CreateOrgState =
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string }
  | { ok: true }
  | null

export async function createOrganizationAction(
  _prev: CreateOrgState,
  formData: FormData,
): Promise<CreateOrgState> {
  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    logo: formData.get("logo") || undefined,
  })

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await auth.api.createOrganization({
      body: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        logo: parsed.data.logo || undefined,
        // userId: optional, omitted → better-auth uses the session user
        // keepCurrentActiveOrganization: false (default)
      },
      headers: await headers(),
    })
  } catch (e) {
    if (e instanceof APIError) {
      // Common errors: SLUG_ALREADY_EXISTS, USER_LIMIT_REACHED, etc.
      return {
        ok: false,
        fieldErrors: { slug: [e.message ?? "Could not create organization"] },
      }
    }
    throw e
  }

  redirect("/home")
}
```

**Form component** (full version, reuses existing `InputField` and `SubmitButton` from `components/auth/`):

```tsx
// components/organizations/create-organization-form.tsx
"use client"

import { useActionState } from "react"
import { createOrganizationAction, type CreateOrgState } from "@/app/(protected)/onboarding/actions.server"
import { InputField } from "@/components/auth/field"
import { SubmitButton } from "@/components/auth/submit-button"
import { SlugField } from "./slug-field"

const initialState: CreateOrgState = null

export function CreateOrganizationForm() {
  const [state, formAction] = useActionState(createOrganizationAction, initialState)
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {}

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {state && !state.ok && state.message && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <InputField
        name="name"
        label="Organization name"
        autoComplete="organization"
        autoFocus
        required
        errors={fieldErrors.name}
      />

      <SlugField
        name="slug"
        label="URL slug"
        hint="Used in your organization URL."
        errors={fieldErrors.slug}
      />

      <InputField
        name="logo"
        label="Logo URL (optional)"
        type="url"
        errors={fieldErrors.logo}
      />

      <SubmitButton>Create organization</SubmitButton>
    </form>
  )
}
```

**`SlugField` helper** (reusable, performs the live `checkSlug` validation to avoid submissions that are guaranteed to fail):

```tsx
// components/organizations/slug-field.tsx
"use client"

import { useId, useState, useTransition } from "react"
import { authClient } from "@/lib/auth-client"
import { Input } from "@workspace/ui/components/input"

interface SlugFieldProps {
  name: string
  label: string
  hint?: string
  errors?: string[]
  defaultValue?: string
}

export function SlugField({ name, label, hint, errors, defaultValue }: SlugFieldProps) {
  const id = useId()
  const [value, setValue] = useState(defaultValue ?? "")
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [, startTransition] = useTransition()

  function onBlur() {
    if (!value || !/^[a-z0-9-]+$/.test(value)) {
      setStatus("idle")
      return
    }
    setStatus("checking")
    startTransition(async () => {
      const { data } = await authClient.organization.checkSlug({ slug: value })
      setStatus(data === false ? "taken" : "available")
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        aria-invalid={(errors?.length ?? 0) > 0 || status === "taken"}
        aria-describedby={`${id}-hint ${id}-status`}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <p
        id={`${id}-status`}
        aria-live="polite"
        className={`text-xs ${
          status === "available"
            ? "text-green-600"
            : status === "taken"
              ? "text-destructive"
              : "text-muted-foreground"
        }`}
      >
        {status === "checking" && "Checking…"}
        {status === "available" && "✓ This slug is available"}
        {status === "taken" && "✗ This slug is already taken"}
        {status === "idle" && " " /* non-breaking space to reserve height */}
      </p>
      {errors?.map((e) => (
        <p key={e} className="text-sm text-destructive" role="alert">
          {e}
        </p>
      ))}
    </div>
  )
}
```

#### 7.2.3 Additional orgs via `/onboarding`

The org-switcher "Create new organization" links to `/onboarding` (not a client-side dialog). This keeps a single server-action form and avoids duplicating the slug-check + validation logic.

```tsx
// org-switcher.tsx excerpt
<DropdownMenuItem
  onSelect={(e) => {
    e.preventDefault()
    router.push("/onboarding")
  }}
>
  <PlusIcon className="size-4" />
  Create new organization
</DropdownMenuItem>
```

The `/onboarding` page detects `session.session.activeOrganizationId` is set and shows the "create additional org" form. No need for a separate dialog component at v1.

#### 7.2.4 Comparison — org creation paths

| Aspect | Auto-create on signup | `/onboarding` (additional orgs) |
|---|---|---|
| **Trigger** | `databaseHooks.session.create.before` | User clicks "Create new org" in org-switcher |
| **Location** | Server hook, no user action | Full page at `/onboarding` |
| **Active org set** | Plugin sets `activeOrganizationId` in session | Server action + `nextCookies()` |
| **Slug uniqueness** | Auto-generated or user-provided | `SlugField` onBlur + `checkSlug` |
| **When to use** | First org for every signup | Creating a second (or nth) org |

#### 7.2.5 Internal side effects of `auth.api.createOrganization`

When `createOrganization` succeeds (from the server action or `databaseHooks`), better-auth performs these steps in order:

1. **Auth check** — reads the session cookie via `headers`, validates the user is authenticated.
2. **Authorization check** — evaluates `allowUserToCreateOrganization` (our config: `true`).
3. **Limit check** — evaluates `organizationLimit` (our config: `10`).
4. **Slug uniqueness** — checks the `organization` table for an existing row with the same `slug`. Returns `SLUG_ALREADY_EXISTS` if not unique.
5. **INSERT organization** — creates a row in the `organization` table with `id`, `name`, `slug`, `logo?`, `metadata?`, `createdAt`.
6. **INSERT member** — creates a row in the `member` table linking the user as `owner` (or `admin` if `creatorRole: "admin"`).
7. **Update session** — sets `session.activeOrganizationId` to the new org's `id`. This is what `nextCookies()` then writes back to the cookie.
8. **Run hooks** — executes `organizationHooks.afterCreateOrganization` if defined.
9. **Return** — the new organization data.

> **What does NOT happen on creation:**
> - No email is sent (unlike invitations)
> - No team is created (teams are a separate, opt-in feature)
> - No billing is set up
> - The user is NOT added to the new org as a member of any other org (memberships are per-org)

> **For `databaseHooks.session.create.before`:** the hook runs at step 0 (before the session is written). The hook creates the org and returns `activeOrganizationId` in the session data. `nextCookies()` writes it to the cookie on the same response.

### 7.3 `/settings/organization` — hub + layout

**`layout.tsx`:**
- RSC: reads `auth.api.getFullOrganization({ headers })` → `{ id, name, slug, members, invitations }`
- Renders sub-nav: **General · Members · Invitations · Billing**
- If no active org → `redirect("/onboarding")`
- If `hasPermission({ organization: ["read"] })` fails → `notFound()`

**`page.tsx` (hub):**
- Option A: `redirect("/settings/organization/general")` (simple)
- Option B: org dashboard (logo, member count, plan, recent activity) with CTAs to sub-tabs

**Recommendation: A for v1, B later.**

### 7.4 `/settings/organization/general`

| Field | Type | Editable |
|---|---|---|
| `name` | text | ✅ |
| `slug` | text (kebab) | ✅ |
| `logo` | url | ✅ |
| `metadata` | key/value UI or JSON | ✅ |
| `id` | text | read-only |
| `createdAt` | date | read-only |

Buttons: **Save** + **Delete organization** (gated `organization:delete`, confirmation modal)

**Server action:**
```ts
updateOrganizationAction(prev, formData)
  → Zod validation
  → auth.api.updateOrganization({ body: { data, organizationId }, headers })
  → revalidatePath("/settings/organization/general")
```

**Permission:** `organization:update` (owner + admin by default).

### 7.5 `/settings/organization/members`

**Content:**
- Invitation form at top: `email` + `role` select
- Table: email, role(s), joinedAt, row actions

**Components:**
- `invite-member-form.tsx` — `useActionState`
- `members-table.tsx` — server-fetched, rows with dropdown "Change role" + "Remove" button

**Server actions:**

| Action | Better-auth call | Permission |
|---|---|---|
| `inviteMemberAction` | `auth.api.inviteMember({ body: { email, role, organizationId }, headers })` | `invitation:create` |
| `updateMemberRoleAction` | `auth.api.updateMemberRole({ body: { memberId, role, organizationId }, headers })` | `member:update` |
| `removeMemberAction` | `auth.api.removeMember({ body: { memberIdOrEmail, organizationId }, headers })` | `member:delete` |

**Guardrail:** never allow removal of the last owner (better-auth refuses server-side; UI should also disable the button).

### 7.6 `/settings/organization/invitations`

**Content:**
- Table: email, role, inviter, status, expiresAt, actions

**Components:**
- `invitations-table.tsx` — empty state if 0 invitations, "expired" badge if past

**Server actions:**

| Action | Better-auth call |
|---|---|
| `cancelInvitationAction` | `auth.api.cancelInvitation({ body: { invitationId }, headers })` |
| `resendInvitationAction` | `auth.api.inviteMember({ body: { email, role, organizationId, resend: true }, headers })` |

**Permission:**
- `invitation:read` (list)
- `invitation:cancel` (cancel)
- `invitation:create` (resend)

### 7.7 `/settings/organization/billing`

**Content:**
- Current plan (placeholder: "Free" · "Pro" · "Enterprise" from `organization.metadata.plan`)
- "Upgrade" button → future Stripe Checkout
- Invoice list → future (empty for now)
- Payment method → future (empty)

**Important:** Better-auth does not cover billing. This page is a **visual placeholder**. For v2:
- Tables `subscription`, `invoice` in `packages/database/src/tables/`
- Webhook Stripe → update `organization.metadata.plan`
- Actions `createCheckoutSessionAction` (Stripe Checkout) + `manageBillingPortalAction` (Stripe Portal)

**Server action:** None for v1. Add 2 actions in `packages/api` when Stripe is wired.

### 7.8 Transversal changes

**`lib/auth-client.ts`:**
```ts
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
})
```

**`proxy.ts`:**
- Add to `PROTECTED_PREFIXES`: `/onboarding`, `/accept-invitation`, `/settings/organization`
- After `getSession`, check `session.session.activeOrganizationId`:
  - If route is `/home` or `/settings/organization/*` AND no active org → `redirect("/onboarding")`
  - If `?id=` on the route → let through (handled by `/onboarding`)

**`components/sidebars/team-switcher.tsx`** (replace with `org-switcher.tsx`):
Wire the existing component to:
- `authClient.useListOrganizations()` — shows all memberships (includes auto-created personal org)
- `authClient.useActiveOrganization()` — current selection
- `authClient.organization.setActive({ organizationId })` on click
- "Create new organization" → `router.push("/onboarding")` (for additional orgs)
- If 0 orgs (should not happen — `databaseHooks` always creates one on signup) → fallback CTA to `/onboarding`

### 7.9 Order of implementation

| Step | Prerequisite | Effort |
|---|---|---|
| 1. Backend (`packages/auth` + `packages/database`) | — | 1-2 d |
| 2. `lib/auth-client.ts` + `organizationClient()` | 1 | 0.5 h |
| 3. `proxy.ts` (org gate + matcher) | 1 | 1 h |
| 4. `/accept-invitation` + `acceptInvitationAction` | 1, 2 | 0.5 d |
| 5. `/onboarding` (fallback + additional org form) | 1, 3 | 0.5 d |
| 6. `org-switcher.tsx` + wiring sidebar | 4, 5 | 0.5 d |
| 7. `layout.tsx` + hub `page.tsx` | 2 | 0.5 d |
| 8. `/general` + `updateOrganizationAction` | 7 | 0.5 d |
| 9. `/members` + 3 actions | 7 | 1 d |
| 10. `/invitations` + 2 actions | 7 | 0.5 d |
| 11. `/billing` (placeholder) | 7 | 0.5 h |
| 12. Tests (unit + e2e manual) | all | 1 d |
| **Total** | | **6-9 days** |

### 7.10 Validation plan

**Tests to write:**
- `packages/auth/tests/organization.test.ts` — create org, set active, invite, accept, owner protection
- `packages/api/tests/organization-router.test.ts` — `organizationMiddleware` injects active org
- Integration tests — Drizzle queries on the new tables

**E2E manual (5 scenarios):**
1. **Sign up** → lands directly in `/home` (org auto-created by `databaseHooks`), org switcher shows 1 org
2. **Invite email** → mail received, `?id=` in link
3. **Accept via link** → added as member, active org set to invited org, lands in `/home`
4. **Org switcher** → switch between multiple orgs, "Create new org" goes to `/onboarding`
5. **Last owner protection** → Remove button disabled for the only owner

---

## 8. References

- [Better Auth — Organization plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth — Next.js integration](https://better-auth.com/docs/integrations/next)
- [Better Auth — Basic usage (client SDK)](https://better-auth.com/docs/basic-usage)
- [Better Auth skills — organization](https://github.com/better-auth/skills/tree/main/better-auth/organization) (official `SKILL.md`)
- [Discussion #4927 — server actions vs client SDK](https://github.com/better-auth/better-auth/discussions/4927) (confirms `auth.api` + server actions is the canonical Next.js pattern)
- [Issue #7005 — `getActiveOrganization` semantics](https://github.com/better-auth/better-auth/issues/7005)
- [Prior audit — `backend-packages-audit.md`](../backend-packages-audit.md) (2026-07-06) — baseline of the current stack
- [Companion document — `backend.md`](./backend.md) (packages/auth · packages/database · packages/api)

---

*Generated from a read-only analysis session; no source files were modified.*
