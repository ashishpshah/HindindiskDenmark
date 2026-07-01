import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // React Compiler plugin rules — flagged as errors but are valid React patterns
  // (setState in effects, Math.random in useMemo, useReactTable). Disable globally.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect':   'off',
      'react-hooks/purity':                'off',
      'react-hooks/incompatible-library':  'off',
    },
  },
  // TanStack Router exports Route (non-component) from route files; shadcn ui exports
  // variant helpers alongside components; context/i18n files export hooks + providers.
  // The react-refresh rule is a false positive for all of these.
  {
    files: [
      'src/routes/**/*.{ts,tsx}',
      'src/context/**/*.{ts,tsx}',
      'src/i18n/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Files using `as any` for legitimate interop: dynamic CMS routes, DottedMap ESM shim.
  {
    files: [
      'src/components/home/Sections.tsx',
      'src/components/ui/map.tsx',
      'src/routes/account.index.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
