/**
 * Electron-Vite Configuration
 * Configures build for main, preload, and renderer processes
 *
 * Part of: MQTT Architecture Implementation (Phase 2)
 */

import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // Main process configuration
  main: {
    plugins: [
      externalizeDepsPlugin({
        // Externalize native modules - they will be loaded from node_modules
        exclude: [],
        include: ['better-sqlite3'],
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.ts'),
        formats: ['es'],
      },
      rollupOptions: {
        // Treat native modules as external
        external: ['better-sqlite3'],
        output: {
          entryFileNames: '[name].mjs',
        },
      },
    },
    resolve: {
      alias: {
        '@electron': resolve(__dirname, 'electron'),
      },
    },
  },

  // Preload script configuration
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts'),
      },
    },
  },

  // Renderer (React app) configuration
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@electron': resolve(__dirname, 'electron'),
        // Monorepo package aliases
        '@mango/types': resolve(__dirname, '../../packages/types/src'),
        '@mango/design-system': resolve(__dirname, '../../packages/design-system/src'),
        '@mango/utils': resolve(__dirname, '../../packages/utils/src'),
        '@mango/database': resolve(__dirname, '../../packages/database/src'),
        '@mango/supabase': resolve(__dirname, '../../packages/supabase/src'),
        '@mango/mqtt': resolve(__dirname, '../../packages/mqtt/src'),
        '@mango/ui': resolve(__dirname, '../../packages/ui/src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Proxy API requests to the admin/backend server
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  },
});
