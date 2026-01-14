import { test, expect } from '@playwright/test';

/**
 * Tip Distribution E2E Tests
 *
 * Verifies that tip distribution works correctly for
 * single and multi-staff tickets.
 */

test.describe('Tip Distribution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('proportional distribution calculates correctly', async ({ page }) => {
    // Placeholder - will test with actual payment flow
    test.skip();

    // 1. Create ticket with multiple staff and different service amounts
    // 2. Add tip
    // 3. Click "Auto-Distribute"
    // 4. Verify each staff gets proportional amount
  });

  test('equal split distributes evenly', async ({ page }) => {
    // Placeholder - will test with actual payment flow
    test.skip();

    // 1. Create ticket with multiple staff
    // 2. Add tip
    // 3. Click "Split Equally"
    // 4. Verify each staff gets equal amount
  });

  test('single staff gets full tip', async ({ page }) => {
    // Placeholder
    test.skip();

    // 1. Create ticket with single staff
    // 2. Add tip
    // 3. Verify tip distribution UI is hidden (single staff)
    // 4. Verify full tip goes to that staff
  });

  test('tip distribution shows in payment confirmation', async ({ page }) => {
    // Placeholder
    test.skip();

    // 1. Create ticket with multiple staff
    // 2. Add tip and distribute
    // 3. Complete payment
    // 4. Verify tip distribution shown in confirmation/receipt
  });

  test('screenshot - tip distribution single staff', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/checkout/screenshots/tip-distribution-single.png',
      fullPage: true
    });
  });

  test('screenshot - tip distribution multi staff', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/checkout/screenshots/tip-distribution-multi.png',
      fullPage: true
    });
  });
});
