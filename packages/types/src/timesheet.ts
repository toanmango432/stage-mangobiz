/**
 * Timesheet Types - Phase 2: Time & Attendance
 *
 * Provides types for clock in/out, break tracking, timesheet management,
 * overtime calculation, and attendance alerts.
 *
 * @see docs/product/PRD-Team-Module.md Section 6.4
 * @see tasks/PHASE2-TIME-ATTENDANCE-BREAKDOWN.md
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/**
 * Status of a timesheet entry in the approval workflow.
 */
export type TimesheetStatus = 'pending' | 'approved' | 'disputed';

/**
 * Type of break - affects payroll calculation.
 * - paid: Break time counts toward worked hours
 * - unpaid: Break time is deducted from worked hours
 */
export type BreakType = 'paid' | 'unpaid';

/**
 * Types of attendance alerts generated for managers.
 */
export type AttendanceAlertType =
  | 'late_arrival'      // Clocked in >5 min after scheduled start
  | 'early_departure'   // Clocked out >15 min before scheduled end
  | 'missed_clock_in'   // Scheduled shift, no clock in by shift start
  | 'extended_break'    // Break longer than scheduled (>5 min over)
  | 'no_show';          // Scheduled but didn't work entire day

/**
 * How overtime should be calculated.
 * - daily: OT after X hours per day (e.g., >8 hrs/day)
 * - weekly: OT after X hours per week (e.g., >40 hrs/week)
 * - both: Whichever threshold triggers first
 */
export type OvertimeCalculationType = 'daily' | 'weekly' | 'both';

// ============================================
// BREAK TRACKING
// ============================================

/**
 * Represents a single break period within a timesheet entry.
 */
export interface BreakEntry {
  /** Unique identifier for this break */
  id: string;

  /** ISO timestamp when break started */
  startTime: string;

  /** ISO timestamp when break ended. Null if break is ongoing */
  endTime: string | null;

  /** Whether this break is paid or unpaid */
  type: BreakType;

  /** Duration in minutes (calculated when break ends) */
  duration: number;

  /** Optional label for the break (e.g., "Lunch", "Break") */
  label?: string;
}

// ============================================
// HOURS CALCULATION
// ============================================

/**
 * Breakdown of hours for a timesheet entry.
 * Used for display and payroll calculations.
 */
export interface HoursBreakdown {
  /** Hours the staff was scheduled to work */
  scheduledHours: number;

  /** Actual hours worked (clock out - clock in - unpaid breaks) */
  actualHours: number;

  /** Regular (non-overtime) hours */
  regularHours: number;

  /** Overtime hours (based on overtime settings) */
  overtimeHours: number;

  /** Double-time hours (if applicable) */
  doubleTimeHours: number;

  /** Total break time in minutes */
  breakMinutes: number;

  /** Paid break time in minutes (counts toward hours) */
  paidBreakMinutes: number;

  /** Unpaid break time in minutes (deducted from hours) */
  unpaidBreakMinutes: number;
}

// ============================================
// OVERTIME SETTINGS
// ============================================

/**
 * Configuration for overtime calculation.
 * Stored at the store/tenant level.
 */
export interface OvertimeSettings {
  /** How to calculate overtime */
  calculationType: OvertimeCalculationType;

  /** Hours per day before overtime kicks in (e.g., 8) */
  dailyThreshold: number;

  /** Hours per week before overtime kicks in (e.g., 40) */
  weeklyThreshold: number;

  /** Overtime pay multiplier (e.g., 1.5 for time-and-a-half) */
  overtimeRate: number;

  /** Double-time pay multiplier (e.g., 2.0) */
  doubleTimeRate?: number;

  /** Hours per day before double-time kicks in (e.g., 12) */
  doubleTimeThreshold?: number;
}

/**
 * Default overtime settings following US labor standards.
 */
export const DEFAULT_OVERTIME_SETTINGS: OvertimeSettings = {
  calculationType: 'weekly',
  dailyThreshold: 8,
  weeklyThreshold: 40,
  overtimeRate: 1.5,
  doubleTimeRate: 2.0,
  doubleTimeThreshold: 12,
};

// ============================================
// TIMESHEET ENTRY
// ============================================

