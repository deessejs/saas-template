---
name: packages-auth
description: better-auth CLI workflow in monorepo — schema generation, file ownership, what the CLI does/doesn't allow customizing
metadata:
  type: reference
---

# better-auth CLI Workflow

## Generate Auth Schema

Since `auth.ts` is in `packages/auth/` (not root), use `--config`:

```bash
npx auth@latest generate \
  --config ./packages/auth/src/index.ts \
  --output ./packages/database/src/schema/auth.ts \
  --yes
```

In this monorepo, use:

```bash
pnpm --filter @workspace/auth auth:generate
```

The CLI command (defined in `packages/auth/package.json`):

```
"auth:generate": "pnpm exec better-auth generate --config ./src/auth.config.ts --output ../database/src/schema/auth.ts --yes"
```

The CLI searches for `auth.ts` in `./`, `./utils`, `./lib`, or `src/*` by default. Since our auth config is in `packages/auth/src/`, we must specify `--config` explicitly.

## After Generation

1. Review the generated `packages/database/src/schema/auth.ts` — **DO NOT EDIT BY HAND**. The file is owned by the better-auth CLI. Any manual edit will be wiped on the next `auth:generate`.
2. Generate drizzle migrations:
   ```bash
   pnpm --filter @workspace/database db:generate
   ```
3. Apply (dev): `pnpm --filter @workspace/database db:push`
4. Apply (prod): `pnpm --filter @workspace/database db:migrate`

## File Ownership Model (CRITICAL)

| File | Owner | Mutable by us? |
|---|---|---|
| `packages/auth/src/auth.config.ts` | us | ✅ yes — drives what gets generated |
| `packages/database/src/schema/auth.ts` | **better-auth CLI** | ❌ no — regenerated each time |
| `packages/database/src/schema/index.ts` | us | ✅ yes — barrel, re-exports |
| `packages/database/src/tables/index.ts` | us | ✅ yes — for app-domain tables |
| `packages/database/drizzle/*.sql` | drizzle-kit | ⚠️ only hand-write for off-tree changes |
| `packages/database/drizzle/meta/_journal.json` | drizzle-kit | ❌ no (unless you know what you're doing) |

## What the Generator Does (verified in `@better-auth/cli@1.4.21` dist)

The generator (`generators-Ht8QYIi_.mjs:133-140`) emits a Drizzle column with:

- `.defaultNow()` **only if** `attr.defaultValue` is a function whose `.toString()` includes `"new Date()"`
- `.$onUpdate(fn)` if `attr.onUpdate` is set and the field type is `date`

**Consequence:** the choice of which tables get `defaultNow()` on `updatedAt` is **hardcoded in better-auth's internal field config**. In 1.6.23:

- `user.updatedAt` → has `.defaultNow()`
- `verification.updatedAt` → has `.defaultNow()`
- `session.updatedAt` → **no** `.defaultNow()` (only `.$onUpdate`)
- `account.updatedAt` → **no** `.defaultNow()` (only `.$onUpdate`)

This inconsistency is intentional from better-auth's side. There is **no public hook** to customize the generated schema.

## Implication for Schema Customization

When you want to add or change a column on a better-auth table:

- **Add a new column** → use the `additionalFields` plugin or write a custom plugin
- **Change a default** → not possible via config; either accept the default, or hand-write a SQL migration
- **Add `withTimezone` or other column options** → not possible via config; would need a post-process script or a hand-written migration

The `additionalFields` plugin allows you to add new fields to user/session tables (see `db/field.d.mts:32`). It does **not** modify the schema of the core auth tables (user, session, account, verification).

## Hand-Written Migrations for Better-Auth Tables

If a change is needed on a better-auth table that the generator doesn't support, the options are:

1. **Don't change** — accept the limitation, document why.
2. **Post-process script** — a script that runs after `auth:generate` and patches the generated file (fragile, regex-based).
3. **Hand-written SQL migration** — write `0001_*.sql` with `ALTER TABLE …` directly, manually add entry to `_journal.json`. Lives outside drizzle-kit's snapshot system, so `db:check` may flag it.

## Drizzle workflow (companion to better-auth)

The better-auth schema lives in a Drizzle ORM layer. Here are the daily-driver commands and where things live.

### Scripts (from `packages/database/package.json`)

| Script | Purpose | When |
|---|---|---|
| `db:generate` | `drizzle-kit generate` — diff schema → write new SQL migration in `drizzle/` | After schema change in `src/schema/index.ts` or `src/tables/` |
| `db:migrate` | `drizzle-kit migrate` — apply pending migrations in order | **Production deploys** |
| `db:push` | `drizzle-kit push` — sync schema directly without migration file | **Dev only** — never in prod |
| `db:studio` | `drizzle-kit studio` — launch web UI for browsing data | Ad-hoc inspection |
| `db:check` | `drizzle-kit check` — verify migration journal consistency | CI + before commits that touched schema |

In monorepo form: `pnpm --filter @workspace/database db:<cmd>`.

### drizzle.config.ts (`packages/database/drizzle.config.ts`)

```ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

Requires `DATABASE_URL` in env (loaded via `dotenv/config`).

### Schema directory layout

```
packages/database/src/
├── schema/
│   ├── auth.ts        ← better-auth CLI OWNS this (see File Ownership above)
│   └── index.ts       ← barrel: `export * from "./auth"`
└── tables/
    └── index.ts       ← APP-OWNED domain tables — `export * from "./your-table"`
```

Convention: auth tables flow through `src/schema/`, app tables through `src/tables/`. The drizzle config points at `src/schema/index.ts` only, so adding a new app table requires either:
- Re-exporting from `src/schema/index.ts` (and possibly inverting the drizzle config), or
- Adding `src/tables/index.ts` to the `schema` array in drizzle config

The current setup uses the second pattern in spirit but only one is wired in drizzle.config — **when adding the first app table, decide which path to take and update drizzle config accordingly**.

### Migrations output

`./drizzle/` contains:
- `0000_<random_slug>.sql` — actual SQL, hand-readable
- `meta/_journal.json` — ordered list of applied migrations
- `meta/0000_snapshot.json` — schema state at that migration (drizzle-kit's diff basis)

**NEVER hand-edit `_journal.json`** unless you know exactly what you're doing — it desyncs from the SQL files and `db:check` will flag it.

### Tests

- Runner: `vitest` (`pnpm test` / `pnpm test:run`)
- Database: `pg-mem` (in-memory postgres) — no external DB needed for tests
- Test utilities: `packages/database/src/test-utils.ts`

### Production vs dev — pick the right command

- Local hacking: `db:push` (fast, no migration file written, can lose data)
- PRs / shared env: `db:generate` → review the SQL → `db:migrate`
- Production: `db:migrate` ONLY. `db:push` bypasses migration history.

## Related

- [[stack]] — pnpm workspace setup
- [[template-strategy]] — monorepo distribution strategy
- [[packages-ui-audit]] — note: `@better-auth/drizzle-adapter` and `better-auth` are separate packages
