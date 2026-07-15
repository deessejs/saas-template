---
name: create-pr
description: Open a PR for an implemented issue — reads the spec, opens PR, updates labels, posts comment. Run after /implement #{n}.
---

# `create-pr` Skill

Open a PR, update issue labels, assign, and post a comment.

## When to use

**Trigger phrases:** "create-pr #N", "open pr #N", "/create-pr #N".

Run this **after** `/implement #{n}` — the branch must be pushed with the implementation.

## Workflow overview

```
0. Reset  — return to main and pull latest
1. Fetch  — read the issue + the spec
2. Check  — gate A: branch on origin · gate B: no existing open PR
3. PR     — open the pull request
4. Update — label, assign, post comment
```

## §0 — Reset (always)

```bash
git checkout main && git pull origin main
```

## §1 — Fetch

Fetch all in parallel:

```bash
gh api "https://api.github.com/repos/deessejs/saas-template/issues/{n}"
gh api --paginate "https://api.github.com/repos/deessejs/saas-template/issues/{n}/comments"
gh api -H "X-GitHub-Api-Version: 2026-03-10" \
  "https://api.github.com/orgs/deessejs/issue-fields"
gh api "https://api.github.com/repos/deessejs/saas-template/contents/.claude/plans/{n}/plan.md?ref=impl/{n}-{slug}" \
  --jq '.content' 2>/dev/null | base64 -d -
```

Also fetch the latest commit to confirm branch is up to date:

```bash
git fetch origin "impl/{n}-{slug}"
```

## §2 — Check

**Gate A — branch on origin**

```bash
git fetch origin "impl/{n}-{slug}" 2>/dev/null && echo "found" || echo "missing"
```

Refuse if missing:

> "Branch `impl/{n}-{slug}` is not on origin. Run `/implement #{n}` first."

**Gate B — no existing open PR**

```bash
gh api --paginate "https://api.github.com/repos/deessejs/saas-template/pulls?state=open&per_page=50" \
  --jq '.[] | select(.body | contains("Closes #{n}")) | {number, html_url}'
```

If a PR exists:

> "A PR already exists for issue #{n}: {PR URL}. Do you want me to update it instead?"

If yes: proceed to §3 but use `--edit` instead of `--create`.

## §3 — Open PR

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

Capture the returned URL.

## §4 — Update Issue

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

## Output

Confirm with a one-liner: PR number, title, URL, and next step.

> "PR #{n}: {title} — {URL}. Merging is manual — review the diff and squash-merge when ready."

## Error handling

| Situation | Action |
|---|---|
| Already on a branch | §0 resets to main automatically |
| Branch not on origin | Refuse — Gate A |
| PR already exists | Tell user; offer to update instead |
| PR creation fails | Check labels are valid, then retry |

## Constraints

- **Always return to `main` first.**
- **Run after `/implement #{n}`** — the branch must exist and be pushed.
- Never push to `main`.
- Never merge a PR from this skill.
