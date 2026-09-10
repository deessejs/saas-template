---
name: single-tenant
description: This template MUST stay single-tenant — no organization plugin, no org schema, no useActiveOrganization, no auto-create-org, no requireEmailVerificationOnInvitation
metadata:
  type: project
---

This template is **single-tenant by design** — there is exactly one user-owned workspace, and that's it. Re-confirmed by the user on 2026-07-28.

**Why:** Earlier iterations experimented with Better Auth's `organizationPlugin` (org auto-create, invitations, org-scoped roles, `useActiveOrganization`). The repo was re-scoped to single-tenant; the local senior guide that documented those patterns was removed in 2026-09-10 (chore: remove docs/). The single-tenant contract now lives only in code shape and the README "Customization" section.

**How to apply:**

- **Never reintroduce multi-tenant concepts** to: `packages/auth/src/auth.ts`, `packages/database/src/schema/`, `packages/auth/src/auth-client.ts`, any UI in `apps/`. That means no `organization(...)` plugin, no `databaseHooks.session.create.before` for org auto-create, no `organizationClient()` on the client, no `requireEmailVerificationOnInvitation`, no `allowUserToCreateOrganization`.
- **When proposing changes to better-auth**, the only authoritative references are the code itself and `README.md` § Customization.
- **When reviewing PRs** that touch auth/db/ui: any org-plugin reference is a regression (do not reintroduce).
- **Bugs `#9070` (session.create.before) and `#9710` (useActiveOrganization stale)** were tracked in this repo because the org plugin used them; they are now moot — do not apply the `#9710` workaround to the client (no `organizationClient()` is wired), and any code path using `session.create.before` should be verified against a single-tenant reason, not an org one.
- The single-tenant replacements the user explicitly cares about: `emailAndPassword.requireEmailVerification: true` for unverified-user gating, `emailVerification.sendOnSignUp: true` for the actual user (not for an org invitee). Both are already wired in `packages/auth/src/auth.ts` (verified 2026-07-28).

Related: [[packages-auth]] (Better Auth package workflow), [[better-auth-cli-release-blocker]] (CLI/runtime mismatch — still release-blocking regardless of single/multi-tenant), [[stack]] (catalog versions, including `better-auth ^1.6.23`).
