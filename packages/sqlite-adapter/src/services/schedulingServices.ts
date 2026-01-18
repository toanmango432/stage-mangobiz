/**
 * Scheduling SQLite Services
 *
 * SQLite service implementations for scheduling-related tables.
 * Includes: TimeOffType, TimeOffRequest, BlockedTimeType, BlockedTimeEntry,
 * BusinessClosedPeriod, Resource, ResourceBooking, StaffSchedule
 *
 * @module sqlite-adapter/services/scheduling
 */

import { BaseSQLiteService, type TableSchema, type ColumnDefinition } from './BaseSQLiteService';
import type { SQLiteAdapter, SQLiteValue } from '../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Sync status for scheduling entities */
export type ScheduleSyncStatus = 'local' | 'synced' | 'pending' | 'syncing' | 'conflict' | 'error';

/** Vector clock for conflict detection */
export type ScheduleVectorClock = Record<string, number>;

/** Time-off request status */
export type TimeOffRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

/** Blocked time frequency */
export type BlockedTimeFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

/** Schedule pattern type */
export type SchedulePatternType = 'fixed' | 'rotating';

/** Resource assignment type */
export type ResourceAssignmentType = 'auto' | 'manual';

// ============================================
// BASE SYNCABLE FIELDS (common to all scheduling entities)
// ============================================

interface BaseSyncableFields {
  tenantId: string;
  storeId: string;
  locationId?: string;
  syncStatus: ScheduleSyncStatus;
  version: number;
  vectorClock: ScheduleVectorClock;
  lastSyncedVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByDevice: string;
  lastModifiedBy: string;
  lastModifiedByDevice: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
  tombstoneExpiresAt?: string;
}

// ============================================
// TIME OFF TYPE
// ============================================

export interface TimeOffType extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  name: string;
  code: string;
  emoji: string;
  color: string;
  isPaid: boolean;
  requiresApproval: boolean;
  annualLimitDays: number | null;
  accrualEnabled: boolean;
  accrualRatePerMonth: number | null;
  carryOverEnabled: boolean;
  maxCarryOverDays: number | null;
  displayOrder: number;
  isActive: boolean;
  isSystemDefault: boolean;
}

export interface TimeOffTypeRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  name: string;
  code: string;
  emoji: string;
  color: string;
  is_paid: number;
  requires_approval: number;
  annual_limit_days: number | null;
  accrual_enabled: number;
  accrual_rate_per_month: number | null;
  carry_over_enabled: number;
  max_carry_over_days: number | null;
  display_order: number;
  is_active: number;
  is_system_default: number;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const timeOffTypeSchema: TableSchema = {
  tableName: 'time_off_types',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    name: 'name',
    code: 'code',
    emoji: 'emoji',
    color: 'color',
    isPaid: { column: 'is_paid', type: 'boolean' } as ColumnDefinition,
    requiresApproval: { column: 'requires_approval', type: 'boolean' } as ColumnDefinition,
    annualLimitDays: 'annual_limit_days',
    accrualEnabled: { column: 'accrual_enabled', type: 'boolean' } as ColumnDefinition,
    accrualRatePerMonth: 'accrual_rate_per_month',
    carryOverEnabled: { column: 'carry_over_enabled', type: 'boolean' } as ColumnDefinition,
    maxCarryOverDays: 'max_carry_over_days',
    displayOrder: 'display_order',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    isSystemDefault: { column: 'is_system_default', type: 'boolean' } as ColumnDefinition,
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class TimeOffTypeSQLiteService extends BaseSQLiteService<TimeOffType, TimeOffTypeRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, timeOffTypeSchema);
  }

  /**
   * Get active time-off types for a store
   */
  async getActive(storeId: string): Promise<TimeOffType[]> {
    return this.findWhere('store_id = ? AND is_active = 1 AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get all time-off types for a store (including inactive)
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<TimeOffType[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get time-off type by code
   */
  async getByCode(storeId: string, code: string): Promise<TimeOffType | null> {
    const results = await this.findWhere('store_id = ? AND code = ? AND is_deleted = 0', [storeId, code]);
    return results[0] ?? null;
  }

  /**
   * Count active types by store
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1 AND is_deleted = 0', [storeId]);
  }

  /**
   * Soft delete a time-off type
   */
  async softDelete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const tombstoneExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await this.db.run(
      `UPDATE ${this.schema.tableName} SET
        is_deleted = 1,
        deleted_at = ?,
        deleted_by = ?,
        deleted_by_device = ?,
        tombstone_expires_at = ?,
        updated_at = ?,
        last_modified_by = ?,
        last_modified_by_device = ?,
        sync_status = 'pending'
      WHERE id = ? AND is_deleted = 0`,
      [now, userId, deviceId, tombstoneExpires, now, userId, deviceId, id]
    );

    return result.changes > 0;
  }
}

// ============================================
// TIME OFF REQUEST
// ============================================

/** Status change history entry */
export interface TimeOffStatusChange {
  from: TimeOffRequestStatus | null;
  to: TimeOffRequestStatus;
  changedAt: string;
  changedBy: string;
  changedByDevice: string;
  reason?: string;
}

export interface TimeOffRequest extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  staffId: string;
  staffName: string;
  typeId: string;
  typeName: string;
  typeEmoji: string;
  typeColor: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime: string | null;
  endTime: string | null;
  totalHours: number;
  totalDays: number;
  status: TimeOffRequestStatus;
  statusHistory: TimeOffStatusChange[];
  notes: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;
  deniedBy: string | null;
  deniedByName: string | null;
  deniedAt: string | null;
  denialReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  hasConflicts: boolean;
  conflictingAppointmentIds: string[];
}

