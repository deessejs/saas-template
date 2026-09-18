---
"next-monorepo": minor
---

Migrate linting and formatting from ESLint and Prettier to [Oxlint](https://oxc.rs) and [Oxfmt](https://oxc.rs).

Oxlint is 50x-100x faster than ESLint. Oxfmt is ~30x faster than Prettier. The migration is API-compatible with our existing rules (including the security-sensitive `no-restricted-syntax` selectors, which are now provided by `oxlint-plugin-eslint`'s JS plugin).

Workspace-level changes:

- `packages/eslint-config` has been replaced by `packages/oxlint-config` (same exports: `base`, `react-internal`, `next`).
- Each workspace now has a `.oxlintrc.json` extending the shared config.
- `pnpm lint` runs Oxlint; `pnpm format` runs Oxfmt.
- A new `Format Check` job has been added to CI (Oxfmt was previously not enforced in CI).
- `react/forbid-elements` (which warns on raw `<input>`/`<button>`/`<select>`/`<textarea>` in favor of `@workspace/ui` shadcn components) is enforced via Oxlint's native rule.
- `nextjs/*` rules from `@next/eslint-plugin-next` are enforced via Oxlint's native `nextjs` plugin.
- `.prettierrc`/`.prettierignore` have been replaced by `.oxfmtrc.json` with `sortTailwindcss` (native Tailwind class sorting, equivalent to `prettier-plugin-tailwindcss`).

Knobs to know:

- The root-level `.eslintrc.js` and `packages/eslint-config/` are removed.
- A real bug was surfaced by `next/no-html-link-for-pages` in `apps/app/components/settings/profile-form.tsx` and has been fixed (raw `<a>` replaced with `<Link>`).
- `// eslint-disable-next-line no-restricted-syntax` comments were updated to `// oxlint-disable-next-line eslint-js/no-restricted-syntax` in `packages/auth/tests/setup.ts` and `apps/app/components/sidebars/nav-user.tsx`.
- Node `>=22.0.0` is still required (Oxlint's `oxlint-plugin-eslint` requires Node 22.6+ for the JS plugin runtime).

Upgrade notes for downstream forks:

- If you have custom ESLint plugins, look at [Writing JS plugins](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html) — most ESLint v9 plugins run unchanged as Oxlint JS plugins.
- If you maintain custom rules in `packages/eslint-config`, port them to `.oxlintrc.json` files in `packages/oxlint-config/`.
