import { BaseSyncableEntity } from '../common';

/**
 * StaffSchedule defines the working pattern for a staff member.
 * Supports 1-4 week rotating patterns.
 */
export interface StaffSchedule extends BaseSyncableEntity {
  // === STAFF REFERENCE ===
  staffId: string;
  staffName: string;

  // === PATTERN CONFIGURATION ===
  /** Type of schedule pattern */
  patternType: SchedulePatternType;
  /** Number of weeks in the pattern (1-4) */
  patternWeeks: number;

  // === WEEK DEFINITIONS ===
  /** Array of week schedules, length = patternWeeks */
  weeks: WeekSchedule[];

  // === EFFECTIVE DATES ===
  /** When this schedule becomes active: "2025-01-01" */
  effectiveFrom: string;
  /** When this schedule ends (null = ongoing) */
  effectiveUntil: string | null;

  // === SOURCE ===
  /** Whether this is the initial default schedule */
  isDefault: boolean;
  /** If copied from another schedule */
  copiedFromScheduleId: string | null;
}

export type SchedulePatternType =
  | 'fixed'     // Same every week
  | 'rotating'; // Rotates over patternWeeks

export interface WeekSchedule {
  /** Week number in the pattern (1-4) */
  weekNumber: number;
  /** 7 days (index 0 = Sunday, 6 = Saturday) */
  days: DayScheduleConfig[];
}

export interface DayScheduleConfig {
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: number;
  /** Whether staff works this day */
  isWorking: boolean;
  /** Shifts for this day (supports split shifts) */
  shifts: ShiftConfig[];
}

export interface ShiftConfig {
  /** Start time: "09:00" */
  startTime: string;
  /** End time: "17:00" */
  endTime: string;
  /** Type of shift */
  type: 'regular' | 'overtime';
  /** Optional notes for this shift */
  notes: string | null;
}

export interface CreateStaffScheduleInput {
  staffId: string;
  staffName: string;
  patternType: SchedulePatternType;
  patternWeeks: number;
  weeks: WeekSchedule[];
  effectiveFrom: string;
  effectiveUntil?: string | null;
}