export interface TimeOffRequestRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  staff_id: string;
  staff_name: string;
  type_id: string;
  type_name: string;
  type_emoji: string;
  type_color: string;
  is_paid: number;
  start_date: string;
  end_date: string;
  is_all_day: number;
  start_time: string | null;
  end_time: string | null;
  total_hours: number;
  total_days: number;
  status: string;
  status_history: string;
  notes: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  denied_by: string | null;
  denied_by_name: string | null;
  denied_at: string | null;
  denial_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  has_conflicts: number;
  conflicting_appointment_ids: string;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const timeOffRequestSchema: TableSchema = {
  tableName: 'time_off_requests',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    staffId: 'staff_id',
    staffName: 'staff_name',
    typeId: 'type_id',
    typeName: 'type_name',
    typeEmoji: 'type_emoji',
    typeColor: 'type_color',
    isPaid: { column: 'is_paid', type: 'boolean' } as ColumnDefinition,
    startDate: 'start_date',
    endDate: 'end_date',
    isAllDay: { column: 'is_all_day', type: 'boolean' } as ColumnDefinition,
    startTime: 'start_time',
    endTime: 'end_time',
    totalHours: 'total_hours',
    totalDays: 'total_days',
    status: 'status',
    statusHistory: { column: 'status_history', type: 'json' } as ColumnDefinition,
    notes: 'notes',
    approvedBy: 'approved_by',
    approvedByName: 'approved_by_name',
    approvedAt: { column: 'approved_at', type: 'date' } as ColumnDefinition,
    approvalNotes: 'approval_notes',
    deniedBy: 'denied_by',
    deniedByName: 'denied_by_name',
    deniedAt: { column: 'denied_at', type: 'date' } as ColumnDefinition,
    denialReason: 'denial_reason',
    cancelledAt: { column: 'cancelled_at', type: 'date' } as ColumnDefinition,
    cancelledBy: 'cancelled_by',
    cancellationReason: 'cancellation_reason',
    hasConflicts: { column: 'has_conflicts', type: 'boolean' } as ColumnDefinition,
    conflictingAppointmentIds: { column: 'conflicting_appointment_ids', type: 'json' } as ColumnDefinition,
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class TimeOffRequestSQLiteService extends BaseSQLiteService<TimeOffRequest, TimeOffRequestRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, timeOffRequestSchema);
  }

  /**
   * Get requests by staff
   */
  async getByStaff(staffId: string): Promise<TimeOffRequest[]> {
    return this.findWhere('staff_id = ? AND is_deleted = 0 ORDER BY start_date ASC', [staffId]);
  }

  /**
   * Get requests by date range
   */
  async getByDateRange(storeId: string, startDate: string, endDate: string): Promise<TimeOffRequest[]> {
    return this.findWhere(
      'store_id = ? AND is_deleted = 0 AND end_date >= ? AND start_date <= ? ORDER BY start_date ASC',
      [storeId, startDate, endDate]
    );
  }

  /**
   * Get requests by status
   */
  async getByStatus(storeId: string, status: TimeOffRequestStatus): Promise<TimeOffRequest[]> {
    return this.findWhere('store_id = ? AND status = ? AND is_deleted = 0 ORDER BY start_date ASC', [storeId, status]);
  }

  /**
   * Get pending requests for a store
   */
  async getPending(storeId: string): Promise<TimeOffRequest[]> {
    return this.getByStatus(storeId, 'pending');
  }

  /**
   * Count pending requests
   */
  async countPending(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND status = ? AND is_deleted = 0', [storeId, 'pending']);
  }

  /**
   * Get upcoming requests (startDate >= today)
   */
  async getUpcoming(storeId: string): Promise<TimeOffRequest[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.findWhere('store_id = ? AND start_date >= ? AND is_deleted = 0 ORDER BY start_date ASC', [storeId, today]);
  }

  /**
   * Get requests by store
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<TimeOffRequest[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY start_date DESC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY start_date DESC', [storeId]);
  }
}

// ============================================
// BLOCKED TIME TYPE
// ============================================

export interface BlockedTimeType extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  name: string;
  code: string;
  description?: string;
  emoji: string;
  color: string;
  defaultDurationMinutes: number;
  isPaid: boolean;
  blocksOnlineBooking: boolean;
  blocksInStoreBooking: boolean;
  requiresApproval: boolean;
  displayOrder: number;
  isActive: boolean;
  isSystemDefault: boolean;
}

export interface BlockedTimeTypeRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  name: string;
  code: string;
  description: string | null;
  emoji: string;
  color: string;
  default_duration_minutes: number;
  is_paid: number;
  blocks_online_booking: number;
  blocks_in_store_booking: number;
  requires_approval: number;
  display_order: number;
  is_active: number;
  is_system_default: number;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const blockedTimeTypeSchema: TableSchema = {
  tableName: 'blocked_time_types',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    name: 'name',
    code: 'code',
    description: 'description',
    emoji: 'emoji',
    color: 'color',
    defaultDurationMinutes: 'default_duration_minutes',
    isPaid: { column: 'is_paid', type: 'boolean' } as ColumnDefinition,
    blocksOnlineBooking: { column: 'blocks_online_booking', type: 'boolean' } as ColumnDefinition,
    blocksInStoreBooking: { column: 'blocks_in_store_booking', type: 'boolean' } as ColumnDefinition,
    requiresApproval: { column: 'requires_approval', type: 'boolean' } as ColumnDefinition,
    displayOrder: 'display_order',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    isSystemDefault: { column: 'is_system_default', type: 'boolean' } as ColumnDefinition,
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class BlockedTimeTypeSQLiteService extends BaseSQLiteService<BlockedTimeType, BlockedTimeTypeRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, blockedTimeTypeSchema);
  }

  /**
   * Get active blocked time types for a store
   */
  async getActive(storeId: string): Promise<BlockedTimeType[]> {
    return this.findWhere('store_id = ? AND is_active = 1 AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get all blocked time types for a store (including inactive)
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<BlockedTimeType[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Count active types
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1 AND is_deleted = 0', [storeId]);
  }
}

// ============================================
// BLOCKED TIME ENTRY
// ============================================

export interface BlockedTimeEntry extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  staffId: string;
  staffName: string;
  typeId: string;
  typeName: string;
  typeEmoji: string;
  typeColor: string;
  isPaid: boolean;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  frequency: BlockedTimeFrequency;
  repeatEndDate: string | null;
  repeatCount: number | null;
  seriesId: string | null;
  isRecurrenceException: boolean;
  originalDate: string | null;
  notes: string | null;
  createdByStaffId: string | null;
  createdByManagerId: string | null;
}

