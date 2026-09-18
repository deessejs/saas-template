# `@workspace/oxlint-config`

Shared [Oxlint](https://oxc.rs) configuration for the workspace.

Exposes three entry points:

- `@workspace/oxlint-config/base` — base rules (TypeScript, unicorn, promise, oxc) plus `no-restricted-syntax` selectors for security-sensitive patterns (open-redirect via `router.push`/`window.location.assign`, bare `void` on top-level calls, `authClient.useSession()` misuse). The `no-restricted-syntax` rule is provided by `oxlint-plugin-eslint` (an Oxlint JS plugin that exposes ESLint's core rules under the `eslint-js/` prefix).
- `@workspace/oxlint-config/react-internal` — extends `base` and adds the `react` plugin, including `react/forbid-elements` (warns on raw `<input>` / `<button>` / `<select>` / `<textarea>` in favor of `@workspace/ui` shadcn components).
- `@workspace/oxlint-config/next` — extends `react-internal` and adds the `nextjs` plugin (parity with `@next/eslint-plugin-next`).

Workspaces consume these via `.oxlintrc.json` files. See `apps/*/.oxlintrc.json` and `packages/*/.oxlintrc.json` for examples.
