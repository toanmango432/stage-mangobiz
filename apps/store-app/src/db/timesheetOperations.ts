import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { syncQueueDB } from './database';
import type {
  TimesheetEntry,
  BreakEntry,
  CreateTimesheetParams,
  ClockInParams,
  ClockOutParams,
  StartBreakParams,
  EndBreakParams,
  TimesheetSummary,
  HoursBreakdown,
} from '../types/timesheet';
import {
  incrementEntityVersion,
  markEntityDeleted,
  type SyncStatus,
} from '../types/common';
import { createEmptyHoursBreakdown } from '../types/timesheet';

// ============================================
// SYNC CONFIGURATION FOR TIMESHEETS
// See: docs/DATA_STORAGE_STRATEGY.md
// ============================================

const SYNC_CONFIG = {
  entity: 'timesheet' as const,
  priority: 2, // Higher priority than team members (time-sensitive data)
  tombstoneRetentionMs: 90 * 24 * 60 * 60 * 1000, // 90 days
};

/**
 * Add operation to sync queue
 */
async function queueForSync(
  type: 'create' | 'update' | 'delete',
  entity: TimesheetEntry,
  _storeId: string
): Promise<void> {
  const actionMap = {
    create: 'CREATE' as const,
    update: 'UPDATE' as const,
    delete: 'DELETE' as const,
  };

  await syncQueueDB.add({
    type,
    entity: SYNC_CONFIG.entity,
    entityId: entity.id,
    action: actionMap[type],
    payload: entity,
    priority: SYNC_CONFIG.priority,
    maxAttempts: 5,
  });
}

/**
 * Calculate hours breakdown from timesheet entry
 */
function calculateHoursBreakdown(entry: TimesheetEntry): HoursBreakdown {
  const breakdown = createEmptyHoursBreakdown();

  // Calculate scheduled hours
  if (entry.scheduledStart && entry.scheduledEnd) {
    const scheduledStart = new Date(entry.scheduledStart).getTime();
    const scheduledEnd = new Date(entry.scheduledEnd).getTime();
    breakdown.scheduledHours = (scheduledEnd - scheduledStart) / (1000 * 60 * 60);
  }

  // Calculate actual hours
  if (entry.actualClockIn && entry.actualClockOut) {
    const clockIn = new Date(entry.actualClockIn).getTime();
    const clockOut = new Date(entry.actualClockOut).getTime();
    const totalMinutes = (clockOut - clockIn) / (1000 * 60);

    // Calculate break time
    let paidBreakMinutes = 0;
    let unpaidBreakMinutes = 0;

    for (const breakEntry of entry.breaks) {
      if (breakEntry.endTime) {
        const breakDuration = breakEntry.duration;
        if (breakEntry.type === 'paid') {
          paidBreakMinutes += breakDuration;
        } else {
          unpaidBreakMinutes += breakDuration;
        }
      }
    }

    breakdown.breakMinutes = paidBreakMinutes + unpaidBreakMinutes;
    breakdown.paidBreakMinutes = paidBreakMinutes;
    breakdown.unpaidBreakMinutes = unpaidBreakMinutes;

    // Actual hours = total time - unpaid breaks
    breakdown.actualHours = (totalMinutes - unpaidBreakMinutes) / 60;

    // For now, all actual hours are regular (overtime calculation done separately)
    breakdown.regularHours = breakdown.actualHours;
  }

  return breakdown;
}

// ============================================
// TIMESHEET DATABASE OPERATIONS
// Production-ready with sync queue integration
// ============================================