export interface BlockedTimeEntryRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  staff_id: string;
  staff_name: string;
  type_id: string;
  type_name: string;
  type_emoji: string;
  type_color: string;
  is_paid: number;
  start_date_time: string;
  end_date_time: string;
  duration_minutes: number;
  frequency: string;
  repeat_end_date: string | null;
  repeat_count: number | null;
  series_id: string | null;
  is_recurrence_exception: number;
  original_date: string | null;
  notes: string | null;
  created_by_staff_id: string | null;
  created_by_manager_id: string | null;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const blockedTimeEntrySchema: TableSchema = {
  tableName: 'blocked_time_entries',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    staffId: 'staff_id',
    staffName: 'staff_name',
    typeId: 'type_id',
    typeName: 'type_name',
    typeEmoji: 'type_emoji',
    typeColor: 'type_color',
    isPaid: { column: 'is_paid', type: 'boolean' } as ColumnDefinition,
    startDateTime: 'start_date_time',
    endDateTime: 'end_date_time',
    durationMinutes: 'duration_minutes',
    frequency: 'frequency',
    repeatEndDate: 'repeat_end_date',
    repeatCount: 'repeat_count',
    seriesId: 'series_id',
    isRecurrenceException: { column: 'is_recurrence_exception', type: 'boolean' } as ColumnDefinition,
    originalDate: 'original_date',
    notes: 'notes',
    createdByStaffId: 'created_by_staff_id',
    createdByManagerId: 'created_by_manager_id',
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class BlockedTimeEntrySQLiteService extends BaseSQLiteService<BlockedTimeEntry, BlockedTimeEntryRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, blockedTimeEntrySchema);
  }

  /**
   * Get entries by staff
   */
  async getByStaff(staffId: string): Promise<BlockedTimeEntry[]> {
    return this.findWhere('staff_id = ? AND is_deleted = 0 ORDER BY start_date_time ASC', [staffId]);
  }

  /**
   * Get entries by date range
   */
  async getByDateRange(storeId: string, startDate: string, endDate: string): Promise<BlockedTimeEntry[]> {
    return this.findWhere(
      'store_id = ? AND is_deleted = 0 AND end_date_time >= ? AND start_date_time <= ? ORDER BY start_date_time ASC',
      [storeId, startDate, endDate]
    );
  }

  /**
   * Get entries by series (recurring blocked time)
   */
  async getBySeries(seriesId: string): Promise<BlockedTimeEntry[]> {
    return this.findWhere('series_id = ? AND is_deleted = 0 ORDER BY start_date_time ASC', [seriesId]);
  }

  /**
   * Get entries for a specific staff on a specific date
   */
  async getByStaffAndDate(staffId: string, date: string): Promise<BlockedTimeEntry[]> {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    return this.findWhere(
      'staff_id = ? AND is_deleted = 0 AND start_date_time >= ? AND start_date_time <= ? ORDER BY start_date_time ASC',
      [staffId, startOfDay, endOfDay]
    );
  }

  /**
   * Get entries by store
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<BlockedTimeEntry[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY start_date_time DESC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY start_date_time DESC', [storeId]);
  }

  /**
   * Delete all entries in a series
   */
  async deleteSeries(seriesId: string, userId: string, deviceId: string): Promise<number> {
    const now = new Date().toISOString();
    const tombstoneExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await this.db.run(
      `UPDATE ${this.schema.tableName} SET
        is_deleted = 1,
        deleted_at = ?,
        deleted_by = ?,
        deleted_by_device = ?,
        tombstone_expires_at = ?,
        updated_at = ?,
        last_modified_by = ?,
        last_modified_by_device = ?,
        sync_status = 'pending'
      WHERE series_id = ? AND is_deleted = 0`,
      [now, userId, deviceId, tombstoneExpires, now, userId, deviceId, seriesId]
    );

    return result.changes;
  }
}

