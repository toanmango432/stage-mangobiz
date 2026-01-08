/**
 * Time Off Request Type Adapter
 *
 * Converts between Supabase TimeOffRequestRow and app TimeOffRequest types.
 */

import type { TimeOffRequestRow, TimeOffRequestInsert, TimeOffRequestUpdate, TimeOffType, Json } from '../types';
import type { TimeOffRequest, TimeOffRequestStatus, TimeOffStatusChange } from '@/types/schedule/timeOffRequest';
import type { SyncStatus } from '@/types/common';

/**
 * Convert Supabase TimeOffRequestRow to app TimeOffRequest type
 */
export function toTimeOffRequest(row: TimeOffRequestRow): TimeOffRequest {
  return {
    id: row.id,
    storeId: row.store_id,
    tenantId: '', // Populated from session
    staffId: row.staff_id,
    staffName: '', // Needs to be populated from staff lookup

    // Type reference - simplified (would need lookup for full details)
    typeId: row.request_type,
    typeName: formatTimeOffType(row.request_type),
    typeEmoji: getTimeOffEmoji(row.request_type),
    typeColor: getTimeOffColor(row.request_type),
    isPaid: isPaidTimeOff(row.request_type),

    // Date range
    startDate: row.start_date,
    endDate: row.end_date,
    isAllDay: row.all_day,
    startTime: row.start_time,
    endTime: row.end_time,

    // Calculated values
    totalHours: row.total_hours || 0,
    totalDays: calculateDays(row.start_date, row.end_date),

    // Status workflow
    status: row.status as TimeOffRequestStatus,
    statusHistory: parseStatusHistory(row),

    // Request details
    notes: row.notes,

    // Approval details
    approvedBy: row.status === 'approved' ? row.reviewed_by : null,
    approvedByName: null, // Needs staff lookup
    approvedAt: row.status === 'approved' ? row.reviewed_at : null,
    approvalNotes: row.status === 'approved' ? row.review_notes : null,

    // Denial details
    deniedBy: row.status === 'denied' ? row.reviewed_by : null,
    deniedByName: null,
    deniedAt: row.status === 'denied' ? row.reviewed_at : null,
    denialReason: row.status === 'denied' ? row.review_notes : null,

    // Cancellation details
    cancelledAt: row.cancelled_at,
    cancelledBy: row.cancelled_by,
    cancellationReason: row.cancellation_reason,

    // Conflict tracking
    hasConflicts: row.has_conflicts,
    conflictingAppointmentIds: parseConflictIds(row.conflict_details),

    // Sync
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status as SyncStatus,
    // BaseSyncableEntity fields with defaults
    version: row.sync_version || 1,
    vectorClock: {},
    lastSyncedVersion: row.sync_version || 1,
    createdBy: row.created_by || '',
    createdByDevice: row.created_by_device || '',
    lastModifiedBy: row.created_by || '', // Use created_by as fallback
    lastModifiedByDevice: row.created_by_device || '',
    isDeleted: false,
  };
}

/**
 * Convert app TimeOffRequest to Supabase TimeOffRequestInsert
 */
export function toTimeOffRequestInsert(
  request: Omit<TimeOffRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>,
  storeId?: string
): Omit<TimeOffRequestInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || request.storeId,
    staff_id: request.staffId,
    request_type: request.typeId as TimeOffType,
    start_date: request.startDate,
    end_date: request.endDate,
    all_day: request.isAllDay,
    start_time: request.startTime || null,
    end_time: request.endTime || null,
    notes: request.notes || null,
    total_hours: request.totalHours || null,
    status: request.status,
    has_conflicts: request.hasConflicts,
    conflict_details: request.conflictingAppointmentIds?.length
      ? { appointmentIds: request.conflictingAppointmentIds }
      : null,
    sync_status: request.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial TimeOffRequest updates to Supabase TimeOffRequestUpdate
 */
