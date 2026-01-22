/**
 * ServiceVariant Type Adapter
 *
 * Converts between Supabase ServiceVariantRow and app ServiceVariant types.
 * Handles snake_case to camelCase conversion and type transformations.
 */

import type {
  SyncStatus,
  ServiceVariantRow,
  ServiceVariantInsert,
  ServiceVariantUpdate,
  ExtraTimeType,
} from '../types';
import type { ServiceVariant, CreateVariantInput } from '@/types/catalog';
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
 * Convert Supabase ServiceVariantRow to app ServiceVariant type
 */
export function toServiceVariant(row: ServiceVariantRow): ServiceVariant {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Foreign key
    serviceId: row.service_id,

    // Core fields
    name: row.name,
    duration: row.duration,
    price: row.price,

    // Extra time
    extraTime: row.extra_time || undefined,
    extraTimeType: (row.extra_time_type as ExtraTimeType) || undefined,

    // Status
    isDefault: row.is_default,
    displayOrder: row.display_order,
    isActive: row.is_active,

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
 * Convert array of ServiceVariantRows to ServiceVariants
 */
export function toServiceVariants(rows: ServiceVariantRow[]): ServiceVariant[] {
  return rows.map(toServiceVariant);
}

/**
 * Convert app ServiceVariant to Supabase ServiceVariantInsert
 */
export function toServiceVariantInsert(
  variant: CreateVariantInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): ServiceVariantInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Foreign key
    service_id: variant.serviceId,

    // Core fields
    name: variant.name,
    duration: variant.duration,
    price: variant.price,

    // Extra time
    extra_time: variant.extraTime || null,
    extra_time_type: variant.extraTimeType || null,

    // Status
    is_default: variant.isDefault,
    display_order: variant.displayOrder,
    is_active: variant.isActive,

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
 * Convert partial ServiceVariant updates to Supabase ServiceVariantUpdate
 */
export function toServiceVariantUpdate(
  updates: Partial<ServiceVariant>,
  userId?: string,
  deviceId?: string
): ServiceVariantUpdate {
  const result: ServiceVariantUpdate = {};

  // Foreign key
  if (updates.serviceId !== undefined) {
    result.service_id = updates.serviceId;
  }

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.duration !== undefined) {
    result.duration = updates.duration;
  }
  if (updates.price !== undefined) {
    result.price = updates.price;
  }

  // Extra time
  if (updates.extraTime !== undefined) {
    result.extra_time = updates.extraTime || null;
  }
  if (updates.extraTimeType !== undefined) {
    result.extra_time_type = updates.extraTimeType || null;
  }

  // Status
  if (updates.isDefault !== undefined) {
    result.is_default = updates.isDefault;
  }
  if (updates.displayOrder !== undefined) {
    result.display_order = updates.displayOrder;
  }
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
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
