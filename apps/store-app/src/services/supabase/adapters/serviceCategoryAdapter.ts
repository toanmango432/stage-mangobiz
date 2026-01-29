/**
 * ServiceCategory Type Adapter
 *
 * Converts between Supabase ServiceCategoryRow and app ServiceCategory types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 */

import type {
  SyncStatus,
  ServiceCategoryRow,
  ServiceCategoryInsert,
  ServiceCategoryUpdate,
} from '../types';
import type { ServiceCategory, CreateCategoryInput } from '@/types/catalog';
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
 * Convert Supabase ServiceCategoryRow to app ServiceCategory type
 */
export function toServiceCategory(row: ServiceCategoryRow): ServiceCategory {
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
    color: row.color,
    icon: row.icon || undefined,
    displayOrder: row.display_order,
    isActive: row.is_active,

    // Hierarchy
    parentCategoryId: row.parent_category_id || undefined,

    // Online booking
    showOnlineBooking: row.show_online_booking,

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
 * Convert app ServiceCategory to Supabase ServiceCategoryInsert
 */
export function toServiceCategoryInsert(
  category: CreateCategoryInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): ServiceCategoryInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Core fields
    name: category.name,
    description: category.description || null,
    color: category.color,
    icon: category.icon || null,
    display_order: category.displayOrder,
    is_active: category.isActive,

    // Hierarchy
    parent_category_id: category.parentCategoryId || null,

    // Online booking
    show_online_booking: category.showOnlineBooking ?? true,

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
 * Convert partial ServiceCategory updates to Supabase ServiceCategoryUpdate
 */
export function toServiceCategoryUpdate(
  updates: Partial<ServiceCategory>,
  userId?: string,
  deviceId?: string
): ServiceCategoryUpdate {
  const result: ServiceCategoryUpdate = {};

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.description !== undefined) {
    result.description = updates.description || null;
  }
  if (updates.color !== undefined) {
    result.color = updates.color;
  }
  if (updates.icon !== undefined) {
    result.icon = updates.icon || null;
  }
  if (updates.displayOrder !== undefined) {
    result.display_order = updates.displayOrder;
  }
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }

  // Hierarchy
  if (updates.parentCategoryId !== undefined) {
    result.parent_category_id = updates.parentCategoryId || null;
  }

  // Online booking
  if (updates.showOnlineBooking !== undefined) {
    result.show_online_booking = updates.showOnlineBooking;
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

/**
 * Convert array of ServiceCategoryRows to ServiceCategories
 */
export function toServiceCategories(rows: ServiceCategoryRow[]): ServiceCategory[] {
  return rows.map(toServiceCategory);
}
