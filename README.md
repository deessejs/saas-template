# SaaS Template

Monorepo template for building SaaS applications with modern tooling.

## Tech Stack

### Package Manager
- [pnpm](https://pnpm.io/) v11 with workspaces and catalogs

### Build System
- [Turborepo](https://turbo.build/) v2 for task orchestration and caching

### Packages
- **database** — Drizzle ORM
- **auth** — better-auth
- **api** — Hono + orpc

### Apps
- **web** — Next.js (app router)
- **app** — Next.js (app router)
- **docs** — Fumadocs

## Structure

```
.
├── apps/
│   ├── web/          # Next.js (app router)
│   ├── app/          # Next.js (app router)
│   └── docs/         # Fumadocs
├── packages/
│   ├── database/     # Drizzle ORM
│   ├── auth/         # better-auth
│   ├── api/          # Hono + orpc
│   ├── ui/           # Shared UI components
│   ├── eslint-config/# ESLint configuration
│   └── typescript-config/# TypeScript configuration
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Quick Start

### GitHub Codespaces (Recommended)

The fastest way to get started without installing anything:

1. Click **Code** → **Create codespace on main**
2. Wait for PostgreSQL and dependencies to install
3. Run `pnpm dev` to start developing

No local setup required. Docker and PostgreSQL are pre-configured in the dev container.

### Local Development

#### Prerequisites

- Node.js 20+
- pnpm 11+
- Docker (for PostgreSQL)

#### Installation

```bash
# Install dependencies
pnpm install

# Generate auth schema
pnpm auth:generate

# Push database schema
pnpm db:push

# Start development
pnpm dev
```

### Available Commands

```bash
# Database
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema to DB
pnpm db:studio      # Open Drizzle Studio
pnpm auth:generate  # Generate auth schema

# Build & Test
pnpm build          # Build all packages
pnpm test           # Run tests (uses pg-mem)
pnpm test:integration  # Run with real PostgreSQL

# Code Quality
pnpm lint           # Lint all packages
pnpm typecheck      # Type check all packages
pnpm format         # Format code
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

## Agents (maintainers only)

The `agents/` directory hosts [Eve](https://vercel.com/eve) agents — filesystem-first
AI agent frameworks managed by the project's maintainers. **End users of this template
can safely ignore this directory.**

Eve agents are workspace members but they are excluded from the shared `catalog`
on purpose: their dependencies (`eve`, `ai`, `@vercel/connect`, etc.) live outside
`catalogMode: strict` via `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.

### Available agents

| Agent | Purpose |
|---|---|
| `tech-lead` | Mirror of the Claude Code tech-lead subagent: audits packages, fixes divergences, maintains `.claude/agent-memory/tech-lead/` |

### Setup

```bash
pnpm install        # workspace install covers agents/tech-lead too
cd agents/tech-lead
npm run dev         # starts the interactive terminal UI (Node 24+ required)
```

Each agent has its own `package.json`, `node_modules`, and `.env`. Use
`agents/tech-lead/.env.example` as a template.

### Runtime requirement

Eve requires Node.js >=24 (Vercel hard requirement), but the rest of this template
targets Node >=20. End users who never touch `agents/` are unaffected. Maintainers
running an agent must use Node 24+ (e.g. via `fnm`, `nvm`, `volta`, or `asdf`).

## Dependencies

Shared dependencies are managed through [pnpm catalogs](https://pnpm.io/workspaces#catalogs-and-ranges-in-workspace-protocol). Update versions in `pnpm-workspace.yaml` to propagate changes across all packages.

## CI/CD

This template includes GitHub Actions workflows for:
- Lint
- Type check
- Build
- Test

## License

[MIT](./LICENSE)

## Support

For questions and support, contact [support@deessejs.com](mailto:support@deessejs.com)
