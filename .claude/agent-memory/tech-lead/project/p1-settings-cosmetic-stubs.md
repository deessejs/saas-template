---
name: p1-settings-cosmetic-stubs
description: 2026-07-13 P1 finding: apps/app/components/settings/* simulates delete-account, password change, profile save, email change, sessions, and connected-account flows with setTimeout + DUMMY_* constants.
metadata:
  type: project
---

Six settings components simulate their actions with `setTimeout` and hard-coded dummy data, leaving a `// TODO: wire to better-auth` comment in each:

- `delete-account-dialog.tsx` — 2-second `setDone(true)` after confirmation
- `password-form.tsx` — 3-second `setSaved(true)` on submit
- `profile-form.tsx` — same `setSaved` pattern
- `email-form.tsx` — `setSent(true)` on submit, no mailer call
- `sessions-table.tsx` — `DUMMY_SESSIONS`, local `setSessions` filter for revoke actions
- `connected-accounts-list.tsx` — `DUMMY_LINKED`, local filter for link/unlink

The riskiest consequence is the account-deletion stub: the user sees "Account deleted" but the session remains valid and a reload returns to `/home`. Password change leaves the existing hash in `account.password`; profile and email changes leave the `user` row untouched; sessions and connected-accounts are entirely client-side, with browser-native `confirm()` dialogs blocking the UI.

**Why:** This is the only surface in the apps that touches the user's most security-sensitive actions. A user who trusted the green "deleted" banner would think they had removed their account and would not know to retry or escalate.

**How to apply:**
- Replace each stub with the matching Better Auth client method (`authClient.deleteUser`, `changePassword`, `updateUser`, `sendVerificationEmail`, `listSessions`, `revokeSession`, `revokeOtherSessions`, `listAccounts`, `linkSocial`, `unlinkSocial`).
- Drop `confirm()` in favor of `shadcn` `AlertDialog`.
- Reuse the `OAuthButtons`-style loading-and-error pattern from P1-007 for `linkSocial` failures.
- The OAuth provider wiring required by `linkSocial` is the same wiring missing from P1 (see [[project/p1-shadcn-oauth-shadow-wire-up|…]]).

Verification before sign-off: run each of the six actions against a fresh database and confirm the relevant DB row changed. Specifically, verify `account.password` updates after the password form submit.

Full evidence and acceptance criteria: `temp/issues/P1-006-settings-cosmetic-stubs.md`.

Related: [[project/p1-oauth-buttons-no-error|…]], [[packages-auth]], [[feedback-verify-high-severity-findings]].
