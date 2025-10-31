/**
 * Drag and Drop Helpers
 * Utilities for enhanced drag & drop with snap-to-grid
 */

import { LocalAppointment } from '../types/appointment';

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
    default:
      return 'bg-teal-100 border-teal-400';
  }
}

