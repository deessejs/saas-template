---
name: p1-trusted-origins
description: 2026-07-13 P1 finding: packages/auth/src/auth.ts hardcodes http://localhost:3000 and :3001 in trustedOrigins; Better Auth 1.6.23 origin-check middleware uses whatever list it receives.
metadata:
  type: project
---

`packages/auth/src/auth.ts:11-15` merges `["http://localhost:3000", "http://localhost:3001"]` with `serverEnv.ALLOWED_ORIGINS` regardless of `NODE_ENV`. `packages/env/src/schema.ts:34-37` makes the same localhost values the default for `ALLOWED_ORIGINS`, so an empty env silently re-adds the dev hosts.

The list feeds two Better Auth gates: CSRF for state-changing POST/PUT/DELETE/PATCH and the four callback URL fields (`callbackURL`, `redirectTo`, `errorCallbackURL`, `newUserCallbackURL`). With the localhost entries trusted in production, an attacker that can reach `http://localhost:3000` on the deployment host gets past the CSRF check (delegated entirely by Better Auth to the user-supplied list — no internal `NODE_ENV` filter).

**Why:** The repo's own pitfalls guide `docs/guides/better-auth/pitfalls.md:88-105` documents the risk and prescribes the conditional. The configuration does not match the documented intent. The defect is environmental — most managed deployments with no localhost ingress are unaffected; self-hosted, Codespaces, and on-prem staging are.

**How to apply:** When reviewing auth config or onboarding a deployer, ask whether the production environment ever serves on `localhost:3000`/`3001`. If yes, gate the entries. If no, treat the defect as latent and prioritize other improvements. The pitfalls §5 will move to "implemented" once the gate lands.

The unit of work for verification: a `NODE_ENV=production` build must reject `Origin: http://localhost:3000` with `403` while accepting `Origin: https://prod.example` against the configured trust list.

Full evidence and acceptance criteria: `temp/issues/P1-002-trusted-origins-localhost-leak.md`.

Related: [[packages-auth]], [[p1-use-secure-cookies]], [[better-auth-cli-release-blocker]], [[feedback-verify-high-severity-findings]].