/**
 * A single timesheet entry representing one day of work for a staff member.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface TimesheetEntry extends BaseSyncableEntity {
  /** Staff member ID this entry belongs to */
  staffId: string;

  /** Date of this entry (YYYY-MM-DD format) */
  date: string;

  // ---- Scheduled Shift ----

  /** Scheduled start time (ISO timestamp) */
  scheduledStart: string;

  /** Scheduled end time (ISO timestamp) */
  scheduledEnd: string;

  // ---- Actual Times ----

  /** Actual clock in time (ISO timestamp). Null if not clocked in */
  actualClockIn: string | null;

  /** Actual clock out time (ISO timestamp). Null if not clocked out */
  actualClockOut: string | null;

  // ---- Breaks ----

  /** List of breaks taken during this shift */
  breaks: BreakEntry[];

  // ---- Calculated Hours ----

  /** Breakdown of hours for this entry */
  hours: HoursBreakdown;

  // ---- Approval Workflow ----

  /** Current status in approval workflow */
  status: TimesheetStatus;

  /** User ID who approved this entry */
  approvedBy?: string;

  /** ISO timestamp when approved */
  approvedAt?: string;

  /** Reason for dispute (if status is 'disputed') */
  disputeReason?: string;

  /** Additional notes about this entry */
  notes?: string;

  // ---- Location Verification (Optional) ----

  /** GPS coordinates when clocked in */
  clockInLocation?: {
    lat: number;
    lng: number;
  };

  /** GPS coordinates when clocked out */
  clockOutLocation?: {
    lat: number;
    lng: number;
  };
}

// ============================================
// ATTENDANCE ALERTS
// ============================================

/**
 * An attendance alert for managers to review.
 * Generated automatically based on schedule vs actual times.
 */
export interface AttendanceAlert {
  /** Unique identifier for this alert */
  id: string;

  /** Staff member this alert is about */
  staffId: string;

  /** Staff member's display name (for quick reference) */
  staffName: string;

  /** Type of attendance issue */
  type: AttendanceAlertType;

  /** When the alert was generated (ISO timestamp) */
  timestamp: string;

  /** Human-readable alert message */
  message: string;

  /** Reference to the related timesheet entry */
  timesheetEntryId?: string;

  /** Date the alert relates to (YYYY-MM-DD) */
  date: string;

  /** Whether this alert has been resolved/acknowledged */
  resolved: boolean;

  /** User ID who resolved the alert */
  resolvedBy?: string;

  /** When the alert was resolved (ISO timestamp) */
  resolvedAt?: string;

  /** Note added when resolving */
  resolutionNote?: string;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Parameters for creating a new timesheet entry.
 */
export interface CreateTimesheetParams {
  staffId: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
}

/**
 * Parameters for clocking in.
 */
export interface ClockInParams {
  staffId: string;
  timestamp?: string;  // Defaults to now
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Parameters for clocking out.
 */
export interface ClockOutParams {
  staffId: string;
  timestamp?: string;  // Defaults to now
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Parameters for starting a break.
 */
export interface StartBreakParams {
  staffId: string;
  breakType: BreakType;
  label?: string;
  timestamp?: string;  // Defaults to now
}

/**
 * Parameters for ending a break.
 */
export interface EndBreakParams {
  staffId: string;
  timestamp?: string;  // Defaults to now
}

/**
 * Result of overtime calculation.
 */
export interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
}

// ============================================
// TIMESHEET SUMMARY
// ============================================

/**
 * Summary of timesheets for a period (used in dashboards/reports).
 */
export interface TimesheetSummary {
  staffId: string;
  staffName: string;
  periodStart: string;
  periodEnd: string;

  /** Total scheduled hours for the period */
  totalScheduledHours: number;

  /** Total actual hours worked */
  totalActualHours: number;

  /** Total regular hours */
  totalRegularHours: number;

  /** Total overtime hours */
  totalOvertimeHours: number;

  /** Total break minutes */
  totalBreakMinutes: number;

  /** Variance from schedule (actual - scheduled) */
  variance: number;

  /** Number of entries pending approval */
  pendingCount: number;

  /** Number of approved entries */
  approvedCount: number;

  /** Number of disputed entries */
  disputedCount: number;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Creates default hours breakdown with all zeros.
 */
export function createEmptyHoursBreakdown(): HoursBreakdown {
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

/**
 * Creates alert message based on alert type.
 */
export function createAlertMessage(
  type: AttendanceAlertType,
  staffName: string,
  details?: { minutes?: number }
): string {
  switch (type) {
    case 'late_arrival':
      return `${staffName} clocked in ${details?.minutes || 0} minutes late`;
    case 'early_departure':
      return `${staffName} clocked out ${details?.minutes || 0} minutes early`;
    case 'missed_clock_in':
      return `${staffName} has not clocked in for their scheduled shift`;
    case 'extended_break':
      return `${staffName}'s break exceeded scheduled time by ${details?.minutes || 0} minutes`;
    case 'no_show':
      return `${staffName} did not show up for their scheduled shift`;
    default:
      return `Attendance alert for ${staffName}`;
  }
}
