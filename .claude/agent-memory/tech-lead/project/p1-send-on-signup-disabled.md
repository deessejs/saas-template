---
name: p1-send-on-signup-disabled
description: 2026-07-13 P1 finding: Better Auth sendOnSignUp is not set and apps/app proxy does not gate protected routes on emailVerified; introduced by f42933e as a temp bypass.
metadata:
  type: project
---

`packages/auth/src/auth.ts` enables email-and-password and sets `requireEmailVerification: true`, but the `emailVerification` block omits both `sendOnSignUp` and `sendOnSignIn`. `apps/app/proxy.ts` reads `auth.api.getSession` only for membership truthiness; it does not inspect `session.user.emailVerified`.

Better Auth 1.6.23 sign-up code (`sign-up.ts:165-189`) computes `shouldSendVerificationEmail = emailVerification?.sendOnSignUp ?? requireEmailVerification` and `shouldSkipAutoSignIn = autoSignIn === false || requireEmailVerification`. With the current config a verification email still goes out (good), but the signup endpoint returns `token: null`. The signup form's `onSuccess` (`signup-form.tsx:124-139`) routes to `/home`, the proxy bounces, and the user lands on `/login`. Worse: while no session is created, a stale session cookie from earlier interactions would still pass the proxy without any `emailVerified` check.

Introduced by `f42933e` ("chore: disable email verification (temp bypass) + add @workspace/email package") and explicitly flagged as temporary in `docs/guides/better-auth/pitfalls.md:107-114` and `docs/guides/better-auth/index.md:16,67`.

**Why:** The current state is internally inconsistent: required verification but no proxy gate. Until verified, signed-in unverified users can mutate per-user state. The UI also claims a session on signup before verification.

**How to apply:**
- Re-enable `emailVerification.sendOnSignUp: true` and `emailVerification.sendOnSignIn: true`.
- Make `apps/app/proxy.ts` redirect unverified users from `PROTECTED_PREFIXES` to `/verify-email`.
- Update `/login` to surface the `403 EMAIL_NOT_VERIFIED` error so the re-attempt after resend is clear.
- Once both land, mark the "temp bypass" framing obsolete; keep the pitfall guide as the canonical "do not re-disable" reference.

Verification before sign-off: dev sign-up with `MAIL_TRANSPORT=console` should land on `/verify-email` and never expose protected pages until `emailVerified` flips to true. Confirm via `packages/auth/tests/email.test.ts` or a sibling integration test.

Full evidence and acceptance criteria: `temp/issues/P1-003-send-on-signup-email-verification-disabled.md`.

Related: [[packages-auth]], [[p1-use-secure-cookies]], [[p1-trusted-origins]], [[better-auth-cli-release-blocker]].
