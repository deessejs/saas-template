---
"@workspace/database": patch
---

test(e2e): re-exercise the custom release pipeline after the `-f` tag fix. Adds a constant export `RELEASE_TEST_MARKER` to `packages/database/src/tables/index.ts` and bumps `@workspace/database` patch. No behavioral change.