export function toTimeOffRequestUpdate(updates: Partial<TimeOffRequest>): TimeOffRequestUpdate {
  const result: TimeOffRequestUpdate = {};

  if (updates.startDate !== undefined) {
    result.start_date = updates.startDate;
  }
  if (updates.endDate !== undefined) {
    result.end_date = updates.endDate;
  }
  if (updates.isAllDay !== undefined) {
    result.all_day = updates.isAllDay;
  }
  if (updates.startTime !== undefined) {
    result.start_time = updates.startTime || null;
  }
  if (updates.endTime !== undefined) {
    result.end_time = updates.endTime || null;
  }
  if (updates.notes !== undefined) {
    result.notes = updates.notes || null;
  }
  if (updates.totalHours !== undefined) {
    result.total_hours = updates.totalHours || null;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.approvedBy !== undefined || updates.deniedBy !== undefined) {
    result.reviewed_by = updates.approvedBy || updates.deniedBy || null;
  }
  if (updates.approvedAt !== undefined || updates.deniedAt !== undefined) {
    result.reviewed_at = updates.approvedAt || updates.deniedAt || null;
  }
  if (updates.approvalNotes !== undefined || updates.denialReason !== undefined) {
    result.review_notes = updates.approvalNotes || updates.denialReason || null;
  }
  if (updates.hasConflicts !== undefined) {
    result.has_conflicts = updates.hasConflicts;
  }
  if (updates.conflictingAppointmentIds !== undefined) {
    result.conflict_details = updates.conflictingAppointmentIds?.length
      ? { appointmentIds: updates.conflictingAppointmentIds }
      : null;
  }
  if (updates.cancelledAt !== undefined) {
    result.cancelled_at = updates.cancelledAt || null;
  }
  if (updates.cancelledBy !== undefined) {
    result.cancelled_by = updates.cancelledBy || null;
  }
  if (updates.cancellationReason !== undefined) {
    result.cancellation_reason = updates.cancellationReason || null;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

/**
 * Convert array of TimeOffRequestRows to TimeOffRequest
 */
export function toTimeOffRequests(rows: TimeOffRequestRow[]): TimeOffRequest[] {
  return rows.map(toTimeOffRequest);
}

// ==================== HELPER FUNCTIONS ====================

function formatTimeOffType(type: TimeOffType): string {
  const labels: Record<TimeOffType, string> = {
    vacation: 'Vacation',
    sick: 'Sick Leave',
    personal: 'Personal',
    unpaid: 'Unpaid Leave',
    bereavement: 'Bereavement',
    jury_duty: 'Jury Duty',
    other: 'Other',
  };
  return labels[type] || type;
}

function getTimeOffEmoji(type: TimeOffType): string {
  const emojis: Record<TimeOffType, string> = {
    vacation: '🏖️',
    sick: '🤒',
    personal: '👤',
    unpaid: '💰',
    bereavement: '🖤',
    jury_duty: '⚖️',
    other: '📅',
  };
  return emojis[type] || '📅';
}

function getTimeOffColor(type: TimeOffType): string {
  const colors: Record<TimeOffType, string> = {
    vacation: 'bg-blue-100',
    sick: 'bg-red-100',
    personal: 'bg-purple-100',
    unpaid: 'bg-gray-100',
    bereavement: 'bg-gray-200',
    jury_duty: 'bg-amber-100',
    other: 'bg-teal-100',
  };
  return colors[type] || 'bg-gray-100';
}

function isPaidTimeOff(type: TimeOffType): boolean {
  const paidTypes: TimeOffType[] = ['vacation', 'sick', 'bereavement', 'jury_duty'];
  return paidTypes.includes(type);
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function parseStatusHistory(row: TimeOffRequestRow): TimeOffStatusChange[] {
  const history: TimeOffStatusChange[] = [];

  // Initial creation
  history.push({
    from: null,
    to: 'pending',
    changedAt: row.created_at,
    changedBy: row.created_by || 'system',
    changedByDevice: row.created_by_device || 'unknown',
  });

  // Add approval/denial if applicable
  if (row.reviewed_at && row.reviewed_by) {
    history.push({
      from: 'pending',
      to: row.status as TimeOffRequestStatus,
      changedAt: row.reviewed_at,
      changedBy: row.reviewed_by,
      changedByDevice: 'unknown',
      reason: row.review_notes || undefined,
    });
  }

  // Add cancellation if applicable
  if (row.cancelled_at && row.cancelled_by) {
    history.push({
      from: row.status as TimeOffRequestStatus,
      to: 'cancelled',
      changedAt: row.cancelled_at,
      changedBy: row.cancelled_by,
      changedByDevice: 'unknown',
      reason: row.cancellation_reason || undefined,
    });
  }

  return history;
}

function parseConflictIds(conflictDetails: Json | null): string[] {
  if (!conflictDetails || typeof conflictDetails !== 'object' || Array.isArray(conflictDetails)) {
    return [];
  }

  const details = conflictDetails as Record<string, unknown>;
  if (Array.isArray(details.appointmentIds)) {
    return details.appointmentIds.filter((id): id is string => typeof id === 'string');
  }

  return [];
}
