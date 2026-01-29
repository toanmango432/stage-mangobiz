/**
 * Unit Tests for MenuService Adapter
 *
 * Tests the conversion between Supabase MenuServiceRow and app MenuService types.
 */

import { describe, it, expect } from 'vitest';
import {
  toMenuService,
  toMenuServices,
  toMenuServiceInsert,
  toMenuServiceUpdate,
} from '../menuServiceAdapter';
import type { MenuServiceRow } from '../../types';
import type { MenuService, CreateMenuServiceInput } from '@/types/catalog';

// Mock MenuServiceRow factory
function createMockServiceRow(overrides: Partial<MenuServiceRow> = {}): MenuServiceRow {
  const now = new Date().toISOString();
  return {
    id: 'svc-001',
    tenant_id: 'tenant-001',
    store_id: 'store-001',
    location_id: null,
    category_id: 'cat-001',
    name: 'Haircut',
    description: 'Professional haircut',
    sku: 'HC-001',
    pricing_type: 'fixed',
    price: 50.0,
    price_max: null,
    cost: 20.0,
    taxable: true,
    duration: 60,
    extra_time: null,
    extra_time_type: null,
    aftercare_instructions: null,
    requires_patch_test: false,
    has_variants: false,
    variant_count: 0,
    all_staff_can_perform: true,
    booking_availability: 'both',
    online_booking_enabled: true,
    requires_deposit: false,
    deposit_amount: null,
    deposit_percentage: null,
    online_booking_buffer_minutes: null,
    advance_booking_days_min: null,
    advance_booking_days_max: null,
    rebook_reminder_days: null,
    turn_weight: 1.0,
    commission_rate: null,
    color: null,
    images: null,
    tags: null,
    status: 'active',
    display_order: 1,
    show_price_online: true,
    allow_custom_duration: false,
    archived_at: null,
    archived_by: null,
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

describe('toMenuService', () => {
  it('should convert snake_case to camelCase for core fields', () => {
    const row = createMockServiceRow();
    const result = toMenuService(row);

    expect(result.tenantId).toBe(row.tenant_id);
    expect(result.storeId).toBe(row.store_id);
    expect(result.categoryId).toBe(row.category_id);
    expect(result.pricingType).toBe(row.pricing_type);
    expect(result.priceMax).toBeUndefined(); // null -> undefined
    expect(result.requiresPatchTest).toBe(row.requires_patch_test);
    expect(result.hasVariants).toBe(row.has_variants);
    expect(result.variantCount).toBe(row.variant_count);
  });

  it('should convert snake_case to camelCase for booking fields', () => {
    const row = createMockServiceRow({
      booking_availability: 'online',
      online_booking_enabled: true,
      requires_deposit: true,
      deposit_amount: 25.0,
      deposit_percentage: 50,
      online_booking_buffer_minutes: 30,
      advance_booking_days_min: 1,
      advance_booking_days_max: 90,
      rebook_reminder_days: 30,
    });
    const result = toMenuService(row);

    expect(result.bookingAvailability).toBe('online');
    expect(result.onlineBookingEnabled).toBe(true);
    expect(result.requiresDeposit).toBe(true);
    expect(result.depositAmount).toBe(25.0);
    expect(result.depositPercentage).toBe(50);
    expect(result.onlineBookingBufferMinutes).toBe(30);
    expect(result.advanceBookingDaysMin).toBe(1);
    expect(result.advanceBookingDaysMax).toBe(90);
    expect(result.rebookReminderDays).toBe(30);
  });

  it('should handle null optional fields as undefined', () => {
    const row = createMockServiceRow({
      description: null,
      sku: null,
      price_max: null,
      cost: null,
      extra_time: null,
      extra_time_type: null,
      aftercare_instructions: null,
      deposit_amount: null,
      deposit_percentage: null,
      commission_rate: null,
      color: null,
      images: null,
      tags: null,
      location_id: null,
      online_booking_buffer_minutes: null,
      advance_booking_days_min: null,
      advance_booking_days_max: null,
      rebook_reminder_days: null,
    });
    const result = toMenuService(row);

    expect(result.description).toBeUndefined();
    expect(result.sku).toBeUndefined();
    expect(result.priceMax).toBeUndefined();
    expect(result.cost).toBeUndefined();
    expect(result.extraTime).toBeUndefined();
    expect(result.extraTimeType).toBeUndefined();
    expect(result.aftercareInstructions).toBeUndefined();
    expect(result.depositAmount).toBeUndefined();
    expect(result.depositPercentage).toBeUndefined();
    expect(result.commissionRate).toBeUndefined();
    expect(result.color).toBeUndefined();
    expect(result.images).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.locationId).toBeUndefined();
  });

  it('should parse vector clock from JSONB', () => {
    const vectorClock = { 'device-001': 1, 'device-002': 3 };
    const row = createMockServiceRow({ vector_clock: vectorClock });
    const result = toMenuService(row);

    expect(result.vectorClock).toEqual(vectorClock);
  });

  it('should handle empty/null vector clock', () => {
    const emptyRow = createMockServiceRow({ vector_clock: {} });
    const nullRow = createMockServiceRow({ vector_clock: null as any });

    expect(toMenuService(emptyRow).vectorClock).toEqual({});
    expect(toMenuService(nullRow).vectorClock).toEqual({});
  });

  it('should handle extra time fields', () => {
    const row = createMockServiceRow({
      extra_time: 15,
      extra_time_type: 'processing',
    });
    const result = toMenuService(row);

    expect(result.extraTime).toBe(15);
    expect(result.extraTimeType).toBe('processing');
  });

  it('should handle variants and variant count', () => {
    const row = createMockServiceRow({
      has_variants: true,
      variant_count: 3,
    });
    const result = toMenuService(row);

    expect(result.hasVariants).toBe(true);
    expect(result.variantCount).toBe(3);
  });

  it('should handle archive fields', () => {
    const archivedAt = new Date().toISOString();
    const row = createMockServiceRow({
      status: 'archived',
      archived_at: archivedAt,
      archived_by: 'user-002',
    });
    const result = toMenuService(row);

    expect(result.status).toBe('archived');
    expect(result.archivedAt).toBe(archivedAt);
    expect(result.archivedBy).toBe('user-002');
  });

  it('should handle soft delete fields', () => {
    const deletedAt = new Date().toISOString();
    const tombstoneExpiresAt = new Date().toISOString();
    const row = createMockServiceRow({
      is_deleted: true,
      deleted_at: deletedAt,
      deleted_by: 'user-003',
      deleted_by_device: 'device-003',
      tombstone_expires_at: tombstoneExpiresAt,
    });
    const result = toMenuService(row);

    expect(result.isDeleted).toBe(true);
    expect(result.deletedAt).toBe(deletedAt);
    expect(result.deletedBy).toBe('user-003');
    expect(result.deletedByDevice).toBe('device-003');
    expect(result.tombstoneExpiresAt).toBe(tombstoneExpiresAt);
  });

  it('should handle tags array', () => {
    const tags = ['popular', 'premium', 'new'];
    const row = createMockServiceRow({ tags });
    const result = toMenuService(row);

    expect(result.tags).toEqual(tags);
  });

  it('should handle images array', () => {
    const images = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];
    const row = createMockServiceRow({ images });
    const result = toMenuService(row);

    expect(result.images).toEqual(images);
  });

  it('should handle turn weight', () => {
    const row = createMockServiceRow({ turn_weight: 2.5 });
    const result = toMenuService(row);

    expect(result.turnWeight).toBe(2.5);
  });

  it('should preserve all pricing fields', () => {
    const row = createMockServiceRow({
      pricing_type: 'from',
      price: 50.0,
      price_max: 150.0,
      cost: 20.0,
      taxable: true,
    });
    const result = toMenuService(row);

    expect(result.pricingType).toBe('from');
    expect(result.price).toBe(50.0);
    expect(result.priceMax).toBe(150.0);
    expect(result.cost).toBe(20.0);
    expect(result.taxable).toBe(true);
  });
});

