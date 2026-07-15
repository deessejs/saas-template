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
    },
  },
]

export { config }
