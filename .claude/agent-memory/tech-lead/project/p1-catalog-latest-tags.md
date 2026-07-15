---
name: p1-catalog-latest-tags
description: 2026-07-13 P1 finding: pnpm-workspace.yaml sets `latest` for better-auth, @better-auth/drizzle-adapter, @orpc/server, and zod, defeating the contract of catalogMode: strict.
metadata:
  type: project
---

`pnpm-workspace.yaml:23,34,50,83` set `latest` for `@better-auth/drizzle-adapter`, `@orpc/server`, `better-auth`, and `zod`. The current lockfile resolves them to 1.6.23 / 1.14.7 / 1.6.23 / 4.4.3 respectively, but `latest` means those versions can change without any catalog edit.

The catalog's stated principle (line 14 comment) is "Shared dependency versions — update here, propagate everywhere." Using `latest` defeats reproducibility: a `pnpm install` from a fresh checkout, or a `pnpm update --latest`, can swap to a new minor/major without anyone editing the catalog file.

The four `latest` entries share one negative impact: the resolved version drifts, and breaks the catalog's contract that the catalog is the unit of decision.

**Why:** Better Auth has shipped breaking changes between minors (1.4 → 1.5 renamed the CLI package to `auth`; 1.6 added CLI fixes for Drizzle default values). Zod is currently mid v3→v4 migration. oRPC also refreshes its server contract. Floating `latest` against those packaging realities creates uncontrolled churn.

**How to apply:**
- When a new contributor adds `latest` to the catalog, redirect them to a caret range and a reviewed version.
- Don't accept `pnpm update --latest` outside a release flow that updates the catalog first.
- Treat the four `latest` entries as part of the same release group as the P0-001 CLI fix.

Concrete replacement proposal (subject to review): `^1.6.23`, `^1.14.7`, `^1.6.23`, `^4.4.3`. The fix lands alongside a deliberate bump of each package, an updated `pnpm-lock.yaml`, and a CHANGELOG note.

Verification before sign-off: two CI runs a week apart produce identical lockfile content. `pnpm install --frozen-lockfile` does not regenerate the lockfile.

Full evidence and acceptance criteria: `temp/issues/P1-005-catalog-latest-tags.md`.

Related: [[better-auth-cli-release-blocker]], [[packages-auth]], [[feedback-long-term-solutions]].
