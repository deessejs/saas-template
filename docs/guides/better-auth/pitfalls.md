# Better-Auth — Known Pitfalls

**Read this before any implementation.** These are behavioral bugs, non-obvious defaults, and removed features that have caused issues in this repo.

---

## 1. `autoCreateOrganizationOnSignUp` Does Not Exist

**Removed in [PR #4755](https://github.com/better-auth/better-auth/pull/4755) (September 2025, merged into canary).**

The TypeScript option existed in types but had no runtime implementation. It was silently removed rather than implemented. Do not search for it in the docs — it is gone.

**What we do instead:** see [`org.md`](./org.md) — the auto-create is implemented manually in `databaseHooks.session.create.before`.

**Source:** [Issue #4334](https://github.com/better-auth/better-auth/issues/4334) — original report of the non-functional option.

---

## 2. `session.create.before` Cannot Query Membership Rows on First Signup

**Status: [open bug #9070](https://github.com/better-auth/better-auth/issues/9070)**

The [documented pattern](https://better-auth.com/docs/plugins/organization) for setting `activeOrganizationId` in `session.create.before` fails on the **first signup** because the organization plugin creates the membership row *after* the session row.

Our current code creates the org inside `session.create.before` itself (not in a separate query), which may sidestep this — but it has not been tested end-to-end with the full membership flow.

**Test plan when touching this code:**
1. Sign up a brand new user
2. Verify `activeOrganizationId` is set in the `session` DB row
3. Verify `useActiveOrganization()` on the client returns the org (not `null`)
4. Sign out, sign back in — confirm it still works

If step 3 fails, fall back to the workaround in [`client.md`](./client.md).

**Source:** [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization) — official docs that recommend this pattern.

---

## 3. `useActiveOrganization` Returns Stale `null` After Sign-in

**Status: [open bug #9710](https://github.com/better-auth/better-auth/issues/9710), fix PRs [#9736](https://github.com/better-auth/better-auth/pull/9736) + [#9737](https://github.com/better-auth/better-auth/pull/9737) pending**

`$activeOrgSignal` invalidates only on `/sign-out` and `/organization/*` paths. It does **not** invalidate on `/sign-in/email`. So after sign-in, `useActiveOrganization()` keeps its pre-session cached value (typically `null`) until a hard page refresh.

**Workaround (apply in `auth-client.ts` or a client-side wrapper):**

```ts
// apps/app/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [organizationClient()],
})

// Workaround for #9710: useActiveOrganization returns stale null after sign-in
let initialized = false
authClient.$sessionSignal.subscribe(() => {
  if (initialized) {
    authClient.$activeOrgSignal.value = null
  }
  initialized = true
})
```

Until the upstream fix lands, this workaround is required for a correct UX.

**Source:** [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization) — official `setActiveOrganization` docs.

---

## 4. `advanced.useSecureCookies: true` Breaks Local Dev

Setting `useSecureCookies: true` forces the `Secure` cookie attribute in **all environments**, including `NODE_ENV=development`. Without HTTPS in local dev, cookies are silently rejected by the browser and sessions never work.

**Current state in this repo:** this option is set. Local dev must use `http://localhost:3000` and the browser must not block cookies.

**Fix:** either remove the line (cookies are secure by default in production anyway) or guard it:

```ts
advanced: {
  useSecureCookies: process.env.NODE_ENV === "production",
},
```

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies) — "cookies are secure only in production by default."

---

## 5. `localhost` in `trustedOrigins` Risks Prod Leak

`trustedOrigins` currently includes hardcoded `http://localhost:3000` and `http://localhost:3001`. This is fine in development, but if `ALLOWED_ORIGINS` is empty in production, localhost origins are still trusted — a potential security issue.

**Fix:** guard with `NODE_ENV`:

```ts
trustedOrigins: [
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
  ...serverEnv.ALLOWED_ORIGINS,
],
```

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — `trustedOrigins` config.

---

## 6. `sendOnSignUp` Is Temporarily `false`

Email verification on signup is disabled as a temporary bypass (commit message: "disable email verification (temp bypass)"). The code has `sendOnSignUp: false`.

**When reactivating:** set it to `true` explicitly. Do not rely on the `undefined` default, which depends on `requireEmailVerification` to trigger the send.

**Source:** [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password) — `sendOnSignUp` options documented under email verification config.

---

## 7. Auth Middleware Throws Plain `Error`, Not `ORPCError`

In `packages/api/src/router/middlewares/auth.ts`:

```ts
throw new Error("Authentication required")
```

oRPC's error handling may not map a plain `Error` to the correct HTTP status code. The correct throw should be:

```ts
import { ORPCError } from "@orpc/server"
throw new ORPCError({ code: "UNAUTHORIZED", message: "Authentication required" })
```

This is tracked as a minor issue since oRPC may still surface the message, but the status code may be wrong (500 instead of 401).
