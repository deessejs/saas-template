import js from "@eslint/js"
import tseslint from "typescript-eslint"

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**", "node_modules/**"],
  },
]

export { config }
