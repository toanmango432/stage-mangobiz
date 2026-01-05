/**
 * useTimeSlotAvailability Hook
 * Calculates and provides time slot availability data
 */

import { useMemo } from 'react';
import { useAppSelector } from './redux';
import { selectAllStaff } from '../store/slices/staffSlice';
import { selectAppointmentsForDate } from '../store/slices/appointmentsSlice';
import { calculateDayAvailability, TimeSlotAvailability } from '../utils/availabilityCalculator';
import { DEFAULT_BUSINESS_HOURS } from '../constants/appointment';

/**
 * Hook to get availability data for all time slots on a given date
 */
export function useTimeSlotAvailability(date: Date): Map<string, TimeSlotAvailability> {
  // Get all staff
  const allStaff = useAppSelector(selectAllStaff) || [];

  // Get appointments for this date
  const appointments = useAppSelector((state) =>
    selectAppointmentsForDate(state, date)
  );

  // Calculate availability for all time slots
  const availabilityMap = useMemo(() => {
    if (!allStaff.length) {
      return new Map();
    }

    return calculateDayAvailability(
      date,
      allStaff,
      appointments,
      {
        start: DEFAULT_BUSINESS_HOURS.START_HOUR,
        end: DEFAULT_BUSINESS_HOURS.END_HOUR,
      }
    );
  }, [date, allStaff, appointments]);

  return availabilityMap;
}

/**
 * Hook to get availability for a specific time slot
 */
export function useSpecificTimeSlotAvailability(
  timeSlot: Date
): TimeSlotAvailability | undefined {
  const date = new Date(timeSlot);
  date.setHours(0, 0, 0, 0);

  const availabilityMap = useTimeSlotAvailability(date);
  return availabilityMap.get(timeSlot.toISOString());
}
