/**
 * MenuService Type Adapter
 *
 * Converts between Supabase MenuServiceRow and app MenuService types.
 * Handles snake_case to camelCase conversion and type transformations.
 */

import type {
  SyncStatus,
  MenuServiceRow,
  MenuServiceInsert,
  MenuServiceUpdate,
  PricingType,
  ServiceStatus,
  BookingAvailability,
  ExtraTimeType,
} from '../types';
import type { MenuService, CreateMenuServiceInput } from '@/types/catalog';
import type { VectorClock } from '@/types/common';

/**
 * Parse vector clock from JSONB
 */
function parseVectorClock(json: unknown): VectorClock {
  if (!json || typeof json !== 'object') {
    return {};
  }
  return json as VectorClock;
}

/**
 * Convert Supabase MenuServiceRow to app MenuService type
 */
export function toMenuService(row: MenuServiceRow): MenuService {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Foreign key
    categoryId: row.category_id,

    // Core fields
    name: row.name,
    description: row.description || undefined,
    sku: row.sku || undefined,

    // Pricing
    pricingType: row.pricing_type as PricingType,
    price: row.price,
    priceMax: row.price_max || undefined,
    cost: row.cost || undefined,
    taxable: row.taxable,

    // Duration
    duration: row.duration,

    // Extra time (Fresha-style)
    extraTime: row.extra_time || undefined,
    extraTimeType: (row.extra_time_type as ExtraTimeType) || undefined,

    // Client care
    aftercareInstructions: row.aftercare_instructions || undefined,
    requiresPatchTest: row.requires_patch_test,

    // Variants
    hasVariants: row.has_variants,
    variantCount: row.variant_count,

    // Staff assignment
    allStaffCanPerform: row.all_staff_can_perform,

    // Booking settings
    bookingAvailability: row.booking_availability as BookingAvailability,
    onlineBookingEnabled: row.online_booking_enabled,
    requiresDeposit: row.requires_deposit,
    depositAmount: row.deposit_amount || undefined,
    depositPercentage: row.deposit_percentage || undefined,

    // Online booking limits
    onlineBookingBufferMinutes: row.online_booking_buffer_minutes || undefined,
    advanceBookingDaysMin: row.advance_booking_days_min || undefined,
    advanceBookingDaysMax: row.advance_booking_days_max || undefined,

    // Rebook reminder
    rebookReminderDays: row.rebook_reminder_days || undefined,

    // Turn weight
    turnWeight: row.turn_weight,

    // Additional settings
    commissionRate: row.commission_rate || undefined,
    color: row.color || undefined,
    images: row.images || undefined,
    tags: row.tags || undefined,

    // Visibility & Status
    status: row.status as ServiceStatus,
    displayOrder: row.display_order,
    showPriceOnline: row.show_price_online,
    allowCustomDuration: row.allow_custom_duration,

    // Archive
    archivedAt: row.archived_at || undefined,
    archivedBy: row.archived_by || undefined,

    // Sync metadata
    syncStatus: row.sync_status as SyncStatus,
    version: row.version,
    vectorClock: parseVectorClock(row.vector_clock),
    lastSyncedVersion: row.last_synced_version,

    // Timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Audit trail
    createdBy: row.created_by || '',
    createdByDevice: row.created_by_device || '',
    lastModifiedBy: row.last_modified_by || '',
    lastModifiedByDevice: row.last_modified_by_device || '',

    // Soft delete
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at || undefined,
    deletedBy: row.deleted_by || undefined,
    deletedByDevice: row.deleted_by_device || undefined,
    tombstoneExpiresAt: row.tombstone_expires_at || undefined,
  };
}

/**
 * Convert array of MenuServiceRows to MenuServices
 */
export function toMenuServices(rows: MenuServiceRow[]): MenuService[] {
  return rows.map(toMenuService);
}

/**
 * Convert app MenuService to Supabase MenuServiceInsert
 */
