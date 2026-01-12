/**
 * Playwright E2E Test Configuration
 * US-017: E2E Tests (Happy Path)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5176',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5176',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
