---
name: vercel-deploy-pattern
description: Vercel deployment pattern for eve agents in monorepo
metadata:
  type: reference
---

# Vercel + eve monorepo deployment pattern

## Pattern exact (matching complete-electron-template)

```json
// vercel.json (at repo root)
{
  "installCommand": "pnpm install --ignore-scripts",
  "buildCommand": "cd agent && pnpm run build",
  "outputDirectory": ".vercel/output"
}
```

**Ne PAS utiliser `pnpm --filter`** — le `cd agent &&` place le CWD dans `agent/`, eve découvre `instructions.md` correctement depuis ce CWD, et `outputDirectory` est résolu depuis la project root (pas depuis le CWD du build).

## Dashboard settings override vercel.json

Vercel dashboard → Project Settings → Build & Development a des champs qui **priment** sur `vercel.json`. Si le dashboard définit `buildCommand` ou `outputDirectory`, ces valeurs écrasent `vercel.json`.

**Conséquence :** changer `vercel.json` ne suffit pas si le dashboard a ses propres overrides. Le build utilise les settings dashboard.

**Solution :**aligner le dashboard avec `vercel.json`, ou ne pas toucher les champs dashboard.

## Node.js version

eve 0.18.x requiert Node.js >=24. Vercel utilise Node 22.x par défaut.

Ajouter dans le `package.json` root :
```json
"engines": {
  "node": ">=24"
}
```

Cela override le Node version setting du dashboard pour le build.

**Attention :** Vercel ne bust PAS le build cache quand `engines.node` change (bug connu #14368). Forcer un rebuild (nouveau commit ou `vercel --prod`).

## Structure agent/

L'agent eve doit être à plat dans `agent/` :
```
agent/
  agent.ts
  instructions.md
  channels/
  sandbox/
  tools/
```

Pas de `agent/agent/` nested — eve découvre les fichiers relatif au CWD. Un nesting `agent/agent/` cassait la découverte car `cd agent` placait le CWD dans `agent/` où eve ne trouvait rien.

## Ressources

- [Build Output API](https://vercel.com/docs/build-output-api/configuration) — outputDirectory résolu depuis project root
- [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) — engines.node override le dashboard
- Bug cache : [vercel/vercel#14368](https://github.com/vercel/vercel/issues/14368) — engines.node change ne bust pas le cache