export function toMenuServiceInsert(
  service: CreateMenuServiceInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): MenuServiceInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Foreign key
    category_id: service.categoryId,

    // Core fields
    name: service.name,
    description: service.description || null,
    sku: service.sku || null,

    // Pricing
    pricing_type: service.pricingType,
    price: service.price,
    price_max: service.priceMax || null,
    cost: service.cost || null,
    taxable: service.taxable,

    // Duration
    duration: service.duration,

    // Extra time
    extra_time: service.extraTime || null,
    extra_time_type: service.extraTimeType || null,

    // Client care
    aftercare_instructions: service.aftercareInstructions || null,
    requires_patch_test: service.requiresPatchTest ?? false,

    // Variants
    has_variants: service.hasVariants,
    variant_count: service.variantCount,

    // Staff assignment
    all_staff_can_perform: service.allStaffCanPerform,

    // Booking settings
    booking_availability: service.bookingAvailability,
    online_booking_enabled: service.onlineBookingEnabled,
    requires_deposit: service.requiresDeposit,
    deposit_amount: service.depositAmount || null,
    deposit_percentage: service.depositPercentage || null,

    // Online booking limits
    online_booking_buffer_minutes: service.onlineBookingBufferMinutes || null,
    advance_booking_days_min: service.advanceBookingDaysMin || null,
    advance_booking_days_max: service.advanceBookingDaysMax || null,

    // Rebook reminder
    rebook_reminder_days: service.rebookReminderDays || null,

    // Turn weight
    turn_weight: service.turnWeight ?? 1.0,

    // Additional settings
    commission_rate: service.commissionRate || null,
    color: service.color || null,
    images: service.images || null,
    tags: service.tags || null,

    // Visibility & Status
    status: service.status,
    display_order: service.displayOrder,
    show_price_online: service.showPriceOnline,
    allow_custom_duration: service.allowCustomDuration,

    // Archive (initially null)
    archived_at: service.archivedAt || null,
    archived_by: service.archivedBy || null,

    // Sync metadata
    sync_status: 'local',
    version: 1,
    vector_clock: initialVectorClock,
    last_synced_version: 0,

    // Timestamps
    created_at: now,
    updated_at: now,

    // Audit trail
    created_by: userId || null,
    created_by_device: deviceId || null,
    last_modified_by: userId || null,
    last_modified_by_device: deviceId || null,

    // Soft delete
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
  };
}

/**
 * Convert partial MenuService updates to Supabase MenuServiceUpdate
 */
