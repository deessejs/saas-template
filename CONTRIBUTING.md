# Contributing

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Create a `.env.local` file based on `.env.example`

## Workflow

### Branch Naming

- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code refactoring

### Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `chore:` — Maintenance tasks

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint` and `pnpm typecheck`
5. Submit a pull request

## Scripts

```bash
pnpm build     # Build all packages
pnpm dev       # Start development servers
pnpm lint      # Lint all packages
pnpm typecheck # Type check all packages
pnpm format    # Format code
```

## Packages

### Adding a New Package

1. Create the package in `packages/` or `apps/`
2. Add it to `pnpm-workspace.yaml`
3. Use `workspace:*` for internal dependencies
4. Use `catalog:` for shared dependencies

### Shared Dependencies

Update shared dependencies in `pnpm-workspace.yaml` under `catalog:`.

## Support

For questions, open an issue or contact [support@deessejs.com](mailto:support@deessejs.com)
