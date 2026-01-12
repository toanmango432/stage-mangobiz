import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/store/**/*.ts',
        'src/services/**/*.ts',
        'src/utils/**/*.ts',
        'src/hooks/**/*.ts',
        'src/constants/**/*.ts',
        'src/types/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/store/hooks.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
