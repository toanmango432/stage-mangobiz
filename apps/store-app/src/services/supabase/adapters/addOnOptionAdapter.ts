/**
 * AddOnOption Type Adapter
 *
 * Converts between Supabase AddOnOptionRow and app AddOnOption types.
 * Handles snake_case to camelCase conversion and type transformations.
 */

import type {
  SyncStatus,
  AddOnOptionRow,
  AddOnOptionInsert,
  AddOnOptionUpdate,
} from '../types';
import type { AddOnOption, CreateAddOnOptionInput } from '@/types/catalog';
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
 * Convert Supabase AddOnOptionRow to app AddOnOption type
 */
export function toAddOnOption(row: AddOnOptionRow): AddOnOption {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Foreign key
    groupId: row.group_id,

    // Core fields
    name: row.name,
    description: row.description || undefined,

    // Pricing & Duration
    price: row.price,
    duration: row.duration,

    // Status
    isActive: row.is_active,
    displayOrder: row.display_order,

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
 * Convert array of AddOnOptionRows to AddOnOptions
 */
export function toAddOnOptions(rows: AddOnOptionRow[]): AddOnOption[] {
  return rows.map(toAddOnOption);
}

/**
 * Convert app AddOnOption input to Supabase AddOnOptionInsert
 */
export function toAddOnOptionInsert(
  option: CreateAddOnOptionInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): AddOnOptionInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Foreign key
    group_id: option.groupId,

    // Core fields
    name: option.name,
    description: option.description || null,

    // Pricing & Duration
    price: option.price,
    duration: option.duration,

    // Status
    is_active: option.isActive,
    display_order: option.displayOrder,

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
 * Convert partial AddOnOption updates to Supabase AddOnOptionUpdate
 */
export function toAddOnOptionUpdate(
  updates: Partial<AddOnOption>,
  userId?: string,
  deviceId?: string
): AddOnOptionUpdate {
  const result: AddOnOptionUpdate = {};

  // Foreign key
  if (updates.groupId !== undefined) {
    result.group_id = updates.groupId;
  }

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.description !== undefined) {
    result.description = updates.description || null;
  }

  // Pricing & Duration
  if (updates.price !== undefined) {
    result.price = updates.price;
  }
  if (updates.duration !== undefined) {
    result.duration = updates.duration;
  }

  // Status
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }
  if (updates.displayOrder !== undefined) {
    result.display_order = updates.displayOrder;
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
