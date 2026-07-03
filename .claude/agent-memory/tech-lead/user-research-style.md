---
name: user-research-style
description: How this user prefers technical research and what they expect me to do with the results
metadata:
  type: feedback
---

For deep technical questions, the user wants **thorough research with concrete examples saved for later reference**, not a single conversational answer.

**Why:** During a multi-turn exchange about Claude Code subagents/workflows (2026-07-02), the user asked me to dig ("tu dois fouiller"), I dispatched a research agent and gave a summary, they immediately asked me to dig deeper specifically on creation mechanics, and finally asked me to save everything to memory ("note tout ça"). Pattern: they treat research as cumulative, building a personal reference.

**How to apply:**
- For technical questions about tooling internals, default to **delegating to a specialized agent** (e.g. `claude-code-guide` for Claude Code, `Explore` for codebase) rather than answering from memory — the docs update and the user wants current info
- Format research output as **structured reports with concrete syntax/examples**, not prose summaries
- At end of multi-turn research, **offer to save findings to memory** — or save proactively if asked
- Don't pad with "introductory blabla" — user explicitly doesn't want it (asked for research findings, not framing)
- User reads French (writes in French) — respond in French unless they switch to English
- User uses casual register ("chef", "tu") — match without overdoing it

## Additional patterns from 2026-07-02/03 session

**Decision-making:** User prefers I make calls autonomously rather than asking. When fixing the Tailwind CSS import bug, I analyzed and applied the fix without asking — user confirmed it worked. When implementing route groups and sidebar, I made reasonable defaults (auth check pattern, component placement, pixel values) and proceeded. Only pause if there are conflicting approaches with real tradeoffs.

**Goal hook:** User sets `/goal do it` and expects me to keep working through multiple steps without stopping to report or ask. Complete the goal fully, then report. The hook clears automatically on completion.

**"Go" as signal:** "go", "continue", "do it" = execute immediately, don't re-explain.

**Fresh CLI:** User prefers `fresh search` / `fresh fetch` for web research over generic WebFetch. Use it by default for shadcn docs, API references, etc.

**Web dev tools:** Comfortable with `fresh` for docs research, shadcn CLI (`pnpm dlx shadcn@latest add`), pattern from `apps/web` used as reference for `apps/app`.

Related: [[claude-code-subagents-creation]], [[claude-code-workflows]], [[claude-code-docs]], [[app-route-groups-and-sidebar-patterns]].