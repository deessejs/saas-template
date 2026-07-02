<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### Fresh CLI 

`fresh` is a CLI for AI-powered web search and fetch, backed by Exa.ai.

**Subcommands:**
- `fresh auth login [--no-open]` — device authorization flow. `--no-open` skips auto-opening the browser.
- `fresh auth logout` — sign out and clear stored credentials.
- `fresh auth status` — check whether the token is valid.
- `fresh auth whoami` — show current user info.
- `fresh search -q <text> [-l <n>] [-t <type>]` — web search.
  - `-l/--limit` default 10
  - `-t/--type`: `auto` (default), `fast`, `deep-lite`, `deep`, `deep-reasoning`, `instant`
- `fresh fetch <url> [-p <prompt>]` — fetch and extract content from a URL; optional `-p/--prompt` steers extraction.

**Auth state to watch:** if `fresh auth status` reports "Token expired", run `fresh auth login` (with `--no-open` if you want to open the browser URL manually).

**Notes:**
- General help via `fresh --help` and per-command via `fresh <cmd> --help`.
- Version via `fresh --version`.

## Eve agents

Maintainers run [Eve](https://vercel.com/eve) agents from `agents/` (top-level).
These agents audit packages, propose fixes, and maintain
`.claude/agent-memory/tech-lead/`. End users of this template can ignore this directory.

To install an agent (Node 24+ required at runtime — see `package.json` engines):

```bash
pnpm install        # workspace install covers agents/* too
cd agents/<name>
npm run dev         # starts the interactive terminal UI
```

Each agent has its own `package.json` and `.env.example`. The `eve` runtime and
`@vercel/connect` are workspace members but bypass the catalog via
`minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.