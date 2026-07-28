import js from "@eslint/js"
import tseslint from "typescript-eslint"

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**", "node_modules/**"],
  },
  {
    // Allow require() for @workspace/env/server since it must be loaded at runtime
    // to avoid ESM/build-time circular dependency issues with dotenv loading.
    rules: {
      "@typescript-eslint/no-require-imports": [
        "error",
        { allow: ["^@workspace/env/server$"] },
      ],
      // Defeat open-redirect via protocol-relative URLs (//evil.com) and
      // backslash bypass (/\\evil.com). See CVE-2025-27143. Any router.push,
      // window.location, or NextResponse.redirect whose first argument calls
      // searchParams.get() must route through safeRedirect() first.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name='push'] > CallExpression[callee.object.name='searchParams'][callee.property.name='get']",
          message:
            "router.push(searchParams.get(...)) is an open-redirect vector. Use safeRedirect() from @workspace/utils/safe-redirect first.",
        },
        {
          selector:
            "CallExpression[callee.property.name='assign'][arguments.0.callee.property.name='get']",
          message:
            "window.location.assign(searchParams.get(...)) is an open-redirect vector. Use safeRedirect() first.",
        },
      ],
    },
  },
]

export { config }
