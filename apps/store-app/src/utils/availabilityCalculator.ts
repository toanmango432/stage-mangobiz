/**
 * Availability Calculator
 * Calculates staff availability for time slots
 */

import { LocalAppointment } from '../types/appointment';
import { Staff } from '../types';

export interface TimeSlotAvailability {
  timeSlot: Date;
  totalStaff: number;
  availableStaff: number;
  bookedStaff: number;
  availabilityPercent: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
  appointments: LocalAppointment[];
}

/**
 * Calculate availability for a specific time slot
 */
export function calculateTimeSlotAvailability(
  timeSlot: Date,
  allStaff: Staff[],
  appointments: LocalAppointment[],
  businessHours: { start: number; end: number }
): TimeSlotAvailability {
  const hour = timeSlot.getHours();

  // Check if outside business hours
  if (hour < businessHours.start || hour >= businessHours.end) {
    return {
      timeSlot,
      totalStaff: allStaff.length,
      availableStaff: 0,
      bookedStaff: 0,
      availabilityPercent: 0,
      color: 'gray',
      appointments: [],
    };
  }

  // Find appointments overlapping this time slot
  const overlappingAppointments = appointments.filter((apt) => {
    const start = new Date(apt.scheduledStartTime);
    const end = new Date(apt.scheduledEndTime);
    return timeSlot >= start && timeSlot < end;
  });

  // Count booked staff (unique staff IDs)
  const bookedStaffIds = new Set(overlappingAppointments.map((apt) => apt.staffId));
  const bookedCount = bookedStaffIds.size;
  const availableCount = allStaff.length - bookedCount;
  const availabilityPercent = (availableCount / allStaff.length) * 100;

  // Determine color based on availability
  let color: 'green' | 'yellow' | 'red';
  if (availabilityPercent >= 75) {
    color = 'green'; // 75%+ available
  } else if (availabilityPercent >= 25) {
    color = 'yellow'; // 25-75% available
  } else {
    color = 'red'; // Less than 25% available
  }

  return {
    timeSlot,
    totalStaff: allStaff.length,
    availableStaff: availableCount,
    bookedStaff: bookedCount,
    availabilityPercent,
    color,
    appointments: overlappingAppointments,
  };
}

/**
 * Calculate availability for entire day (15-minute intervals)
 */
export function calculateDayAvailability(
  date: Date,
  allStaff: Staff[],
  appointments: LocalAppointment[],
  businessHours: { start: number; end: number }
): Map<string, TimeSlotAvailability> {
  const availabilityMap = new Map<string, TimeSlotAvailability>();

  // Generate 15-minute time slots for full 24 hours
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeSlot = new Date(date);
      timeSlot.setHours(hour, minute, 0, 0);

      const key = timeSlot.toISOString();
      const availability = calculateTimeSlotAvailability(
        timeSlot,
        allStaff,
        appointments,
        businessHours
      );

      availabilityMap.set(key, availability);
    }
  }

  return availabilityMap;
}

/**
 * Get availability color class for UI
 */
export function getAvailabilityColorClass(availability: TimeSlotAvailability): string {
  switch (availability.color) {
    case 'green':
      return 'timeslot-available-high';
    case 'yellow':
      return 'timeslot-available-medium';
    case 'red':
      return 'timeslot-available-low';
    case 'gray':
      return 'timeslot-outside-hours';
    default:
      return '';
  }
}

/**
 * Format availability for tooltip
 */
export function formatAvailabilityTooltip(availability: TimeSlotAvailability): string {
  if (availability.color === 'gray') {
    return 'Outside business hours';
  }

  const percent = Math.round(availability.availabilityPercent);
  return `${availability.availableStaff}/${availability.totalStaff} staff available (${percent}%)`;
}
