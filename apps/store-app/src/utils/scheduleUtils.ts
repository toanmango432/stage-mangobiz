/**
 * Schedule Utilities for Multi-Week Pattern Support
 *
 * Provides utilities for:
 * - Calculating which week of a rotating pattern applies to a given date
 * - Converting between UI schedule types and database StaffSchedule types
 * - Time format conversions (12h ↔ 24h)
 */

import type {
  StaffSchedule,
  WeekSchedule,
  DayScheduleConfig,
  ShiftConfig,
  CreateStaffScheduleInput,
} from '../types/schedule/staffSchedule';

// ============================================================
// UI TYPES (from AddEditScheduleModal)
// ============================================================

export interface UITimeSlot {
  start: string;  // "9a", "5p", "12:30p"
  end: string;
  type?: 'normal' | 'extra' | 'off';
  reason?: string;
}

export interface UIDaySchedule {
  [day: string]: UITimeSlot[];  // "MON", "TUE", etc.
}

export interface UIScheduleData {
  id?: string;
  staffId: string;
  schedule: UIDaySchedule;
  repeatRules: {
    [day: string]: {
      type: 'weekly' | 'biweekly' | 'monthly' | 'none';
      startDate: string;
      endDate?: string;
      forever: boolean;
    };
  };
  notes: {
    [day: string]: string;
  };
}

// ============================================================
// WEEK NUMBER CALCULATION
// ============================================================

/**
 * Calculate which week of the pattern applies to a given date.
 *
 * @param anchorDate - The date when Week 1 starts (effectiveFrom)
 * @param targetDate - The date to check
 * @param patternWeeks - Number of weeks in the pattern (1-4)
 * @returns Week number (1-based: 1, 2, 3, or 4)
 *
 * @example
 * // If pattern started Jan 1, 2025 and has 2 weeks
 * getWeekNumberForDate('2025-01-01', '2025-01-08', 2) // Returns 2
 * getWeekNumberForDate('2025-01-01', '2025-01-15', 2) // Returns 1 (cycles back)
 */
export function getWeekNumberForDate(
  anchorDate: string,
  targetDate: string,
  patternWeeks: number
): number {
  const anchor = new Date(anchorDate + 'T00:00:00');
  const target = new Date(targetDate + 'T00:00:00');

  // Calculate days difference
  const diffTime = target.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Calculate weeks difference
  const weeksDiff = Math.floor(diffDays / 7);

  // Get week number in pattern (1-based)
  const weekNumber = (weeksDiff % patternWeeks) + 1;

  return weekNumber;
}

/**
 * Get the schedule for a specific date from a StaffSchedule.
 *
 * @param schedule - The staff schedule
 * @param targetDate - The date to get schedule for
 * @returns DayScheduleConfig for that date, or undefined if not found
 */
export function getScheduleForDate(
  schedule: StaffSchedule,
  targetDate: string
): DayScheduleConfig | undefined {
  const targetDateObj = new Date(targetDate + 'T00:00:00');
  const dayOfWeek = targetDateObj.getDay(); // 0 = Sunday

  // For fixed patterns, always use week 1
  // Use patternAnchorDate for week calculation (falls back to effectiveFrom if not set)
  const anchorDate = schedule.patternAnchorDate || schedule.effectiveFrom;
  const weekNumber = schedule.patternType === 'fixed'
    ? 1
    : getWeekNumberForDate(anchorDate, targetDate, schedule.patternWeeks);

  const weekSchedule = schedule.weeks.find(w => w.weekNumber === weekNumber);
  if (!weekSchedule) return undefined;

  return weekSchedule.days.find(d => d.dayOfWeek === dayOfWeek);
}

/**
 * Check if a staff member is working on a specific date.
 */
export function isStaffWorkingOnDate(
  schedule: StaffSchedule,
  targetDate: string
): boolean {
  const dayConfig = getScheduleForDate(schedule, targetDate);
  return dayConfig?.isWorking ?? false;
}

/**
 * Get working hours for a staff member on a specific date.
 * Returns array of shift times.
 */
export function getWorkingHoursForDate(
  schedule: StaffSchedule,
  targetDate: string
): ShiftConfig[] {
  const dayConfig = getScheduleForDate(schedule, targetDate);
  if (!dayConfig?.isWorking) return [];
  return dayConfig.shifts.filter(s => s.type === 'regular' || s.type === 'overtime');
}

// ============================================================
// TIME FORMAT CONVERSION
// ============================================================

/**
 * Convert 12-hour format (UI) to 24-hour format (Database).
 *
 * @example
 * uiTimeToDbTime("9a") // "09:00"
 * uiTimeToDbTime("5p") // "17:00"
 * uiTimeToDbTime("12:30p") // "12:30"
 */
