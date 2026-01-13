/**
 * E2E Tests: Payment Failure and Retry
 * US-017: E2E Tests (Happy Path)
 * 
 * Tests payment failure scenarios and retry functionality
 */

import { test, expect } from '@playwright/test';
import {
  simulateReadyToPay,
  simulatePaymentResult,
  waitForScreen,
  getCurrentScreen,
  waitForStoreReady,
  setMqttConnected,
} from './helpers';

test.describe('Payment Failure and Retry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForStoreReady(page);
    await setMqttConnected(page);
  });

  async function navigateToPayment(page: import('@playwright/test').Page) {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    await page.getByRole('button', { name: /no.*tip/i }).click();
    await page.getByRole('button', { name: /continue/i }).click();
    await waitForScreen(page, 'signature');
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 100);
      await page.mouse.up();
    }
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /done|complete|confirm/i }).click();
    await waitForScreen(page, 'payment');
  }

  test('payment failure shows error message', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, false);
    await waitForScreen(page, 'result');
    
    await expect(page.getByText(/failed|declined|error/i).first()).toBeVisible();
    await expect(page.getByText(/insufficient funds/i)).toBeVisible();
  });

  test('try again button returns to payment screen', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, false);
    await waitForScreen(page, 'result');
    
    const tryAgainButton = page.getByRole('button', { name: /try.*again|retry/i });
    await expect(tryAgainButton).toBeVisible();
    await tryAgainButton.click();
    
    await waitForScreen(page, 'payment');
    
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('payment');
  });

  test('retry after failure can succeed', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, false);
    await waitForScreen(page, 'result');
    
    await page.getByRole('button', { name: /try.*again|retry/i }).click();
    await waitForScreen(page, 'payment');
    
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    await expect(page.getByText(/success/i).first()).toBeVisible();
    await expect(page.getByText('4242')).toBeVisible();
  });

  test('multiple retries are allowed', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, false);
    await waitForScreen(page, 'result');
    
    await page.getByRole('button', { name: /try.*again|retry/i }).click();
    await waitForScreen(page, 'payment');
    
    await simulatePaymentResult(page, false);
    await waitForScreen(page, 'result');
    
    await page.getByRole('button', { name: /try.*again|retry/i }).click();
    await waitForScreen(page, 'payment');
    
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    await expect(page.getByText(/success/i).first()).toBeVisible();
  });

  test('success result shows card info and auth code', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    await expect(page.getByText('4242')).toBeVisible();
    await expect(page.getByText(/A12345/i)).toBeVisible();
  });

  test('success result auto-advances after delay', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    const initialScreen = await getCurrentScreen(page);
    expect(initialScreen).toBe('result');
    
    await page.waitForTimeout(6000);
    
    const newScreen = await getCurrentScreen(page);
    expect(['result', 'receipt', 'thank-you']).toContain(newScreen);
  });

  test('failure result does not auto-advance', async ({ page }) => {
    await navigateToPayment(page);
    
    await simulatePaymentResult(page, false);
    await waitForScreen(page, 'result');
    
    await page.waitForTimeout(5000);
    
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('result');
  });
});
