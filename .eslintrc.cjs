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
    ],
  },
}
