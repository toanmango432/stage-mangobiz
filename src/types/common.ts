// Common types and enums used across the application

export type SyncStatus = 'local' | 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'waiting'
  | 'in-service'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type BookingSource =
  | 'phone'
  | 'walk-in'
  | 'online'
  | 'mango-store'
  | 'client-app'
  | 'admin-portal';

export type TicketStatus =
  // Sales Module Statuses (payment captured):
  | 'paid'              // Full payment received - appears in Sales
  | 'partial-payment'   // Some payment received, balance remains - appears in Sales
  | 'refunded'          // Full refund issued - appears in Sales
  | 'partially-refunded' // Partial refund issued - appears in Sales
  | 'voided'            // Transaction cancelled - appears in Sales
  // Non-Sales Statuses (no payment captured):
  | 'unpaid'            // Service done, payment outstanding - does NOT appear in Sales
  | 'pending'           // Transaction initiated, awaiting payment - does NOT appear in Sales
  | 'failed'            // Payment declined/error - does NOT appear in Sales
  | 'completed';        // Legacy status (maps to 'paid')

export type PaymentMethod =
  | 'cash'
  | 'credit-card'
  | 'debit-card'
  | 'card'              // Generic card (legacy)
  | 'venmo'
  | 'digital-wallet'
  | 'gift-card'
  | 'account-credit'
  | 'split';

export type CardType =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'other';

export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'voided'
  | 'refunded'
  | 'partially-refunded';

export type StaffStatus =
  | 'available'
  | 'busy'
  | 'on-break'
  | 'clocked-out'
  | 'off-today';

// ============================================
// SERVICE STATUS TRACKING
// Per DATA_STORAGE_STRATEGY.md Section 2.2
// ============================================

/**
 * Status of an individual service within a ticket or appointment.
 * Used for tracking service progress and timer functionality.
 */
export type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

/**
 * Audit trail for service status changes.
 * Records who changed the status, when, and from which device.
 */
export interface ServiceStatusChange {
  from: ServiceStatus;
  to: ServiceStatus;
  changedAt: string;            // ISO 8601 string
  changedBy: string;            // User ID
  changedByDevice: string;      // Device ID
  reason?: string;              // Optional reason for status change
}

export type SyncOperationType =
  | 'create'
  | 'update'
  | 'delete';

export type EntityType =
  | 'appointment'
  | 'ticket'
  | 'transaction'
  | 'client'
  | 'staff'
  | 'service'
  | 'teamMember'
  // Schedule Module entities
  | 'timeOffType'
  | 'timeOffRequest'
  | 'blockedTimeType'
  | 'blockedTimeEntry'
  | 'businessClosedPeriod'
  | 'resource'
  | 'resourceBooking'
  | 'staffSchedule'
  // Timesheet Module entities (Phase 2)
  | 'timesheet'
  // Payroll Module entities (Phase 3)
  | 'payrun';

// ============================================
// BASE SYNCABLE ENTITY (Production-Ready)
// All synced entities MUST extend this interface
// See: docs/DATA_STORAGE_STRATEGY.md Section 2.1
// ============================================

/**
 * VectorClock for conflict detection across devices.
 * Maps deviceId to the last seen version from that device.
 */
export type VectorClock = Record<string, number>;

/**
 * Base interface for all entities that sync between local and cloud storage.
 * This is the production-ready pattern per DATA_STORAGE_STRATEGY.md
 */
export interface BaseSyncableEntity {
  // Primary key
  id: string;

  // Multi-tenant isolation (required for all synced data)
  tenantId: string;
  storeId: string;
  locationId?: string;

  // Sync metadata
  syncStatus: SyncStatus;
  version: number;                    // Monotonic counter, increments on each change
  vectorClock: VectorClock;           // { deviceId: lastSeenVersion }
  lastSyncedVersion: number;          // Version when last successfully synced

  // Timestamps (ISO 8601 strings for serialization)
  createdAt: string;
  updatedAt: string;

  // Audit trail
  createdBy: string;                  // User ID
  createdByDevice: string;            // Device ID
  lastModifiedBy: string;             // User ID
  lastModifiedByDevice: string;       // Device ID

  // Soft delete (tombstone pattern)
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
  tombstoneExpiresAt?: string;        // When to hard-delete
}

/**
 * Creates default values for BaseSyncableEntity fields.
 * Use this when creating new entities.
 */
export function createBaseSyncableDefaults(
  userId: string,
  deviceId: string,
  tenantId: string,
  storeId: string,
  locationId?: string
): Omit<BaseSyncableEntity, 'id'> {
  const now = new Date().toISOString();
  return {
    tenantId,
    storeId,
    locationId,
    syncStatus: 'local',
    version: 1,
    vectorClock: { [deviceId]: 1 },
    lastSyncedVersion: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    createdByDevice: deviceId,
    lastModifiedBy: userId,
    lastModifiedByDevice: deviceId,
    isDeleted: false,
  };
}

/**
 * Increments version and updates vector clock for an entity mutation.
 * Call this before any update to a syncable entity.
 */
export function incrementEntityVersion<T extends BaseSyncableEntity>(
  entity: T,
  userId: string,
  deviceId: string
): T {
  const newVersion = entity.version + 1;
  return {
    ...entity,
    version: newVersion,
    vectorClock: {
      ...entity.vectorClock,
      [deviceId]: newVersion,
    },
    updatedAt: new Date().toISOString(),
    lastModifiedBy: userId,
    lastModifiedByDevice: deviceId,
    syncStatus: 'pending' as SyncStatus,
  };
}

/**
 * Marks an entity as soft-deleted (tombstone pattern).
 * The entity will be synced to propagate the deletion.
 */
export function markEntityDeleted<T extends BaseSyncableEntity>(
  entity: T,
  userId: string,
  deviceId: string,
  tombstoneRetentionMs: number = 30 * 24 * 60 * 60 * 1000 // 30 days default
): T {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + tombstoneRetentionMs);

  return {
    ...incrementEntityVersion(entity, userId, deviceId),
    isDeleted: true,
    deletedAt: now.toISOString(),
    deletedBy: userId,
    deletedByDevice: deviceId,
    tombstoneExpiresAt: expiresAt.toISOString(),
  };
}

// ============================================
// LEGACY TYPES (kept for backwards compatibility)
// ============================================

/** @deprecated Use BaseSyncableEntity instead */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

/** @deprecated Use BaseSyncableEntity audit fields instead */
export interface AuditInfo {
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
