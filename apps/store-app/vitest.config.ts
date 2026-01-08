import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Resolve React from root node_modules for consistency
const rootNodeModules = path.resolve(__dirname, '../../node_modules')

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
      // Explicitly resolve React from root node_modules
      'react': path.resolve(rootNodeModules, 'react'),
      'react-dom': path.resolve(rootNodeModules, 'react-dom'),
      'react-dom/client': path.resolve(rootNodeModules, 'react-dom/client'),
    },
    // Deduplicate React and related libraries
    dedupe: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'use-sync-external-store'],
  },
})
