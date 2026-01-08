/**
 * Timesheet Type Adapter
 *
 * Converts between Supabase TimesheetRow and app TimesheetEntry types.
 */

import type { TimesheetRow, TimesheetInsert, TimesheetUpdate, Json } from '../types';
import type { TimesheetEntry, BreakEntry, HoursBreakdown, TimesheetStatus } from '@/types/timesheet';
import type { SyncStatus } from '@/types/common';

/**
 * Convert Supabase TimesheetRow to app TimesheetEntry type
 */
export function toTimesheet(row: TimesheetRow): TimesheetEntry {
  return {
    id: row.id,
    storeId: row.store_id,
    tenantId: '', // Not stored in Supabase row, populated from session
    staffId: row.staff_id,
    date: row.date,
    scheduledStart: row.scheduled_start || '',
    scheduledEnd: row.scheduled_end || '',
    actualClockIn: row.actual_clock_in,
    actualClockOut: row.actual_clock_out,
    breaks: parseBreaks(row.breaks),
    hours: parseHours(row.hours),
    status: row.status as TimesheetStatus,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    disputeReason: row.dispute_reason || undefined,
    notes: row.notes || undefined,
    clockInLocation: parseLocation(row.clock_in_location),
    clockOutLocation: parseLocation(row.clock_out_location),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status as SyncStatus,
    // BaseSyncableEntity fields with defaults
    version: row.sync_version || 1,
    vectorClock: {},
    lastSyncedVersion: row.sync_version || 1,
    createdBy: row.created_by || '',
    createdByDevice: row.created_by_device || '',
    lastModifiedBy: row.last_modified_by || '',
    lastModifiedByDevice: row.last_modified_by_device || '',
    isDeleted: false,
  };
}

/**
 * Convert app TimesheetEntry to Supabase TimesheetInsert
 */
export function toTimesheetInsert(
  entry: Omit<TimesheetEntry, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<TimesheetInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || entry.storeId,
    staff_id: entry.staffId,
    date: entry.date,
    scheduled_start: entry.scheduledStart || null,
    scheduled_end: entry.scheduledEnd || null,
    actual_clock_in: entry.actualClockIn || null,
    actual_clock_out: entry.actualClockOut || null,
    breaks: serializeBreaks(entry.breaks) as Json,
    hours: serializeHours(entry.hours) as Json,
    status: entry.status,
    approved_by: entry.approvedBy || null,
    approved_at: entry.approvedAt || null,
    dispute_reason: entry.disputeReason || null,
    notes: entry.notes || null,
    clock_in_location: entry.clockInLocation
      ? { lat: entry.clockInLocation.lat, lng: entry.clockInLocation.lng }
      : null,
    clock_out_location: entry.clockOutLocation
      ? { lat: entry.clockOutLocation.lat, lng: entry.clockOutLocation.lng }
      : null,
    sync_status: entry.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial TimesheetEntry updates to Supabase TimesheetUpdate
 */
export function toTimesheetUpdate(updates: Partial<TimesheetEntry>): TimesheetUpdate {
  const result: TimesheetUpdate = {};

  if (updates.scheduledStart !== undefined) {
    result.scheduled_start = updates.scheduledStart || null;
  }
  if (updates.scheduledEnd !== undefined) {
    result.scheduled_end = updates.scheduledEnd || null;
  }
  if (updates.actualClockIn !== undefined) {
    result.actual_clock_in = updates.actualClockIn || null;
  }
  if (updates.actualClockOut !== undefined) {
    result.actual_clock_out = updates.actualClockOut || null;
  }
  if (updates.breaks !== undefined) {
    result.breaks = serializeBreaks(updates.breaks) as Json;
  }
  if (updates.hours !== undefined) {
    result.hours = serializeHours(updates.hours) as Json;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.approvedBy !== undefined) {
    result.approved_by = updates.approvedBy || null;
  }
  if (updates.approvedAt !== undefined) {
    result.approved_at = updates.approvedAt || null;
  }
  if (updates.disputeReason !== undefined) {
    result.dispute_reason = updates.disputeReason || null;
  }
  if (updates.notes !== undefined) {
    result.notes = updates.notes || null;
  }
  if (updates.clockInLocation !== undefined) {
    result.clock_in_location = updates.clockInLocation
      ? { lat: updates.clockInLocation.lat, lng: updates.clockInLocation.lng }
      : null;
  }
  if (updates.clockOutLocation !== undefined) {
    result.clock_out_location = updates.clockOutLocation
      ? { lat: updates.clockOutLocation.lat, lng: updates.clockOutLocation.lng }
      : null;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

/**
 * Convert array of TimesheetRows to TimesheetEntry
 */
export function toTimesheets(rows: TimesheetRow[]): TimesheetEntry[] {
  return rows.map(toTimesheet);
}

// ==================== PARSE HELPERS ====================

function parseBreaks(json: Json): BreakEntry[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const breakItem = item as Record<string, unknown>;
    return {
      id: String(breakItem.id || ''),
      startTime: String(breakItem.startTime || breakItem.start_time || ''),
      endTime: breakItem.endTime || breakItem.end_time
        ? String(breakItem.endTime || breakItem.end_time)
        : null,
      type: (breakItem.type as 'paid' | 'unpaid') || 'unpaid',
      duration: Number(breakItem.duration || 0),
      label: breakItem.label ? String(breakItem.label) : undefined,
    };
  });
}

function parseHours(json: Json): HoursBreakdown {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return createEmptyHoursBreakdown();
  }

  const hours = json as Record<string, unknown>;
  return {
    scheduledHours: Number(hours.scheduledHours || hours.scheduled_hours || 0),
    actualHours: Number(hours.actualHours || hours.actual_hours || 0),
    regularHours: Number(hours.regularHours || hours.regular_hours || 0),
    overtimeHours: Number(hours.overtimeHours || hours.overtime_hours || 0),
    doubleTimeHours: Number(hours.doubleTimeHours || hours.double_time_hours || 0),
    breakMinutes: Number(hours.breakMinutes || hours.break_minutes || 0),
    paidBreakMinutes: Number(hours.paidBreakMinutes || hours.paid_break_minutes || 0),
    unpaidBreakMinutes: Number(hours.unpaidBreakMinutes || hours.unpaid_break_minutes || 0),
  };
}

function parseLocation(json: Json | null): { lat: number; lng: number } | undefined {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return undefined;

  const loc = json as Record<string, unknown>;
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return { lat: loc.lat, lng: loc.lng };
  }
  return undefined;
}

// ==================== SERIALIZE HELPERS ====================

function serializeBreaks(breaks?: BreakEntry[]): unknown[] {
  if (!breaks) return [];
  return breaks.map((b) => ({
    id: b.id,
    startTime: b.startTime,
    endTime: b.endTime,
    type: b.type,
    duration: b.duration,
    label: b.label,
  }));
}

function serializeHours(hours?: HoursBreakdown): unknown {
  if (!hours) return {};
  return {
    scheduledHours: hours.scheduledHours,
    actualHours: hours.actualHours,
    regularHours: hours.regularHours,
    overtimeHours: hours.overtimeHours,
    doubleTimeHours: hours.doubleTimeHours,
    breakMinutes: hours.breakMinutes,
    paidBreakMinutes: hours.paidBreakMinutes,
    unpaidBreakMinutes: hours.unpaidBreakMinutes,
  };
}

function createEmptyHoursBreakdown(): HoursBreakdown {
  return {
    scheduledHours: 0,
    actualHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    doubleTimeHours: 0,
    breakMinutes: 0,
    paidBreakMinutes: 0,
    unpaidBreakMinutes: 0,
  };
}
