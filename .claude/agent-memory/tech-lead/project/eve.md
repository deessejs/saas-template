---
name: eve-integration
description: Eve agent integration in pnpm monorepo — init side effects, MiniMax M3 provider, scaffold quirks
metadata:
  type: project
---

# Eve Agent integration in pnpm monorepo

## `npx eve@latest init` side effects

When scaffolding an Eve agent via `npx eve@latest init <name>` in a pnpm workspace, the CLI modifies files **outside** the target directory:

1. **`pnpm-workspace.yaml`** (root): adds the agent path to `packages:` (e.g. `- agents/*`) AND a `minimumReleaseAgeExclude` block listing Eve deps (`@ai-sdk/*`, `eve`, `ai`, `@vercel/*`, `rolldown`, `workflow`, etc.).
2. **`package.json`** (root): bumps `"engines.node"` to `"24.x"`. Eve requires Node >=24 and forces this on the parent project.

**Why**: undocumented Eve behavior (or pnpm auto-detection during install) that contradicts the natural "agent lives in its own folder" mental model. Verified on 2026-07-02 with `eve@0.18.2` against this monorepo.

**How to apply**:
- ALWAYS check `git diff` of `package.json` and `pnpm-workspace.yaml` after `npx eve@latest init`.
- ALWAYS revert the root `package.json` engine bump back to the project's true minimum (this template: `>=20`). Keeping `24.x` would break end users on Node 20.
- The `agents/*` workspace entry is intentional (user accepted this trade-off) but can be removed if strict isolation is needed — use `pnpm install --ignore-workspace` from `agents/<name>/` then.
- Keep the `minimumReleaseAgeExclude` block: `eve`, `ai`, etc. need fresh releases otherwise blocked by `minimumReleaseAge`.

## `eve dev` scaffold quirks

- **`eve dev` generates a full Next.js web UI by default.** On first launch it scaffolds `next.config.ts`, Tailwind, Radix UI, Shiki, etc. — 28+ packages, a `vercel.json` with dual-service config, and rewrites `package.json` scripts to `next build/dev/start`. To get a CLI-only agent, delete all web files after scaffold.
- **`eve dev` also re-bumps the root engine to `24.x`** on subsequent launches if it detects it's missing. Revert manually after each `eve dev` run.

## MiniMax model provider

The Eve tech-lead agent uses the **MiniMax native provider** (`vercel-minimax-ai-provider@^0.0.2`, Anthropic-compatible mode).

Default config:
- **Model**: `MiniMax-M3` (since 2026-07-02)
- **Context window**: 1_000_000 tokens (M3's full native window)

Override via env in `agents/tech-lead/.env.local`:
- `MINIMAX_MODEL_ID` — any of: `MiniMax-M3` (1M), `MiniMax-M2.1` (128k), `MiniMax-M2.1-lightning`, `MiniMax-M2` (128k), or a custom string
- `MINIMAX_MODEL_CONTEXT_WINDOW` — adjust to actual model capability (M2.x = 128k, M3 = 1M)
- `MINIMAX_API_KEY` — required, get from https://platform.minimax.io

**Why M3 as default**: confirmed live on the MiniMax platform with 1M context window, frontier coding + agentic focus. M3 supersedes M2.1 for new agent work.

**Why not the upstream provider's TypeScript types**: `vercel-minimax-ai-provider`'s `MinimaxChatModelId` only declares `MiniMax-M2 | MiniMax-M2.1 | MiniMax-M2.1-lightning | string`. `MiniMax-M3` falls through the `string` branch and is accepted at runtime. Don't update the provider's types — they're not ours to maintain.

**Caveat**: the provider is young (0.0.2, 12 ⭐). If the upstream type list catches up, the `string` fallback will narrow automatically.

Related: [[template-strategy]] (don't impose maintainer tooling constraints on end users), [[vercel-deploy]].
