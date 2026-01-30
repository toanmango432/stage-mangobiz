/**
 * StaffServiceAssignment Type Adapter
 *
 * Converts between Supabase StaffServiceAssignmentRow and app StaffServiceAssignment types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 */

import type {
  SyncStatus,
  StaffServiceAssignmentRow,
  StaffServiceAssignmentInsert,
  StaffServiceAssignmentUpdate,
} from '../types';
import type { StaffServiceAssignment, CreateStaffAssignmentInput } from '@/types/catalog';
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
 * Convert Supabase StaffServiceAssignmentRow to app StaffServiceAssignment type
 */
export function toStaffServiceAssignment(row: StaffServiceAssignmentRow): StaffServiceAssignment {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Assignment relationship
    staffId: row.staff_id,
    serviceId: row.service_id,

    // Custom pricing/duration
    customPrice: row.custom_price ?? undefined,
    customDuration: row.custom_duration ?? undefined,
    customCommissionRate: row.custom_commission_rate ?? undefined,

    // Status
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
 * Convert app StaffServiceAssignment to Supabase StaffServiceAssignmentInsert
 */
export function toStaffServiceAssignmentInsert(
  assignment: CreateStaffAssignmentInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): StaffServiceAssignmentInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Assignment relationship
    staff_id: assignment.staffId,
    service_id: assignment.serviceId,

    // Custom pricing/duration
    custom_price: assignment.customPrice ?? null,
    custom_duration: assignment.customDuration ?? null,
    custom_commission_rate: assignment.customCommissionRate ?? null,

    // Status
    is_active: assignment.isActive,

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
 * Convert partial StaffServiceAssignment updates to Supabase StaffServiceAssignmentUpdate
 */
export function toStaffServiceAssignmentUpdate(
  updates: Partial<StaffServiceAssignment>,
  userId?: string,
  deviceId?: string
): StaffServiceAssignmentUpdate {
  const result: StaffServiceAssignmentUpdate = {};

  // Assignment relationship
  if (updates.staffId !== undefined) {
    result.staff_id = updates.staffId;
  }
  if (updates.serviceId !== undefined) {
    result.service_id = updates.serviceId;
  }

  // Custom pricing/duration
  if (updates.customPrice !== undefined) {
    result.custom_price = updates.customPrice ?? null;
  }
  if (updates.customDuration !== undefined) {
    result.custom_duration = updates.customDuration ?? null;
  }
  if (updates.customCommissionRate !== undefined) {
    result.custom_commission_rate = updates.customCommissionRate ?? null;
  }

  // Status
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
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
 * Convert array of StaffServiceAssignmentRows to StaffServiceAssignments
 */
export function toStaffServiceAssignments(rows: StaffServiceAssignmentRow[]): StaffServiceAssignment[] {
  return rows.map(toStaffServiceAssignment);
}
