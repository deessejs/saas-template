---
name: vercel-deploy
description: Vercel deployment pattern for eve agent in this monorepo — dashboard overrides, Node 24, engines pinning, flat agent structure, live URL
metadata:
  type: project
---

# Vercel + eve monorepo deployment

## Pattern exact (matching complete-electron-template)

```json
// vercel.json (at repo root)
{
  "installCommand": "pnpm install --ignore-scripts",
  "buildCommand": "cd agent && pnpm run build",
  "outputDirectory": ".vercel/output"
}
```

**DO NOT use `pnpm --filter`** — the `cd agent &&` puts the CWD inside `agent/`, eve discovers `instructions.md` correctly from that CWD, and `outputDirectory` is resolved from the project root (not from the build's CWD).

## Live URL

- Tech-lead agent: https://saas-template-tech-lead.vercel.app

## Dashboard settings OVERRIDE vercel.json

Vercel dashboard → Project Settings → Build & Development has fields that **override** `vercel.json`. If the dashboard defines `buildCommand` or `outputDirectory`, those values overwrite `vercel.json`.

→ Changing `vercel.json` is not enough if the dashboard has its own overrides. The build uses the dashboard settings.

**Solution**: align dashboard with `vercel.json`, OR don't touch the dashboard fields.

## Node.js version

`eve@0.18.x` requires Node >=24. Vercel uses Node 22.x by default.

Add in root `package.json`:

```json
"engines": {
  "node": ">=24"
}
```

This overrides the Node version setting of the dashboard for the build.

**Warning**: Vercel does NOT bust the build cache when `engines.node` changes (known bug #14368). Force a rebuild (new commit or `vercel --prod`).

## agent/ structure

The eve agent must be flat in `agent/`:

```
agent/
  agent.ts
  instructions.md
  channels/
  sandbox/
  tools/
```

NOT `agent/agent/` nested — eve discovers files relative to CWD. A nesting `agent/agent/` broke discovery because `cd agent` placed the CWD in `agent/` where eve found nothing.

## Ressources

- [Build Output API](https://vercel.com/docs/build-output-api/configuration) — outputDirectory is resolved from project root
- [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) — engines.node overrides dashboard
- Bug cache: [vercel/vercel#14368](https://github.com/vercel/vercel/issues/14368) — engines.node change does not bust cache

Related: [[eve-integration]]
