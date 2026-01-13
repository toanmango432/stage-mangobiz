/**
 * E2E Tests: Cancel Flow
 * US-017: E2E Tests (Happy Path)
 * 
 * Tests the cancel/abort flow via MQTT cancel message
 */

import { test, expect } from '@playwright/test';
import {
  simulateReadyToPay,
  simulateCancel,
  waitForScreen,
  getCurrentScreen,
  waitForStoreReady,
  setMqttConnected,
} from './helpers';

test.describe('Cancel Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForStoreReady(page);
    await setMqttConnected(page);
  });

  test('cancel from order review returns to idle', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await expect(page.getByText('Jane Doe')).toBeVisible();
    
    await simulateCancel(page);
    await waitForScreen(page, 'idle');
    
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('idle');
  });

  test('cancel from tip screen returns to idle', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    await simulateCancel(page);
    await waitForScreen(page, 'idle');
    
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('idle');
  });

  test('cancel from signature screen returns to idle', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    await page.getByRole('button', { name: /no.*tip/i }).click();
    await page.getByRole('button', { name: /continue/i }).click();
    await waitForScreen(page, 'signature');
    
    await simulateCancel(page);
    await waitForScreen(page, 'idle');
    
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('idle');
  });

  test('cancel from payment screen returns to idle', async ({ page }) => {
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
    
    await simulateCancel(page);
    await waitForScreen(page, 'idle');
    
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('idle');
  });

  test('cancel clears transaction data', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await expect(page.getByText('Jane Doe')).toBeVisible();
    
    await simulateCancel(page);
    await waitForScreen(page, 'idle');
    
    const state = await page.evaluate(() => {
      const store = (window as unknown as { __REDUX_STORE__?: { getState: () => { transaction: { current: unknown } } } }).__REDUX_STORE__;
      return store?.getState()?.transaction?.current;
    });
    
    expect(state).toBeNull();
  });

  test('need help button is visible on all payment screens', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    const helpButtonReview = page.getByText(/need help/i).first();
    await expect(helpButtonReview).toBeVisible();
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    const helpButtonTip = page.getByText(/need help/i).first();
    await expect(helpButtonTip).toBeVisible();
    
    await page.getByRole('button', { name: /no.*tip/i }).click();
    await page.getByRole('button', { name: /continue/i }).click();
    await waitForScreen(page, 'signature');
    
    const helpButtonSig = page.getByText(/need help/i).first();
    await expect(helpButtonSig).toBeVisible();
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 100);
      await page.mouse.up();
    }
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /done|agree|complete/i }).click();
    await waitForScreen(page, 'payment');
    
    const helpButtonPay = page.getByText(/need help/i).first();
    await expect(helpButtonPay).toBeVisible();
  });
});
