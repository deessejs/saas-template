---
name: eve-init-side-effects
description: npx eve@latest init modifies parent's pnpm-workspace.yaml AND bumps root package.json engine to 24.x — manual revert required
metadata:
  type: project
---

When scaffolding an Eve agent via `npx eve@latest init <name>` in a pnpm workspace, the CLI modifies files **outside** the target directory:

1. **`pnpm-workspace.yaml`** (root) — adds the agent path to `packages:` (e.g. `- agents/*`) AND a `minimumReleaseAgeExclude` block listing Eve deps (`@ai-sdk/*`, `eve`, `ai`, `@vercel/*`, `rolldown`, `workflow`, etc.).
2. **`package.json`** (root) — bumps `"engines.node"` to `"24.x"`. Eve requires Node >=24 and forces this on the parent project.

**Why:** This is undocumented Eve behavior (or pnpm auto-detection during install) that contradicts the natural "agent lives in its own folder" mental model. Verified on 2026-07-02 with `eve@0.18.2` against this monorepo.

**How to apply:**
- When integrating an Eve agent into a multi-package pnpm workspace, ALWAYS check `git diff` of `package.json` and `pnpm-workspace.yaml` after `npx eve@latest init`.
- **Always revert** the root `package.json` engine bump back to the project's true minimum (this template: `>=20`). Keeping `24.x` would break end users on Node 20.
- The `agents/*` workspace entry is intentional (user accepted this trade-off) but can be removed if strict isolation is needed — use `pnpm install --ignore-workspace` from `agents/<name>/` then.
- The `minimumReleaseAgeExclude` block is necessary: `eve`, `ai`, etc. need fresh releases that would otherwise be blocked by `minimumReleaseAge`. Keep it.
- **`eve dev` generates a full Next.js web UI by default.** On first launch it scaffolds `next.config.ts`, Tailwind, Radix UI, Shiki, etc. — 28+ packages, a `vercel.json` with dual-service config, and rewrites `package.json` scripts to `next build/dev/start`. To get a CLI-only agent, delete all web files after scaffold (see `agents/tech-lead/` cleanup from 2026-07-02).
- **`eve dev` also re-bumps the root engine to `24.x`** on subsequent launches if it detects it's missing. Revert manually after each `eve dev` run.
- Related: [[template-strategy]] (don't impose maintainer tooling constraints on end users).