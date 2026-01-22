/**
 * Unit Tests for ServiceCategory Adapter
 *
 * Tests the conversion between Supabase ServiceCategoryRow and app ServiceCategory types.
 */

import { describe, it, expect } from 'vitest';
import {
  toServiceCategory,
  toServiceCategories,
  toServiceCategoryInsert,
  toServiceCategoryUpdate,
} from '../serviceCategoryAdapter';
import type { ServiceCategoryRow } from '../../types';
import type { ServiceCategory, CreateCategoryInput } from '@/types/catalog';

// Mock ServiceCategoryRow factory
function createMockCategoryRow(overrides: Partial<ServiceCategoryRow> = {}): ServiceCategoryRow {
  const now = new Date().toISOString();
  return {
    id: 'cat-001',
    tenant_id: 'tenant-001',
    store_id: 'store-001',
    location_id: null,
    name: 'Hair Services',
    description: 'Professional hair services',
    color: '#FF5733',
    icon: 'scissors',
    display_order: 1,
    is_active: true,
    parent_category_id: null,
    show_online_booking: true,
    sync_status: 'synced',
    version: 1,
    vector_clock: { 'device-001': 1 },
    last_synced_version: 0,
    created_at: now,
    updated_at: now,
    created_by: 'user-001',
    created_by_device: 'device-001',
    last_modified_by: 'user-001',
    last_modified_by_device: 'device-001',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
    ...overrides,
  };
}

describe('toServiceCategory', () => {
  it('should convert snake_case to camelCase', () => {
    const row = createMockCategoryRow();
    const result = toServiceCategory(row);

    expect(result.tenantId).toBe(row.tenant_id);
    expect(result.storeId).toBe(row.store_id);
    expect(result.displayOrder).toBe(row.display_order);
    expect(result.isActive).toBe(row.is_active);
    expect(result.showOnlineBooking).toBe(row.show_online_booking);
    expect(result.syncStatus).toBe(row.sync_status);
    expect(result.vectorClock).toEqual(row.vector_clock);
    expect(result.lastSyncedVersion).toBe(row.last_synced_version);
    expect(result.createdBy).toBe(row.created_by);
    expect(result.createdByDevice).toBe(row.created_by_device);
    expect(result.lastModifiedBy).toBe(row.last_modified_by);
    expect(result.lastModifiedByDevice).toBe(row.last_modified_by_device);
  });

  it('should handle null optional fields as undefined', () => {
    const row = createMockCategoryRow({
      description: null,
      icon: null,
      parent_category_id: null,
      location_id: null,
    });
    const result = toServiceCategory(row);

    expect(result.description).toBeUndefined();
    expect(result.icon).toBeUndefined();
    expect(result.parentCategoryId).toBeUndefined();
    expect(result.locationId).toBeUndefined();
  });

  it('should parse vector clock from JSONB', () => {
    const vectorClock = { 'device-001': 1, 'device-002': 3 };
    const row = createMockCategoryRow({ vector_clock: vectorClock });
    const result = toServiceCategory(row);

    expect(result.vectorClock).toEqual(vectorClock);
  });

  it('should handle empty vector clock', () => {
    const row = createMockCategoryRow({ vector_clock: {} });
    const result = toServiceCategory(row);

    expect(result.vectorClock).toEqual({});
  });

  it('should handle null/undefined vector clock', () => {
    const row = createMockCategoryRow({ vector_clock: null as any });
    const result = toServiceCategory(row);

    expect(result.vectorClock).toEqual({});
  });

  it('should handle soft delete fields', () => {
    const deletedAt = new Date().toISOString();
    const tombstoneExpiresAt = new Date().toISOString();
    const row = createMockCategoryRow({
      is_deleted: true,
      deleted_at: deletedAt,
      deleted_by: 'user-002',
      deleted_by_device: 'device-002',
      tombstone_expires_at: tombstoneExpiresAt,
    });
    const result = toServiceCategory(row);

    expect(result.isDeleted).toBe(true);
    expect(result.deletedAt).toBe(deletedAt);
    expect(result.deletedBy).toBe('user-002');
    expect(result.deletedByDevice).toBe('device-002');
    expect(result.tombstoneExpiresAt).toBe(tombstoneExpiresAt);
  });

  it('should convert null soft delete fields to undefined', () => {
    const row = createMockCategoryRow({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      deleted_by_device: null,
      tombstone_expires_at: null,
    });
    const result = toServiceCategory(row);

    expect(result.isDeleted).toBe(false);
    expect(result.deletedAt).toBeUndefined();
    expect(result.deletedBy).toBeUndefined();
    expect(result.deletedByDevice).toBeUndefined();
    expect(result.tombstoneExpiresAt).toBeUndefined();
  });

  it('should handle empty string audit fields as empty string (not undefined)', () => {
    const row = createMockCategoryRow({
      created_by: '',
      created_by_device: '',
      last_modified_by: '',
      last_modified_by_device: '',
    });
    const result = toServiceCategory(row);

    expect(result.createdBy).toBe('');
    expect(result.createdByDevice).toBe('');
    expect(result.lastModifiedBy).toBe('');
    expect(result.lastModifiedByDevice).toBe('');
  });

  it('should preserve all core fields', () => {
    const row = createMockCategoryRow({
      name: 'Nail Services',
      description: 'Professional nail care',
      color: '#00FF00',
      icon: 'nail',
      display_order: 5,
      is_active: false,
      show_online_booking: false,
    });
    const result = toServiceCategory(row);

    expect(result.name).toBe('Nail Services');
    expect(result.description).toBe('Professional nail care');
    expect(result.color).toBe('#00FF00');
    expect(result.icon).toBe('nail');
    expect(result.displayOrder).toBe(5);
    expect(result.isActive).toBe(false);
    expect(result.showOnlineBooking).toBe(false);
  });
});

