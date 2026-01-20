import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Resolve React from pnpm node_modules structure
const pnpmBase = path.resolve(__dirname, '../../node_modules/.pnpm')
const pnpmReact = path.resolve(pnpmBase, 'react@18.3.1/node_modules/react')
const pnpmReactDom = path.resolve(pnpmBase, 'react-dom@18.3.1_react@18.3.1/node_modules/react-dom')

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/Book/**/*.{ts,tsx}',
        'src/components/frontdesk/**/*.{ts,tsx}',
        'src/components/checkout/**/*.{ts,tsx}',
        'src/components/auth/**/*.{ts,tsx}',
        'src/components/common/**/*.{ts,tsx}',
        'src/hooks/*.ts',
        'src/utils/*.ts',
        'src/services/**/*.ts',
        'src/store/**/*.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts',
        '**/*.d.ts',
        '**/types.ts',
      ],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Monorepo package aliases
      '@mango/types': path.resolve(__dirname, '../../packages/types/src'),
      '@mango/design-system': path.resolve(__dirname, '../../packages/design-system/src'),
      '@mango/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@mango/database': path.resolve(__dirname, '../../packages/database/src'),
      '@mango/supabase': path.resolve(__dirname, '../../packages/supabase/src'),
      '@mango/mqtt': path.resolve(__dirname, '../../packages/mqtt/src'),
      '@mango/ui': path.resolve(__dirname, '../../packages/ui/src'),
      // Explicitly resolve React from pnpm node_modules
      'react': pnpmReact,
      'react/jsx-runtime': path.resolve(pnpmReact, 'jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(pnpmReact, 'jsx-dev-runtime'),
      'react-dom': pnpmReactDom,
      'react-dom/client': path.resolve(pnpmReactDom, 'client'),
    },
    // Deduplicate React and related libraries
    dedupe: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'use-sync-external-store'],
  },
})
