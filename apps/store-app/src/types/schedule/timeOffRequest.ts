import { BaseSyncableEntity } from '../common';

/**
 * TimeOffRequest represents a staff member's request for time off.
 * Follows a workflow: pending -> approved/denied -> (optional) cancelled
 */
export interface TimeOffRequest extends BaseSyncableEntity {
  // === STAFF REFERENCE ===
  staffId: string;
  /** Denormalized for offline display */
  staffName: string;

  // === TYPE REFERENCE (Denormalized snapshot) ===
  typeId: string;
  typeName: string;
  typeEmoji: string;
  typeColor: string;
  /** Snapshot of isPaid at request time */
  isPaid: boolean;

  // === DATE RANGE ===
  /** Start date: "2025-12-25" (ISO 8601 date only) */
  startDate: string;
  /** End date: "2025-12-26" (inclusive) */
  endDate: string;
  /** Whether this is a full day(s) request */
  isAllDay: boolean;
  /** Start time if partial day: "09:00" */
  startTime: string | null;
  /** End time if partial day: "17:00" */
  endTime: string | null;

  // === CALCULATED VALUES ===
  /** Total hours based on scheduled shifts */
  totalHours: number;
  /** Number of working days affected */
  totalDays: number;

  // === STATUS WORKFLOW ===
  status: TimeOffRequestStatus;
  /** Audit trail of all status changes */
  statusHistory: TimeOffStatusChange[];

  // === REQUEST DETAILS ===
  /** Optional notes from requester */
  notes: string | null;

  // === APPROVAL DETAILS ===
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;

  // === DENIAL DETAILS ===
  deniedBy: string | null;
  deniedByName: string | null;
  deniedAt: string | null;
  /** Required when denying */
  denialReason: string | null;

  // === CANCELLATION DETAILS ===
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;

  // === CONFLICT TRACKING ===
  /** Whether appointments exist on these dates */
  hasConflicts: boolean;
  /** IDs of conflicting appointments */
  conflictingAppointmentIds: string[];
}

export type TimeOffRequestStatus =
  | 'pending'    // Awaiting manager review
  | 'approved'   // Approved by manager
  | 'denied'     // Denied by manager
  | 'cancelled'; // Cancelled by requester or manager

export interface TimeOffStatusChange {
  from: TimeOffRequestStatus | null;
  to: TimeOffRequestStatus;
  changedAt: string;
  changedBy: string;
  changedByDevice: string;
  reason?: string;
}

/**
 * Input for creating a time-off request
 */
export interface CreateTimeOffRequestInput {
  staffId: string;
  staffName: string;
  typeId: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}
