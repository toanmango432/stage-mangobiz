import { BaseSyncableEntity } from '../common';

/**
 * BusinessClosedPeriod represents when the entire business or specific locations are closed.
 * Different from individual staff time-off.
 */
export interface BusinessClosedPeriod extends BaseSyncableEntity {
  // === IDENTITY ===
  /** Descriptive name: "Christmas Day", "Staff Training Day" */
  name: string;

  // === SCOPE ===
  /** If true, applies to all locations */
  appliesToAllLocations: boolean;
  /** Specific location IDs if not all */
  locationIds: string[];

  // === DATE RANGE ===
  startDate: string;
  endDate: string;

  // === PARTIAL DAY SUPPORT ===
  isPartialDay: boolean;
  /** Start time for partial day: "14:00" (close at 2pm) */
  startTime: string | null;
  /** End time for partial day */
  endTime: string | null;

  // === BOOKING BEHAVIOR ===
  blocksOnlineBooking: boolean;
  blocksInStoreBooking: boolean;

  // === DISPLAY ===
  color: string;
  notes: string | null;

  // === RECURRENCE ===
  /** If true, repeats on same dates each year */
  isAnnual: boolean;
}

export interface CreateBusinessClosedPeriodInput {
  name: string;
  appliesToAllLocations: boolean;
  locationIds?: string[];
  startDate: string;
  endDate: string;
  isPartialDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  blocksOnlineBooking?: boolean;
  blocksInStoreBooking?: boolean;
  color?: string;
  notes?: string | null;
  isAnnual?: boolean;
}