export function uiTimeToDbTime(uiTime: string): string {
  const time = uiTime.toLowerCase().trim();
  const isAM = time.includes('a');
  const isPM = time.includes('p');

  // Extract time parts
  const cleaned = time.replace(/[ap]/g, '');
  const parts = cleaned.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  // Convert to 24-hour
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convert 24-hour format (Database) to 12-hour format (UI).
 *
 * @example
 * dbTimeToUiTime("09:00") // "9a"
 * dbTimeToUiTime("17:00") // "5p"
 * dbTimeToUiTime("12:30") // "12:30p"
 */
export function dbTimeToUiTime(dbTime: string): string {
  const [hoursStr, minutesStr] = dbTime.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  const isPM = hours >= 12;
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const suffix = isPM ? 'p' : 'a';

  if (minutes === 0) {
    return `${hours}${suffix}`;
  }
  return `${hours}:${minutes.toString().padStart(2, '0')}${suffix}`;
}

// ============================================================
// TYPE ADAPTERS: UI ↔ Database
// ============================================================

export const DAY_KEY_TO_INDEX: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export const INDEX_TO_DAY_KEY: Record<number, string> = {
  0: 'SUN',
  1: 'MON',
  2: 'TUE',
  3: 'WED',
  4: 'THU',
  5: 'FRI',
  6: 'SAT',
};

/**
 * Convert UI schedule data to database StaffSchedule format.
 * This is for a single week - call multiple times for multi-week patterns.
 *
 * @param uiData - UI schedule data from AddEditScheduleModal
 * @param weekNumber - Which week this represents (1-4)
 * @returns WeekSchedule for the database
 */
export function uiScheduleToWeekSchedule(
  uiData: UIScheduleData,
  weekNumber = 1
): WeekSchedule {
  const days: DayScheduleConfig[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayKey = INDEX_TO_DAY_KEY[dayIndex];
    const uiSlots = uiData.schedule[dayKey] || [];

    // Filter out "off" type slots (breaks) for working calculation
    const workingSlots = uiSlots.filter(slot => slot.type !== 'off');
    const isWorking = workingSlots.length > 0 && workingSlots.some(s => s.start && s.end);

    const shifts: ShiftConfig[] = workingSlots
      .filter(slot => slot.start && slot.end)
      .map(slot => ({
        startTime: uiTimeToDbTime(slot.start),
        endTime: uiTimeToDbTime(slot.end),
        type: slot.type === 'extra' ? 'overtime' as const : 'regular' as const,
        notes: slot.reason || null,
      }));

    days.push({
      dayOfWeek: dayIndex,
      isWorking,
      shifts,
    });
  }

  return {
    weekNumber,
    days,
  };
}

/**
 * Convert database StaffSchedule to UI format for a specific week.
 *
 * @param schedule - Database StaffSchedule
 * @param weekNumber - Which week to extract (1-4)
 * @returns UI schedule data
 */
export function staffScheduleToUISchedule(
  schedule: StaffSchedule,
  weekNumber = 1
): UIScheduleData {
  const weekSchedule = schedule.weeks.find(w => w.weekNumber === weekNumber);

  const uiSchedule: UIDaySchedule = {};

  if (weekSchedule) {
    weekSchedule.days.forEach(day => {
      const dayKey = INDEX_TO_DAY_KEY[day.dayOfWeek];

      if (day.isWorking && day.shifts.length > 0) {
        uiSchedule[dayKey] = day.shifts.map(shift => ({
          start: dbTimeToUiTime(shift.startTime),
          end: dbTimeToUiTime(shift.endTime),
          type: shift.type === 'overtime' ? 'extra' as const : 'normal' as const,
          reason: shift.notes || undefined,
        }));
      } else {
        uiSchedule[dayKey] = [];
      }
    });
  }

  return {
    id: schedule.id,
    staffId: schedule.staffId,
    schedule: uiSchedule,
    repeatRules: {},
    notes: {},
  };
}

/**
 * Create a full StaffSchedule input from UI data for multiple weeks.
 *
 * @param staffId - Staff member ID
 * @param staffName - Staff member name
 * @param weekSchedules - Array of UI schedule data, one per week
 * @param effectiveFrom - When schedule starts
 * @param effectiveUntil - When schedule ends (optional)
 */
export function createStaffScheduleInput(
  staffId: string,
  staffName: string,
  weekSchedules: UIScheduleData[],
  effectiveFrom: string,
  effectiveUntil?: string | null
): CreateStaffScheduleInput {
  const patternWeeks = weekSchedules.length;
  const patternType = patternWeeks === 1 ? 'fixed' : 'rotating';

  const weeks: WeekSchedule[] = weekSchedules.map((uiData, index) =>
    uiScheduleToWeekSchedule(uiData, index + 1)
  );

  return {
    staffId,
    staffName,
    patternType,
    patternWeeks,
    weeks,
    effectiveFrom,
    effectiveUntil: effectiveUntil ?? null,
  };
}

// ============================================================
// EMPTY SCHEDULE HELPERS
// ============================================================

/**
 * Create an empty week schedule with all days off.
 */
export function createEmptyWeekSchedule(weekNumber: number): WeekSchedule {
  const days: DayScheduleConfig[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    days.push({
      dayOfWeek: dayIndex,
      isWorking: false,
      shifts: [],
    });
  }

  return {
    weekNumber,
    days,
  };
}

/**
 * Create a default week schedule with Mon-Fri 9-5.
 */
export function createDefaultWeekSchedule(weekNumber: number): WeekSchedule {
  const days: DayScheduleConfig[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const isWeekday = dayIndex >= 1 && dayIndex <= 5; // Mon-Fri

    days.push({
      dayOfWeek: dayIndex,
      isWorking: isWeekday,
      shifts: isWeekday
        ? [{ startTime: '09:00', endTime: '17:00', type: 'regular', notes: null }]
        : [],
    });
  }

  return {
    weekNumber,
    days,
  };
}

/**
 * Create empty UI schedule data.
 */
export function createEmptyUISchedule(staffId = ''): UIScheduleData {
  return {
    staffId,
    schedule: {},
    repeatRules: {},
    notes: {},
  };
}

/**
 * Copy a week schedule to create another week.
 */
export function copyWeekSchedule(
  source: WeekSchedule,
  newWeekNumber: number
): WeekSchedule {
  return {
    weekNumber: newWeekNumber,
    days: source.days.map(day => ({
      ...day,
      shifts: day.shifts.map(shift => ({ ...shift })),
    })),
  };
}