describe('toServiceCategories', () => {
  it('should convert array of rows to array of categories', () => {
    const rows = [
      createMockCategoryRow({ id: 'cat-001', name: 'Hair' }),
      createMockCategoryRow({ id: 'cat-002', name: 'Nails' }),
      createMockCategoryRow({ id: 'cat-003', name: 'Spa' }),
    ];
    const result = toServiceCategories(rows);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('cat-001');
    expect(result[0].name).toBe('Hair');
    expect(result[1].id).toBe('cat-002');
    expect(result[1].name).toBe('Nails');
    expect(result[2].id).toBe('cat-003');
    expect(result[2].name).toBe('Spa');
  });

  it('should handle empty array', () => {
    const result = toServiceCategories([]);
    expect(result).toEqual([]);
  });
});

describe('toServiceCategoryInsert', () => {
  const mockInput: CreateCategoryInput = {
    name: 'Massage Services',
    description: 'Relaxing massage treatments',
    color: '#0000FF',
    icon: 'massage',
    displayOrder: 3,
    isActive: true,
    showOnlineBooking: true,
  };

  it('should convert camelCase to snake_case', () => {
    const result = toServiceCategoryInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      'device-001'
    );

    expect(result.tenant_id).toBe('tenant-001');
    expect(result.store_id).toBe('store-001');
    expect(result.display_order).toBe(mockInput.displayOrder);
    expect(result.is_active).toBe(mockInput.isActive);
    expect(result.show_online_booking).toBe(mockInput.showOnlineBooking);
  });

  it('should set initial sync metadata', () => {
    const result = toServiceCategoryInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      'device-001'
    );

    expect(result.sync_status).toBe('local');
    expect(result.version).toBe(1);
    expect(result.vector_clock).toEqual({ 'device-001': 1 });
    expect(result.last_synced_version).toBe(0);
  });

  it('should handle missing deviceId for vector clock', () => {
    const result = toServiceCategoryInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      undefined
    );

    expect(result.vector_clock).toEqual({});
  });

  it('should set audit trail fields', () => {
    const result = toServiceCategoryInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      'device-001'
    );

    expect(result.created_by).toBe('user-001');
    expect(result.created_by_device).toBe('device-001');
    expect(result.last_modified_by).toBe('user-001');
    expect(result.last_modified_by_device).toBe('device-001');
  });

  it('should handle missing userId and deviceId', () => {
    const result = toServiceCategoryInsert(mockInput, 'store-001', 'tenant-001');

    expect(result.created_by).toBeNull();
    expect(result.created_by_device).toBeNull();
    expect(result.last_modified_by).toBeNull();
    expect(result.last_modified_by_device).toBeNull();
  });

  it('should initialize soft delete fields to null/false', () => {
    const result = toServiceCategoryInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      'device-001'
    );

    expect(result.is_deleted).toBe(false);
    expect(result.deleted_at).toBeNull();
    expect(result.deleted_by).toBeNull();
    expect(result.deleted_by_device).toBeNull();
    expect(result.tombstone_expires_at).toBeNull();
  });

  it('should handle undefined optional fields as null', () => {
    const input: CreateCategoryInput = {
      name: 'Test Category',
      color: '#000000',
      displayOrder: 1,
      isActive: true,
      // description, icon, parentCategoryId, showOnlineBooking undefined
    };
    const result = toServiceCategoryInsert(input, 'store-001', 'tenant-001');

    expect(result.description).toBeNull();
    expect(result.icon).toBeNull();
    expect(result.parent_category_id).toBeNull();
    expect(result.show_online_booking).toBe(true); // defaults to true
  });

  it('should default showOnlineBooking to true when undefined', () => {
    const input: CreateCategoryInput = {
      name: 'Test',
      color: '#000000',
      displayOrder: 1,
      isActive: true,
    };
    const result = toServiceCategoryInsert(input, 'store-001', 'tenant-001');

    expect(result.show_online_booking).toBe(true);
  });

  it('should set timestamps to current ISO string', () => {
    const result = toServiceCategoryInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      'device-001'
    );

    // Verify ISO 8601 format
    expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify timestamps are recent (within last 5 seconds)
    const now = Date.now();
    const createdTime = new Date(result.created_at || Date.now()).getTime();
    expect(createdTime).toBeGreaterThan(now - 5000);
    expect(createdTime).toBeLessThanOrEqual(now + 1000);
  });
});

