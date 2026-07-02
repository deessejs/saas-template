---
name: pnpm-workspace-migration
description: Monorepo migrated from npm workspaces to pnpm workspaces with strict mode
metadata:
  type: project
---

# pnpm Workspace Migration (2026-07-01)

## Stack actuel

- **packageManager**: `pnpm@11.0.0`
- **Structure**: `apps/web`, `packages/ui`, `packages/eslint-config`, `packages/typescript-config`
- **Lockfile**: `pnpm-lock.yaml` (280KB, 640 packages)
- **turbo.json**: v2.x avec `tasks` field

## Config pnpm

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
allowBuilds:
  - esbuild
  - sharp
```

```ini
# .npmrc
shamefully-hoist=false
public-hoist-pattern[]=
```

## Erreurs courantes évitées

1. **pnpm 11 require `allowBuilds`** explicite pour les packages avec postinstall (esbuild, sharp)
2. **turbo binary** ne fonctionne pas en bash natif sur ce Windows — utiliser `npx turbo` ou `pnpm exec turbo`
3. **Config packages** (`eslint-config`, `typescript-config`) n'ont pas de scripts — turbo skipgracefully

## Catalogs (2026-07-01)

Centralise les versions partagées dans `pnpm-workspace.yaml` :

```yaml
catalog:
  react: 19.2.4
  react-dom: 19.2.4
  typescript: ^5.9.3
  "@types/node": ^20
  "@types/react": ^19
  "@types/react-dom": ^19
  "@tailwindcss/postcss": ^4
  "@turbo/gen": ^2.10.1
```

Tous les packages utilisent `"react": "catalog:"` au lieu de versions hardcodées.

## CI GitHub Actions (2026-07-01)

`.github/workflows/ci.yml` : lint → typecheck → build → test en parallèle

## CODEOWNERS (2026-07-01)

`.github/CODEOWNERS` : ownership par répertoire

## catalogMode: strict (2026-07-01)

Plus de versions bare autorisées — tout doit venir du catalog

## Prochaines étapes suggérées

- Remote cache (Vercel) : `npx turbo login && npx turbo link`
- changesets pour versioning npm
