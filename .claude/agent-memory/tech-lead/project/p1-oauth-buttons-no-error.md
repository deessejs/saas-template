---
name: p1-oauth-buttons-no-error
description: 2026-07-13 P1 finding: OAuthButtons component is duplicated between login-form.tsx and signup-form.tsx; setLoading has no cleanup; no toast on signIn.social failure.
metadata:
  type: project
---

`apps/app/components/auth/login-form.tsx:15-56` and `signup-form.tsx:68-109` contain two `OAuthButtons` components, byte-for-byte identical except for surrounding boilerplate. A `diff -u` of the two files shows only differences in imports, schemas, and helper components. Each copy:

- Calls `authClient.signIn.social({ provider, callbackURL: '/home' })` and ignores the return value.
- Has no `try/finally`; `setLoading(provider)` is set on click but never cleared on rejection, so the buttons display "Redirecting…" until a page reload.
- Surfaces no error toast when `signIn.social` rejects.

With no `socialProviders` in `packages/auth/src/auth.ts`, every click triggers `404 PROVIDER_NOT_FOUND` from Better Auth 1.6.23. The user sees a frozen "Redirecting…" state with no error message.

**Why:** Same defect, two places. Any provider addition, layout tweak, or accessibility fix has to be replicated. The error-handling omission makes OAuth failures unreproducible — the user never sees feedback, support never receives a report.

**How to apply:**
- Extract `apps/app/components/auth/oauth-buttons.tsx` as the single source. Keep the provider list (Google, GitHub) in a shared constant.
- Wrap the social call in `try { ... } catch (error) { toast.error(...) } finally { setLoading(null) }`.
- Use the absolute redirect URL from the response (`data.url`) when present instead of relying only on `callbackURL`.
- Coordinate with P1-006 to make the connected-accounts flow use the same shared component.

Verification before sign-off: disable provider wiring, click Google, confirm a visible error appears within one second, confirm the buttons re-enable on the next click. Re-enable a provider and verify the round trip to `/home`.

Full evidence and acceptance criteria: `temp/issues/P1-007-oauth-buttons-duplication-no-error-handling.md`.

Related: [[project/p1-settings-cosmetic-stubs]], [[packages-auth]], [[feedback-verify-high-severity-findings]].
