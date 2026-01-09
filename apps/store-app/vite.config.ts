import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// NOTE: vite-plugin-remove-console causes parsing issues with certain TypeScript constructs
// Disabled until a fix is available. Console.log statements will remain in production builds.
// import removeConsole from 'vite-plugin-remove-console'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // removeConsole plugin disabled due to parsing issues with auditLogger calls
    // See: https://github.com/nicklin99/vite-plugin-remove-console/issues
  ],
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
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the admin/backend server
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],

          // Redux and state management
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],

          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],

          // UI components - Radix (large library)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-scroll-area',
          ],

          // Animation
          'vendor-motion': ['framer-motion'],

          // Date utilities
          'vendor-date': ['date-fns'],

          // Forms
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Icons - tree-shaken but still substantial
          'vendor-icons': ['lucide-react'],

          // Database
          'vendor-db': ['dexie', 'dexie-react-hooks'],

          // Query
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    // Increase chunk size warning limit slightly (we're optimizing)
    chunkSizeWarningLimit: 600,
  },
})
