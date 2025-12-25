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
