---
name: implement
description: Implement a spec-reviewed issue. Reads the plan, asks for approval if not already given, writes code, and opens a PR. Refuses if not status:ready or if no spec exists.
---

# `implement` Skill

Read an existing implementation spec, implement the code, and open a PR.

## When to use

**Trigger phrases:** "implement #N", "work on #N", "start #N", "/implement #N".

**Prerequisite:** `/spec #{n}` must have been run first.

## Workflow overview

```
0. Reset      — return to main and pull latest
1. Fetch      — read the issue + look for the spec
2. Check      — gate A: status:ready · gate B: spec exists · gate C: branch exists
3. Review     — ask for approval if not already given
4. Checkout   — fetch and checkout the branch
5. Implement  — write the code following the spec
6. Validate   — build → typecheck → test → lint → dedupe
7. Commit     — git add + commit + push
8. PR         — open the pull request
9. Update     — label issue, update org fields, post comment
```

## §0 — Reset (always)

```bash
git checkout main && git pull origin main
```

## §1 — Fetch

```bash
gh api "https://api.github.com/repos/deessejs/saas-template/issues/{n}"
gh api --paginate "https://api.github.com/repos/deessejs/saas-template/issues/{n}/comments"
```

Also fetch the org-level issue field IDs (needed in §9):

```bash
gh api -H "X-GitHub-Api-Version: 2026-03-10" \
  "https://api.github.com/orgs/deessejs/issue-fields"
```

## §2 — Check

Three sequential gates. Refuse immediately at the first failure.

**Gate A — status:ready**

Refuse if `status:ready` label is absent:

> "Issue #{n} does not have the `status:ready` label. Run `/triage #{n}` first."

**Gate B — spec exists**

Look for `.claude/plans/{n}/plan.md` on the branch `impl/{n}-{slug}`:

```bash
gh api "https://api.github.com/repos/deessejs/saas-template/contents/.claude/plans/{n}/plan.md?ref=impl/{n}-{slug}" \
  --jq '.content' 2>/dev/null | base64 -d -
```

Refuse if not found:

> "No spec found for issue #{n}. Run `/spec #{n}` first to write the implementation plan."

**Gate C — branch exists**

```bash
git fetch origin "impl/{n}-{slug}" 2>/dev/null && echo "found" || echo "missing"
```

Refuse if not on origin:

> "Branch `impl/{n}-{slug}` does not exist on origin. Run `/spec #{n}` first to create it."

## §3 — Review

Read the spec at `.claude/plans/{n}/plan.md` on the branch. Check the YAML `status` field.

- **`status: approved`** → proceed to §4 without asking
- **`status: draft`** → **blocking**: present a summary and ask for approval

When asking for approval, include:
- TL;DR from the spec
- Files count + step count
- Key risk (warn if `breaking-change` label present)
- Branch + plan path

**If approved:**
1. Update the spec YAML on the branch:
   - `status: approved`
   - `reviewer: martyy-code`
   - `reviewed: {YYYY-MM-DD}`
2. Commit the update and push
3. Proceed to §4

**If rejected:**
> "Implementation blocked. The spec remains on `impl/{n}-{slug}` at `.claude/plans/{n}/plan.md`."

## §4 — Checkout the branch

```bash
git fetch origin "impl/{n}-{slug}"
git checkout "impl/{n}-{slug}"
git merge origin/impl/{n}-{slug}  # pull latest spec if updated
```

## §5 — Implement

Read `.claude/plans/{n}/plan.md` and follow it exactly.

- Use `Edit` and `Write` to modify/create files
- Execute steps in the order listed in the Outline
- Do not deviate from the spec unless you hit a concrete contradiction — then stop and ask
- Keep the diff clean: no unrelated reformats mixed with logic changes
- If the issue has `breaking-change` label → review Risks section carefully before starting

## §6 — Validate

After every file change and again at the end, run in sequence:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm dedupe:check
```

If any step fails:
1. Fix the failure
2. Re-run the full sequence
3. If the fix requires diverging from the spec → stop and ask before continuing

## §7 — Commit + Push

```bash
git add {files from plan + modified files}
git commit -m "{type}: {concise description}

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin "impl/{n}-{slug}"
```

**Commit type:** match the primary area label — `ci`, `chore`, `docs`, `feat`, `fix`, `refactor`.

## §8 — Open PR

```bash
gh pr create \
  --title "{issue title}" \
  --body "## Summary

{TL;DR from the spec}

## What changed

- {file}: {what changed}
- ...

## Verification

- [ ] \`pnpm build\`
- [ ] \`pnpm typecheck\`
- [ ] \`pnpm test\`
- [ ] \`pnpm lint\`

## Related

Closes #{n}

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)" \
  --label "{labels}" \
  --assignee martyy-code
```

## §9 — Update Issue

After PR is open, do all three in parallel:

**1. Remove `status:ready`**, add `status:in-progress`:

```bash
gh issue edit {n} --remove-label "status:ready" --add-label "status:in-progress"
```

**2. Assign to `martyy-code`:**

```bash
gh issue edit {n} --add-assignee martyy-code
```

**3. Post a comment:**

```markdown
<!-- triage-skill:v1 -->
## Implementation started

PR opened: {PR URL}

The spec was reviewed and approved. Implementation in progress.

_Triage by @martyy-code._
```

## Idempotency

Before opening a PR, check if one already exists:

```bash
gh api --paginate "https://api.github.com/repos/deessejs/saas-template/pulls?state=open&per_page=50" \
  --jq '.[] | select(.body | contains("Closes #{n}")) | {number, html_url}'
```

If a PR exists → tell the user and offer to update it instead.

## Error handling

| Situation | Action |
|---|---|
| Already on a branch | §0 resets to main automatically |
| Not `status:ready` | Refuse — Gate A |
| No spec found | Refuse — Gate B |
| Branch not on origin | Refuse — Gate C |
| `breaking-change` label present | Warn and review Risks before proceeding |
| PR already exists | Tell user; offer to update instead |
| Tests fail | Fix → re-validate → ask if outside spec |
| Spec not approved | Ask for approval in §3 |

## Constraints

- **Always return to `main` first.**
- **Refuse if not `status:ready`.**
- **Refuse if no spec exists.**
- **Always branch from `/spec` first.**
- **Plan before code — no exceptions.**
- Never push to `main`.
- Never merge a PR from this skill.
- Do not use `--force` to overwrite branches without permission.
