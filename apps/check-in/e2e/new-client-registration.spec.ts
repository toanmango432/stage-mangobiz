/**
 * E2E Test: New Client Registration Flow
 * 
 * Tests navigation to registration and form validation.
 */

import { test, expect, enterPhoneNumber } from './fixtures';

test.describe('New Client Registration Flow', () => {
  test.beforeEach(async ({ mockPage }) => {
    await mockPage.goto('/');
    await mockPage.waitForTimeout(500);
  });

  test('can navigate to verify page with new phone number', async ({ mockPage }) => {
    await enterPhoneNumber(mockPage, '9995551234');
    await expect(mockPage.getByText('(999) 555-1234')).toBeVisible();
    await mockPage.getByRole('button', { name: /continue/i }).click();
    await expect(mockPage).toHaveURL(/\/verify\?phone=9995551234/);
  });

  test('signup page loads with phone parameter', async ({ mockPage }) => {
    await mockPage.goto('/signup?phone=9995551234');
    await mockPage.waitForTimeout(500);

    // Should show phone number
    await expect(mockPage.getByText(/(999) 555-1234|999.*555.*1234/)).toBeVisible({ timeout: 5000 });

    // Should have form fields
    const firstNameInput = mockPage.getByLabel(/first name/i);
    await expect(firstNameInput).toBeVisible();
  });

  test('signup form has required fields', async ({ mockPage }) => {
    await mockPage.goto('/signup?phone=9995551234');
    await mockPage.waitForTimeout(500);

    // Check for required form elements
    await expect(mockPage.getByLabel(/first name/i)).toBeVisible();
    await expect(mockPage.getByLabel(/last name/i)).toBeVisible();
  });

  test('can fill out registration form', async ({ mockPage }) => {
    await mockPage.goto('/signup?phone=9995551234');
    await mockPage.waitForTimeout(500);

    await mockPage.getByLabel(/first name/i).fill('John');
    await mockPage.getByLabel(/last name/i).fill('Smith');

    // Verify values are filled
    await expect(mockPage.getByLabel(/first name/i)).toHaveValue('John');
    await expect(mockPage.getByLabel(/last name/i)).toHaveValue('Smith');
  });
});
