/**
 * Timesheet Data Service
 *
 * Domain-specific data operations for timesheets.
 * Follows the staffDataService.ts pattern for consistency.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB (instant response)
 * - Writes queue for background sync with server
 *
 * Note: Timesheets use IndexedDB for offline-first support.
 * When online, can also route to Supabase timesheetsTable.
 */

import { store } from '@/store';
import { syncQueueDB } from '@/db/database';
import { timesheetDB } from '@/db/timesheetOperations';
import type {
  TimesheetEntry,
  ClockInParams,
  ClockOutParams,
  StartBreakParams,
  EndBreakParams,
  BreakType,
  TimesheetSummary,
} from '@/types/timesheet';

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Get current user ID from Redux store
 */
function getUserId(): string {
  const state = store.getState();
  return state.auth.user?.id || 'system';
}

/**
 * Get device ID from Redux store or generate one
 */
function getDeviceId(): string {
  const state = store.getState();
  return state.auth.device?.id || 'web-client';
}

/**
 * Queue a sync operation for background processing
 * LOCAL-FIRST: Non-blocking, fire-and-forget
 */
function queueSyncOperation(
  action: 'create' | 'update' | 'delete',
  entityId: string,
  payload: unknown
): void {
  // Don't await - queue async
  syncQueueDB.add({
    type: action,
    entity: 'timesheet',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[TimesheetDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== TIMESHEET SERVICE ====================

/**
 * Timesheet data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes queue for background sync
 */
export const timesheetService = {
  // ==================== READ OPERATIONS ====================

  /**
   * Get all timesheets for a staff member
   */
  async getByStaffId(staffId: string): Promise<TimesheetEntry[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return timesheetDB.getTimesheetsByStaff(storeId, staffId);
  },

  /**
   * Get timesheets within a date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<TimesheetEntry[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return timesheetDB.getTimesheetsByDateRange(storeId, startDate, endDate);
  },

  /**
   * Get timesheets for a specific date
   */
  async getByDate(date: string): Promise<TimesheetEntry[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return timesheetDB.getTimesheetsByDate(storeId, date);
  },

  /**
   * Get a single timesheet by ID
   */
  async getById(id: string): Promise<TimesheetEntry | null> {
    const timesheet = await timesheetDB.getTimesheetById(id);
    return timesheet || null;
  },

  /**
   * Get timesheet for a specific staff member on a specific date
   */
  async getByStaffAndDate(staffId: string, date: string): Promise<TimesheetEntry | null> {
    const storeId = getStoreId();
    if (!storeId) return null;

    const timesheet = await timesheetDB.getTimesheetByStaffAndDate(storeId, staffId, date);
    return timesheet || null;
  },

  /**
   * Get pending timesheets awaiting approval
   */
  async getPending(): Promise<TimesheetEntry[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return timesheetDB.getPendingTimesheets(storeId);
  },

  /**
   * Get timesheets by status
   */
  async getByStatus(status: 'pending' | 'approved' | 'disputed'): Promise<TimesheetEntry[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return timesheetDB.getTimesheetsByStatus(storeId, status);
  },

  /**
   * Check if staff is currently clocked in
   */
  async isStaffClockedIn(staffId: string): Promise<boolean> {
    const storeId = getStoreId();
    if (!storeId) return false;

    return timesheetDB.isStaffClockedIn(storeId, staffId);
  },

  /**
   * Check if staff is currently on break
   */
  async isStaffOnBreak(staffId: string): Promise<boolean> {
    const storeId = getStoreId();
    if (!storeId) return false;

    return timesheetDB.isStaffOnBreak(storeId, staffId);
  },

  /**
   * Get current shift status for a staff member
   */
  async getShiftStatus(staffId: string): Promise<{
    isClockedIn: boolean;
    isOnBreak: boolean;
    clockInTime: string | null;
    currentBreakStart: string | null;
    totalWorkedMinutes: number;
    totalBreakMinutes: number;
  }> {
    const storeId = getStoreId();
    if (!storeId) {
      return {
        isClockedIn: false,
        isOnBreak: false,
        clockInTime: null,
        currentBreakStart: null,
        totalWorkedMinutes: 0,
        totalBreakMinutes: 0,
      };
    }

    return timesheetDB.getStaffShiftStatus(storeId, staffId);
  },

  /**
   * Get timesheet summary for a staff member for a period
   */
  async getSummary(
    staffId: string,
    staffName: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TimesheetSummary> {
    const storeId = getStoreId();
    return timesheetDB.getTimesheetSummary(storeId, staffId, staffName, periodStart, periodEnd);
  },

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new timesheet entry
   */
  async create(params: {
    staffId: string;
    date: string;
    scheduledStart: string;
    scheduledEnd: string;
  }): Promise<TimesheetEntry> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    const id = await timesheetDB.createTimesheet(params, storeId, userId, deviceId);

    // Fetch the created timesheet
    const created = await timesheetDB.getTimesheetById(id);
    if (!created) throw new Error('Failed to create timesheet');

    // Queue for background sync
    queueSyncOperation('create', created.id, created);

    return created;
  },

  /**
   * Update an existing timesheet
   */
  async update(id: string, updates: Partial<TimesheetEntry>): Promise<TimesheetEntry | null> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    try {
      const updated = await timesheetDB.updateTimesheet(id, updates, userId, deviceId);

      // Queue for background sync
      queueSyncOperation('update', id, updated);

      return updated;
    } catch (error) {
      console.error('[TimesheetDataService] Failed to update timesheet:', error);
      return null;
    }
  },

  // ==================== CLOCK OPERATIONS ====================

  /**
   * Clock in a staff member
   */
  async clockIn(params: ClockInParams): Promise<TimesheetEntry> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    const timesheet = await timesheetDB.clockIn(params, storeId, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('update', timesheet.id, timesheet);

    return timesheet;
  },

  /**
   * Clock out a staff member
   */
  async clockOut(params: ClockOutParams): Promise<TimesheetEntry> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    const timesheet = await timesheetDB.clockOut(params, storeId, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('update', timesheet.id, timesheet);

    return timesheet;
  },

  // ==================== BREAK OPERATIONS ====================

  /**
   * Start a break
   */
  async startBreak(params: StartBreakParams): Promise<TimesheetEntry> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    const timesheet = await timesheetDB.startBreak(params, storeId, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('update', timesheet.id, timesheet);

    return timesheet;
  },

  /**
   * End a break
   */
  async endBreak(params: EndBreakParams): Promise<TimesheetEntry> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();

    const timesheet = await timesheetDB.endBreak(params, storeId, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('update', timesheet.id, timesheet);

    return timesheet;
  },

  // ==================== APPROVAL OPERATIONS ====================

  /**
   * Approve a timesheet
   */
  async approve(id: string): Promise<TimesheetEntry> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    const timesheet = await timesheetDB.approveTimesheet(id, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('update', id, timesheet);

    return timesheet;
  },

  /**
   * Reject/dispute a timesheet
   */
  async reject(id: string, reason: string): Promise<TimesheetEntry> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    const timesheet = await timesheetDB.disputeTimesheet(id, reason, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('update', id, timesheet);

    return timesheet;
  },

  /**
   * Bulk approve multiple timesheets
   */
  async bulkApprove(ids: string[]): Promise<void> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    await timesheetDB.bulkApproveTimesheets(ids, userId, deviceId);

    // Queue each for sync
    for (const id of ids) {
      const timesheet = await timesheetDB.getTimesheetById(id);
      if (timesheet) {
        queueSyncOperation('update', id, timesheet);
      }
    }
  },

  // ==================== DELETE OPERATIONS ====================

  /**
   * Soft delete a timesheet
   */
  async delete(id: string): Promise<void> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    await timesheetDB.softDeleteTimesheet(id, userId, deviceId);

    // Queue for background sync
    queueSyncOperation('delete', id, null);
  },
};

export default timesheetService;