// ============================================
// BUSINESS CLOSED PERIOD
// ============================================

export interface BusinessClosedPeriod extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  name: string;
  appliesToAllLocations: boolean;
  locationIds: string[];
  startDate: string;
  endDate: string;
  isPartialDay: boolean;
  startTime: string | null;
  endTime: string | null;
  blocksOnlineBooking: boolean;
  blocksInStoreBooking: boolean;
  color: string;
  notes: string | null;
  isAnnual: boolean;
}

export interface BusinessClosedPeriodRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  name: string;
  applies_to_all_locations: number;
  location_ids: string;
  start_date: string;
  end_date: string;
  is_partial_day: number;
  start_time: string | null;
  end_time: string | null;
  blocks_online_booking: number;
  blocks_in_store_booking: number;
  color: string;
  notes: string | null;
  is_annual: number;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const businessClosedPeriodSchema: TableSchema = {
  tableName: 'business_closed_periods',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    name: 'name',
    appliesToAllLocations: { column: 'applies_to_all_locations', type: 'boolean' } as ColumnDefinition,
    locationIds: { column: 'location_ids', type: 'json' } as ColumnDefinition,
    startDate: 'start_date',
    endDate: 'end_date',
    isPartialDay: { column: 'is_partial_day', type: 'boolean' } as ColumnDefinition,
    startTime: 'start_time',
    endTime: 'end_time',
    blocksOnlineBooking: { column: 'blocks_online_booking', type: 'boolean' } as ColumnDefinition,
    blocksInStoreBooking: { column: 'blocks_in_store_booking', type: 'boolean' } as ColumnDefinition,
    color: 'color',
    notes: 'notes',
    isAnnual: { column: 'is_annual', type: 'boolean' } as ColumnDefinition,
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class BusinessClosedPeriodSQLiteService extends BaseSQLiteService<BusinessClosedPeriod, BusinessClosedPeriodRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, businessClosedPeriodSchema);
  }

  /**
   * Get active (upcoming + current) closed periods
   */
  async getActive(storeId: string): Promise<BusinessClosedPeriod[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.findWhere('store_id = ? AND end_date >= ? AND is_deleted = 0 ORDER BY start_date ASC', [storeId, today]);
  }

  /**
   * Get closed periods by date range
   */
  async getByDateRange(storeId: string, startDate: string, endDate: string): Promise<BusinessClosedPeriod[]> {
    return this.findWhere(
      'store_id = ? AND is_deleted = 0 AND end_date >= ? AND start_date <= ? ORDER BY start_date ASC',
      [storeId, startDate, endDate]
    );
  }

  /**
   * Get closed period for a specific date
   */
  async getForDate(storeId: string, date: string): Promise<BusinessClosedPeriod | null> {
    const results = await this.findWhere(
      'store_id = ? AND is_deleted = 0 AND start_date <= ? AND end_date >= ?',
      [storeId, date, date]
    );
    return results[0] ?? null;
  }

  /**
   * Get all periods for store
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<BusinessClosedPeriod[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY start_date ASC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY start_date ASC', [storeId]);
  }

  /**
   * Get annual (recurring) periods
   */
  async getAnnual(storeId: string): Promise<BusinessClosedPeriod[]> {
    return this.findWhere('store_id = ? AND is_annual = 1 AND is_deleted = 0 ORDER BY start_date ASC', [storeId]);
  }
}

