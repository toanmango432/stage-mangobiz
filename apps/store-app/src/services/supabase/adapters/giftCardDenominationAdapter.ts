/**
 * GiftCardDenomination Type Adapter
 *
 * Converts between Supabase CatalogGiftCardDenominationRow and app GiftCardDenomination types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 */

import type {
  SyncStatus,
  CatalogGiftCardDenominationRow,
  CatalogGiftCardDenominationInsert,
  CatalogGiftCardDenominationUpdate,
} from '../types';
import type { GiftCardDenomination, CreateGiftCardDenominationInput } from '@/types/catalog';
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
 * Convert Supabase CatalogGiftCardDenominationRow to app GiftCardDenomination type
 */
export function toGiftCardDenomination(row: CatalogGiftCardDenominationRow): GiftCardDenomination {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Core fields
    amount: row.amount,
    label: row.label || undefined,

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
 * Convert app GiftCardDenomination to Supabase CatalogGiftCardDenominationInsert
 */
export function toGiftCardDenominationInsert(
  denomination: CreateGiftCardDenominationInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): CatalogGiftCardDenominationInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Core fields
    amount: denomination.amount,
    label: denomination.label || null,

    // Status
    is_active: denomination.isActive,
    display_order: denomination.displayOrder,

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
 * Convert partial GiftCardDenomination updates to Supabase CatalogGiftCardDenominationUpdate
 */
export function toGiftCardDenominationUpdate(
  updates: Partial<GiftCardDenomination>,
  userId?: string,
  deviceId?: string
): CatalogGiftCardDenominationUpdate {
  const result: CatalogGiftCardDenominationUpdate = {};

  // Core fields
  if (updates.amount !== undefined) {
    result.amount = updates.amount;
  }
  if (updates.label !== undefined) {
    result.label = updates.label || null;
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
 * Convert array of CatalogGiftCardDenominationRows to GiftCardDenominations
 */
export function toGiftCardDenominations(rows: CatalogGiftCardDenominationRow[]): GiftCardDenomination[] {
  return rows.map(toGiftCardDenomination);
}