describe('toMenuServices', () => {
  it('should convert array of rows to array of services', () => {
    const rows = [
      createMockServiceRow({ id: 'svc-001', name: 'Haircut' }),
      createMockServiceRow({ id: 'svc-002', name: 'Color' }),
      createMockServiceRow({ id: 'svc-003', name: 'Style' }),
    ];
    const result = toMenuServices(rows);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('svc-001');
    expect(result[0].name).toBe('Haircut');
    expect(result[1].id).toBe('svc-002');
    expect(result[1].name).toBe('Color');
    expect(result[2].id).toBe('svc-003');
    expect(result[2].name).toBe('Style');
  });

  it('should handle empty array', () => {
    const result = toMenuServices([]);
    expect(result).toEqual([]);
  });
});

describe('toMenuServiceInsert', () => {
  const mockInput: CreateMenuServiceInput = {
    categoryId: 'cat-001',
    name: 'Hair Color',
    description: 'Professional hair coloring',
    sku: 'HC-002',
    pricingType: 'from',
    price: 80.0,
    priceMax: 200.0,
    cost: 30.0,
    taxable: true,
    duration: 120,
    hasVariants: true,
    variantCount: 5,
    allStaffCanPerform: false,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: true,
    depositPercentage: 25,
    status: 'active',
    displayOrder: 2,
    showPriceOnline: true,
    allowCustomDuration: false,
  };

  it('should convert camelCase to snake_case', () => {
    const result = toMenuServiceInsert(
      mockInput,
      'store-001',
      'tenant-001',
      'user-001',
      'device-001'
    );

    expect(result.tenant_id).toBe('tenant-001');
    expect(result.store_id).toBe('store-001');
    expect(result.category_id).toBe(mockInput.categoryId);
    expect(result.pricing_type).toBe(mockInput.pricingType);
    expect(result.price_max).toBe(mockInput.priceMax);
    expect(result.has_variants).toBe(mockInput.hasVariants);
    expect(result.variant_count).toBe(mockInput.variantCount);
    expect(result.all_staff_can_perform).toBe(mockInput.allStaffCanPerform);
    expect(result.booking_availability).toBe(mockInput.bookingAvailability);
    expect(result.online_booking_enabled).toBe(mockInput.onlineBookingEnabled);
    expect(result.requires_deposit).toBe(mockInput.requiresDeposit);
    expect(result.deposit_percentage).toBe(mockInput.depositPercentage);
    expect(result.show_price_online).toBe(mockInput.showPriceOnline);
    expect(result.allow_custom_duration).toBe(mockInput.allowCustomDuration);
  });

  it('should set initial sync metadata', () => {
    const result = toMenuServiceInsert(
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
    const result = toMenuServiceInsert(mockInput, 'store-001', 'tenant-001', 'user-001');

    expect(result.vector_clock).toEqual({});
  });

  it('should default turn weight to 1.0 when undefined', () => {
    const input = { ...mockInput, turnWeight: undefined };
    const result = toMenuServiceInsert(input, 'store-001', 'tenant-001');

    expect(result.turn_weight).toBe(1.0);
  });

  it('should use provided turn weight', () => {
    const input = { ...mockInput, turnWeight: 2.5 };
    const result = toMenuServiceInsert(input, 'store-001', 'tenant-001');

    expect(result.turn_weight).toBe(2.5);
  });

  it('should default requiresPatchTest to false when undefined', () => {
    const input = { ...mockInput };
    delete (input as any).requiresPatchTest;
    const result = toMenuServiceInsert(input, 'store-001', 'tenant-001');

    expect(result.requires_patch_test).toBe(false);
  });

  it('should handle undefined optional fields as null', () => {
    const minimalInput: CreateMenuServiceInput = {
      categoryId: 'cat-001',
      name: 'Basic Service',
      pricingType: 'fixed',
      price: 50.0,
      taxable: false,
      duration: 60,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: true,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      status: 'active',
      displayOrder: 1,
      showPriceOnline: true,
      allowCustomDuration: false,
    };
    const result = toMenuServiceInsert(minimalInput, 'store-001', 'tenant-001');

    expect(result.description).toBeNull();
    expect(result.sku).toBeNull();
    expect(result.price_max).toBeNull();
    expect(result.cost).toBeNull();
    expect(result.extra_time).toBeNull();
    expect(result.extra_time_type).toBeNull();
    expect(result.aftercare_instructions).toBeNull();
    expect(result.deposit_amount).toBeNull();
    expect(result.deposit_percentage).toBeNull();
    expect(result.commission_rate).toBeNull();
    expect(result.color).toBeNull();
    expect(result.images).toBeNull();
    expect(result.tags).toBeNull();
  });

  it('should initialize soft delete fields to null/false', () => {
    const result = toMenuServiceInsert(mockInput, 'store-001', 'tenant-001');

    expect(result.is_deleted).toBe(false);
    expect(result.deleted_at).toBeNull();
    expect(result.deleted_by).toBeNull();
    expect(result.deleted_by_device).toBeNull();
    expect(result.tombstone_expires_at).toBeNull();
  });

  it('should initialize archive fields to null', () => {
    const result = toMenuServiceInsert(mockInput, 'store-001', 'tenant-001');

    expect(result.archived_at).toBeNull();
    expect(result.archived_by).toBeNull();
  });

  it('should set timestamps to current ISO string', () => {
    const result = toMenuServiceInsert(mockInput, 'store-001', 'tenant-001');

    // Verify ISO 8601 format
    expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(result.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify timestamps are recent (within last 5 seconds)
    const now = Date.now();
    const createdTime = new Date(result.created_at || Date.now()).getTime();
    expect(createdTime).toBeGreaterThan(now - 5000);
    expect(createdTime).toBeLessThanOrEqual(now + 1000);
  });

  it('should handle extra time fields', () => {
    const input = {
      ...mockInput,
      extraTime: 30,
      extraTimeType: 'finishing' as const,
    };
    const result = toMenuServiceInsert(input, 'store-001', 'tenant-001');

    expect(result.extra_time).toBe(30);
    expect(result.extra_time_type).toBe('finishing');
  });

  it('should handle booking advance limits', () => {
    const input = {
      ...mockInput,
      advanceBookingDaysMin: 1,
      advanceBookingDaysMax: 90,
      onlineBookingBufferMinutes: 120,
    };
    const result = toMenuServiceInsert(input, 'store-001', 'tenant-001');

    expect(result.advance_booking_days_min).toBe(1);
    expect(result.advance_booking_days_max).toBe(90);
    expect(result.online_booking_buffer_minutes).toBe(120);
  });
});

describe('toMenuServiceUpdate', () => {
  it('should convert only provided fields', () => {
    const updates: Partial<MenuService> = {
      name: 'Updated Service',
      price: 100.0,
      duration: 90,
    };
    const result = toMenuServiceUpdate(updates, 'user-002', 'device-002');

    expect(result.name).toBe('Updated Service');
    expect(result.price).toBe(100.0);
    expect(result.duration).toBe(90);
    expect(result.description).toBeUndefined();
    expect(result.sku).toBeUndefined();
  });

  it('should convert camelCase to snake_case', () => {
    const updates: Partial<MenuService> = {
      pricingType: 'from',
      priceMax: 250.0,
      hasVariants: true,
      variantCount: 10,
      allStaffCanPerform: false,
      bookingAvailability: 'online',
      onlineBookingEnabled: true,
      requiresDeposit: true,
      depositAmount: 50.0,
      showPriceOnline: false,
      allowCustomDuration: true,
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.pricing_type).toBe('from');
    expect(result.price_max).toBe(250.0);
    expect(result.has_variants).toBe(true);
    expect(result.variant_count).toBe(10);
    expect(result.all_staff_can_perform).toBe(false);
    expect(result.booking_availability).toBe('online');
    expect(result.online_booking_enabled).toBe(true);
    expect(result.requires_deposit).toBe(true);
    expect(result.deposit_amount).toBe(50.0);
    expect(result.show_price_online).toBe(false);
    expect(result.allow_custom_duration).toBe(true);
  });

  it('should handle empty string fields as null', () => {
    const updates: Partial<MenuService> = {
      description: '',
      sku: '',
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.description).toBeNull();
    expect(result.sku).toBeNull();
  });

  it('should update sync metadata when provided', () => {
    const updates: Partial<MenuService> = {
      syncStatus: 'synced',
      version: 10,
      vectorClock: { 'device-005': 10 },
      lastSyncedVersion: 9,
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.sync_status).toBe('synced');
    expect(result.version).toBe(10);
    expect(result.vector_clock).toEqual({ 'device-005': 10 });
    expect(result.last_synced_version).toBe(9);
  });

  it('should update archive fields when provided', () => {
    const archivedAt = new Date().toISOString();
    const updates: Partial<MenuService> = {
      status: 'archived',
      archivedAt,
      archivedBy: 'user-004',
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.status).toBe('archived');
    expect(result.archived_at).toBe(archivedAt);
    expect(result.archived_by).toBe('user-004');
  });

  it('should update soft delete fields when provided', () => {
    const deletedAt = new Date().toISOString();
    const updates: Partial<MenuService> = {
      isDeleted: true,
      deletedAt,
      deletedBy: 'user-005',
      deletedByDevice: 'device-005',
      tombstoneExpiresAt: deletedAt,
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.is_deleted).toBe(true);
    expect(result.deleted_at).toBe(deletedAt);
    expect(result.deleted_by).toBe('user-005');
    expect(result.deleted_by_device).toBe('device-005');
    expect(result.tombstone_expires_at).toBe(deletedAt);
  });

  it('should always set updated_at', () => {
    const result = toMenuServiceUpdate({ name: 'Test' });

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
    const result = toMenuServiceUpdate({ name: 'Test' }, 'user-006');

    expect(result.last_modified_by).toBe('user-006');
  });

  it('should set last_modified_by_device when deviceId provided', () => {
    const result = toMenuServiceUpdate({ name: 'Test' }, undefined, 'device-006');

    expect(result.last_modified_by_device).toBe('device-006');
  });

  it('should handle empty updates object', () => {
    const result = toMenuServiceUpdate({});

    // Should only have updated_at
    expect(result.updated_at).toBeDefined();
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('should update turn weight', () => {
    const updates: Partial<MenuService> = {
      turnWeight: 3.5,
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.turn_weight).toBe(3.5);
  });

  it('should update booking advance limits', () => {
    const updates: Partial<MenuService> = {
      advanceBookingDaysMin: 2,
      advanceBookingDaysMax: 60,
      onlineBookingBufferMinutes: 60,
      rebookReminderDays: 45,
    };
    const result = toMenuServiceUpdate(updates);

    expect(result.advance_booking_days_min).toBe(2);
    expect(result.advance_booking_days_max).toBe(60);
    expect(result.online_booking_buffer_minutes).toBe(60);
    expect(result.rebook_reminder_days).toBe(45);
  });
});
