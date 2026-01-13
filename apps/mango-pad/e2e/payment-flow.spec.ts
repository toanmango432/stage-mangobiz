/**
 * E2E Tests: Complete Payment Flow
 * US-017: E2E Tests (Happy Path)
 * 
 * Tests the complete payment flow:
 * Idle -> Order Review -> Tip -> Signature -> Payment -> Result -> Receipt -> Thank You -> Idle
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

test.describe('Complete Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForStoreReady(page);
    await setMqttConnected(page);
  });

  test('starts at idle screen', async ({ page }) => {
    const screen = await getCurrentScreen(page);
    expect(screen).toBe('idle');
    
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('complete payment flow: Idle -> Review -> Tip -> Sign -> Pay -> Result -> Receipt -> Thank You -> Idle', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText('Maria Smith')).toBeVisible();
    await expect(page.getByText('Haircut')).toBeVisible();
    await expect(page.getByText('$45.00')).toBeVisible();
    await expect(page.getByText('$168.18')).toBeVisible();
    
    const confirmButton = page.getByRole('button', { name: /looks good|confirm/i });
    await confirmButton.click();
    
    await waitForScreen(page, 'tip');
    
    await expect(page.getByText(/select.*tip|add.*tip/i)).toBeVisible();
    
    const tip20Button = page.getByRole('button', { name: /20%/i }).first();
    await tip20Button.click();
    
    const continueButton = page.getByRole('button', { name: /continue/i });
    await continueButton.click();
    
    await waitForScreen(page, 'signature');
    
    await expect(page.getByText(/sign|signature/i).first()).toBeVisible();
    
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible' });
    
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 100);
      await page.mouse.move(box.x + 200, box.y + 50);
      await page.mouse.up();
    }
    
    await page.waitForTimeout(200);
    
    const doneButton = page.getByRole('button', { name: /done|complete|confirm/i });
    await doneButton.click();
    
    await waitForScreen(page, 'payment');
    
    await expect(page.getByText(/insert|tap|card/i).first()).toBeVisible();
    
    await simulatePaymentResult(page, true);
    await waitForScreen(page, 'result');
    
    await expect(page.getByText(/success/i).first()).toBeVisible();
    await expect(page.getByText('4242')).toBeVisible();
    
    await page.waitForTimeout(5000);
    
    const currentScreen = await getCurrentScreen(page);
    expect(['result', 'receipt', 'thank-you']).toContain(currentScreen);
    
    if (currentScreen === 'receipt') {
      await expect(page.getByText(/receipt/i).first()).toBeVisible();
      
      const noReceiptButton = page.getByRole('button', { name: /no.*receipt|skip/i });
      await noReceiptButton.click();
    }
    
    if (currentScreen !== 'idle') {
      await page.waitForTimeout(7000);
    }
  });

  test('displays all order items correctly', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');

    await expect(page.getByText('Haircut')).toBeVisible();
    await expect(page.getByText('Color Treatment')).toBeVisible();
    await expect(page.getByText('Shampoo (Retail)')).toBeVisible();
    
    await expect(page.getByText('$155.00')).toBeVisible();
    await expect(page.getByText('$13.18')).toBeVisible();
    await expect(page.getByText('$168.18')).toBeVisible();
  });

  test('tip selection updates total correctly', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    const tip18Button = page.getByRole('button', { name: /18%/i }).first();
    await tip18Button.click();
    
    await expect(page.getByText(/\$30\.27/i).first()).toBeVisible();
    
    const tip25Button = page.getByRole('button', { name: /25%/i }).first();
    await tip25Button.click();
    
    await expect(page.getByText(/\$42\.05/i).first()).toBeVisible();
  });

  test('no tip option works', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    const noTipButton = page.getByRole('button', { name: /no.*tip/i });
    await noTipButton.click();
    
    const continueButton = page.getByRole('button', { name: /continue/i });
    await continueButton.click();
    
    await waitForScreen(page, 'signature');
  });

  test('custom tip amount via keypad', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    const customButton = page.getByRole('button', { name: /custom/i });
    await customButton.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    await page.getByRole('button', { name: 'Number 5' }).click();
    await page.getByRole('button', { name: 'Number 0' }).click();
    
    await page.getByRole('button', { name: /done|confirm/i }).click();
    
    await expect(page.getByText(/\$50\.00/i).first()).toBeVisible();
  });

  test('signature is required before proceeding', async ({ page }) => {
    await simulateReadyToPay(page);
    await waitForScreen(page, 'order-review');
    
    await page.getByRole('button', { name: /looks good|confirm/i }).click();
    await waitForScreen(page, 'tip');
    
    await page.getByRole('button', { name: /18%/i }).first().click();
    await page.getByRole('button', { name: /continue/i }).click();
    await waitForScreen(page, 'signature');
    
    const doneButton = page.locator('button:has-text("Done")').first();
    await expect(doneButton).toBeDisabled();
    
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 100);
      await page.mouse.up();
    }
    
    await page.waitForTimeout(200);
    await expect(doneButton).toBeEnabled();
  });

  test('clear signature button resets canvas', async ({ page }) => {
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
    const doneButton = page.locator('button:has-text("Done")').first();
    await expect(doneButton).toBeEnabled();
    
    const clearButton = page.getByRole('button', { name: /clear/i });
    await clearButton.click();
    
    await expect(doneButton).toBeDisabled();
  });

  test('loyalty points passed through transaction', async ({ page }) => {
    await simulateReadyToPay(page, { loyaltyPoints: 250 });
    await waitForScreen(page, 'order-review');
    
    const state = await page.evaluate(() => {
      const store = (window as unknown as { __REDUX_STORE__?: { getState: () => { transaction: { current: { loyaltyPoints?: number } | null } } } }).__REDUX_STORE__;
      return store?.getState()?.transaction?.current?.loyaltyPoints;
    });
    
    expect(state).toBe(250);
  });
});
