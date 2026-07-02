import { config as baseConfig } from "./base.js"
import pluginNext from "@next/eslint-plugin-next"
import globals from "globals"

const nextConfig = [
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

export { nextConfig }