// ============================================
// RESOURCE
// ============================================

export interface Resource extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  name: string;
  description: string | null;
  category: string;
  capacity: number;
  isBookable: boolean;
  color: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  linkedServiceIds: string[];
}

export interface ResourceRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  name: string;
  description: string | null;
  category: string;
  capacity: number;
  is_bookable: number;
  color: string;
  image_url: string | null;
  display_order: number;
  is_active: number;
  linked_service_ids: string;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const resourceSchema: TableSchema = {
  tableName: 'resources',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    name: 'name',
    description: 'description',
    category: 'category',
    capacity: 'capacity',
    isBookable: { column: 'is_bookable', type: 'boolean' } as ColumnDefinition,
    color: 'color',
    imageUrl: 'image_url',
    displayOrder: 'display_order',
    isActive: { column: 'is_active', type: 'boolean' } as ColumnDefinition,
    linkedServiceIds: { column: 'linked_service_ids', type: 'json' } as ColumnDefinition,
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class ResourceSQLiteService extends BaseSQLiteService<Resource, ResourceRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, resourceSchema);
  }

  /**
   * Get active resources for a store
   */
  async getActive(storeId: string): Promise<Resource[]> {
    return this.findWhere('store_id = ? AND is_active = 1 AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get resources by category
   */
  async getByCategory(storeId: string, category: string): Promise<Resource[]> {
    return this.findWhere('store_id = ? AND category = ? AND is_active = 1 AND is_deleted = 0 ORDER BY display_order ASC', [storeId, category]);
  }

  /**
   * Get all resources for store
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<Resource[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY display_order ASC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Get bookable resources
   */
  async getBookable(storeId: string): Promise<Resource[]> {
    return this.findWhere('store_id = ? AND is_bookable = 1 AND is_active = 1 AND is_deleted = 0 ORDER BY display_order ASC', [storeId]);
  }

  /**
   * Count active resources
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1 AND is_deleted = 0', [storeId]);
  }

  /**
   * Get distinct categories
   */
  async getCategories(storeId: string): Promise<string[]> {
    const rows = await this.db.all(
      `SELECT DISTINCT category FROM ${this.schema.tableName} WHERE store_id = ? AND is_deleted = 0 ORDER BY category ASC`,
      [storeId]
    );
    return rows.map((row) => (row as { category: string }).category);
  }
}

// ============================================
// RESOURCE BOOKING
// ============================================

export interface ResourceBooking extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  resourceId: string;
  resourceName: string;
  appointmentId: string;
  startDateTime: string;
  endDateTime: string;
  staffId: string;
  staffName: string;
  assignmentType: ResourceAssignmentType;
  assignedBy: string | null;
}

