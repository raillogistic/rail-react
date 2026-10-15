import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const createLayerBoundaryRule = (disallowedPatterns) => [
  'error',
  {
    patterns: disallowedPatterns.map((pattern) => ({
      group: [pattern],
      message: 'Layer boundary violation. Import from lower architectural layers only.',
    })),
  },
]

export default defineConfig([
  globalIgnores([
    "node_modules",
    "dist",
    "build",
    "coverage",
    "*.min.js",
    "src/schema.ts",
    "src/models.ts",
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "react-refresh/only-export-components": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/views/routes/*",
                "@/views/providers/*",
                "@/layout/*",
                "@/views/AuthDependentContent",
                "@/graphql/apollo-client",
                "@/graphql/authHeaders",
              ],
              message:
                "Use canonical app-layer and shared-api paths instead of deprecated compatibility wrappers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/processes/**/*.{ts,tsx}'],
    rules: {
      "no-restricted-imports": createLayerBoundaryRule(["@/app/*"]),
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      "no-restricted-imports": createLayerBoundaryRule([
        "@/app/*",
        "@/processes/*",
      ]),
    },
  },
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      "no-restricted-imports": createLayerBoundaryRule([
        "@/app/*",
        "@/processes/*",
        "@/pages/*",
      ]),
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      "no-restricted-imports": createLayerBoundaryRule([
        "@/app/*",
        "@/processes/*",
        "@/pages/*",
        "@/widgets/*",
      ]),
    },
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      "no-restricted-imports": createLayerBoundaryRule([
        "@/app/*",
        "@/processes/*",
        "@/pages/*",
        "@/widgets/*",
        "@/features/*",
      ]),
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      "no-restricted-imports": createLayerBoundaryRule([
        "@/app/*",
        "@/processes/*",
        "@/pages/*",
        "@/widgets/*",
        "@/features/*",
        "@/entities/*",
      ]),
    },
  },
])