export const timesheetDB = {
  // ---- Read Operations ----

  /**
   * Get all timesheets for a store (excludes deleted)
   */
  async getAllTimesheets(storeId: string): Promise<TimesheetEntry[]> {
    const timesheets = await db.timesheets
      .where('storeId')
      .equals(storeId)
      .toArray();
    return timesheets.filter((t) => !t.isDeleted);
  },

  /**
   * Get timesheet by ID
   */
  async getTimesheetById(id: string): Promise<TimesheetEntry | undefined> {
    return await db.timesheets.get(id);
  },

  /**
   * Get timesheets for a staff member
   */
  async getTimesheetsByStaff(
    storeId: string,
    staffId: string
  ): Promise<TimesheetEntry[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    const timesheets = await db.timesheets
      .where('[storeId+staffId]')
      .equals([storeId, staffId])
      .toArray();
    return timesheets.filter((t) => !t.isDeleted);
  },

  /**
   * Get timesheets by date
   */
  async getTimesheetsByDate(
    storeId: string,
    date: string
  ): Promise<TimesheetEntry[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    const timesheets = await db.timesheets
      .where('[storeId+date]')
      .equals([storeId, date])
      .toArray();
    return timesheets.filter((t) => !t.isDeleted);
  },

  /**
   * Get timesheet for specific staff member on a specific date
   * Note: We first try to match by storeId, but if not found, we return any non-deleted
   * timesheet for that staff+date combination (staff should only have one timesheet per day)
   */
  async getTimesheetByStaffAndDate(
    storeId: string,
    staffId: string,
    date: string
  ): Promise<TimesheetEntry | undefined> {
    // Guard: return undefined if staffId is invalid (prevents IDBKeyRange.bound error)
    if (!staffId) return undefined;
    const timesheets = await db.timesheets
      .where('[staffId+date]')
      .equals([staffId, date])
      .toArray();

    console.log('[timesheetDB.getTimesheetByStaffAndDate] Query:', { storeId, staffId, date });
    console.log('[timesheetDB.getTimesheetByStaffAndDate] Found timesheets:', timesheets.map(t => ({
      id: t.id,
      storeId: t.storeId,
      staffId: t.staffId,
      date: t.date,
      actualClockIn: t.actualClockIn,
      isDeleted: t.isDeleted
    })));

    // First try exact match with storeId
    let result = timesheets.find((t) => t.storeId === storeId && !t.isDeleted);

    // If not found with exact storeId match, return any non-deleted timesheet
    // (staff should only have one timesheet per day regardless of storeId)
    if (!result) {
      result = timesheets.find((t) => !t.isDeleted);
      if (result) {
        console.log('[timesheetDB.getTimesheetByStaffAndDate] StoreId mismatch but found timesheet with storeId:', result.storeId);
      }
    }

    console.log('[timesheetDB.getTimesheetByStaffAndDate] Result:', result ? 'found' : 'NOT FOUND');

    return result;
  },

  /**
   * Get timesheets by date range
   */
  async getTimesheetsByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<TimesheetEntry[]> {
    const timesheets = await db.timesheets
      .where('storeId')
      .equals(storeId)
      .filter((t) => t.date >= startDate && t.date <= endDate && !t.isDeleted)
      .toArray();
    return timesheets;
  },

  /**
   * Get timesheets by status
   */
  async getTimesheetsByStatus(
    storeId: string,
    status: 'pending' | 'approved' | 'disputed'
  ): Promise<TimesheetEntry[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    const timesheets = await db.timesheets
      .where('[storeId+status]')
      .equals([storeId, status])
      .toArray();
    return timesheets.filter((t) => !t.isDeleted);
  },

  /**
   * Get pending timesheets for approval
   */
  async getPendingTimesheets(storeId: string): Promise<TimesheetEntry[]> {
    return this.getTimesheetsByStatus(storeId, 'pending');
  },

  /**
   * Get timesheets pending sync
   */
  async getTimesheetsPendingSync(storeId: string): Promise<TimesheetEntry[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    const timesheets = await db.timesheets
      .where('[storeId+syncStatus]')
      .equals([storeId, 'pending'])
      .toArray();
    return timesheets;
  },

  // ---- Write Operations ----

  /**
   * Create a new timesheet entry
   */
  async createTimesheet(
    params: CreateTimesheetParams,
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId: string = 'default-tenant'
  ): Promise<string> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const newTimesheet: TimesheetEntry = {
      id,
      tenantId,
      storeId,
      staffId: params.staffId,
      date: params.date,
      scheduledStart: params.scheduledStart,
      scheduledEnd: params.scheduledEnd,
      actualClockIn: null,
      actualClockOut: null,
      breaks: [],
      hours: createEmptyHoursBreakdown(),
      status: 'pending',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      syncStatus: 'local' as SyncStatus,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,
    };

    // Calculate initial hours (scheduled only at this point)
    newTimesheet.hours = calculateHoursBreakdown(newTimesheet);

    await db.timesheets.add(newTimesheet);
    await queueForSync('create', newTimesheet, storeId);

    return id;
  },

  /**
   * Update a timesheet entry
   */
  async updateTimesheet(
    id: string,
    updates: Partial<TimesheetEntry>,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    const existing = await db.timesheets.get(id);
    if (!existing) {
      throw new Error(`Timesheet with id ${id} not found`);
    }

    if (existing.isDeleted) {
      throw new Error(`Cannot update deleted timesheet ${id}`);
    }

    const merged: TimesheetEntry = {
      ...existing,
      ...updates,
    };

    // Recalculate hours
    merged.hours = calculateHoursBreakdown(merged);

    // Increment version and update sync metadata
    const updated = incrementEntityVersion(merged, userId, deviceId);

    await db.timesheets.put(updated);
    await queueForSync('update', updated, updated.storeId);

    return updated;
  },

  // ---- Clock In/Out Operations ----

  /**
   * Clock in a staff member
   * IMPORTANT: Creates timesheet with actualClockIn in a single operation
   * to avoid race conditions
   */
  async clockIn(
    params: ClockInParams,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = params.timestamp || new Date().toISOString();

    console.log('[timesheetDB.clockIn] Called with:', {
      staffId: params.staffId,
      storeId,
      today,
      timestamp,
    });

    // Find existing timesheet for today
    let timesheet = await this.getTimesheetByStaffAndDate(
      storeId,
      params.staffId,
      today
    );
    console.log('[timesheetDB.clockIn] Existing timesheet:', timesheet ? { id: timesheet.id, actualClockIn: timesheet.actualClockIn } : 'not found');

    if (!timesheet) {
      // Create a new timesheet with actualClockIn already set (single operation)
      const now = new Date().toISOString();
      const id = uuidv4();

      const newTimesheet: TimesheetEntry = {
        id,
        tenantId: 'default-tenant',
        storeId,
        staffId: params.staffId,
        date: today,
        scheduledStart: timestamp,
        scheduledEnd: timestamp,
        actualClockIn: timestamp, // Set clock in time immediately!
        actualClockOut: null,
        clockInLocation: params.location,
        breaks: [],
        hours: createEmptyHoursBreakdown(),
        status: 'pending',
        version: 1,
        vectorClock: { [deviceId]: 1 },
        lastSyncedVersion: 0,
        syncStatus: 'local' as SyncStatus,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        createdByDevice: deviceId,
        lastModifiedBy: userId,
        lastModifiedByDevice: deviceId,
        isDeleted: false,
      };

      // Calculate hours
      newTimesheet.hours = calculateHoursBreakdown(newTimesheet);

      console.log('[timesheetDB.clockIn] Creating new timesheet with actualClockIn:', timestamp);
      await db.timesheets.add(newTimesheet);
      await queueForSync('create', newTimesheet, storeId);

      // Verify it was saved
      const saved = await db.timesheets.get(id);
      console.log('[timesheetDB.clockIn] Verified saved timesheet:', saved ? { id: saved.id, actualClockIn: saved.actualClockIn } : 'NOT FOUND!');

      if (!saved) {
        throw new Error('Failed to save timesheet to IndexedDB');
      }

      return saved;
    }

    // If timesheet exists but not clocked in, update it
    if (!timesheet.actualClockIn) {
      console.log('[timesheetDB.clockIn] Updating existing timesheet with clock in time');
      const updated = await this.updateTimesheet(
        timesheet.id,
        {
          actualClockIn: timestamp,
          clockInLocation: params.location,
        },
        userId,
        deviceId
      );

      // Verify the update
      const verified = await db.timesheets.get(timesheet.id);
      console.log('[timesheetDB.clockIn] Verified updated timesheet:', verified ? { id: verified.id, actualClockIn: verified.actualClockIn } : 'NOT FOUND!');

      return updated;
    }

    // Already clocked in, return existing
    console.log('[timesheetDB.clockIn] Already clocked in, returning existing timesheet');
    return timesheet;
  },

  /**
   * Clock out a staff member
   */
  async clockOut(
    params: ClockOutParams,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = params.timestamp || new Date().toISOString();

    const timesheet = await this.getTimesheetByStaffAndDate(
      storeId,
      params.staffId,
      today
    );

    if (!timesheet) {
      throw new Error(`No timesheet found for staff ${params.staffId} on ${today}`);
    }

    if (!timesheet.actualClockIn) {
      throw new Error('Cannot clock out without clocking in first');
    }

    // End any active breaks
    const updatedBreaks = timesheet.breaks.map((breakEntry) => {
      if (!breakEntry.endTime) {
        const startTime = new Date(breakEntry.startTime).getTime();
        const endTime = new Date(timestamp).getTime();
        return {
          ...breakEntry,
          endTime: timestamp,
          duration: Math.round((endTime - startTime) / (1000 * 60)),
        };
      }
      return breakEntry;
    });

    return await this.updateTimesheet(
      timesheet.id,
      {
        actualClockOut: timestamp,
        clockOutLocation: params.location,
        breaks: updatedBreaks,
      },
      userId,
      deviceId
    );
  },

  // ---- Break Operations ----

  /**
   * Start a break
   */
  async startBreak(
    params: StartBreakParams,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = params.timestamp || new Date().toISOString();

    const timesheet = await this.getTimesheetByStaffAndDate(
      storeId,
      params.staffId,
      today
    );

    if (!timesheet) {
      throw new Error(`No timesheet found for staff ${params.staffId} on ${today}`);
    }

    if (!timesheet.actualClockIn) {
      throw new Error('Cannot start break without clocking in first');
    }

    // Check for active break
    const activeBreak = timesheet.breaks.find((b) => !b.endTime);
    if (activeBreak) {
      throw new Error('Cannot start a new break while another break is active');
    }

    const newBreak: BreakEntry = {
      id: uuidv4(),
      startTime: timestamp,
      endTime: null,
      type: params.breakType,
      duration: 0,
      label: params.label,
    };

    return await this.updateTimesheet(
      timesheet.id,
      {
        breaks: [...timesheet.breaks, newBreak],
      },
      userId,
      deviceId
    );
  },

  /**
   * End a break
   */
  async endBreak(
    params: EndBreakParams,
    storeId: string,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = params.timestamp || new Date().toISOString();

    const timesheet = await this.getTimesheetByStaffAndDate(
      storeId,
      params.staffId,
      today
    );

    if (!timesheet) {
      throw new Error(`No timesheet found for staff ${params.staffId} on ${today}`);
    }

    // Find active break
    const activeBreakIndex = timesheet.breaks.findIndex((b) => !b.endTime);
    if (activeBreakIndex === -1) {
      throw new Error('No active break to end');
    }

    const activeBreak = timesheet.breaks[activeBreakIndex];
    const startTime = new Date(activeBreak.startTime).getTime();
    const endTime = new Date(timestamp).getTime();
    const duration = Math.round((endTime - startTime) / (1000 * 60));

    const updatedBreaks = [...timesheet.breaks];
    updatedBreaks[activeBreakIndex] = {
      ...activeBreak,
      endTime: timestamp,
      duration,
    };

    return await this.updateTimesheet(
      timesheet.id,
      { breaks: updatedBreaks },
      userId,
      deviceId
    );
  },

  // ---- Approval Workflow ----

  /**
   * Approve a timesheet
   */
  async approveTimesheet(
    id: string,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    return await this.updateTimesheet(
      id,
      {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date().toISOString(),
      },
      userId,
      deviceId
    );
  },

  /**
   * Dispute a timesheet
   */
  async disputeTimesheet(
    id: string,
    reason: string,
    userId: string,
    deviceId: string
  ): Promise<TimesheetEntry> {
    return await this.updateTimesheet(
      id,
      {
        status: 'disputed',
        disputeReason: reason,
      },
      userId,
      deviceId
    );
  },

  /**
   * Bulk approve timesheets
   */
  async bulkApproveTimesheets(
    ids: string[],
    userId: string,
    deviceId: string
  ): Promise<void> {
    await db.transaction('rw', db.timesheets, async () => {
      for (const id of ids) {
        await this.approveTimesheet(id, userId, deviceId);
      }
    });
  },

  // ---- Delete Operations ----

  /**
   * Soft delete a timesheet (tombstone pattern)
   */
  async softDeleteTimesheet(
    id: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const existing = await db.timesheets.get(id);
    if (!existing) {
      throw new Error(`Timesheet with id ${id} not found`);
    }

    const deleted = markEntityDeleted(
      existing,
      userId,
      deviceId,
      SYNC_CONFIG.tombstoneRetentionMs
    );

    await db.timesheets.put(deleted);
    await queueForSync('delete', deleted, deleted.storeId);
  },

  /**
   * Hard delete a timesheet (permanent)
   */
  async hardDeleteTimesheet(id: string): Promise<void> {
    await db.timesheets.delete(id);
  },

  // ---- Summary & Reports ----

  /**
   * Get timesheet summary for a staff member for a period
   */
  async getTimesheetSummary(
    storeId: string,
    staffId: string,
    staffName: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TimesheetSummary> {
    // Guard: return empty summary if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) {
      return {
        staffId,
        staffName,
        periodStart,
        periodEnd,
        totalScheduledHours: 0,
        totalActualHours: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0,
        totalBreakMinutes: 0,
        variance: 0,
        pendingCount: 0,
        approvedCount: 0,
        disputedCount: 0,
      };
    }
    const timesheets = await db.timesheets
      .where('[storeId+staffId]')
      .equals([storeId, staffId])
      .filter((t) => t.date >= periodStart && t.date <= periodEnd && !t.isDeleted)
      .toArray();

    let totalScheduledHours = 0;
    let totalActualHours = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalBreakMinutes = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let disputedCount = 0;

    for (const ts of timesheets) {
      totalScheduledHours += ts.hours.scheduledHours;
      totalActualHours += ts.hours.actualHours;
      totalRegularHours += ts.hours.regularHours;
      totalOvertimeHours += ts.hours.overtimeHours;
      totalBreakMinutes += ts.hours.breakMinutes;

      if (ts.status === 'pending') pendingCount++;
      if (ts.status === 'approved') approvedCount++;
      if (ts.status === 'disputed') disputedCount++;
    }

    return {
      staffId,
      staffName,
      periodStart,
      periodEnd,
      totalScheduledHours,
      totalActualHours,
      totalRegularHours,
      totalOvertimeHours,
      totalBreakMinutes,
      variance: totalActualHours - totalScheduledHours,
      pendingCount,
      approvedCount,
      disputedCount,
    };
  },

  // ---- Sync Operations ----

  /**
   * Mark a timesheet as synced
   */
  async markSynced(id: string, serverVersion: number): Promise<void> {
    const timesheet = await db.timesheets.get(id);
    if (!timesheet) return;

    await db.timesheets.update(id, {
      syncStatus: 'synced' as SyncStatus,
      lastSyncedVersion: serverVersion,
    });
  },

  /**
   * Apply a server change (for pull sync)
   */
  async applyServerChange(serverTimesheet: TimesheetEntry): Promise<void> {
    const local = await db.timesheets.get(serverTimesheet.id);

    if (!local) {
      // New record from server
      await db.timesheets.add({
        ...serverTimesheet,
        syncStatus: 'synced' as SyncStatus,
        lastSyncedVersion: serverTimesheet.version,
      });
      return;
    }

    // For now, simple last-write-wins based on version
    // TODO: Implement vector clock comparison like teamOperations
    if (serverTimesheet.version >= local.version) {
      await db.timesheets.put({
        ...serverTimesheet,
        syncStatus: 'synced' as SyncStatus,
        lastSyncedVersion: serverTimesheet.version,
      });
    }
  },

  /**
   * Purge expired tombstones
   */
  async purgeExpiredTombstones(): Promise<number> {
    const now = new Date().toISOString();
    const expired = await db.timesheets
      .filter(
        (t) =>
          t.isDeleted === true &&
          t.tombstoneExpiresAt !== undefined &&
          t.tombstoneExpiresAt < now &&
          t.syncStatus === 'synced'
      )
      .toArray();

    for (const timesheet of expired) {
      await this.hardDeleteTimesheet(timesheet.id);
    }

    return expired.length;
  },

  // ---- Utilities ----

  /**
   * Check if staff is currently clocked in
   */
  async isStaffClockedIn(storeId: string, staffId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const timesheet = await this.getTimesheetByStaffAndDate(storeId, staffId, today);
    return timesheet?.actualClockIn !== null && timesheet?.actualClockOut === null;
  },

  /**
   * Check if staff is currently on break
   */
  async isStaffOnBreak(storeId: string, staffId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const timesheet = await this.getTimesheetByStaffAndDate(storeId, staffId, today);
    if (!timesheet) return false;
    return timesheet.breaks.some((b) => !b.endTime);
  },

  /**
   * Get current shift status for a staff member
   */
  async getStaffShiftStatus(
    storeId: string,
    staffId: string
  ): Promise<{
    isClockedIn: boolean;
    isOnBreak: boolean;
    clockInTime: string | null;
    currentBreakStart: string | null;
    totalWorkedMinutes: number;
    totalBreakMinutes: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    console.log('[timesheetDB.getStaffShiftStatus] Checking:', { storeId, staffId, today });
    const timesheet = await this.getTimesheetByStaffAndDate(storeId, staffId, today);
    console.log('[timesheetDB.getStaffShiftStatus] Found timesheet:', timesheet ? { id: timesheet.id, actualClockIn: timesheet.actualClockIn } : null);

    if (!timesheet || !timesheet.actualClockIn) {
      console.log('[timesheetDB.getStaffShiftStatus] Returning NOT clocked in');
      return {
        isClockedIn: false,
        isOnBreak: false,
        clockInTime: null,
        currentBreakStart: null,
        totalWorkedMinutes: 0,
        totalBreakMinutes: 0,
      };
    }

    const activeBreak = timesheet.breaks.find((b) => !b.endTime);
    const totalBreakMinutes = timesheet.breaks.reduce((sum, b) => sum + b.duration, 0);

    const clockInTime = new Date(timesheet.actualClockIn).getTime();
    const now = Date.now();
    const totalWorkedMinutes = Math.round((now - clockInTime) / (1000 * 60)) - totalBreakMinutes;

    return {
      isClockedIn: timesheet.actualClockOut === null,
      isOnBreak: !!activeBreak,
      clockInTime: timesheet.actualClockIn,
      currentBreakStart: activeBreak?.startTime || null,
      totalWorkedMinutes: Math.max(0, totalWorkedMinutes),
      totalBreakMinutes,
    };
  },

  /**
   * Clear all timesheet data
   */
  async clearAll(): Promise<void> {
    await db.timesheets.clear();
  },

  /**
   * Check if timesheet data exists
   */
  async hasData(storeId: string): Promise<boolean> {
    const count = await db.timesheets.where('storeId').equals(storeId).count();
    return count > 0;
  },
};

export default timesheetDB;
