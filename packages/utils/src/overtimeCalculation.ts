/**
 * Overtime Calculation Utility
 *
 * Calculates regular, overtime, and double-time hours based on configurable settings.
 * Supports daily, weekly, or combined calculation types.
 *
 * @see docs/product/PRD-Team-Module.md Section 6.4.4
 * @see tasks/PHASE2-TIME-ATTENDANCE-BREAKDOWN.md
 */

import type {
  OvertimeSettings,
  OvertimeResult,
  TimesheetEntry,
  HoursBreakdown,
} from '@mango/types';
import { DEFAULT_OVERTIME_SETTINGS } from '@mango/types';

// ============================================
// TYPES
// ============================================

/**
 * Daily hours summary for a single day
 */
interface DailyHours {
  date: string;
  actualHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
}

/**
 * Weekly summary with day-by-day breakdown
 */
interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalDoubleTimeHours: number;
  dailyBreakdown: DailyHours[];
}

// ============================================
// DAILY OVERTIME CALCULATION
// ============================================

/**
 * Calculate overtime for a single day based on daily thresholds.
 *
 * Example with 8hr daily threshold and 12hr double-time threshold:
 * - 6 hours worked → 6 regular, 0 OT, 0 DT
 * - 10 hours worked → 8 regular, 2 OT, 0 DT
 * - 14 hours worked → 8 regular, 4 OT, 2 DT
 */
export function calculateDailyOvertime(
  actualHours: number,
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): OvertimeResult {
  const { dailyThreshold, doubleTimeThreshold } = settings;

  if (actualHours <= 0) {
    return { regularHours: 0, overtimeHours: 0, doubleTimeHours: 0 };
  }

  let regularHours = 0;
  let overtimeHours = 0;
  let doubleTimeHours = 0;

  // Regular hours (up to daily threshold)
  regularHours = Math.min(actualHours, dailyThreshold);

  // Overtime hours (between daily threshold and double-time threshold)
  if (actualHours > dailyThreshold) {
    const hoursOverRegular = actualHours - dailyThreshold;

    if (doubleTimeThreshold && actualHours > doubleTimeThreshold) {
      overtimeHours = doubleTimeThreshold - dailyThreshold;
      doubleTimeHours = actualHours - doubleTimeThreshold;
    } else {
      overtimeHours = hoursOverRegular;
    }
  }

  return {
    regularHours: roundToTwoDecimals(regularHours),
    overtimeHours: roundToTwoDecimals(overtimeHours),
    doubleTimeHours: roundToTwoDecimals(doubleTimeHours),
  };
}

// ============================================
// WEEKLY OVERTIME CALCULATION
// ============================================

/**
 * Calculate overtime for a week based on weekly threshold.
 * All hours up to weekly threshold are regular, hours over are overtime.
 *
 * Example with 40hr weekly threshold:
 * - 35 hours in week → 35 regular, 0 OT
 * - 45 hours in week → 40 regular, 5 OT
 */
export function calculateWeeklyOvertime(
  totalWeeklyHours: number,
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): OvertimeResult {
  const { weeklyThreshold } = settings;

  if (totalWeeklyHours <= 0) {
    return { regularHours: 0, overtimeHours: 0, doubleTimeHours: 0 };
  }

  const regularHours = Math.min(totalWeeklyHours, weeklyThreshold);
  const overtimeHours = Math.max(0, totalWeeklyHours - weeklyThreshold);

  return {
    regularHours: roundToTwoDecimals(regularHours),
    overtimeHours: roundToTwoDecimals(overtimeHours),
    doubleTimeHours: 0, // Weekly calculation doesn't typically have double-time
  };
}

// ============================================
// COMBINED CALCULATION (DAILY + WEEKLY)
// ============================================

/**
 * Calculate overtime using both daily and weekly rules.
 * Daily overtime is calculated first, then weekly threshold is applied
 * to remaining regular hours.
 *
 * This is the most conservative approach (favors the employee).
 */
