/**
 * Tenants Repository Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase, withCircuitBreaker } from '../../client';

// Mock the supabase client
vi.mock('../../client', () => ({
  supabase: {
    from: vi.fn(),
  },
  withCircuitBreaker: vi.fn((fn) => fn()),
}));

describe('TenantsRepository', () => {
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock query builder
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };

    (supabase.from as any).mockReturnValue(mockQuery);
  });

  describe('toTenant conversion', () => {
    it('should convert snake_case row to camelCase app type', async () => {
      const row = {
        id: '123',
        name: 'Test Tenant',
        email: 'test@example.com',
        phone: '555-1234',
        status: 'active',
        plan_type: 'professional',
        max_stores: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Import after mocks are set up
      const { tenantsRepository } = await import('../tenants.repository');

      // Mock the response
      mockQuery.single.mockResolvedValueOnce({ data: row, error: null });

      const result = await tenantsRepository.getById('123');

      expect(result).toEqual({
        id: '123',
        name: 'Test Tenant',
        email: 'test@example.com',
        phone: '555-1234',
        status: 'active',
        planType: 'professional',
        maxStores: 5,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
    });
  });

  describe('getAll', () => {
    it.skip('should return all tenants - TODO: fix module caching issue with mocks', async () => {
      // Note: This test is skipped due to module caching issues with the dynamic import pattern.
      // The repository is instantiated when first imported and keeps the stale mock.
      // Consider refactoring to use dependency injection for better testability.
      const rows = [
        {
          id: '1',
          name: 'Tenant 1',
          email: 'tenant1@example.com',
          status: 'active',
          plan_type: 'basic',
          max_stores: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Tenant 2',
          email: 'tenant2@example.com',
          status: 'active',
          plan_type: 'professional',
          max_stores: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockQuery.range.mockResolvedValueOnce({ data: rows, error: null, count: 2 });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].planType).toBe('basic');
      expect(result[1].maxStores).toBe(5);
    });
  });

  describe('getByEmail', () => {
    it('should return tenant by email', async () => {
      const row = {
        id: '123',
        name: 'Test Tenant',
        email: 'test@example.com',
        status: 'active',
        plan_type: 'professional',
        max_stores: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQuery.single.mockResolvedValueOnce({ data: row, error: null });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.getByEmail('test@example.com');

      expect(result?.email).toBe('test@example.com');
      expect(supabase.from).toHaveBeenCalledWith('tenants');
    });

    it('should return null for non-existent email', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.getByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      const input = {
        name: 'New Tenant',
        email: 'new@example.com',
        status: 'active' as const,
        planType: 'basic' as const,
        maxStores: 1,
      };

      const createdRow = {
        id: '456',
        name: 'New Tenant',
        email: 'new@example.com',
        status: 'active',
        plan_type: 'basic',
        max_stores: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockQuery.single.mockResolvedValueOnce({ data: createdRow, error: null });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.createTenant(input);

      expect(result.id).toBe('456');
      expect(result.name).toBe('New Tenant');
      expect(result.planType).toBe('basic');
    });
  });

  describe('suspend/activate', () => {
    it('should suspend a tenant', async () => {
      const suspendedRow = {
        id: '123',
        name: 'Test Tenant',
        email: 'test@example.com',
        status: 'suspended',
        plan_type: 'professional',
        max_stores: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockQuery.single.mockResolvedValueOnce({ data: suspendedRow, error: null });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.suspend('123');

      expect(result.status).toBe('suspended');
    });

    it('should activate a tenant', async () => {
      const activatedRow = {
        id: '123',
        name: 'Test Tenant',
        email: 'test@example.com',
        status: 'active',
        plan_type: 'professional',
        max_stores: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockQuery.single.mockResolvedValueOnce({ data: activatedRow, error: null });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.activate('123');

      expect(result.status).toBe('active');
    });
  });

  describe('getCountByStatus', () => {
    it('should return counts by status', async () => {
      const data = [
        { status: 'active' },
        { status: 'active' },
        { status: 'suspended' },
        { status: 'inactive' },
      ];

      mockQuery.select.mockResolvedValueOnce({ data, error: null });

      const { tenantsRepository } = await import('../tenants.repository');
      const result = await tenantsRepository.getCountByStatus();

      expect(result.active).toBe(2);
      expect(result.suspended).toBe(1);
      expect(result.inactive).toBe(1);
    });
  });
});
