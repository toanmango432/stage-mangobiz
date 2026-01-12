/**
 * E2E Tests: Split Payment Flow
 * US-017: E2E Tests (Happy Path)
 * 
 * Tests the 2-way split payment flow
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

test.describe('Split Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForStoreReady(page);
    await setMqttConnected(page);
    
    await page.evaluate(() => {
      const store = (window as unknown as { __REDUX_STORE__?: { dispatch: (a: unknown) => void } }).__REDUX_STORE__;
      if (store) {
        store.dispatch({
          type: 'config/updateConfig',
          payload: { splitPaymentEnabled: true, maxSplits: 4 },
        });
      }
    });
  });

  test('2-way equal split payment flow', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await expect(page.getByText('$168.18')).toBeVisible();
    
    const splitButton = page.getByRole('button', { name: /split/i });
    await expect(splitButton).toBeVisible();
    await splitButton.click();
    
    await waitForScreen(page, 'split-selection');
    
    const split2WayButton = page.getByRole('button', { name: /2|two/i }).first();
    await split2WayButton.click();
    
    await expect(page.getByText(/\$84\.09/i)).toBeVisible();
    
    const confirmSplitButton = page.getByRole('button', { name: /confirm|continue/i });
    await confirmSplitButton.click();
    
    await waitForScreen(page, 'split-status');
    await expect(page.getByText(/1.*of.*2|payment 1/i)).toBeVisible();
    
    const payFirstButton = page.getByRole('button', { name: /pay|continue|start/i }).first();
    await payFirstButton.click();
    
    let currentScreen = await getCurrentScreen(page);
    if (currentScreen === 'tip') {
      await page.getByRole('button', { name: /no.*tip/i }).click();
      await page.getByRole('button', { name: /continue/i }).click();
      currentScreen = await getCurrentScreen(page);
    }
    
    if (currentScreen === 'signature') {
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
      currentScreen = await getCurrentScreen(page);
    }
    
    await waitForScreen(page, 'payment');
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    await page.waitForTimeout(3500);
    
    await waitForScreen(page, 'split-status');
    
    const paySecondButton = page.getByRole('button', { name: /pay|continue|start/i }).first();
    await paySecondButton.click();
    
    currentScreen = await getCurrentScreen(page);
    if (currentScreen === 'tip') {
      await page.getByRole('button', { name: /no.*tip/i }).click();
      await page.getByRole('button', { name: /continue/i }).click();
      currentScreen = await getCurrentScreen(page);
    }
    
    if (currentScreen === 'signature') {
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
    }
    
    await waitForScreen(page, 'payment');
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    await page.waitForTimeout(4000);
    
    const finalScreen = await getCurrentScreen(page);
    expect(['result', 'receipt', 'thank-you', 'idle', 'split-status']).toContain(finalScreen);
  });

  test('cancel split returns to order review', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    const splitButton = page.getByRole('button', { name: /split/i });
    await splitButton.click();
    
    await waitForScreen(page, 'split-selection');
    
    const cancelButton = page.locator('button').first();
    await cancelButton.click();
    
    await waitForScreen(page, 'order-review');
  });

  test('split payment shows correct amounts for each split', async ({ page }) => {
    await simulateReadyToPay(page, { total: 100.00 });
    await waitForScreen(page, 'order-review');
    
    const splitButton = page.getByRole('button', { name: /split/i });
    await splitButton.click();
    
    await waitForScreen(page, 'split-selection');
    
    const split2WayButton = page.getByRole('button', { name: /2|two/i }).first();
    await split2WayButton.click();
    
    await expect(page.getByText(/\$50\.00/i)).toBeVisible();
  });

  test('3-way split calculates correctly', async ({ page }) => {
    await simulateReadyToPay(page, { total: 99.00 });
    await waitForScreen(page, 'order-review');
    
    const splitButton = page.getByRole('button', { name: /split/i });
    await splitButton.click();
    
    await waitForScreen(page, 'split-selection');
    
    const split3WayButton = page.getByRole('button', { name: /3|three/i }).first();
    await split3WayButton.click();
    
    await expect(page.getByText(/\$33\.00/i)).toBeVisible();
  });
});
