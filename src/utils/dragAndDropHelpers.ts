/**
 * Drag and Drop Helpers
 * Utilities for enhanced drag & drop with snap-to-grid
 */

import { LocalAppointment } from '../types/appointment';
import type { StaffSchedule } from '../types/schedule/staffSchedule';
import { getScheduleForDate } from './scheduleUtils';

/**
 * Snap time to 15-minute intervals
 */
export function snapToGrid(date: Date): Date {
  const snapped = new Date(date);
  const minutes = snapped.getMinutes();
  const snappedMinutes = Math.round(minutes / 15) * 15;
  snapped.setMinutes(snappedMinutes, 0, 0);
  return snapped;
}

/**
 * Calculate time from mouse Y position in calendar grid
 */
export function calculateTimeFromPosition(
  y: number,
  gridHeight: number,
  headerHeight: number
): Date {
  // Account for header height
  const relativeY = y - headerHeight;
  
  // Calculate time based on position
  // Grid represents 24 hours = 1440 minutes
  const totalMinutes = Math.round((relativeY / gridHeight) * 1440);
  
  // Snap to 15-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 15) * 15;
  
  // Create date with snapped time
  const now = new Date();
  const hours = Math.floor(snappedMinutes / 60);
  const minutes = snappedMinutes % 60;
  
  const result = new Date(now);
  result.setHours(hours, minutes, 0, 0);
  
  return snapToGrid(result);
}

/**
 * Calculate appointment end time based on start time and duration
 */
export function calculateEndTime(startTime: Date, durationMinutes: number): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
}

/**
 * Check if a drag position would cause a conflict
 */
export function checkDragConflict(
  appointment: LocalAppointment,
  newStaffId: string,
  newStartTime: Date,
  existingAppointments: LocalAppointment[]
): { hasConflict: boolean; conflictType?: string; message?: string } {
  // Calculate new end time
  const duration = Math.round(
    (new Date(appointment.scheduledEndTime).getTime() - 
     new Date(appointment.scheduledStartTime).getTime()) / 60000
  );
  const newEndTime = calculateEndTime(newStartTime, duration);

  // Check against all other appointments
  for (const existing of existingAppointments) {
    // Skip the appointment being moved
    if (existing.id === appointment.id) continue;

    // Check double-booking
    if (existing.staffId === newStaffId) {
      const existingStart = new Date(existing.scheduledStartTime);
      const existingEnd = new Date(existing.scheduledEndTime);
      
      // Check overlap
      if (newStartTime < existingEnd && existingStart < newEndTime) {
        return {
          hasConflict: true,
          conflictType: 'double-booking',
          message: `Would conflict with ${existing.clientName}'s appointment`
        };
      }

      // Check buffer time (10 minutes minimum)
      const BUFFER_MINUTES = 10;
      const gapBefore = Math.abs(
        (newStartTime.getTime() - existingEnd.getTime()) / 60000
      );
      const gapAfter = Math.abs(
        (existingStart.getTime() - newEndTime.getTime()) / 60000
      );

      if (gapBefore < BUFFER_MINUTES && gapBefore > 0) {
        return {
          hasConflict: true,
          conflictType: 'buffer-violation',
          message: `Only ${Math.round(gapBefore)} min gap before ${existing.clientName}'s appointment`
        };
      }

      if (gapAfter < BUFFER_MINUTES && gapAfter > 0) {
        return {
          hasConflict: true,
          conflictType: 'buffer-violation',
          message: `Only ${Math.round(gapAfter)} min gap after ${existing.clientName}'s appointment`
        };
      }
    }

    // Check client conflict
    if (existing.clientId === appointment.clientId && existing.id !== appointment.id) {
      const existingStart = new Date(existing.scheduledStartTime);
      const existingEnd = new Date(existing.scheduledEndTime);
      
      if (newStartTime < existingEnd && existingStart < newEndTime) {
        return {
          hasConflict: true,
          conflictType: 'client-conflict',
          message: `${appointment.clientName} has another appointment at this time`
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Get conflict indicator color
 */
export function getConflictColor(conflictType?: string): string {
  switch (conflictType) {
    case 'double-booking':
      return 'bg-red-200 border-red-400';
    case 'buffer-violation':
      return 'bg-yellow-200 border-yellow-400';
    case 'client-conflict':
      return 'bg-orange-200 border-orange-400';
    case 'outside-hours':
      return 'bg-gray-200 border-gray-400';
    default:
      return 'bg-teal-100 border-teal-400';
  }
}

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if an appointment time falls within staff working hours.
 * Returns true if the appointment is valid, false if outside working hours.
 */
export function checkWithinWorkingHours(
  schedule: StaffSchedule | null | undefined,
  appointmentDate: string,  // 'YYYY-MM-DD'
  startTime: Date,
  endTime: Date
): { isValid: boolean; message?: string } {
  if (!schedule) {
    // No schedule found - allow booking (staff hasn't set up schedule yet)
    return { isValid: true };
  }

  const dayConfig = getScheduleForDate(schedule, appointmentDate);

  if (!dayConfig || !dayConfig.isWorking) {
    return {
      isValid: false,
      message: `${schedule.staffName} is not scheduled to work on this day`,
    };
  }

  // Get appointment start/end in minutes from midnight
  const appointmentStartMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const appointmentEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

  // Check if appointment falls within any of the staff's shifts
  const workingShifts = dayConfig.shifts.filter(
    s => s.type === 'regular' || s.type === 'overtime'
  );

  if (workingShifts.length === 0) {
    return {
      isValid: false,
      message: `${schedule.staffName} has no shifts scheduled for this day`,
    };
  }

  // Check if appointment fits within any shift
  for (const shift of workingShifts) {
    const shiftStartMinutes = timeToMinutes(shift.startTime);
    const shiftEndMinutes = timeToMinutes(shift.endTime);

    // Appointment must start and end within the shift
    if (
      appointmentStartMinutes >= shiftStartMinutes &&
      appointmentEndMinutes <= shiftEndMinutes
    ) {
      return { isValid: true };
    }
  }

  // Appointment doesn't fit any shift - provide helpful message
  const shiftTimes = workingShifts
    .map(s => `${s.startTime}-${s.endTime}`)
    .join(', ');

  return {
    isValid: false,
    message: `Appointment falls outside ${schedule.staffName}'s working hours (${shiftTimes})`,
  };
}

/**
 * Enhanced conflict check that includes working hours validation.
 * Use this when you have access to the staff schedule.
 */
export function checkDragConflictWithSchedule(
  appointment: LocalAppointment,
  newStaffId: string,
  newStartTime: Date,
  existingAppointments: LocalAppointment[],
  staffSchedule?: StaffSchedule | null
): { hasConflict: boolean; conflictType?: string; message?: string } {
  // First check working hours if schedule is available
  if (staffSchedule && staffSchedule.staffId === newStaffId) {
    const duration = Math.round(
      (new Date(appointment.scheduledEndTime).getTime() -
        new Date(appointment.scheduledStartTime).getTime()) / 60000
    );
    const newEndTime = calculateEndTime(newStartTime, duration);
    const dateStr = newStartTime.toISOString().split('T')[0];

    const hoursCheck = checkWithinWorkingHours(
      staffSchedule,
      dateStr,
      newStartTime,
      newEndTime
    );

    if (!hoursCheck.isValid) {
      return {
        hasConflict: true,
        conflictType: 'outside-hours',
        message: hoursCheck.message,
      };
    }
  }

  // Then check regular conflicts
  return checkDragConflict(appointment, newStaffId, newStartTime, existingAppointments);
}

