import pluginNext from "@next/eslint-plugin-next"
import globals from "globals"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for Next.js applications.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = [
  ...baseConfig,
  {
    plugins: {
      "@next/next": pluginNext,
    },
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
]
