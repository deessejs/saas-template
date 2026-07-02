---
name: tech-lead-subagent-design
description: Design decisions for the tech-lead subagent — read-only planner, .claude/agents/ location, deliberately scoped to Claude Code (NOT Eve)
metadata:
  type: project
---

# Tech-Lead Subagent — Design (2026-07-02)

## Scope: Claude Code only

The tech-lead subagent lives in Claude Code's `.claude/agents/` directory. **Eve framework is unrelated** — Eve agent definitions live in their own `agent/` directory structure (instructions.md, tools/, etc.) and follow filesystem-first conventions. Don't conflate the two systems.

**Why:** User explicitly clarified "eve n'a rien à voir avec claude" twice during the design conversation, after I'd suggested mirroring to `agents/` at root.

**How to apply:**
- Tech-lead subagent = Claude Code subagent (`.claude/agents/tech-lead.md`)
- Eve agents (if added later) = `agent/` directory with `instructions.md` + `tools/` per [Eve conventions](https://eve.dev/docs)
- These are two separate stacks; don't merge their file structures

## Role: read-only planner

Tech-lead **plans**, never edits. Code-fixer executes. Main Claude orchestrates between them.

**Why:** Separation of concerns — planning agents should not also be execution agents, because mixing them corrupts output format (plans become diffs, diffs become suggestions).

**How to apply:**
- `tools: Read, Grep, Glob, Bash, WebFetch` — no `Edit`, no `Write`, no `Agent`
- Tech-lead outputs structured markdown plans, not file changes
- If a plan is approved, main Claude executes or spawns code-fixer

## Memory integration

`memory: project` auto-loads the 7 existing memory files at `.claude/agent-memory/tech-lead/`. Tech-lead reads them before recommending.

Related: [[pnpm-migration-2026]], [[template-strategy]], [[better-auth-workflow]], [[claude-code-subagents-creation]], [[claude-code-workflows]], [[user-research-style]].