export function calculateCombinedOvertime(
  dailyHoursArray: number[],
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): OvertimeResult {
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;
  let totalDoubleTimeHours = 0;

  // Step 1: Apply daily rules first
  for (const hours of dailyHoursArray) {
    const dailyResult = calculateDailyOvertime(hours, settings);
    totalRegularHours += dailyResult.regularHours;
    totalOvertimeHours += dailyResult.overtimeHours;
    totalDoubleTimeHours += dailyResult.doubleTimeHours;
  }

  // Step 2: Apply weekly threshold to regular hours
  const { weeklyThreshold } = settings;
  if (totalRegularHours > weeklyThreshold) {
    const extraOT = totalRegularHours - weeklyThreshold;
    totalRegularHours = weeklyThreshold;
    totalOvertimeHours += extraOT;
  }

  return {
    regularHours: roundToTwoDecimals(totalRegularHours),
    overtimeHours: roundToTwoDecimals(totalOvertimeHours),
    doubleTimeHours: roundToTwoDecimals(totalDoubleTimeHours),
  };
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate overtime based on settings calculation type.
 * Automatically selects the correct algorithm based on settings.
 *
 * @param hoursData - Either a single day's hours or an array of daily hours
 * @param settings - Overtime settings (defaults to US standard 40hr/week, 8hr/day)
 */
export function calculateOvertime(
  hoursData: number | number[],
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): OvertimeResult {
  const { calculationType } = settings;

  if (Array.isArray(hoursData)) {
    // Multi-day calculation
    switch (calculationType) {
      case 'daily':
        // Sum up daily overtime calculations
        return hoursData.reduce(
          (acc, hours) => {
            const result = calculateDailyOvertime(hours, settings);
            return {
              regularHours: acc.regularHours + result.regularHours,
              overtimeHours: acc.overtimeHours + result.overtimeHours,
              doubleTimeHours: acc.doubleTimeHours + result.doubleTimeHours,
            };
          },
          { regularHours: 0, overtimeHours: 0, doubleTimeHours: 0 }
        );

      case 'weekly':
        const totalHours = hoursData.reduce((sum, h) => sum + h, 0);
        return calculateWeeklyOvertime(totalHours, settings);

      case 'both':
        return calculateCombinedOvertime(hoursData, settings);

      default:
        return calculateWeeklyOvertime(
          hoursData.reduce((sum, h) => sum + h, 0),
          settings
        );
    }
  } else {
    // Single day calculation
    if (calculationType === 'daily' || calculationType === 'both') {
      return calculateDailyOvertime(hoursData, settings);
    }
    // For weekly-only, single day is just regular hours
    return {
      regularHours: roundToTwoDecimals(hoursData),
      overtimeHours: 0,
      doubleTimeHours: 0,
    };
  }
}

// ============================================
// TIMESHEET INTEGRATION
// ============================================

/**
 * Calculate overtime for a single timesheet entry.
 * Updates the hours breakdown with overtime calculations.
 */
export function calculateTimesheetOvertime(
  entry: TimesheetEntry,
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): HoursBreakdown {
  const { hours } = entry;
  const result = calculateDailyOvertime(hours.actualHours, settings);

  return {
    ...hours,
    regularHours: result.regularHours,
    overtimeHours: result.overtimeHours,
    doubleTimeHours: result.doubleTimeHours,
  };
}

/**
 * Calculate overtime for multiple timesheet entries (e.g., a week).
 * Returns updated hours breakdown for each entry.
 */
export function calculateTimesheetsOvertime(
  entries: TimesheetEntry[],
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): Map<string, HoursBreakdown> {
  const results = new Map<string, HoursBreakdown>();

  if (settings.calculationType === 'both') {
    // Combined calculation requires processing all at once
    const dailyHours = entries.map((e) => e.hours.actualHours);
    const combined = calculateCombinedOvertime(dailyHours, settings);

    // Distribute overtime proportionally across days
    const totalActual = dailyHours.reduce((sum, h) => sum + h, 0);

    entries.forEach((entry, i) => {
      const proportion = totalActual > 0 ? dailyHours[i] / totalActual : 0;

      results.set(entry.id, {
        ...entry.hours,
        regularHours: roundToTwoDecimals(combined.regularHours * proportion),
        overtimeHours: roundToTwoDecimals(combined.overtimeHours * proportion),
        doubleTimeHours: roundToTwoDecimals(combined.doubleTimeHours * proportion),
      });
    });
  } else if (settings.calculationType === 'weekly') {
    // Weekly calculation
    const totalHours = entries.reduce((sum, e) => sum + e.hours.actualHours, 0);
    const weeklyResult = calculateWeeklyOvertime(totalHours, settings);

    // Distribute overtime proportionally
    entries.forEach((entry) => {
      const proportion = totalHours > 0 ? entry.hours.actualHours / totalHours : 0;

      results.set(entry.id, {
        ...entry.hours,
        regularHours: roundToTwoDecimals(weeklyResult.regularHours * proportion),
        overtimeHours: roundToTwoDecimals(weeklyResult.overtimeHours * proportion),
        doubleTimeHours: 0,
      });
    });
  } else {
    // Daily calculation - process each individually
    entries.forEach((entry) => {
      results.set(entry.id, calculateTimesheetOvertime(entry, settings));
    });
  }

  return results;
}

// ============================================
// WEEKLY SUMMARY
// ============================================

/**
 * Generate a weekly summary from timesheet entries.
 */
export function generateWeeklySummary(
  entries: TimesheetEntry[],
  weekStart: string,
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): WeeklySummary {
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate week end (6 days after start)
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const weekEnd = endDate.toISOString().split('T')[0];

  // Calculate overtime for all entries
  const overtimeByEntry = calculateTimesheetsOvertime(sortedEntries, settings);

  // Build daily breakdown
  const dailyBreakdown: DailyHours[] = sortedEntries.map((entry) => {
    const hours = overtimeByEntry.get(entry.id) || entry.hours;
    return {
      date: entry.date,
      actualHours: entry.hours.actualHours,
      regularHours: hours.regularHours,
      overtimeHours: hours.overtimeHours,
      doubleTimeHours: hours.doubleTimeHours,
    };
  });

  // Calculate totals
  const totals = dailyBreakdown.reduce(
    (acc, day) => ({
      totalRegularHours: acc.totalRegularHours + day.regularHours,
      totalOvertimeHours: acc.totalOvertimeHours + day.overtimeHours,
      totalDoubleTimeHours: acc.totalDoubleTimeHours + day.doubleTimeHours,
    }),
    { totalRegularHours: 0, totalOvertimeHours: 0, totalDoubleTimeHours: 0 }
  );

  return {
    weekStart,
    weekEnd,
    ...totals,
    dailyBreakdown,
  };
}

// ============================================
// PAY CALCULATION HELPERS
// ============================================

/**
 * Calculate total pay based on hours and rates.
 */
export function calculatePay(
  result: OvertimeResult,
  hourlyRate: number,
  settings: OvertimeSettings = DEFAULT_OVERTIME_SETTINGS
): {
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  totalPay: number;
} {
  const { overtimeRate, doubleTimeRate = 2.0 } = settings;

  const regularPay = roundToTwoDecimals(result.regularHours * hourlyRate);
  const overtimePay = roundToTwoDecimals(
    result.overtimeHours * hourlyRate * overtimeRate
  );
  const doubleTimePay = roundToTwoDecimals(
    result.doubleTimeHours * hourlyRate * doubleTimeRate
  );

  return {
    regularPay,
    overtimePay,
    doubleTimePay,
    totalPay: roundToTwoDecimals(regularPay + overtimePay + doubleTimePay),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Round a number to two decimal places.
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Get the start of the week (Sunday) for a given date.
 */
export function getWeekStart(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

/**
 * Get the end of the week (Saturday) for a given date.
 */
export function getWeekEnd(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d.toISOString().split('T')[0];
}

/**
 * Check if two dates are in the same week.
 */
export function isSameWeek(date1: string | Date, date2: string | Date): boolean {
  return getWeekStart(date1) === getWeekStart(date2);
}

/**
 * Format hours for display (e.g., "8.5 hrs" or "8h 30m")
 */
export function formatHours(hours: number, format: 'decimal' | 'hm' = 'decimal'): string {
  if (format === 'hm') {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${roundToTwoDecimals(hours)} hrs`;
}

/**
 * Parse time string (HH:MM) to hours decimal.
 */
export function timeToHours(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

/**
 * Convert hours decimal to time string (HH:MM).
 */
export function hoursToTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
