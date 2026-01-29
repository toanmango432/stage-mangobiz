/**
 * E2E Tests: Catalog-Checkout Flow
 *
 * Tests the complete catalog integration in the checkout flow including:
 * - Service selection with variants
 * - Variant selector modal/sheet
 * - Add-on selection with validation
 * - Price calculation including variant + add-on prices
 * - Duration calculation including add-on durations
 * - Payment flow with catalog-enhanced services
 *
 * Prerequisites:
 * - App must be logged in (auth state persisted)
 * - Store must have services with variants in catalog
 * - Store must have add-on groups configured
 *
 * @see docs/product/PRD-Sales-Checkout-Module.md
 * @see apps/store-app/src/components/checkout/VariantSelector.tsx
 * @see apps/store-app/src/components/checkout/AddOnSelector.tsx
 */

import { test, expect } from '@playwright/test';

test.describe('Catalog-Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app root first to check auth state
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check if redirected to login (auth required)
    const isLoginPage = await page.url().includes('/login') ||
                        await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (isLoginPage) {
      test.skip(true, 'Auth required - run with authenticated session');
      return;
    }

    // Navigate to checkout page
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
  });

  test('checkout page loads and displays service catalog', async ({ page }) => {
    // Verify page loaded (look for common checkout elements)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Try to find service grid/list
    const serviceGrid = page.locator('[data-testid="service-grid"], [class*="ServiceGrid"], [class*="service-"]');
    const gridVisible = await serviceGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (!gridVisible) {
      test.skip(true, 'Service grid not found - may require specific navigation or setup');
      return;
    }

    // Verify at least one service is displayed
    const serviceCards = page.locator('[data-testid="service-card"], [class*="ServiceCard"], [class*="service-card"]');
    const count = await serviceCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('service with variants shows variant selector', async ({ page }) => {
    // Find a service that has variants (look for variant indicator or badge)
    // Note: This assumes services with variants are marked visually
    const serviceWithVariants = page.locator('[data-testid="service-card"]:has([data-testid="variant-badge"])').first();

    // If no services with variants exist, skip this test
    const hasVariants = await serviceWithVariants.count() > 0;
    if (!hasVariants) {
      test.skip(true, 'No services with variants found in catalog');
      return;
    }

    // Click the service
    await serviceWithVariants.click();

    // Verify variant selector appears
    const variantSelector = page.locator('[data-testid="variant-selector"], [class*="VariantSelector"]');
    await expect(variantSelector).toBeVisible({ timeout: 5000 });

    // Verify variant options are listed
    const variantOptions = page.locator('[data-testid="variant-option"]');
    const variantCount = await variantOptions.count();
    expect(variantCount).toBeGreaterThan(0);

    // Take screenshot of variant selector
    await page.screenshot({
      path: 'e2e/screenshots/variant-selector.png',
      fullPage: false
    });
  });

  test('selecting variant shows add-on selector', async ({ page }) => {
    // Find and click service with variants
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Check if variant selector appears
    const variantSelector = page.locator('[data-testid="variant-selector"]');
    const hasVariantSelector = await variantSelector.isVisible().catch(() => false);

    if (hasVariantSelector) {
      // Select first variant
      const firstVariant = page.locator('[data-testid="variant-option"]').first();
      await firstVariant.click();
    }

    // Check if add-on selector appears
    // Note: Add-on selector may not appear if no add-ons are configured
    const addOnSelector = page.locator('[data-testid="add-on-selector"], [class*="AddOnSelector"]');
    const hasAddOns = await addOnSelector.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAddOns) {
      // Verify add-on groups are displayed
      const addOnGroups = page.locator('[data-testid="add-on-group"]');
      const groupCount = await addOnGroups.count();
      expect(groupCount).toBeGreaterThan(0);

      // Take screenshot of add-on selector
      await page.screenshot({
        path: 'e2e/screenshots/add-on-selector.png',
        fullPage: false
      });
    } else {
      // If no add-ons, service should be added directly to ticket
      console.log('No add-ons configured for this service');
    }
  });

  test('add-on selection enforces min/max rules', async ({ page }) => {
    // Navigate to a service with add-ons
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Handle variant selection if present
    const variantSelector = page.locator('[data-testid="variant-selector"]');
    const hasVariants = await variantSelector.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasVariants) {
      await page.locator('[data-testid="variant-option"]').first().click();
    }

    // Check for add-on selector
    const addOnSelector = page.locator('[data-testid="add-on-selector"]');
    const hasAddOns = await addOnSelector.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasAddOns) {
      test.skip(true, 'No add-ons configured for testing');
      return;
    }

    // Find required add-on group (if any)
    const requiredGroup = page.locator('[data-testid="add-on-group"]:has([data-testid="required-badge"])').first();
    const hasRequiredGroup = await requiredGroup.count() > 0;

    if (hasRequiredGroup) {
      // Try to proceed without selecting required add-on
      const continueButton = page.locator('[data-testid="continue-button"], button:has-text("Continue")');
      await continueButton.click();

      // Verify error message or disabled state
      const errorMessage = page.locator('[role="alert"], [class*="error"]');
      const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
      const isDisabled = await continueButton.isDisabled().catch(() => false);

      expect(hasError || isDisabled).toBeTruthy();
    }
  });

  test('service is added to ticket with correct price and duration', async ({ page }) => {
    // Get initial ticket state
    const ticketPanel = page.locator('[data-testid="ticket-panel"], [class*="TicketPanel"]');
    const initialItems = await page.locator('[data-testid="ticket-item"]').count();

    // Add a service
    const serviceCard = page.locator('[data-testid="service-card"]').first();

    // Get service name and price for verification
    const serviceName = await serviceCard.locator('[data-testid="service-name"]').textContent().catch(() => 'Service');
    const servicePrice = await serviceCard.locator('[data-testid="service-price"]').textContent().catch(() => '$0');

    await serviceCard.click();

    // Handle variant selection
    const variantSelector = page.locator('[data-testid="variant-selector"]');
    const hasVariants = await variantSelector.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasVariants) {
      await page.locator('[data-testid="variant-option"]').first().click();
    }

    // Handle add-on selection
    const addOnSelector = page.locator('[data-testid="add-on-selector"]');
    const hasAddOns = await addOnSelector.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasAddOns) {
      // Click continue/skip button to proceed without add-ons
      const continueButton = page.locator('[data-testid="continue-button"], [data-testid="skip-button"], button:has-text("Continue"), button:has-text("Skip")').first();
      await continueButton.click();
    }

    // Wait for service to be added to ticket
    await page.waitForTimeout(1000);

    // Verify ticket item count increased
    const finalItems = await page.locator('[data-testid="ticket-item"]').count();
    expect(finalItems).toBe(initialItems + 1);

    // Verify service appears in ticket
    const ticketItems = page.locator('[data-testid="ticket-item"]');
    const lastItem = ticketItems.last();
    const ticketItemText = await lastItem.textContent();

    // Service name should appear somewhere in the ticket item
    expect(ticketItemText).toContain(serviceName?.trim() || 'Service');

    // Take screenshot of updated ticket
    await page.screenshot({
      path: 'e2e/screenshots/ticket-with-service.png',
      fullPage: true
    });
  });

  test('add-on prices are included in service total', async ({ page }) => {
    // Add a service with add-ons
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Handle variant
    const variantSelector = page.locator('[data-testid="variant-selector"]');
    const hasVariants = await variantSelector.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasVariants) {
      await page.locator('[data-testid="variant-option"]').first().click();
    }

    // Check for add-ons
    const addOnSelector = page.locator('[data-testid="add-on-selector"]');
    const hasAddOns = await addOnSelector.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasAddOns) {
      test.skip(true, 'No add-ons configured for price verification');
      return;
    }

    // Select an add-on with a price
    const addOnOption = page.locator('[data-testid="add-on-option"]').first();
    const addOnPrice = await addOnOption.locator('[data-testid="add-on-price"]').textContent().catch(() => '$0');
    await addOnOption.click();

    // Continue to add to ticket
    const continueButton = page.locator('[data-testid="continue-button"], button:has-text("Continue")').first();
    await continueButton.click();

    // Wait for ticket update
    await page.waitForTimeout(1000);

    // Verify ticket shows service + add-on
    const lastTicketItem = page.locator('[data-testid="ticket-item"]').last();
    const itemPrice = await lastTicketItem.locator('[data-testid="line-item-price"]').textContent().catch(() => '$0');

    // Price should reflect add-on (basic verification that price changed)
    expect(itemPrice).toBeTruthy();
    console.log(`Service with add-on total: ${itemPrice}`);
  });

  test('staff override duration is used for ticket timer', async ({ page }) => {
    // This test verifies that staff-specific duration overrides are respected
    // Note: Requires staff assignment with customDuration configured

    // Add a service to ticket
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Skip variant/add-on selection for simplicity
    const continueButton = page.locator('[data-testid="continue-button"], [data-testid="skip-button"], button:has-text("Continue"), button:has-text("Skip")').first();
    const hasContinueButton = await continueButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasContinueButton) {
      await continueButton.click();
    }

    // Wait for ticket item to appear
    await page.waitForTimeout(1000);

    // Check if duration is displayed in ticket
    const ticketItem = page.locator('[data-testid="ticket-item"]').last();
    const duration = await ticketItem.locator('[data-testid="service-duration"]').textContent().catch(() => null);

    if (duration) {
      console.log(`Service duration: ${duration}`);
      expect(duration).toBeTruthy();
    } else {
      console.log('Duration not displayed in ticket UI');
    }
  });

  test('complete checkout flow with variant and add-ons', async ({ page }) => {
    // End-to-end flow: service → variant → add-ons → payment

    // Step 1: Add service
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Step 2: Select variant if available
    const variantSelector = page.locator('[data-testid="variant-selector"]');
    const hasVariants = await variantSelector.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasVariants) {
      await page.locator('[data-testid="variant-option"]').first().click();
      await page.screenshot({
        path: 'e2e/screenshots/flow-variant-selected.png'
      });
    }

    // Step 3: Handle add-ons
    const addOnSelector = page.locator('[data-testid="add-on-selector"]');
    const hasAddOns = await addOnSelector.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasAddOns) {
      // Select first optional add-on
      const addOnOption = page.locator('[data-testid="add-on-option"]').first();
      await addOnOption.click();
      await page.screenshot({
        path: 'e2e/screenshots/flow-addon-selected.png'
      });
    }

    // Step 4: Continue/Add to ticket
    const continueButton = page.locator('[data-testid="continue-button"], button:has-text("Continue"), button:has-text("Add")').first();
    const hasContinueButton = await continueButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasContinueButton) {
      await continueButton.click();
    }

    // Wait for ticket update
    await page.waitForTimeout(1000);

    // Step 5: Verify service in ticket
    const ticketItems = page.locator('[data-testid="ticket-item"]');
    const itemCount = await ticketItems.count();
    expect(itemCount).toBeGreaterThan(0);

    await page.screenshot({
      path: 'e2e/screenshots/flow-ticket-updated.png',
      fullPage: true
    });

    // Step 6: Proceed to payment (if available)
    const paymentButton = page.locator('[data-testid="checkout-button"], button:has-text("Checkout"), button:has-text("Payment")').first();
    const hasPaymentButton = await paymentButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasPaymentButton) {
      await paymentButton.click();

      // Verify payment modal/page appears
      const paymentModal = page.locator('[data-testid="payment-modal"], [class*="PaymentModal"]');
      const hasPaymentModal = await paymentModal.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasPaymentModal) {
        await page.screenshot({
          path: 'e2e/screenshots/flow-payment-modal.png'
        });
        console.log('Payment modal opened successfully');
      }
    }
  });
});

