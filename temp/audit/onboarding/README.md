# SaaS Onboarding Strategy — Better-Auth Organization Plugin

**Date:** 2026-07-08
**Status:** Decisions locked. Implementation-ready.
**Reference:** Vercel's production better-auth implementation (auto-create pattern).
**Inputs:** better-auth.com/docs/plugins/organization, YuSMP B2B SaaS Onboarding Patterns (2026), Tenet SaaS Onboarding UX Best Practices (2026), `temp/audit/organizations/` backend + frontend audits.

---

## Decision record

| # | Decision | Choice |
|---|---|---|
| D1 | Signup → first org | **Auto-create via `databaseHooks.session.create.before`** |
| D2 | Zero-org state | **Forbidden — strict gate in `proxy.ts`** |
| D3 | Invitation → needs own org first | **No** — `acceptInvitation` works without org |
| D4 | Accept invitation → auto-set active org | **Yes** — via `organizationHooks.afterAcceptInvitation` |
| D5 | Session migration | **Default `NULL` column** — deploy before org-switcher is live |
| D6 | When to set `activeOrganizationId` | `databaseHooks.session.create.before` (signup) + `afterAcceptInvitation` hook |
| D7 | Where to check it | `proxy.ts` — all protected routes except `/accept-invitation` |
| D8 | RBAC | **Static** (default roles) — dynamic deferred to v2 |
| D9 | Teams | **Off** — add `teams.enabled: true` when needed |
| D10 | Email verification on invitation | **`true`** |

---

## 1. Plugin scope

The `organization` plugin provides:

- **Tables:** `organization`, `member`, `invitation`, opt-in `team`, opt-in `teamMember`, opt-in `organizationRole`
- **Session column:** `activeOrganizationId` (required), opt-in `activeTeamId`
- **API surface:** ~30 server endpoints (`auth.api.*`) + ~20 client methods (`authClient.organization.*`)
- **Hooks:** `before/afterCreateOrganization`, `before/afterAddMember`, `before/afterCreateInvitation`, `before/afterAcceptInvitation`, etc.
- **Session linkage:** `activeOrganizationId` stored server-side in the `session` row, mirrored client-side via nanostores

The plugin does **not** prescribe the onboarding UX, billing, or email delivery. Those are the decisions in this document.

---

## 2. User flows

### Flow 1 — Self-signup (dominant path)

```
/signup
  → verify email
  → databaseHooks.session.create.before: auto-create org (e.g. "John's workspace")
  → activeOrganizationId set in session
  → redirect to /home
  → sidebar: org-switcher shows 1 org
```

User reaches `/home` and first value immediately. No `/onboarding` stop.

### Flow 2 — Invitation (user has no org yet)

```
/accept-invitation?id=xxx
  → not logged in → /signup → verify email → /accept-invitation?id=xxx
  → logged in → acceptInvitation (email match checked by plugin)
    → databaseHooks fires: auto-creates user's personal org
    → afterAcceptInvitation hook: setActiveOrganization to invited org
  → redirect to /home
  → sidebar: org-switcher shows [invited org] (active)
  → user is immediately in the invited org
```

### Flow 3 — Existing user accepts second invitation

```
/home (active org: Acme)
  → email: "join Client Corp" invitation link
  → /accept-invitation?id=yyy
  → acceptInvitation
    → afterAcceptInvitation hook: setActiveOrganization to Client Corp
  → redirect to /home
  → sidebar: org-switcher shows [Acme, Client Corp] (Client Corp is active)
```

Users who auto-created an org and then receive an invitation will have two orgs. The org-switcher handles switching — Vercel uses the same pattern.

---

## 3. `proxy.ts` gate

After `getSession`, check `session.session.activeOrganizationId`. Redirect to `/onboarding` if null on a protected route.

`/accept-invitation` is excluded — an invited user without an org must reach it:

```
if (path !== "/accept-invitation" && !path.startsWith("/accept-invitation/")) {
  if (no active org && path requires org) → redirect to /onboarding
}
```

`/onboarding` exists as:
1. A fallback for legacy sessions post-migration (they land there with null, and `databaseHooks` fires on their next auth)
2. A path to create additional orgs beyond the auto-created default (via org-switcher)

---

## 4. Session migration

`ALTER TABLE session ADD COLUMN active_organization_id DEFAULT NULL`.

Existing cookies remain valid. `getSession()` returns `null` for old sessions until they re-authenticate. They land in `/onboarding` (the fallback path), `databaseHooks` fires on their next session creation, and their `activeOrganizationId` is set.

Deploy this migration **before** the org-switcher and `databaseHooks` are live. Sequence: migration → restart → org-switcher.

---

## 5. Implementation phases

### Phase 1 — Backend foundation (1–2 days)

1. Add `organization` plugin to `packages/auth/src/index.ts`
2. Add `organization` plugin to `packages/auth/src/auth.config.ts` (extract to `organizationConfig.ts` to avoid drift)
3. Wire `sendInvitationEmail` (mailer — currently missing for all flows)
4. Add `databaseHooks.session.create.before` → auto-create org on signup
5. Add `organizationHooks.afterAcceptInvitation` → `auth.api.setActiveOrganization` to the invited org
6. Set `requireEmailVerificationOnInvitation: true`
7. Run `pnpm --filter @workspace/auth auth:generate`
8. Run `pnpm --filter @workspace/database db:generate && db:migrate`
9. Extend pg-mem DDL in `packages/database/tests/setup.ts` and `packages/auth/tests/setup.ts`
10. Add `organizationMiddleware` to `packages/api` (reads `session.activeOrganizationId`, injects into oRPC context)

### Phase 2 — `proxy.ts` + fallback (0.5 day)

1. Update `proxy.ts`:
   - add `/onboarding` to `PROTECTED_PREFIXES`
   - add `/accept-invitation` to protected routes
   - check `activeOrganizationId` after `getSession`, exclude `/accept-invitation` from redirect
2. Create `app/(protected)/onboarding/page.tsx` as fallback for legacy sessions and additional org creation

### Phase 3 — Org switcher (0.5 day)

1. Add `organizationClient()` to `lib/auth-client.ts`
2. Replace decorative `team-switcher.tsx` with `org-switcher.tsx`:
   - `useListOrganizations` → all memberships
   - `useActiveOrganization` → current selection
   - `organization.setActive` → on selection
   - "Create new organization" → `/onboarding`

### Phase 4 — Settings org (1–2 days)

1. `app/(protected)/settings/organization/layout.tsx` + hub `page.tsx`
2. `/settings/organization/general` + `updateOrganizationAction`
3. `/settings/organization/members` + `inviteMemberAction`, `updateMemberRoleAction`, `removeMemberAction`
4. `/settings/organization/invitations` + `cancelInvitationAction`
5. `/settings/organization/billing` (placeholder — Stripe deferred to v2)

### Phase 5 — Polish (0.5 day)

1. `error.tsx` and `loading.tsx` boundaries
2. `not-found.tsx`
3. `global-error.tsx`
4. Replace fake `SessionsTable` + `ConnectedAccountsList` with real better-auth data
5. Write `packages/auth/tests/organization.test.ts`

---

## References

- [Better Auth — Organization plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth — Organization skill](https://github.com/better-auth/skills/tree/main/better-auth/organization)
- YuSMP Group — *B2B SaaS Onboarding Patterns* (2026-01-04)
- Tenet — *SaaS Onboarding UX Best Practices* (2026-02-23)
- `temp/audit/organizations/backend.md` (2026-07-07)
- `temp/audit/organizations/frontend.md` (2026-07-07)
