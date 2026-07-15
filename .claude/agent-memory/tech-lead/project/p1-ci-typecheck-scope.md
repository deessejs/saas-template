---
name: p1-ci-typecheck-scope
description: 2026-07-13 P1 finding: .github/workflows/ci.yml typecheck job filters to three packages and runs pnpm install without --frozen-lockfile.
metadata:
  type: project
---

The typecheck job runs:

```sh
pnpm install
pnpm turbo typecheck --force \
  --filter=@workspace/api --filter=@workspace/auth --filter=@workspace/database
```

Two compounding defects:

1. The filter excludes `apps/app`, `apps/web`, `apps/docs`, `packages/ui`, `packages/email`, `packages/cookies`, `packages/utils`, `packages/eslint-config`, and `packages/typescript-config`. Type regressions in apps land on `main` and only get caught locally.
2. `pnpm install` without `--frozen-lockfile` (the other four jobs all use it) silently absorbs lockfile drift instead of failing on it.

`turbo.json` already declares `typecheck: { dependsOn: ["^build", "^typecheck"] }`. Dropping the filter runs every workspace that has a `typecheck` script (all three apps do: `tsc --noEmit`).

**Why:** Branch protection on `main` relies on the typecheck job to gate merging. As written, only three of twelve workspaces are actually guarded.

**How to apply:**
- When editing the workflow, mirror the install pattern of the other jobs: `pnpm install --frozen-lockfile`.
- Run `pnpm turbo typecheck` without filters, or add explicit app filters (`--filter=@workspace/app --filter=@workspace/web --filter=@workspace/docs`).
- Drop `--force` once cache hits settle, or keep it if cache-hit ratio is irrelevant for the typecheck step.
- Before flagging "all green", confirm in the PR checks UI that the typecheck job covers the file you're touching.

Verification before sign-off: a deliberate `--frozen-lockfile` failure must turn CI red. A type error in `apps/app/app/page.tsx` must turn CI red.

Full evidence and acceptance criteria: `temp/issues/P1-004-ci-typecheck-scope-and-lockfile.md`.

Related: [[feedback-verify-high-severity-findings]], [[feedback-long-term-solutions]].
