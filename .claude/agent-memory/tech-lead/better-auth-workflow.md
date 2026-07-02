---
name: better-auth-workflow
description: How to generate better-auth schema in this monorepo
metadata:
  type: reference
---

# Better-Auth CLI Workflow

## Generate Auth Schema

Since `auth.ts` is in `packages/auth/` (not root), use `--config`:

```bash
npx auth@latest generate \
  --config ./packages/auth/src/index.ts \
  --output ./packages/database/src/schema/auth.ts \
  --yes
```

This outputs the auth tables (users, sessions, accounts, etc.) to the database package.

## After Generation

1. Review the generated `packages/database/src/schema/auth.ts`
2. Merge exports if needed in `packages/database/src/schema/index.ts`
3. Generate drizzle migrations:
   ```bash
   pnpm --filter @workspace/database db:generate
   ```
4. Apply (dev):
   ```bash
   pnpm --filter @workspace/database db:push
   ```
5. Or apply (prod):
   ```bash
   pnpm --filter @workspace/database db:migrate
   ```

## Why --config is Required

The CLI searches for `auth.ts` in `./`, `./utils`, `./lib`, or `src/*` by default. Since our auth config is in `packages/auth/src/`, we must specify `--config` explicitly.

## Related

- [[pnpm-migration-2026]] — pnpm workspace setup
- [[template-strategy]] — monorepo distribution strategy
