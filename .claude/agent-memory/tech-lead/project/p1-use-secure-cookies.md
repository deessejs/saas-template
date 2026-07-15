---
name: p1-use-secure-cookies
description: 2026-07-13 P1 defect: Better Auth useSecureCookies is unconditional in packages/auth/src/auth.ts, breaking local HTTP login while leaving production correct
metadata:
  type: project
---

`packages/auth/src/auth.ts:51-53` sets `advanced.useSecureCookies: true` with no gate. Better Auth 1.6.23's `createCookieGetter` lets an explicit `useSecureCookies` win over every other resolution path (dynamic protocol, baseURL prefix, `isProduction`). With the static value, all six Better Auth cookies (session_token, session_data, account_data, dont_remember, plus OAuth state) get the `Secure` attribute in every environment.

Production remains correct because HTTPS is the production target. The defect only affects local HTTP onboarding: the user signs up, the browser refuses to store the `Secure` cookie, and every protected page bounces them to `/login`.

The repo already documents this defect and its fix in `docs/guides/better-auth/pitfalls.md:71-86`. The recommended fix is `useSecureCookies: process.env.NODE_ENV === "production"`. Until that edit lands, add `P1: local HTTP sessions silently break` to local onboarding QA.

**Why:** The repo's quick-start and `devcontainer` setup assumes HTTP localhost works. New contributors hit the symptom as "the app forgot me after sign-up", which looks like a session bug rather than a cookie attribute.

**How to apply:**
- Before claiming "login flow works", sign up a fresh user on a fresh dev database over plain HTTP and reload a protected page.
- Treat the pitfalls section §4 as acceptance criteria: when the fix lands, delete or rewrite §4 to describe the adopted state.
- Look for the `__Secure-` cookie name prefix in browser devtools as the diagnostic.

Full evidence and acceptance criteria: `temp/issues/P1-001-use-secure-cookies-non-env-gated.md`.

Related: [[packages-auth]], [[better-auth-cli-release-blocker]], [[feedback-verify-high-severity-findings]].
