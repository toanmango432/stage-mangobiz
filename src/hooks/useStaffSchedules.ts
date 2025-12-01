/**
 * useStaffSchedules Hook
 *
 * Provides reactive access to staff schedules from IndexedDB using Dexie live queries.
 * Handles multi-week rotating patterns by calculating the correct week based on date.
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { db } from '@/db/schema';
import { selectSalonId } from '@/store/slices/authSlice';
import {
  getWeekNumberForDate,
  staffScheduleToUISchedule,
  dbTimeToUiTime,
  INDEX_TO_DAY_KEY,
} from '@/utils/scheduleUtils';
import type { StaffSchedule } from '@/types/schedule/staffSchedule';

// UI format expected by ScheduleView and EmployeeRow
export interface UITimeSlot {
  start: string;
  end: string;
  type?: 'normal' | 'extra' | 'off';
  reason?: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface UIScheduleByDay {
  [day: string]: UITimeSlot[]; // "MON", "TUE", etc.
}

export interface UIScheduleByStaff {
  [staffId: string]: UIScheduleByDay;
}

/**
 * Get all staff schedules for the current store
 */
export function useAllStaffSchedules() {
  const storeId = useSelector(selectSalonId);

  const schedules = useLiveQuery(
    async () => {
      if (!storeId) return [];
      return db.staffSchedules
        .where('storeId')
        .equals(storeId)
        .filter(s => !s.isDeleted)
        .toArray();
    },
    [storeId],
    []
  );

  return schedules;
}

/**
 * Get current schedule for a specific staff member
 */
export function useStaffSchedule(staffId: string | undefined) {
  const schedule = useLiveQuery(
    async () => {
      if (!staffId) return undefined;
      const today = new Date().toISOString().split('T')[0];
      return db.staffSchedules
        .where('staffId')
        .equals(staffId)
        .filter(s =>
          !s.isDeleted &&
          s.effectiveFrom <= today &&
          (!s.effectiveUntil || s.effectiveUntil >= today)
        )
        .first();
    },
    [staffId],
    undefined
  );

  return schedule;
}

/**
 * Convert a StaffSchedule to UI format for a specific date.
 * This accounts for multi-week rotating patterns.
 */
export function convertScheduleForDate(
  schedule: StaffSchedule,
  targetDate: string
): UIScheduleByDay {
  // Determine which week applies
  const anchorDate = schedule.patternAnchorDate || schedule.effectiveFrom;
  const weekNumber = schedule.patternType === 'fixed'
    ? 1
    : getWeekNumberForDate(anchorDate, targetDate, schedule.patternWeeks);

  const uiData = staffScheduleToUISchedule(schedule, weekNumber);
  return uiData.schedule;
}

/**
 * Get UI-formatted schedules for all staff for a specific week start date.
 * This is the main hook for ScheduleView calendar integration.
 */
export function useStaffSchedulesForWeek(weekStartDate: string) {
  const storeId = useSelector(selectSalonId);

  const schedules = useLiveQuery(
    async () => {
      if (!storeId) return [];
      const today = new Date().toISOString().split('T')[0];
      return db.staffSchedules
        .where('storeId')
        .equals(storeId)
        .filter(s =>
          !s.isDeleted &&
          s.effectiveFrom <= today &&
          (!s.effectiveUntil || s.effectiveUntil >= today)
        )
        .toArray();
    },
    [storeId],
    []
  );

  // Convert all schedules to UI format for the given week
  const uiSchedules = useMemo(() => {
    const result: UIScheduleByStaff = {};

    for (const schedule of schedules) {
      result[schedule.staffId] = convertScheduleForDate(schedule, weekStartDate);
    }

    return result;
  }, [schedules, weekStartDate]);

  return {
    schedules,
    uiSchedules,
    isLoading: schedules === undefined,
  };
}

/**
 * Get working hours for a specific staff on a specific date.
 * Useful for the Book module appointment validation.
 */
export function useStaffWorkingHoursForDate(
  staffId: string | undefined,
  targetDate: string
) {
  const schedule = useStaffSchedule(staffId);

  const workingHours = useMemo(() => {
    if (!schedule || !staffId) {
      return {
        isWorking: false,
        shifts: [] as { start: string; end: string }[],
      };
    }

    // Get day of week for target date
    const targetDateObj = new Date(targetDate + 'T00:00:00');
    const dayOfWeek = targetDateObj.getDay();
    const dayKey = INDEX_TO_DAY_KEY[dayOfWeek];

    // Get correct week schedule
    const anchorDate = schedule.patternAnchorDate || schedule.effectiveFrom;
    const weekNumber = schedule.patternType === 'fixed'
      ? 1
      : getWeekNumberForDate(anchorDate, targetDate, schedule.patternWeeks);

    const weekSchedule = schedule.weeks.find(w => w.weekNumber === weekNumber);
    if (!weekSchedule) {
      return { isWorking: false, shifts: [] };
    }

    const dayConfig = weekSchedule.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!dayConfig || !dayConfig.isWorking) {
      return { isWorking: false, shifts: [] };
    }

    const shifts = dayConfig.shifts
      .filter(s => s.type === 'regular' || s.type === 'overtime')
      .map(s => ({
        start: dbTimeToUiTime(s.startTime),
        end: dbTimeToUiTime(s.endTime),
      }));

    return {
      isWorking: true,
      shifts,
      dayKey,
    };
  }, [schedule, staffId, targetDate]);

  return workingHours;
}

export default useStaffSchedulesForWeek;
