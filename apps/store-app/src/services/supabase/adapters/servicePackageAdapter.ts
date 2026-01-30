/**
 * ServicePackage Type Adapter
 *
 * Converts between Supabase ServicePackageRow and app ServicePackage types.
 * Handles snake_case to camelCase conversion and JSONB parsing for services array.
 */

import type {
  SyncStatus,
  ServicePackageRow,
  ServicePackageInsert,
  ServicePackageUpdate,
  DiscountType,
  BookingMode,
  BookingAvailability,
  Json,
} from '../types';
import type {
  ServicePackage,
  CreatePackageInput,
  PackageServiceItem,
} from '@/types/catalog';
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
 * Parse services JSONB array to PackageServiceItem[]
 */
function parseServicesJson(json: unknown): PackageServiceItem[] {
  if (!json || !Array.isArray(json)) {
    return [];
  }
  return json as PackageServiceItem[];
}

/**
 * Convert Supabase ServicePackageRow to app ServicePackage type
 */
export function toServicePackage(row: ServicePackageRow): ServicePackage {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Core fields
    name: row.name,
    description: row.description || undefined,

    // Services (JSONB → PackageServiceItem[])
    services: parseServicesJson(row.services),

    // Pricing
    originalPrice: row.original_price,
    packagePrice: row.package_price,
    discountType: row.discount_type as DiscountType,
    discountValue: row.discount_value,

    // Booking mode
    bookingMode: row.booking_mode as BookingMode,

    // Validity
    validityDays: row.validity_days || undefined,
    usageLimit: row.usage_limit || undefined,

    // Booking settings
    bookingAvailability: row.booking_availability as BookingAvailability,
    onlineBookingEnabled: row.online_booking_enabled,

    // Staff restrictions
    restrictedStaffIds: row.restricted_staff_ids || undefined,

    // Status
    isActive: row.is_active,
    displayOrder: row.display_order,

    // Visual
    color: row.color || undefined,
    images: row.images || undefined,

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
 * Convert array of ServicePackageRows to ServicePackages
 */
export function toServicePackages(rows: ServicePackageRow[]): ServicePackage[] {
  return rows.map(toServicePackage);
}

/**
 * Convert app ServicePackage to Supabase ServicePackageInsert
 */
export function toServicePackageInsert(
  pkg: CreatePackageInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): ServicePackageInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Core fields
    name: pkg.name,
    description: pkg.description || null,

    // Services (PackageServiceItem[] → JSONB)
    services: pkg.services as unknown as Json,

    // Pricing
    original_price: pkg.originalPrice,
    package_price: pkg.packagePrice,
    discount_type: pkg.discountType,
    discount_value: pkg.discountValue,

    // Booking mode
    booking_mode: pkg.bookingMode,

    // Validity
    validity_days: pkg.validityDays || null,
    usage_limit: pkg.usageLimit || null,

    // Booking settings
    booking_availability: pkg.bookingAvailability,
    online_booking_enabled: pkg.onlineBookingEnabled,

    // Staff restrictions
    restricted_staff_ids: pkg.restrictedStaffIds || null,

    // Status
    is_active: pkg.isActive,
    display_order: pkg.displayOrder,

    // Visual
    color: pkg.color || null,
    images: pkg.images || null,

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
 * Convert partial ServicePackage updates to Supabase ServicePackageUpdate
 */
export function toServicePackageUpdate(
  updates: Partial<ServicePackage>,
  userId?: string,
  deviceId?: string
): ServicePackageUpdate {
  const result: ServicePackageUpdate = {};

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.description !== undefined) {
    result.description = updates.description || null;
  }

  // Services
  if (updates.services !== undefined) {
    result.services = updates.services as unknown as Json;
  }

  // Pricing
  if (updates.originalPrice !== undefined) {
    result.original_price = updates.originalPrice;
  }
  if (updates.packagePrice !== undefined) {
    result.package_price = updates.packagePrice;
  }
  if (updates.discountType !== undefined) {
    result.discount_type = updates.discountType;
  }
  if (updates.discountValue !== undefined) {
    result.discount_value = updates.discountValue;
  }

  // Booking mode
  if (updates.bookingMode !== undefined) {
    result.booking_mode = updates.bookingMode;
  }

  // Validity
  if (updates.validityDays !== undefined) {
    result.validity_days = updates.validityDays || null;
  }
  if (updates.usageLimit !== undefined) {
    result.usage_limit = updates.usageLimit || null;
  }

  // Booking settings
  if (updates.bookingAvailability !== undefined) {
    result.booking_availability = updates.bookingAvailability;
  }
  if (updates.onlineBookingEnabled !== undefined) {
    result.online_booking_enabled = updates.onlineBookingEnabled;
  }

  // Staff restrictions
  if (updates.restrictedStaffIds !== undefined) {
    result.restricted_staff_ids = updates.restrictedStaffIds || null;
  }

  // Status
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }
  if (updates.displayOrder !== undefined) {
    result.display_order = updates.displayOrder;
  }

  // Visual
  if (updates.color !== undefined) {
    result.color = updates.color || null;
  }
  if (updates.images !== undefined) {
    result.images = updates.images || null;
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