describe('toServiceCategoryUpdate', () => {
  it('should convert only provided fields', () => {
    const updates: Partial<ServiceCategory> = {
      name: 'Updated Name',
      displayOrder: 10,
    };
    const result = toServiceCategoryUpdate(updates, 'user-002', 'device-002');

    expect(result.name).toBe('Updated Name');
    expect(result.display_order).toBe(10);
    expect(result.description).toBeUndefined();
    expect(result.color).toBeUndefined();
  });

  it('should convert camelCase to snake_case', () => {
    const updates: Partial<ServiceCategory> = {
      displayOrder: 5,
      isActive: false,
      showOnlineBooking: false,
      parentCategoryId: 'parent-001',
    };
    const result = toServiceCategoryUpdate(updates);

    expect(result.display_order).toBe(5);
    expect(result.is_active).toBe(false);
    expect(result.show_online_booking).toBe(false);
    expect(result.parent_category_id).toBe('parent-001');
  });

  it('should handle empty string fields as null', () => {
    const updates: Partial<ServiceCategory> = {
      description: '',
      icon: '',
    };
    const result = toServiceCategoryUpdate(updates);

    expect(result.description).toBeNull();
    expect(result.icon).toBeNull();
  });

  it('should update sync metadata when provided', () => {
    const updates: Partial<ServiceCategory> = {
      syncStatus: 'synced',
      version: 5,
      vectorClock: { 'device-003': 5 },
      lastSyncedVersion: 4,
    };
    const result = toServiceCategoryUpdate(updates);

    expect(result.sync_status).toBe('synced');
    expect(result.version).toBe(5);
    expect(result.vector_clock).toEqual({ 'device-003': 5 });
    expect(result.last_synced_version).toBe(4);
  });

  it('should update soft delete fields when provided', () => {
    const deletedAt = new Date().toISOString();
    const updates: Partial<ServiceCategory> = {
      isDeleted: true,
      deletedAt,
      deletedBy: 'user-003',
      deletedByDevice: 'device-003',
      tombstoneExpiresAt: deletedAt,
    };
    const result = toServiceCategoryUpdate(updates);

    expect(result.is_deleted).toBe(true);
    expect(result.deleted_at).toBe(deletedAt);
    expect(result.deleted_by).toBe('user-003');
    expect(result.deleted_by_device).toBe('device-003');
    expect(result.tombstone_expires_at).toBe(deletedAt);
  });

  it('should always set updated_at', () => {
    const result = toServiceCategoryUpdate({ name: 'Test' });

    // Verify ISO 8601 format
    expect(result.updated_at).toBeDefined();
    expect(result.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify timestamp is recent (within last 5 seconds)
    const now = Date.now();
    const updatedTime = new Date(result.updated_at!).getTime();
    expect(updatedTime).toBeGreaterThan(now - 5000);
    expect(updatedTime).toBeLessThanOrEqual(now + 1000);
  });

  it('should set last_modified_by when userId provided', () => {
    const result = toServiceCategoryUpdate({ name: 'Test' }, 'user-004');

    expect(result.last_modified_by).toBe('user-004');
  });

  it('should set last_modified_by_device when deviceId provided', () => {
    const result = toServiceCategoryUpdate({ name: 'Test' }, undefined, 'device-004');

    expect(result.last_modified_by_device).toBe('device-004');
  });

  it('should handle empty updates object', () => {
    const result = toServiceCategoryUpdate({});

    // Should only have updated_at
    expect(result.updated_at).toBeDefined();
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('should handle null values for nullable fields', () => {
    const updates: Partial<ServiceCategory> = {
      description: '',
      icon: '',
    };
    const result = toServiceCategoryUpdate(updates);

    // Empty strings should convert to null
    expect(result.description).toBeNull();
    expect(result.icon).toBeNull();
  });
});
