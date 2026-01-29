/**
 * AddOnGroup Type Adapter
 *
 * Converts between Supabase AddOnGroupRow and app AddOnGroup types.
 * Handles snake_case to camelCase conversion and type transformations.
 */

import type {
  SyncStatus,
  AddOnGroupRow,
  AddOnGroupInsert,
  AddOnGroupUpdate,
  SelectionMode,
} from '../types';
import type { AddOnGroup, CreateAddOnGroupInput } from '@/types/catalog';
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
 * Convert Supabase AddOnGroupRow to app AddOnGroup type
 */
export function toAddOnGroup(row: AddOnGroupRow): AddOnGroup {
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

    // Selection rules
    selectionMode: row.selection_mode as AddOnGroup['selectionMode'],
    minSelections: row.min_selections,
    maxSelections: row.max_selections || undefined,
    isRequired: row.is_required,

    // Applicability - TEXT[] in Postgres maps directly to string[]
    applicableToAll: row.applicable_to_all,
    applicableCategoryIds: row.applicable_category_ids || [],
    applicableServiceIds: row.applicable_service_ids || [],

    // Status
    isActive: row.is_active,
    displayOrder: row.display_order,
    onlineBookingEnabled: row.online_booking_enabled,

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
 * Convert array of AddOnGroupRows to AddOnGroups
 */
export function toAddOnGroups(rows: AddOnGroupRow[]): AddOnGroup[] {
  return rows.map(toAddOnGroup);
}

/**
 * Convert app AddOnGroup input to Supabase AddOnGroupInsert
 */
export function toAddOnGroupInsert(
  group: CreateAddOnGroupInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): AddOnGroupInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Core fields
    name: group.name,
    description: group.description || null,

    // Selection rules
    selection_mode: group.selectionMode as SelectionMode,
    min_selections: group.minSelections,
    max_selections: group.maxSelections || null,
    is_required: group.isRequired,

    // Applicability - string[] maps directly to TEXT[]
    applicable_to_all: group.applicableToAll,
    applicable_category_ids: group.applicableCategoryIds,
    applicable_service_ids: group.applicableServiceIds,

    // Status
    is_active: group.isActive,
    display_order: group.displayOrder,
    online_booking_enabled: group.onlineBookingEnabled,

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
 * Convert partial AddOnGroup updates to Supabase AddOnGroupUpdate
 */
export function toAddOnGroupUpdate(
  updates: Partial<AddOnGroup>,
  userId?: string,
  deviceId?: string
): AddOnGroupUpdate {
  const result: AddOnGroupUpdate = {};

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.description !== undefined) {
    result.description = updates.description || null;
  }

  // Selection rules
  if (updates.selectionMode !== undefined) {
    result.selection_mode = updates.selectionMode as SelectionMode;
  }
  if (updates.minSelections !== undefined) {
    result.min_selections = updates.minSelections;
  }
  if (updates.maxSelections !== undefined) {
    result.max_selections = updates.maxSelections || null;
  }
  if (updates.isRequired !== undefined) {
    result.is_required = updates.isRequired;
  }

  // Applicability
  if (updates.applicableToAll !== undefined) {
    result.applicable_to_all = updates.applicableToAll;
  }
  if (updates.applicableCategoryIds !== undefined) {
    result.applicable_category_ids = updates.applicableCategoryIds;
  }
  if (updates.applicableServiceIds !== undefined) {
    result.applicable_service_ids = updates.applicableServiceIds;
  }

  // Status
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }
  if (updates.displayOrder !== undefined) {
    result.display_order = updates.displayOrder;
  }
  if (updates.onlineBookingEnabled !== undefined) {
    result.online_booking_enabled = updates.onlineBookingEnabled;
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
