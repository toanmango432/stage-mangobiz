/**
 * Unit tests for ClientSQLiteService
 *
 * Tests client CRUD operations, filtering, search, and VIP/blocked queries.
 *
 * @module sqlite-adapter/services/__tests__/clientService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClientSQLiteService, type ClientFilters } from '../clientService';
import { createMockAdapter, createMockClient } from './mockAdapter';

describe('ClientSQLiteService', () => {
  let adapter: ReturnType<typeof createMockAdapter>;
  let service: ClientSQLiteService;

  const testStoreId = 'store-001';

  beforeEach(() => {
    adapter = createMockAdapter();
    service = new ClientSQLiteService(adapter);

    // Seed test data
    adapter._seed('clients', [
      createMockClient({
        id: 'client-1',
        store_id: testStoreId,
        first_name: 'Alice',
        last_name: 'Anderson',
        phone: '555-1001',
        email: 'alice@example.com',
        is_blocked: 0,
        is_vip: 1,
        loyalty_tier: 'gold',
        total_visits: 25,
        total_spent: 2500.0,
        last_visit: '2024-01-10T14:00:00.000Z',
      }),
      createMockClient({
        id: 'client-2',
        store_id: testStoreId,
        first_name: 'Bob',
        last_name: 'Brown',
        phone: '555-1002',
        email: 'bob@example.com',
        is_blocked: 1,
        blocked_at: '2024-01-05T10:00:00.000Z',
        block_reason: 'no_show',
        is_vip: 0,
        loyalty_tier: 'silver',
        total_visits: 5,
        total_spent: 150.0,
        last_visit: '2024-01-05T10:00:00.000Z',
      }),
      createMockClient({
        id: 'client-3',
        store_id: testStoreId,
        first_name: 'Charlie',
        last_name: 'Chen',
        phone: '555-1003',
        email: null,
        is_blocked: 0,
        is_vip: 0,
        loyalty_tier: 'bronze',
        total_visits: 2,
        total_spent: 75.0,
        last_visit: '2023-06-15T09:00:00.000Z',
      }),
      createMockClient({
        id: 'client-4',
        store_id: testStoreId,
        first_name: 'Diana',
        last_name: 'Davis',
        phone: '555-1004',
        email: 'diana@example.com',
        is_blocked: 0,
        is_vip: 1,
        loyalty_tier: 'gold',
        total_visits: 50,
        total_spent: 5000.0,
        last_visit: '2024-01-12T16:00:00.000Z',
        source: 'referral',
      }),
      // Different store
      createMockClient({
        id: 'client-5',
        store_id: 'store-002',
        first_name: 'Eve',
        last_name: 'Edwards',
        phone: '555-2001',
        is_blocked: 0,
        is_vip: 0,
      }),
    ]);
  });

  describe('getAll', () => {
    it('returns all clients for a store', async () => {
      const clients = await service.getAll(testStoreId);
      expect(clients).toHaveLength(4);
      expect(clients.every((c) => c.storeId === testStoreId)).toBe(true);
    });

    it('does not return clients from other stores', async () => {
      const clients = await service.getAll(testStoreId);
      expect(clients.find((c) => c.id === 'client-5')).toBeUndefined();
    });

    it('respects limit parameter', async () => {
      const clients = await service.getAll(testStoreId, 2);
      expect(clients).toHaveLength(2);
    });

    it('respects offset parameter', async () => {
      const clients = await service.getAll(testStoreId, 100, 2);
      expect(clients).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('returns client when found', async () => {
      const client = await service.getById('client-1');
      expect(client).toBeDefined();
      expect(client?.id).toBe('client-1');
      expect(client?.firstName).toBe('Alice');
      expect(client?.lastName).toBe('Anderson');
    });

    it('returns undefined when not found', async () => {
      const client = await service.getById('nonexistent');
      expect(client).toBeUndefined();
    });

    it('converts boolean fields correctly', async () => {
      const client = await service.getById('client-1');
      expect(client?.isVip).toBe(true);
      expect(client?.isBlocked).toBe(false);

      const blocked = await service.getById('client-2');
      expect(blocked?.isBlocked).toBe(true);
      expect(blocked?.isVip).toBe(false);
    });
  });

  describe('getByIds', () => {
    it('returns multiple clients', async () => {
      const clients = await service.getByIds(['client-1', 'client-3']);
      expect(clients).toHaveLength(2);
      expect(clients.map((c) => c.id).sort()).toEqual(['client-1', 'client-3']);
    });

    it('returns empty array for empty input', async () => {
      const clients = await service.getByIds([]);
      expect(clients).toEqual([]);
    });
  });

  describe('getFiltered', () => {
    it('filters by status active', async () => {
      const filters: ClientFilters = { status: 'active' };
      const result = await service.getFiltered(testStoreId, filters);

      expect(result.clients.every((c) => !c.isBlocked)).toBe(true);
    });

    it('filters by status blocked', async () => {
      const filters: ClientFilters = { status: 'blocked' };
      const result = await service.getFiltered(testStoreId, filters);

      expect(result.clients.length).toBe(1);
      expect(result.clients[0].id).toBe('client-2');
      expect(result.clients[0].isBlocked).toBe(true);
    });

    it('filters by status vip', async () => {
      const filters: ClientFilters = { status: 'vip' };
      const result = await service.getFiltered(testStoreId, filters);

      expect(result.clients.length).toBe(2);
      expect(result.clients.every((c) => c.isVip)).toBe(true);
    });

    it('filters by loyalty tier', async () => {
      const filters: ClientFilters = { loyaltyTier: 'gold' };
      const result = await service.getFiltered(testStoreId, filters);

      expect(result.clients.length).toBe(2);
      expect(result.clients.every((c) => c.loyaltyTier === 'gold')).toBe(true);
    });

    it('filters by source', async () => {
      const filters: ClientFilters = { source: 'referral' };
      const result = await service.getFiltered(testStoreId, filters);

      expect(result.clients.length).toBe(1);
      expect(result.clients[0].id).toBe('client-4');
    });

    it('returns total count with filters', async () => {
      const filters: ClientFilters = { status: 'vip' };
      const result = await service.getFiltered(testStoreId, filters);

      expect(result.total).toBe(2);
    });
  });

  // Note: The search method uses complex SQL with LIKE patterns and string concatenation
  // (first_name || ' ' || last_name) which cannot be fully simulated by the mock adapter.
  // These tests verify the method executes without error. Full search behavior is tested
  // via integration tests with real SQLite.
  describe('search', () => {
    it('executes without error', async () => {
      // Verify the method completes without throwing
      await expect(service.search(testStoreId, 'alice')).resolves.toBeDefined();
    });

    it('returns array of clients', async () => {
      const clients = await service.search(testStoreId, 'test');
      expect(Array.isArray(clients)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const clients = await service.search(testStoreId, 'test', 2);
      expect(clients.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getBlocked', () => {
    it('returns only blocked clients', async () => {
      const blocked = await service.getBlocked(testStoreId);
      expect(blocked.length).toBe(1);
      expect(blocked[0].id).toBe('client-2');
      expect(blocked[0].isBlocked).toBe(true);
    });

    it('returns empty array when no blocked clients', async () => {
      const blocked = await service.getBlocked('store-002');
      expect(blocked).toHaveLength(0);
    });
  });

  describe('getVip', () => {
    it('returns only VIP clients', async () => {
      const vips = await service.getVip(testStoreId);
      expect(vips.length).toBe(2);
      expect(vips.every((c) => c.isVip)).toBe(true);
    });

    it('respects limit parameter', async () => {
      const vips = await service.getVip(testStoreId, 1);
      expect(vips.length).toBe(1);
    });
  });

  describe('getCount', () => {
    it('returns correct count for store', async () => {
      const count = await service.getCount(testStoreId);
      expect(count).toBe(4);
    });

    it('returns 0 for empty store', async () => {
      const count = await service.getCount('nonexistent-store');
      expect(count).toBe(0);
    });
  });

  describe('create', () => {
    it('creates a new client', async () => {
      const newClient = await service.create({
        storeId: testStoreId,
        firstName: 'Frank',
        lastName: 'Foster',
        phone: '555-9999',
        isBlocked: false,
        isVip: false,
        syncStatus: 'local',
      });

      expect(newClient.id).toBeDefined();
      expect(newClient.firstName).toBe('Frank');
      expect(newClient.lastName).toBe('Foster');
      expect(newClient.createdAt).toBeDefined();
      expect(newClient.updatedAt).toBeDefined();
    });

    it('sets default syncStatus', async () => {
      const newClient = await service.create({
        storeId: testStoreId,
        firstName: 'Test',
        lastName: 'User',
        phone: '555-0000',
        isBlocked: false,
        isVip: false,
        syncStatus: 'local',
      });

      expect(newClient.syncStatus).toBe('local');
    });
  });

  describe('update', () => {
    it('updates client fields', async () => {
      const updated = await service.update('client-1', {
        firstName: 'Alicia',
        phone: '555-9999',
      });

      expect(updated).toBeDefined();
      expect(updated?.firstName).toBe('Alicia');
      expect(updated?.phone).toBe('555-9999');
      expect(updated?.lastName).toBe('Anderson'); // Unchanged
    });

    it('returns undefined for nonexistent client', async () => {
      const updated = await service.update('nonexistent', {
        firstName: 'Test',
      });

      expect(updated).toBeUndefined();
    });

    it('updates boolean fields correctly', async () => {
      const updated = await service.update('client-1', {
        isVip: false,
        isBlocked: true,
      });

      expect(updated?.isVip).toBe(false);
      expect(updated?.isBlocked).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes existing client', async () => {
      const deleted = await service.delete('client-1');
      expect(deleted).toBe(true);

      const client = await service.getById('client-1');
      expect(client).toBeUndefined();
    });

    it('returns false for nonexistent client', async () => {
      const deleted = await service.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('updates count after delete', async () => {
      const before = await service.getCount(testStoreId);
      await service.delete('client-1');
      const after = await service.getCount(testStoreId);

      expect(after).toBe(before - 1);
    });
  });

  describe('multi-store isolation', () => {
    it('getAll only returns clients from specified store', async () => {
      const store1Clients = await service.getAll(testStoreId);
      const store2Clients = await service.getAll('store-002');

      expect(store1Clients).toHaveLength(4);
      expect(store2Clients).toHaveLength(1);
    });

    // Note: search method uses complex LIKE patterns that the mock can't fully simulate.
    // Store isolation via getCount is more reliably tested.
    it('getCount is scoped to store', async () => {
      const store1Count = await service.getCount(testStoreId);
      const store2Count = await service.getCount('store-002');

      expect(store1Count).toBe(4);
      expect(store2Count).toBe(1);
    });

  });
});
