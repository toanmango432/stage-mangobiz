import { BaseSyncableEntity } from '../common';

/**
 * BlockedTimeEntry represents a specific blocked time slot on a staff calendar.
 * Can be one-time or recurring.
 */
export interface BlockedTimeEntry extends BaseSyncableEntity {
  // === STAFF REFERENCE ===
  staffId: string;
  staffName: string;

  // === TYPE REFERENCE (Denormalized) ===
  typeId: string;
  typeName: string;
  typeEmoji: string;
  typeColor: string;
  isPaid: boolean;

  // === TIMING ===
  /** Full datetime: "2025-12-25T12:00:00.000Z" */
  startDateTime: string;
  /** Full datetime: "2025-12-25T13:00:00.000Z" */
  endDateTime: string;
  /** Calculated duration in minutes */
  durationMinutes: number;

  // === RECURRENCE ===
  frequency: BlockedTimeFrequency;
  /** When recurring entries should stop */
  repeatEndDate: string | null;
  /** Alternative: stop after N occurrences */
  repeatCount: number | null;
  /** Links recurring entries in a series */
  seriesId: string | null;
  /** If this is a modified occurrence */
  isRecurrenceException: boolean;
  /** Original date if exception */
  originalDate: string | null;

  // === NOTES ===
  notes: string | null;

  // === CONTEXT ===
  /** If staff created for themselves */
  createdByStaffId: string | null;
  /** If manager created for staff */
  createdByManagerId: string | null;
}

export type BlockedTimeFrequency =
  | 'once'      // One-time block
  | 'daily'     // Every day
  | 'weekly'    // Same day each week
  | 'biweekly'  // Every 2 weeks
  | 'monthly';  // Same day each month

export interface CreateBlockedTimeEntryInput {
  staffId: string;
  staffName: string;
  typeId: string;
  startDateTime: string;
  endDateTime: string;
  frequency: BlockedTimeFrequency;
  repeatEndDate?: string | null;
  repeatCount?: number | null;
  notes?: string | null;
}
