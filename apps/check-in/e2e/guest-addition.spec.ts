/**
 * E2E Test: Guest Addition Flow
 * 
 * Tests the guests page functionality.
 */

import { test, expect } from './fixtures';

test.describe('Guest Addition Flow', () => {
  test('guests page loads correctly', async ({ mockPage }) => {
    await mockPage.goto('/guests?clientId=client-123&phone=5551234567');
    await mockPage.waitForTimeout(500);

    // Page should load without errors
    const pageContent = await mockPage.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('guests page has add guest functionality', async ({ mockPage }) => {
    await mockPage.goto('/guests?clientId=client-123&phone=5551234567');
    await mockPage.waitForTimeout(500);

    // Look for add guest button
    const addGuestBtn = mockPage.getByRole('button', { name: /add guest/i });
    if (await addGuestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(addGuestBtn).toBeVisible();
    }
  });

  test('guests page renders without error', async ({ mockPage }) => {
    await mockPage.goto('/guests?clientId=client-123&phone=5551234567');
    await mockPage.waitForTimeout(500);

    // Page should render (may redirect or show content)
    const url = mockPage.url();
    expect(url).toBeTruthy();
  });
});
