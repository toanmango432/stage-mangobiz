/**
 * E2E Test: Returning Client Check-In Flow
 * 
 * Tests the check-in flow from welcome through navigation.
 */

import { test, expect, enterPhoneNumber } from './fixtures';

test.describe('Returning Client Check-In Flow', () => {
  test.beforeEach(async ({ mockPage }) => {
    await mockPage.goto('/');
    await mockPage.waitForTimeout(500);
  });

  test('welcome screen displays and accepts phone input', async ({ mockPage }) => {
    await expect(mockPage.locator('h1')).toBeVisible();
    
    await enterPhoneNumber(mockPage, '5551234567');
    await expect(mockPage.getByText('(555) 123-4567')).toBeVisible();

    const continueButton = mockPage.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled();
  });

  test('navigates to verify page after phone entry', async ({ mockPage }) => {
    await enterPhoneNumber(mockPage, '5551234567');
    await mockPage.getByRole('button', { name: /continue/i }).click();
    await expect(mockPage).toHaveURL(/\/verify\?phone=5551234567/);
  });

  test('phone number formatting shows correctly', async ({ mockPage }) => {
    await enterPhoneNumber(mockPage, '5551234567');
    await expect(mockPage.getByText('(555) 123-4567')).toBeVisible();
  });

  test('delete button removes last digit', async ({ mockPage }) => {
    await enterPhoneNumber(mockPage, '5551234567');
    await expect(mockPage.getByText('(555) 123-4567')).toBeVisible();

    // Click delete button (last button with svg icon)
    const deleteButton = mockPage.locator('button').filter({ has: mockPage.locator('svg') }).last();
    await deleteButton.click();

    await expect(mockPage.getByText('(555) 123-456')).toBeVisible();
  });

  test('cannot continue with incomplete phone number', async ({ mockPage }) => {
    await enterPhoneNumber(mockPage, '55512');

    const continueButton = mockPage.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeDisabled();
  });
});
