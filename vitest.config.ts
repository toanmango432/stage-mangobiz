import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/Book/**/*.{ts,tsx}',
        'src/hooks/useAppointmentForm.ts',
        'src/hooks/useServiceSelection.ts',
        'src/hooks/useClientSearch.ts',
        'src/utils/conflictDetection.ts',
        'src/utils/smartAutoAssign.ts',
        'src/utils/phoneUtils.ts',
        'src/utils/timeUtils.ts',
        'src/utils/bufferTimeUtils.ts',
        'src/utils/dragAndDropHelpers.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.ts',
        '**/*.d.ts',
        '**/types.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
