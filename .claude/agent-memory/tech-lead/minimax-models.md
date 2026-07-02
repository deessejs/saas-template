---
name: minimax-models
description: MiniMax model IDs and context windows — M3 is the new default (1M context, frontier coding + agentic), M2.1/M2 are legacy
metadata:
  type: project
---

The Eve tech-lead agent at `agents/tech-lead/` uses the **MiniMax native provider** (`vercel-minimax-ai-provider@^0.0.2`, Anthropic-compatible mode). Default config:

- **Model**: `MiniMax-M3` (since 2026-07-02)
- **Context window**: 1_000_000 tokens (M3's full native window)

Override via env in `agents/tech-lead/.env.local`:
- `MINIMAX_MODEL_ID` — any of: `MiniMax-M3` (1M), `MiniMax-M2.1` (128k), `MiniMax-M2.1-lightning`, `MiniMax-M2` (128k), or a custom string
- `MINIMAX_MODEL_CONTEXT_WINDOW` — adjust to actual model capability (M2.x = 128k, M3 = 1M)
- `MINIMAX_API_KEY` — required, get from https://platform.minimax.io

**Why M3 as default:** confirmed live on the MiniMax platform with 1M context window, frontier coding + agentic focus (verified via fresh fetch 2026-07-02). M3 supersedes M2.1 for new agent work.

**Why not the upstream provider's TypeScript types:** `vercel-minimax-ai-provider`'s `MinimaxChatModelId` only declares `MiniMax-M2 | MiniMax-M2.1 | MiniMax-M2.1-lightning | string`. `MiniMax-M3` falls through the `string` branch and is accepted at runtime. Don't update the provider's types — they're not ours to maintain.

**Caveat:** the provider is young (0.0.2, 12 ⭐). If the upstream type list catches up, the `string` fallback will narrow automatically.

Related: [[eve-init-side-effects]] (agent scaffold quirks).