import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from '../server';

// Mock environment variables
vi.mock('@/mocks/browser', () => ({
  startMockWorker: vi.fn(),
}));

// Start server before all tests
beforeAll(() => {
  server.listen({ 
    onUnhandledRequest: 'warn',
  });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});

describe('MSW Handlers', () => {
  it('should handle storefront services request', async () => {
    const response = await fetch('/api/v1/storefront/services');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle storefront products request', async () => {
    const response = await fetch('/api/v1/storefront/products');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle booking availability request', async () => {
    const response = await fetch('/api/v1/booking/availability?date=2025-01-20');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('date');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle cart session creation', async () => {
    const response = await fetch('/api/v1/cart/session', {
      method: 'POST',
    });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('items');
  });

  it('should handle promotions request', async () => {
    const response = await fetch('/api/v1/promotions');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle announcements request', async () => {
    const response = await fetch('/api/v1/store/announcements');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle AI query request', async () => {
    const response = await fetch('/api/v1/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'What services do you offer?',
        type: 'chat',
      }),
    });
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('suggestions');
  });

  it('should return 404 for non-existent service', async () => {
    const response = await fetch('/api/v1/storefront/services/non-existent-id');
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('should return 400 for invalid booking request', async () => {
    const response = await fetch('/api/v1/booking/availability');
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('code', 'MISSING_PARAMETER');
  });
});
