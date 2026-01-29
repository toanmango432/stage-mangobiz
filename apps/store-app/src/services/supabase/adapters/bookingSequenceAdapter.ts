/**
 * BookingSequence Type Adapter
 *
 * Converts between Supabase BookingSequenceRow and app BookingSequence types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 */

import type {
  SyncStatus,
  BookingSequenceRow,
  BookingSequenceInsert,
  BookingSequenceUpdate,
  Json,
} from '../types';
import type { BookingSequence, CreateBookingSequenceInput } from '@/types/catalog';
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
 * Parse service order from JSONB array
 */
function parseServiceOrder(json: unknown): string[] {
  if (!json || !Array.isArray(json)) {
    return [];
  }
  return json as string[];
}

/**
 * Convert Supabase BookingSequenceRow to app BookingSequence type
 */
export function toBookingSequence(row: BookingSequenceRow): BookingSequence {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Core fields
    serviceOrder: parseServiceOrder(row.service_order),
    isEnabled: row.is_enabled,

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
 * Convert app BookingSequence to Supabase BookingSequenceInsert
 */
export function toBookingSequenceInsert(
  sequence: CreateBookingSequenceInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): BookingSequenceInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Core fields
    service_order: sequence.serviceOrder as unknown as Json,
    is_enabled: sequence.isEnabled,

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
 * Convert partial BookingSequence updates to Supabase BookingSequenceUpdate
 */
export function toBookingSequenceUpdate(
  updates: Partial<BookingSequence>,
  userId?: string,
  deviceId?: string
): BookingSequenceUpdate {
  const result: BookingSequenceUpdate = {};

  // Core fields
  if (updates.serviceOrder !== undefined) {
    result.service_order = updates.serviceOrder as unknown as Json;
  }
  if (updates.isEnabled !== undefined) {
    result.is_enabled = updates.isEnabled;
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
 * Convert array of BookingSequenceRows to BookingSequences
 */
export function toBookingSequences(rows: BookingSequenceRow[]): BookingSequence[] {
  return rows.map(toBookingSequence);
}