export function toMenuServiceUpdate(
  updates: Partial<MenuService>,
  userId?: string,
  deviceId?: string
): MenuServiceUpdate {
  const result: MenuServiceUpdate = {};

  // Foreign key
  if (updates.categoryId !== undefined) {
    result.category_id = updates.categoryId;
  }

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.description !== undefined) {
    result.description = updates.description || null;
  }
  if (updates.sku !== undefined) {
    result.sku = updates.sku || null;
  }

  // Pricing
  if (updates.pricingType !== undefined) {
    result.pricing_type = updates.pricingType;
  }
  if (updates.price !== undefined) {
    result.price = updates.price;
  }
  if (updates.priceMax !== undefined) {
    result.price_max = updates.priceMax || null;
  }
  if (updates.cost !== undefined) {
    result.cost = updates.cost || null;
  }
  if (updates.taxable !== undefined) {
    result.taxable = updates.taxable;
  }

  // Duration
  if (updates.duration !== undefined) {
    result.duration = updates.duration;
  }

  // Extra time
  if (updates.extraTime !== undefined) {
    result.extra_time = updates.extraTime || null;
  }
  if (updates.extraTimeType !== undefined) {
    result.extra_time_type = updates.extraTimeType || null;
  }

  // Client care
  if (updates.aftercareInstructions !== undefined) {
    result.aftercare_instructions = updates.aftercareInstructions || null;
  }
  if (updates.requiresPatchTest !== undefined) {
    result.requires_patch_test = updates.requiresPatchTest;
  }

  // Variants
  if (updates.hasVariants !== undefined) {
    result.has_variants = updates.hasVariants;
  }
  if (updates.variantCount !== undefined) {
    result.variant_count = updates.variantCount;
  }

  // Staff assignment
  if (updates.allStaffCanPerform !== undefined) {
    result.all_staff_can_perform = updates.allStaffCanPerform;
  }

  // Booking settings
  if (updates.bookingAvailability !== undefined) {
    result.booking_availability = updates.bookingAvailability;
  }
  if (updates.onlineBookingEnabled !== undefined) {
    result.online_booking_enabled = updates.onlineBookingEnabled;
  }
  if (updates.requiresDeposit !== undefined) {
    result.requires_deposit = updates.requiresDeposit;
  }
  if (updates.depositAmount !== undefined) {
    result.deposit_amount = updates.depositAmount || null;
  }
  if (updates.depositPercentage !== undefined) {
    result.deposit_percentage = updates.depositPercentage || null;
  }

  // Online booking limits
  if (updates.onlineBookingBufferMinutes !== undefined) {
    result.online_booking_buffer_minutes = updates.onlineBookingBufferMinutes || null;
  }
  if (updates.advanceBookingDaysMin !== undefined) {
    result.advance_booking_days_min = updates.advanceBookingDaysMin || null;
  }
  if (updates.advanceBookingDaysMax !== undefined) {
    result.advance_booking_days_max = updates.advanceBookingDaysMax || null;
  }

  // Rebook reminder
  if (updates.rebookReminderDays !== undefined) {
    result.rebook_reminder_days = updates.rebookReminderDays || null;
  }

  // Turn weight
  if (updates.turnWeight !== undefined) {
    result.turn_weight = updates.turnWeight;
  }

  // Additional settings
  if (updates.commissionRate !== undefined) {
    result.commission_rate = updates.commissionRate || null;
  }
  if (updates.color !== undefined) {
    result.color = updates.color || null;
  }
  if (updates.images !== undefined) {
    result.images = updates.images || null;
  }
  if (updates.tags !== undefined) {
    result.tags = updates.tags || null;
  }

  // Visibility & Status
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.displayOrder !== undefined) {
    result.display_order = updates.displayOrder;
  }
  if (updates.showPriceOnline !== undefined) {
    result.show_price_online = updates.showPriceOnline;
  }
  if (updates.allowCustomDuration !== undefined) {
    result.allow_custom_duration = updates.allowCustomDuration;
  }

  // Archive
  if (updates.archivedAt !== undefined) {
    result.archived_at = updates.archivedAt || null;
  }
  if (updates.archivedBy !== undefined) {
    result.archived_by = updates.archivedBy || null;
  }

  // Sync metadata
  if (updates.syncStatus !== undefined) {
    // Cast to Supabase SyncStatus (filters out 'syncing' which is app-only status)
    result.sync_status = updates.syncStatus as SyncStatus;
  }
  if (updates.version !== undefined) {
    result.version = updates.version;
  }
  if (updates.vectorClock !== undefined) {
    result.vector_clock = updates.vectorClock;
  }
  if (updates.lastSyncedVersion !== undefined) {
    result.last_synced_version = updates.lastSyncedVersion;
  }

  // Soft delete
  if (updates.isDeleted !== undefined) {
    result.is_deleted = updates.isDeleted;
  }
  if (updates.deletedAt !== undefined) {
    result.deleted_at = updates.deletedAt || null;
  }
  if (updates.deletedBy !== undefined) {
    result.deleted_by = updates.deletedBy || null;
  }
  if (updates.deletedByDevice !== undefined) {
    result.deleted_by_device = updates.deletedByDevice || null;
  }
  if (updates.tombstoneExpiresAt !== undefined) {
    result.tombstone_expires_at = updates.tombstoneExpiresAt || null;
  }

  // Always update modified metadata and timestamp
  result.updated_at = new Date().toISOString();
  if (userId) {
    result.last_modified_by = userId;
  }
  if (deviceId) {
    result.last_modified_by_device = deviceId;
  }

  return result;
}
