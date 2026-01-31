module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Data Architecture: ERROR on direct database imports in components
    // Use dataService instead: import { dataService } from '@/services/dataService'
    // Changed from 'warn' to 'error' per DATA_ARCHITECTURE_REMEDIATION_PLAN.md Phase 2.4
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/db/database', '**/db/database.ts'],
            message: 'Use dataService instead of direct DB imports. Import from @/services/dataService.',
          },
          {
            group: ['**/db/*Operations', '**/db/*Operations.ts'],
            message: 'Use dataService instead of direct DB operations. Import from @/services/dataService.',
          },
          {
            group: ['**/db/catalogDatabase', '**/db/catalogDatabase.ts'],
            message: 'Use dataService instead of direct catalog DB. Import from @/services/dataService.',
          },
          {
            group: ['**/db/scheduleDatabase', '**/db/scheduleDatabase.ts'],
            message: 'Use dataService instead of direct schedule DB. Import from @/services/dataService.',
          },
        ],
      },
    ],
    // Design System: Warn on legacy teal colors - use brand-* instead
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'Literal[value=/teal-/]',
        message: 'Use brand-* colors instead of teal-* for consistent branding. Import from @/design-system.',
      },
      {
        selector: 'Literal[value=/bg-\\[#[0-9a-fA-F]{3,6}\\]/]',
        message: 'Avoid hardcoded bg-[#xxx] colors. Use Tailwind semantic classes (bg-brand-500, bg-emerald-500) or design tokens from @/design-system.',
      },
      {
        selector: 'Literal[value=/text-\\[#[0-9a-fA-F]{3,6}\\]/]',
        message: 'Avoid hardcoded text-[#xxx] colors. Use Tailwind semantic classes (text-brand-500, text-slate-600) or design tokens from @/design-system.',
      },
      {
        selector: 'Literal[value=/border-\\[#[0-9a-fA-F]{3,6}\\]/]',
        message: 'Avoid hardcoded border-[#xxx] colors. Use Tailwind semantic classes (border-brand-500) or design tokens from @/design-system.',
      },
      {
        selector: 'Literal[value=/fill-\\[#[0-9a-fA-F]{3,6}\\]/]',
        message: 'Avoid hardcoded fill-[#xxx] colors. Use Tailwind semantic classes or design tokens from @/design-system.',
      },
      {
        selector: 'Literal[value=/stroke-\\[#[0-9a-fA-F]{3,6}\\]/]',
        message: 'Avoid hardcoded stroke-[#xxx] colors. Use Tailwind semantic classes or design tokens from @/design-system.',
      },
    ],
  },
}
