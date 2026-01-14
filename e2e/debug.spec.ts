import { test } from '@playwright/test';

test('debug modal DOM structure', async ({ page }) => {
    await page.goto('/');

    // Wait for app init
    await page.waitForSelector('text=Mango POS', { timeout: 10000 }).catch(() => { });

    // Navigate to Book
    await page.getByRole('button', { name: 'Book' }).click();
    await page.waitForTimeout(2000);

    // Open modal
    await page.getByTestId('new-appointment-button').click();
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/modal-state.png', fullPage: true });

    // Get all elements with data-testid
    const elements = await page.$$('[data-testid]');
    console.log(`Found ${elements.length} elements with data-testid`);

    for (const el of elements) {
        const testId = await el.getAttribute('data-testid');
        const tag = await el.evaluate(node => node.tagName);
        const visible = await el.isVisible();
        console.log(`  - ${testId} (${tag}) visible: ${visible}`);
    }

    // Try to get the modal container
    const modalExists = await page.locator('.fixed.z-50').count();
    console.log(`Modal containers found: ${modalExists}`);

    // Check for minimized state
    const isMinimizedClass = await page.locator('.fixed.z-50.bg-white').first().getAttribute('class');
    console.log(`Modal classes: ${isMinimizedClass}`);
});
