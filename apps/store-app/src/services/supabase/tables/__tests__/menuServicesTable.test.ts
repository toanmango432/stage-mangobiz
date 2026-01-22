/**
 * Unit tests for menuServicesTable operations
 *
 * Tests CRUD operations, archive/restore, search, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { menuServicesTable } from '../menuServicesTable';
import type { MenuServiceRow, MenuServiceInsert, MenuServiceUpdate } from '../../types';

// Mock Supabase client with proper chaining
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockIlike = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockGt = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();

const mockQueryBuilder: any = {
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  ilike: mockIlike,
  order: mockOrder,
  limit: mockLimit,
  gt: mockGt,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  single: mockSingle,
  upsert: mockUpsert,
};

// All methods return the builder for chaining
mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);
mockIlike.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockGt.mockReturnValue(mockQueryBuilder);
mockInsert.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);
mockDelete.mockReturnValue(mockQueryBuilder);
mockUpsert.mockReturnValue(mockQueryBuilder);

vi.mock('../../client', () => ({
  supabase: {
    from: vi.fn(() => mockQueryBuilder),
  },
}));

describe('menuServicesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to return the query builder by default
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockIn.mockReturnValue(mockQueryBuilder);
    mockIlike.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockLimit.mockReturnValue(mockQueryBuilder);
    mockGt.mockReturnValue(mockQueryBuilder);
    mockInsert.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockDelete.mockReturnValue(mockQueryBuilder);
    mockUpsert.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock service row
  const createMockService = (overrides?: Partial<MenuServiceRow>): MenuServiceRow => ({
    id: 'svc-1',
    tenant_id: 'tenant-1',
    store_id: 'store-1',
    category_id: 'cat-1',
    name: 'Haircut',
    description: 'Standard haircut service',
    pricing_type: 'fixed',
    price: 50.00,
    price_max: null,
    cost: 20.00,
    duration: 60,
    buffer_time: 0,
    extra_time: null,
    extra_time_type: null,
    taxable: true,
    commission_rate: 0.5,
    display_order: 1,
    status: 'active',
    tags: ['popular'],
    images: [],
    color: null,
    icon: null,
    sku: null,
    barcode: null,
    online_booking_enabled: true,
    show_price_online: true,
    booking_availability: 'both',
    advance_booking_days_min: 0,
    advance_booking_days_max: 90,
    requires_patch_test: false,
    patch_test_days_before: null,
    turn_weight: 1.0,
    rebook_reminder_days: 30,
    has_variants: false,
    variant_count: 0,
    archived_at: null,
    archived_by: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
    sync_status: 'synced',
    version: 1,
    vector_clock: { 'device-1': 1 },
    last_synced_version: 1,
    created_at: '2026-01-22T10:00:00.000Z',
    created_by: 'user-1',
    created_by_device: 'device-1',
    updated_at: '2026-01-22T10:00:00.000Z',
    last_modified_by: 'user-1',
    last_modified_by_device: 'device-1',
    ...overrides,
  });

  describe('getByStoreId', () => {
    it('should get all active services for a store', async () => {
      const mockServices = [createMockService(), createMockService({ id: 'svc-2', name: 'Hair Coloring' })];
      mockQueryBuilder.order.mockResolvedValue({ data: mockServices, error: null });

      const result = await menuServicesTable.getByStoreId('store-1');

      expect(result).toEqual(mockServices);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should include inactive services when requested', async () => {
      const mockServices = [createMockService({ status: 'archived' })];
      mockQueryBuilder.order.mockResolvedValue({ data: mockServices, error: null });

      const result = await menuServicesTable.getByStoreId('store-1', true);

      expect(result).toEqual(mockServices);
      // Should not filter by status when includeInactive is true
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
    });

    it('should return empty array when no data', async () => {
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: null });

      const result = await menuServicesTable.getByStoreId('store-1');

      expect(result).toEqual([]);
    });

    it('should throw error on database error', async () => {
      const dbError = new Error('Database error');
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.getByStoreId('store-1')).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should get a single service by ID', async () => {
      const mockService = createMockService();
      mockQueryBuilder.single.mockResolvedValue({ data: mockService, error: null });

      const result = await menuServicesTable.getById('svc-1');

      expect(result).toEqual(mockService);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should return null when service not found (PGRST116)', async () => {
      const notFoundError = { code: 'PGRST116', message: 'No rows found' };
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: notFoundError });

      const result = await menuServicesTable.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on other database errors', async () => {
      const dbError = { code: 'PGRST500', message: 'Internal error' };
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.getById('svc-1')).rejects.toThrow();
    });
  });

  describe('getByCategoryId', () => {
    it('should get services by category ID', async () => {
      const mockServices = [createMockService(), createMockService({ id: 'svc-2' })];
      mockQueryBuilder.order.mockResolvedValue({ data: mockServices, error: null });

      const result = await menuServicesTable.getByCategoryId('cat-1');

      expect(result).toEqual(mockServices);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category_id', 'cat-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should include inactive services when requested', async () => {
      mockQueryBuilder.order.mockResolvedValue({ data: [], error: null });

      await menuServicesTable.getByCategoryId('cat-1', true);

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category_id', 'cat-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      // Should not filter by status when includeInactive is true
    });
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const newService: MenuServiceInsert = {
        tenant_id: 'tenant-1',
        store_id: 'store-1',
        category_id: 'cat-1',
        name: 'New Service',
        pricing_type: 'fixed',
        price: 75.00,
        duration: 45,
        status: 'active',
        sync_status: 'local',
        version: 1,
        vector_clock: { 'device-1': 1 },
        last_synced_version: 0,
        created_at: '2026-01-22T10:00:00.000Z',
        updated_at: '2026-01-22T10:00:00.000Z',
      };
      const createdService = createMockService({ ...newService, id: 'svc-new' });
      mockQueryBuilder.single.mockResolvedValue({ data: createdService, error: null });

      const result = await menuServicesTable.create(newService);

      expect(result).toEqual(createdService);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(newService);
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should throw error on creation failure', async () => {
      const newService: MenuServiceInsert = {
        tenant_id: 'tenant-1',
        store_id: 'store-1',
        category_id: 'cat-1',
        name: 'Test',
        pricing_type: 'fixed',
        price: 50,
        duration: 60,
        status: 'active',
        sync_status: 'local',
        version: 1,
        vector_clock: {},
        last_synced_version: 0,
        created_at: '2026-01-22T10:00:00.000Z',
        updated_at: '2026-01-22T10:00:00.000Z',
      };
      const dbError = new Error('Constraint violation');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.create(newService)).rejects.toThrow('Constraint violation');
    });
  });

  describe('update', () => {
    it('should update an existing service', async () => {
      const updates: MenuServiceUpdate = {
        name: 'Updated Service',
        price: 60.00,
        duration: 75,
      };
      const updatedService = createMockService({ ...updates });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedService, error: null });

      const result = await menuServicesTable.update('svc-1', updates);

      expect(result).toEqual(updatedService);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        ...updates,
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
    });

    it('should always set updated_at timestamp', async () => {
      const updates: MenuServiceUpdate = { name: 'Test' };
      mockQueryBuilder.single.mockResolvedValue({ data: createMockService(), error: null });

      await menuServicesTable.update('svc-1', updates);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        updated_at: expect.any(String),
      }));
    });

    it('should throw error on update failure', async () => {
      const updates: MenuServiceUpdate = { name: 'Test' };
      const dbError = new Error('Update failed');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.update('nonexistent', updates)).rejects.toThrow('Update failed');
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete a service with tombstone', async () => {
      mockQueryBuilder.update.mockResolvedValue({ data: null, error: null });

      await menuServicesTable.delete('svc-1', 'user-1', 'device-1');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        is_deleted: true,
        deleted_at: expect.any(String),
        deleted_by: 'user-1',
        deleted_by_device: 'device-1',
        tombstone_expires_at: expect.any(String),
        sync_status: 'pending',
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
    });

    it('should set tombstone expiry to 30 days from now', async () => {
      mockQueryBuilder.update.mockResolvedValue({ data: null, error: null });

      const beforeDelete = Date.now();
      await menuServicesTable.delete('svc-1', 'user-1', 'device-1');
      const afterDelete = Date.now();

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      const tombstoneDate = new Date(updateCall.tombstone_expires_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      expect(tombstoneDate).toBeGreaterThanOrEqual(beforeDelete + thirtyDays - 1000);
      expect(tombstoneDate).toBeLessThanOrEqual(afterDelete + thirtyDays + 1000);
    });

    it('should throw error on delete failure', async () => {
      const dbError = new Error('Delete failed');
      mockQueryBuilder.update.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.delete('svc-1', 'user-1', 'device-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('archive', () => {
    it('should archive a service (status-based soft delete)', async () => {
      const archivedService = createMockService({ status: 'archived' });
      mockQueryBuilder.single.mockResolvedValue({ data: archivedService, error: null });

      const result = await menuServicesTable.archive('svc-1', 'user-1');

      expect(result).toEqual(archivedService);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'archived',
        archived_at: expect.any(String),
        archived_by: 'user-1',
        sync_status: 'pending',
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should throw error on archive failure', async () => {
      const dbError = new Error('Archive failed');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.archive('svc-1', 'user-1')).rejects.toThrow('Archive failed');
    });
  });

  describe('restore', () => {
    it('should restore an archived service', async () => {
      const restoredService = createMockService({ status: 'active' });
      mockQueryBuilder.single.mockResolvedValue({ data: restoredService, error: null });

      const result = await menuServicesTable.restore('svc-1');

      expect(result).toEqual(restoredService);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active',
        archived_at: null,
        archived_by: null,
        sync_status: 'pending',
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should throw error on restore failure', async () => {
      const dbError = new Error('Restore failed');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.restore('svc-1')).rejects.toThrow('Restore failed');
    });
  });

  describe('search', () => {
    it('should search services by name', async () => {
      const searchResults = [createMockService({ name: 'Haircut Premium' })];
      mockQueryBuilder.limit.mockResolvedValue({ data: searchResults, error: null });

      const result = await menuServicesTable.search('store-1', 'haircut');

      expect(result).toEqual(searchResults);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%haircut%');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('should use custom limit', async () => {
      mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null });

      await menuServicesTable.search('store-1', 'test', 10);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should return empty array for empty query', async () => {
      const result = await menuServicesTable.search('store-1', '');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.select).not.toHaveBeenCalled();
    });

    it('should sanitize search query', async () => {
      mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null });

      await menuServicesTable.search('store-1', "test<script>alert('xss')</script>");

      // Sanitization removes special chars
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%testscriptalertxss/script%');
    });
  });

  describe('getUpdatedSince', () => {
    it('should get services updated since a specific date', async () => {
      const sinceDate = new Date('2026-01-20T00:00:00.000Z');
      const updatedServices = [createMockService({ updated_at: '2026-01-21T00:00:00.000Z' })];
      mockQueryBuilder.order.mockResolvedValue({ data: updatedServices, error: null });

      const result = await menuServicesTable.getUpdatedSince('store-1', sinceDate);

      expect(result).toEqual(updatedServices);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.gt).toHaveBeenCalledWith('updated_at', sinceDate.toISOString());
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: true });
    });

    it('should include deleted services for sync propagation', async () => {
      const deletedService = createMockService({ is_deleted: true });
      mockQueryBuilder.order.mockResolvedValue({ data: [deletedService], error: null });

      const result = await menuServicesTable.getUpdatedSince('store-1', new Date());

      expect(result).toEqual([deletedService]);
      // Should NOT filter by is_deleted for sync
    });
  });

  describe('upsertMany', () => {
    it('should bulk upsert services', async () => {
      const services: MenuServiceInsert[] = [
        {
          id: 'svc-1',
          tenant_id: 'tenant-1',
          store_id: 'store-1',
          category_id: 'cat-1',
          name: 'Service 1',
          pricing_type: 'fixed',
          price: 50,
          duration: 60,
          status: 'active',
          sync_status: 'local',
          version: 1,
          vector_clock: {},
          last_synced_version: 0,
          created_at: '2026-01-22T10:00:00.000Z',
          updated_at: '2026-01-22T10:00:00.000Z',
        },
      ];
      const upsertedServices = services.map(s => createMockService(s));
      mockQueryBuilder.select.mockResolvedValue({ data: upsertedServices, error: null });

      const result = await menuServicesTable.upsertMany(services);

      expect(result).toEqual(upsertedServices);
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(services, { onConflict: 'id' });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });
  });

  describe('updateDisplayOrder', () => {
    it('should update display order for multiple services', async () => {
      const updates = [
        { id: 'svc-1', displayOrder: 2 },
        { id: 'svc-2', displayOrder: 1 },
      ];
      mockQueryBuilder.update.mockResolvedValue({ data: null, error: null });

      await menuServicesTable.updateDisplayOrder(updates);

      expect(mockQueryBuilder.update).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
        display_order: 2,
        updated_at: expect.any(String),
      }));
    });

    it('should throw error if any update fails', async () => {
      const updates = [
        { id: 'svc-1', displayOrder: 1 },
        { id: 'svc-2', displayOrder: 2 },
      ];
      mockUpdate
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('Update failed') });

      await expect(menuServicesTable.updateDisplayOrder(updates)).rejects.toThrow('Update failed');
    });
  });

  describe('getOnlineBookingServices', () => {
    it('should get services available for online booking', async () => {
      const onlineServices = [createMockService({ online_booking_enabled: true, booking_availability: 'online' })];
      mockQueryBuilder.order.mockResolvedValue({ data: onlineServices, error: null });

      const result = await menuServicesTable.getOnlineBookingServices('store-1');

      expect(result).toEqual(onlineServices);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('online_booking_enabled', true);
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('booking_availability', ['online', 'both']);
    });
  });

  describe('getServicesWithVariants', () => {
    it('should get services with variants', async () => {
      const servicesWithVariants = [createMockService({ has_variants: true, variant_count: 3 })];
      mockQueryBuilder.order.mockResolvedValue({ data: servicesWithVariants, error: null });

      const result = await menuServicesTable.getServicesWithVariants('store-1');

      expect(result).toEqual(servicesWithVariants);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('has_variants', true);
    });
  });

  describe('getArchivedServices', () => {
    it('should get archived services only', async () => {
      const archivedServices = [createMockService({ status: 'archived', archived_at: '2026-01-20T00:00:00.000Z' })];
      mockQueryBuilder.order.mockResolvedValue({ data: archivedServices, error: null });

      const result = await menuServicesTable.getArchivedServices('store-1');

      expect(result).toEqual(archivedServices);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'archived');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('archived_at', { ascending: false });
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a service', async () => {
      mockQueryBuilder.delete.mockResolvedValue({ data: null, error: null });

      await menuServicesTable.hardDelete('svc-1');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
    });

    it('should throw error on hard delete failure', async () => {
      const dbError = new Error('Hard delete failed');
      mockQueryBuilder.delete.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.hardDelete('svc-1')).rejects.toThrow('Hard delete failed');
    });
  });

  describe('updateVariantCount', () => {
    it('should update variant count and has_variants flag', async () => {
      const updatedService = createMockService({ variant_count: 5, has_variants: true });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedService, error: null });

      const result = await menuServicesTable.updateVariantCount('svc-1', 5);

      expect(result).toEqual(updatedService);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        variant_count: 5,
        has_variants: true,
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'svc-1');
    });

    it('should set has_variants to false when count is 0', async () => {
      const updatedService = createMockService({ variant_count: 0, has_variants: false });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedService, error: null });

      const result = await menuServicesTable.updateVariantCount('svc-1', 0);

      expect(result).toEqual(updatedService);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        variant_count: 0,
        has_variants: false,
      }));
    });

    it('should throw error on update failure', async () => {
      const dbError = new Error('Update failed');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(menuServicesTable.updateVariantCount('svc-1', 5)).rejects.toThrow('Update failed');
    });
  });
});