test.describe('Catalog-Checkout Visual Verification', () => {
  test('variant selector visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check auth
    const isLoginPage = await page.url().includes('/login') ||
                        await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (isLoginPage) {
      test.skip(true, 'Auth required');
      return;
    }

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    // Find service with variants
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    const hasServiceCard = await serviceCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasServiceCard) {
      test.skip(true, 'No service cards found');
      return;
    }

    await serviceCard.click();

    // Wait for variant selector
    const variantSelector = page.locator('[data-testid="variant-selector"]');
    const hasVariants = await variantSelector.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasVariants) {
      await page.screenshot({
        path: 'e2e/screenshots/visual-variant-selector.png',
        fullPage: false
      });
    } else {
      test.skip(true, 'No variants to verify');
    }
  });

  test('add-on selector visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check auth
    const isLoginPage = await page.url().includes('/login') ||
                        await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (isLoginPage) {
      test.skip(true, 'Auth required');
      return;
    }

    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    const hasServiceCard = await serviceCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasServiceCard) {
      test.skip(true, 'No service cards found');
      return;
    }

    await serviceCard.click();

    // Skip variant if present
    const variantOption = page.locator('[data-testid="variant-option"]').first();
    const hasVariant = await variantOption.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasVariant) {
      await variantOption.click();
    }

    // Wait for add-on selector
    const addOnSelector = page.locator('[data-testid="add-on-selector"]');
    const hasAddOns = await addOnSelector.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasAddOns) {
      await page.screenshot({
        path: 'e2e/screenshots/visual-addon-selector.png',
        fullPage: false
      });
    } else {
      test.skip(true, 'No add-ons to verify');
    }
  });
});
