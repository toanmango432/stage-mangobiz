/**
 * Unit tests for serviceCategoriesTable operations
 *
 * Tests CRUD operations, error handling, and multi-tenant isolation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serviceCategoriesTable } from '../serviceCategoriesTable';
import type { ServiceCategoryRow, ServiceCategoryInsert, ServiceCategoryUpdate } from '../../types';

// Mock Supabase client with proper chaining
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
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
  is: mockIs,
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
mockIs.mockReturnValue(mockQueryBuilder);
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

describe('serviceCategoriesTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to return the query builder by default for proper chaining
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockIs.mockReturnValue(mockQueryBuilder);
    mockIlike.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockLimit.mockReturnValue(mockQueryBuilder);
    mockGt.mockReturnValue(mockQueryBuilder);
    mockInsert.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockDelete.mockReturnValue(mockQueryBuilder);
    mockUpsert.mockReturnValue(mockQueryBuilder);
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock category row
  const createMockCategory = (overrides?: Partial<ServiceCategoryRow>): ServiceCategoryRow => ({
    id: 'cat-1',
    tenant_id: 'tenant-1',
    store_id: 'store-1',
    location_id: null,
    name: 'Hair Services',
    description: 'All hair-related services',
    color: '#FF5733',
    icon: 'scissors',
    display_order: 1,
    is_active: true,
    parent_category_id: null,
    show_online_booking: true,
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
    it('should get all active categories for a store', async () => {
      const mockCategories = [createMockCategory(), createMockCategory({ id: 'cat-2', name: 'Nail Services' })];
      mockQueryBuilder.order.mockResolvedValue({ data: mockCategories, error: null });

      const result = await serviceCategoriesTable.getByStoreId('store-1');

      expect(result).toEqual(mockCategories);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should include inactive categories when requested', async () => {
      const mockCategories = [createMockCategory({ is_active: false })];
      mockQueryBuilder.order.mockResolvedValue({ data: mockCategories, error: null });

      const result = await serviceCategoriesTable.getByStoreId('store-1', true);

      expect(result).toEqual(mockCategories);
      expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith('is_active', true);
    });

    it('should return empty array when no data', async () => {
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: null });

      const result = await serviceCategoriesTable.getByStoreId('store-1');

      expect(result).toEqual([]);
    });

    it('should throw error on database error', async () => {
      const dbError = new Error('Database connection failed');
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: dbError });

      await expect(serviceCategoriesTable.getByStoreId('store-1')).rejects.toThrow('Database connection failed');
    });
  });

  describe('getById', () => {
    it('should get a single category by ID', async () => {
      const mockCategory = createMockCategory();
      mockQueryBuilder.single.mockResolvedValue({ data: mockCategory, error: null });

      const result = await serviceCategoriesTable.getById('cat-1');

      expect(result).toEqual(mockCategory);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cat-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should return null when category not found (PGRST116)', async () => {
      const notFoundError = { code: 'PGRST116', message: 'No rows found' };
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: notFoundError });

      const result = await serviceCategoriesTable.getById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on other database errors', async () => {
      const dbError = { code: 'PGRST500', message: 'Internal error' };
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(serviceCategoriesTable.getById('cat-1')).rejects.toThrow();
    });
  });

  describe('getByParentId', () => {
    it('should get child categories of a parent', async () => {
      const childCategories = [
        createMockCategory({ id: 'cat-2', parent_category_id: 'cat-1' }),
        createMockCategory({ id: 'cat-3', parent_category_id: 'cat-1' }),
      ];
      mockQueryBuilder.order.mockResolvedValue({ data: childCategories, error: null });

      const result = await serviceCategoriesTable.getByParentId('cat-1');

      expect(result).toEqual(childCategories);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('parent_category_id', 'cat-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });
  });

  describe('getRootCategories', () => {
    it('should get categories without parent (root categories)', async () => {
      const rootCategories = [createMockCategory(), createMockCategory({ id: 'cat-2', name: 'Nails' })];
      mockQueryBuilder.order.mockResolvedValue({ data: rootCategories, error: null });

      const result = await serviceCategoriesTable.getRootCategories('store-1');

      expect(result).toEqual(rootCategories);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.is).toHaveBeenCalledWith('parent_category_id', null);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('search', () => {
    it('should search categories by name', async () => {
      const searchResults = [createMockCategory({ name: 'Hair Coloring' })];
      mockQueryBuilder.limit.mockResolvedValue({ data: searchResults, error: null });

      const result = await serviceCategoriesTable.search('store-1', 'hair');

      expect(result).toEqual(searchResults);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%hair%');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('should return empty array for empty query', async () => {
      const result = await serviceCategoriesTable.search('store-1', '');

      expect(result).toEqual([]);
      expect(mockQueryBuilder.select).not.toHaveBeenCalled();
    });

    it('should sanitize search query', async () => {
      mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null });

      await serviceCategoriesTable.search('store-1', "test'; DROP TABLE--");

      // Sanitization removes quotes and parens but keeps semicolons and dashes
      // Input: "test'; DROP TABLE--" → removes ' → "test; DROP TABLE--"
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%test; DROP TABLE--%');
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategory: ServiceCategoryInsert = {
        tenant_id: 'tenant-1',
        store_id: 'store-1',
        name: 'New Category',
        description: 'Test category',
        color: '#123456',
        icon: 'icon-name',
        display_order: 5,
        is_active: true,
        parent_category_id: null,
        show_online_booking: true,
        sync_status: 'local',
        version: 1,
        vector_clock: { 'device-1': 1 },
        last_synced_version: 0,
        created_at: '2026-01-22T10:00:00.000Z',
        created_by: 'user-1',
        created_by_device: 'device-1',
        updated_at: '2026-01-22T10:00:00.000Z',
      };
      const createdCategory = createMockCategory({ ...newCategory, id: 'cat-new' });
      mockQueryBuilder.single.mockResolvedValue({ data: createdCategory, error: null });

      const result = await serviceCategoriesTable.create(newCategory);

      expect(result).toEqual(createdCategory);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(newCategory);
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should throw error on creation failure', async () => {
      const newCategory: ServiceCategoryInsert = {
        tenant_id: 'tenant-1',
        store_id: 'store-1',
        name: 'Test',
        color: '#000',
        display_order: 1,
        sync_status: 'local',
        version: 1,
        vector_clock: {},
        last_synced_version: 0,
        created_at: '2026-01-22T10:00:00.000Z',
        updated_at: '2026-01-22T10:00:00.000Z',
      };
      const dbError = new Error('Unique constraint violation');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(serviceCategoriesTable.create(newCategory)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const updates: ServiceCategoryUpdate = {
        name: 'Updated Name',
        description: 'Updated description',
        color: '#654321',
      };
      const updatedCategory = createMockCategory({ ...updates });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedCategory, error: null });

      const result = await serviceCategoriesTable.update('cat-1', updates);

      expect(result).toEqual(updatedCategory);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        ...updates,
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cat-1');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should always set updated_at timestamp', async () => {
      const updates: ServiceCategoryUpdate = { name: 'Test' };
      mockQueryBuilder.single.mockResolvedValue({ data: createMockCategory(), error: null });

      await serviceCategoriesTable.update('cat-1', updates);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        updated_at: expect.any(String),
      }));
    });

    it('should throw error on update failure', async () => {
      const updates: ServiceCategoryUpdate = { name: 'Test' };
      const dbError = new Error('Record not found');
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: dbError });

      await expect(serviceCategoriesTable.update('nonexistent', updates)).rejects.toThrow('Record not found');
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete a category with tombstone', async () => {
      // Mock .eq() to resolve with success (terminal operation)
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      await serviceCategoriesTable.delete('cat-1', 'user-1', 'device-1');

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        is_deleted: true,
        deleted_at: expect.any(String),
        deleted_by: 'user-1',
        deleted_by_device: 'device-1',
        tombstone_expires_at: expect.any(String),
        sync_status: 'pending',
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cat-1');
    });

    it('should set tombstone expiry to 30 days from now', async () => {
      // Mock .eq() to resolve with success (terminal operation)
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      const beforeDelete = Date.now();
      await serviceCategoriesTable.delete('cat-1', 'user-1', 'device-1');
      const afterDelete = Date.now();

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      const tombstoneDate = new Date(updateCall.tombstone_expires_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      expect(tombstoneDate).toBeGreaterThanOrEqual(beforeDelete + thirtyDays - 1000);
      expect(tombstoneDate).toBeLessThanOrEqual(afterDelete + thirtyDays + 1000);
    });

    it('should throw error on delete failure', async () => {
      const dbError = new Error('Delete failed');
      // Mock .eq() to resolve with error (terminal operation)
      mockEq.mockResolvedValueOnce({ data: null, error: dbError });

      await expect(serviceCategoriesTable.delete('cat-1', 'user-1', 'device-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a category', async () => {
      // Mock .eq() to resolve with success response (terminal operation)
      mockEq.mockResolvedValueOnce({ data: null, error: null });

      await serviceCategoriesTable.hardDelete('cat-1');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cat-1');
    });

    it('should throw error on hard delete failure', async () => {
      const dbError = new Error('Hard delete failed');
      // Mock .eq() to resolve with error response
      mockEq.mockResolvedValueOnce({ data: null, error: dbError });

      await expect(serviceCategoriesTable.hardDelete('cat-1')).rejects.toThrow('Hard delete failed');
    });
  });

  describe('getUpdatedSince', () => {
    it('should get categories updated since a specific date', async () => {
      const sinceDate = new Date('2026-01-20T00:00:00.000Z');
      const updatedCategories = [createMockCategory({ updated_at: '2026-01-21T00:00:00.000Z' })];
      mockQueryBuilder.order.mockResolvedValue({ data: updatedCategories, error: null });

      const result = await serviceCategoriesTable.getUpdatedSince('store-1', sinceDate);

      expect(result).toEqual(updatedCategories);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.gt).toHaveBeenCalledWith('updated_at', sinceDate.toISOString());
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: true });
    });
  });

  describe('upsertMany', () => {
    it('should bulk upsert categories', async () => {
      const categories: ServiceCategoryInsert[] = [
        {
          id: 'cat-1',
          tenant_id: 'tenant-1',
          store_id: 'store-1',
          name: 'Category 1',
          color: '#111',
          display_order: 1,
          sync_status: 'local',
          version: 1,
          vector_clock: {},
          last_synced_version: 0,
          created_at: '2026-01-22T10:00:00.000Z',
          updated_at: '2026-01-22T10:00:00.000Z',
        },
        {
          id: 'cat-2',
          tenant_id: 'tenant-1',
          store_id: 'store-1',
          name: 'Category 2',
          color: '#222',
          display_order: 2,
          sync_status: 'local',
          version: 1,
          vector_clock: {},
          last_synced_version: 0,
          created_at: '2026-01-22T10:00:00.000Z',
          updated_at: '2026-01-22T10:00:00.000Z',
        },
      ];
      const upsertedCategories = categories.map(c => createMockCategory(c));
      mockQueryBuilder.select.mockResolvedValue({ data: upsertedCategories, error: null });

      const result = await serviceCategoriesTable.upsertMany(categories);

      expect(result).toEqual(upsertedCategories);
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(categories, { onConflict: 'id' });
      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should return empty array when no data', async () => {
      mockQueryBuilder.select.mockResolvedValue({ data: null, error: null });

      const result = await serviceCategoriesTable.upsertMany([]);

      expect(result).toEqual([]);
    });
  });

  describe('updateDisplayOrder', () => {
    it('should update display order for multiple categories', async () => {
      const updates = [
        { id: 'cat-1', displayOrder: 3 },
        { id: 'cat-2', displayOrder: 1 },
        { id: 'cat-3', displayOrder: 2 },
      ];
      // Mock .eq() to resolve with success (terminal operation in Promise.all)
      mockEq.mockResolvedValue({ data: null, error: null });

      await serviceCategoriesTable.updateDisplayOrder(updates);

      expect(mockQueryBuilder.update).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
        display_order: 3,
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
        display_order: 1,
        updated_at: expect.any(String),
      }));
      expect(mockQueryBuilder.update).toHaveBeenNthCalledWith(3, expect.objectContaining({
        display_order: 2,
        updated_at: expect.any(String),
      }));
      expect(mockEq).toHaveBeenCalledTimes(3);
    });

    it('should throw error if any update fails', async () => {
      const updates = [
        { id: 'cat-1', displayOrder: 1 },
        { id: 'cat-2', displayOrder: 2 },
      ];
      mockEq
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('Update failed') });

      await expect(serviceCategoriesTable.updateDisplayOrder(updates)).rejects.toThrow('Update failed');
    });
  });

  describe('getOnlineBookingCategories', () => {
    it('should get categories visible for online booking', async () => {
      const onlineCategories = [createMockCategory({ show_online_booking: true })];
      mockQueryBuilder.order.mockResolvedValue({ data: onlineCategories, error: null });

      const result = await serviceCategoriesTable.getOnlineBookingCategories('store-1');

      expect(result).toEqual(onlineCategories);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('store_id', 'store-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_deleted', false);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('show_online_booking', true);
    });
  });
});