export interface ResourceBookingRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  resource_id: string;
  resource_name: string;
  appointment_id: string;
  start_date_time: string;
  end_date_time: string;
  staff_id: string;
  staff_name: string;
  assignment_type: string;
  assigned_by: string | null;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const resourceBookingSchema: TableSchema = {
  tableName: 'resource_bookings',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    resourceId: 'resource_id',
    resourceName: 'resource_name',
    appointmentId: 'appointment_id',
    startDateTime: 'start_date_time',
    endDateTime: 'end_date_time',
    staffId: 'staff_id',
    staffName: 'staff_name',
    assignmentType: 'assignment_type',
    assignedBy: 'assigned_by',
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class ResourceBookingSQLiteService extends BaseSQLiteService<ResourceBooking, ResourceBookingRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, resourceBookingSchema);
  }

  /**
   * Get bookings by resource and date range
   */
  async getByResource(resourceId: string, startDate: string, endDate: string): Promise<ResourceBooking[]> {
    return this.findWhere(
      'resource_id = ? AND is_deleted = 0 AND start_date_time >= ? AND start_date_time <= ? ORDER BY start_date_time ASC',
      [resourceId, startDate, endDate]
    );
  }

  /**
   * Get booking by appointment
   */
  async getByAppointment(appointmentId: string): Promise<ResourceBooking | null> {
    const results = await this.findWhere('appointment_id = ? AND is_deleted = 0', [appointmentId]);
    return results[0] ?? null;
  }

  /**
   * Get bookings by store and date range
   */
  async getByDateRange(storeId: string, startDate: string, endDate: string): Promise<ResourceBooking[]> {
    return this.findWhere(
      'store_id = ? AND is_deleted = 0 AND start_date_time >= ? AND start_date_time <= ? ORDER BY start_date_time ASC',
      [storeId, startDate, endDate]
    );
  }

  /**
   * Check if resource is available in time slot
   */
  async isResourceAvailable(resourceId: string, startDateTime: string, endDateTime: string, excludeBookingId?: string): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count FROM ${this.schema.tableName}
      WHERE resource_id = ?
        AND is_deleted = 0
        AND start_date_time < ?
        AND end_date_time > ?
    `;
    const params: SQLiteValue[] = [resourceId, endDateTime, startDateTime];

    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }

    const result = await this.db.get(query, params);
    return (result as { count: number }).count === 0;
  }
}

// ============================================
// STAFF SCHEDULE
// ============================================

/** Day schedule configuration */
export interface DayScheduleConfig {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isWorking: boolean;
  shifts: ShiftConfig[];
}

/** Shift configuration */
export interface ShiftConfig {
  startTime: string;
  endTime: string;
  type: 'regular' | 'overtime';
  notes: string | null;
}

/** Week schedule */
export interface WeekSchedule {
  weekNumber: number;
  days: DayScheduleConfig[];
}

export interface SchedulingStaffSchedule extends Record<string, unknown>, BaseSyncableFields {
  id: string;
  staffId: string;
  staffName: string;
  patternType: SchedulePatternType;
  patternWeeks: number;
  weeks: WeekSchedule[];
  effectiveFrom: string;
  effectiveUntil: string | null;
  patternAnchorDate: string;
  isDefault: boolean;
  copiedFromScheduleId: string | null;
}

export interface SchedulingStaffScheduleRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  staff_id: string;
  staff_name: string;
  pattern_type: string;
  pattern_weeks: number;
  weeks: string;
  effective_from: string;
  effective_until: string | null;
  pattern_anchor_date: string;
  is_default: number;
  copied_from_schedule_id: string | null;
  sync_status: string;
  version: number;
  vector_clock: string;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_device: string;
  last_modified_by: string;
  last_modified_by_device: string;
  is_deleted: number;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

const staffScheduleSchema: TableSchema = {
  tableName: 'staff_schedules',
  primaryKey: 'id',
  columns: {
    id: 'id',
    tenantId: 'tenant_id',
    storeId: 'store_id',
    locationId: 'location_id',
    staffId: 'staff_id',
    staffName: 'staff_name',
    patternType: 'pattern_type',
    patternWeeks: 'pattern_weeks',
    weeks: { column: 'weeks', type: 'json' } as ColumnDefinition,
    effectiveFrom: 'effective_from',
    effectiveUntil: 'effective_until',
    patternAnchorDate: 'pattern_anchor_date',
    isDefault: { column: 'is_default', type: 'boolean' } as ColumnDefinition,
    copiedFromScheduleId: 'copied_from_schedule_id',
    syncStatus: 'sync_status',
    version: 'version',
    vectorClock: { column: 'vector_clock', type: 'json' } as ColumnDefinition,
    lastSyncedVersion: 'last_synced_version',
    createdAt: { column: 'created_at', type: 'date' } as ColumnDefinition,
    updatedAt: { column: 'updated_at', type: 'date' } as ColumnDefinition,
    createdBy: 'created_by',
    createdByDevice: 'created_by_device',
    lastModifiedBy: 'last_modified_by',
    lastModifiedByDevice: 'last_modified_by_device',
    isDeleted: { column: 'is_deleted', type: 'boolean' } as ColumnDefinition,
    deletedAt: { column: 'deleted_at', type: 'date' } as ColumnDefinition,
    deletedBy: 'deleted_by',
    deletedByDevice: 'deleted_by_device',
    tombstoneExpiresAt: { column: 'tombstone_expires_at', type: 'date' } as ColumnDefinition,
  },
};

export class StaffScheduleSQLiteService extends BaseSQLiteService<SchedulingStaffSchedule, SchedulingStaffScheduleRow> {
  constructor(adapter: SQLiteAdapter) {
    super(adapter, staffScheduleSchema);
  }

  /**
   * Get schedules by staff
   */
  async getByStaff(staffId: string): Promise<SchedulingStaffSchedule[]> {
    return this.findWhere('staff_id = ? AND is_deleted = 0 ORDER BY effective_from DESC', [staffId]);
  }

  /**
   * Get effective schedule for staff (current date)
   */
  async getEffective(staffId: string): Promise<SchedulingStaffSchedule | null> {
    const today = new Date().toISOString().split('T')[0];
    const results = await this.findWhere(
      `staff_id = ? AND is_deleted = 0
       AND effective_from <= ?
       AND (effective_until IS NULL OR effective_until >= ?)
       ORDER BY effective_from DESC`,
      [staffId, today, today]
    );
    return results[0] ?? null;
  }

  /**
   * Get schedules by store
   */
  async getByStore(storeId: string, includeDeleted = false): Promise<SchedulingStaffSchedule[]> {
    if (includeDeleted) {
      return this.findWhere('store_id = ? ORDER BY effective_from DESC', [storeId]);
    }
    return this.findWhere('store_id = ? AND is_deleted = 0 ORDER BY effective_from DESC', [storeId]);
  }

  /**
   * Get schedules effective within a date range
   */
  async getByDateRange(storeId: string, startDate: string, endDate: string): Promise<SchedulingStaffSchedule[]> {
    return this.findWhere(
      `store_id = ? AND is_deleted = 0
       AND effective_from <= ?
       AND (effective_until IS NULL OR effective_until >= ?)
       ORDER BY effective_from DESC`,
      [storeId, endDate, startDate]
    );
  }

  /**
   * Get current schedule for staff on specific date
   */
  async getForDate(staffId: string, date: string): Promise<SchedulingStaffSchedule | null> {
    const results = await this.findWhere(
      `staff_id = ? AND is_deleted = 0
       AND effective_from <= ?
       AND (effective_until IS NULL OR effective_until >= ?)
       ORDER BY effective_from DESC`,
      [staffId, date, date]
    );
    return results[0] ?? null;
  }

  /**
   * Get default schedules only
   */
  async getDefaults(storeId: string): Promise<SchedulingStaffSchedule[]> {
    return this.findWhere('store_id = ? AND is_default = 1 AND is_deleted = 0 ORDER BY staff_name ASC', [storeId]);
  }
}
