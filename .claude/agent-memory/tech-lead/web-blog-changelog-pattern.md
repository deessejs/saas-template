---
name: web-blog-changelog-patterns
description: apps/web blog, changelog, and Zustand store patterns
metadata:
  type: project
---

# Blog + Changelog + Cookie Consent — `apps/web`

## apps/web src/ structure

```
apps/web/
├── src/
│   ├── app/           # Next.js routes
│   ├── components/     # App components
│   ├── lib/          # Helpers, blog lib, utils
│   └── stores/        # Zustand stores (NO lib/stores)
├── content/           # MDX content
│   ├── authors/
│   ├── posts/
│   └── releases/
└── content-collections.ts
```

`@/*` dans tsconfig → `src/*`

## Zustand stores

**Location:** `src/stores/cookies/cookie-consent.ts`

Pattern :
```ts
export const useCookieConsentStore = create<State & Actions>()((set, get) => ({
  consent: loadStored() ?? DEFAULT,
  hasDecided: loadStored() !== null,

  acceptAll: () => {
    persist(full)
    set({ consent: full, hasDecided: true })
  },
  // ...
}))
```

Pas de provider. Chaque composant appelle `useCookieConsentStore()` directement.

**Ne pas utiliser `useSyncExternalStore`** — break le prerendering Next.js.

## Blog + Changelog

- `content-collections.ts` génère les types `allPosts`, `allAuthors`, `allReleases`
- Collections : `posts`, `authors`, `releases`
- Multi-auteur, tags libres, drafts, reading time, MDX+Shiki
- Routes : blog (liste, slug, tag, author), changelog (index, slug)
- SEO : OG images, RSS feeds, sitemap, JSON-LD
- Search : Fuse.js dialog accessible via `⌘K`/`Ctrl+K` ou bouton sur les pages blog/changelog
