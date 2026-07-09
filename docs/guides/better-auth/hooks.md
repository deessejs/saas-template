# Better-Auth — Database Hooks

Lifecycle hooks for database operations. See [`index.md`](./index.md) first.

**Source:** [better-auth.com/docs/concepts/hooks](https://better-auth.com/docs/concepts/hooks) — core hooks concept. [better-auth.com/docs/concepts/database](https://better-auth.com/docs/concepts/database) — databaseHooks reference.

---

## Hook Types

Every model (`user`, `session`, `account`, `verification`) supports:

| Hook | Runs | Can modify data? | Can abort? |
|---|---|---|---|
| `model.create.before` | Before the row is written | ✅ return `{ data: ... }` | ✅ return `false` |
| `model.create.after` | After the row is written | ❌ | ❌ |
| `model.update.before` | Before the row is updated | ✅ return `{ data: ... }` | ✅ return `false` |
| `model.update.after` | After the row is updated | ❌ | ❌ |
| `model.delete.before` | Before the row is deleted | ❌ | ✅ return `false` |
| `model.delete.after` | After the row is deleted | ❌ | ❌ |

---

## Signature

```ts
databaseHooks: {
  session: {
    create: {
      before: async (session, ctx) => {
        // session: current session object being written
        // ctx: context (e.g., ctx.context.session for the calling user in update/delete hooks)
        return { data: { ...session, activeOrganizationId: "..." } }
        // or: return false to abort
      },
      after: async (session) => {
        // session: the written row
      },
    },
  },
}
```

The `before` hook can **merge** data back into the session object via `{ data: ... }`. The `after` hook receives the final row.

**Source:** [better-auth.com/docs/concepts/database](https://better-auth.com/docs/concepts/database) — hook signature documentation.

---

## Session.create.before — Key Use Case

This is the hook used for auto-creating the user's personal organization on signup:

```ts
databaseHooks: {
  session: {
    create: {
      before: async (session) => {
        const userName =
          session.user?.name ??
          session.user?.email?.split("@")[0] ??
          "Personal"

        const org = await (auth.api as any).createOrganization({
          body: {
            name: `${userName}'s workspace`,
            slug: slugify(userName),
          },
          headers: new Headers(),
        })

        return {
          data: {
            ...session,
            activeOrganizationId: org.id,
          },
        }
      },
    },
  },
},
```

**Why this works:** the org is created inside the before hook using `auth.api.createOrganization`, which means the membership row exists before the session is committed. This may bypass [#9070](https://github.com/better-auth/better-auth/issues/9070) — see [`pitfalls.md`](./pitfalls.md) §2 for the full test plan.

**Source:** [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization) — docs for `setActiveOrganization` via `databaseHooks`.

---

## User.create.after — Async Side Effects

Use for fire-and-forget operations that need the committed user row:

```ts
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        // User row is now committed. Safe to query.
        void sendWelcomeEmail({ to: user.email })
      },
    },
  },
},
```

Always use `void` or `waitUntil` for async side effects — do not await in `after` hooks as it blocks the response.

---

## Account Hooks

Useful for linking OAuth accounts:

```ts
databaseHooks: {
  account: {
    create: {
      after: async (account) => {
        // Link is established. Trigger additional setup if needed.
      },
    },
  },
}
```

---

## Ordering Within a Create Flow

On signup, the execution order is:

1. `session.create.before`
2. Session row written
3. `session.create.after`
4. `user.create.before` (if new user)
5. User row written
6. `user.create.after` (if new user)
7. Organization plugin creates membership row

**Do not** assume `user` exists when `session.create.before` runs — on first signup it does not yet.

---

## Drizzle Relations for Joins

If `experimental.joins: true`, the schema must include Drizzle `relations()` for every table. Regenerate with:

```bash
pnpm auth:generate
```

Review the diff — the CLI regenerates the entire `schema/auth.ts` and may overwrite customizations.

**Source:** [better-auth.com/docs/adapters/drizzle](https://better-auth.com/docs/adapters/drizzle) — joins section.
