/**
 * E2E Test Fixtures
 * 
 * Provides mock data and page utilities for Playwright E2E tests.
 * Mocks Supabase and MQTT by intercepting network requests.
 */

import { test as base, expect, Page, Route } from '@playwright/test';

// Mock Data
export const mockClient = {
  id: 'client-123',
  first_name: 'Jane',
  last_name: 'Doe',
  phone: '5551234567',
  email: 'jane.doe@example.com',
  zip_code: '90210',
  sms_opt_in: true,
  preferred_technician_id: null,
  loyalty_points: 150,
  loyalty_points_to_next_reward: 50,
  created_at: '2024-01-01T00:00:00Z',
  last_visit_at: '2024-06-01T00:00:00Z',
  visit_count: 5,
};

export const mockServices = [
  {
    id: 'svc-1',
    name: 'Classic Manicure',
    category_id: 'cat-1',
    price: 25,
    duration_minutes: 30,
    is_active: true,
    description: 'Classic manicure service',
    thumbnail_url: null,
    service_categories: { id: 'cat-1', name: 'Nails', display_order: 1 },
  },
  {
    id: 'svc-2',
    name: 'Gel Manicure',
    category_id: 'cat-1',
    price: 40,
    duration_minutes: 45,
    is_active: true,
    description: 'Gel manicure service',
    thumbnail_url: null,
    service_categories: { id: 'cat-1', name: 'Nails', display_order: 1 },
  },
  {
    id: 'svc-3',
    name: 'Classic Pedicure',
    category_id: 'cat-2',
    price: 35,
    duration_minutes: 45,
    is_active: true,
    description: 'Classic pedicure service',
    thumbnail_url: null,
    service_categories: { id: 'cat-2', name: 'Pedicures', display_order: 2 },
  },
];

export const mockTechnicians = [
  {
    id: 'tech-1',
    first_name: 'Alice',
    last_name: 'Smith',
    display_name: 'Alice S.',
    photo_url: null,
    status: 'available',
    service_ids: ['svc-1', 'svc-2', 'svc-3'],
    estimated_wait_minutes: 10,
  },
  {
    id: 'tech-2',
    first_name: 'Bob',
    last_name: 'Johnson',
    display_name: 'Bob J.',
    photo_url: null,
    status: 'with_client',
    service_ids: ['svc-1', 'svc-2'],
    estimated_wait_minutes: 25,
  },
];

export const mockCheckIn = {
  id: 'checkin-456',
  check_in_number: 'A001',
  store_id: 'store-1',
  client_id: 'client-123',
  client_name: 'Jane Doe',
  client_phone: '5551234567',
  services: [],
  technician_preference: 'anyone',
  guests: [],
  status: 'waiting',
  queue_position: 3,
  estimated_wait_minutes: 15,
  checked_in_at: new Date().toISOString(),
  sync_status: 'synced',
};

// Helper to setup Supabase mocks
export async function setupSupabaseMocks(page: Page) {
  await page.route('**/rest/v1/clients**', async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET') {
      // Phone lookup
      if (url.includes('phone=eq.5551234567')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockClient]),
        });
      }
      // No client found
      if (url.includes('phone=eq.')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    }

    if (method === 'POST') {
      const body = await route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          ...mockClient,
          id: 'client-new',
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
          email: body.email,
        }]),
      });
    }

    return route.continue();
  });

  await page.route('**/rest/v1/services**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockServices),
    });
  });

  await page.route('**/rest/v1/technicians**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTechnicians),
    });
  });

  await page.route('**/rest/v1/check_ins**', async (route: Route) => {
    const method = route.request().method();
    if (method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([mockCheckIn]),
      });
    }
    return route.continue();
  });

  // Mock analytics endpoint
  await page.route('**/functions/v1/analytics**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

// Helper to enter phone number using keypad
export async function enterPhoneNumber(page: Page, phone: string) {
  for (const digit of phone) {
    await page.getByRole('button', { name: digit, exact: true }).click();
    await page.waitForTimeout(50); // Small delay between keypresses
  }
}

// Custom test fixture with mocks
export const test = base.extend<{
  mockPage: Page;
}>({
  mockPage: async ({ page }, use) => {
    await setupSupabaseMocks(page);
    await use(page);
  },
});

export { expect };
