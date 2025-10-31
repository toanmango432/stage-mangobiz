/**
 * Conflict Detection Utilities
 * Detect scheduling conflicts for appointments
 */

import { LocalAppointment } from '../types/appointment';

export interface ConflictInfo {
  type: 'double-booking' | 'client-conflict' | 'buffer-violation' | 'business-hours' | 'staff-unavailable';
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Detect conflicts for a new or updated appointment
 * @param appointment The appointment to check
 * @param existingAppointments All other appointments (excluding the one being checked)
 * @returns Array of conflict messages
 */
export function detectAppointmentConflicts(
  appointment: LocalAppointment,
  existingAppointments: LocalAppointment[]
): string[] {
  const conflicts: string[] = [];

  // Check against all existing appointments
  existingAppointments.forEach((existing) => {
    // 1. Double-booking: Same staff, overlapping time
    if (
      appointment.staffId === existing.staffId &&
      timeRangesOverlap(
        new Date(appointment.scheduledStartTime),
        new Date(appointment.scheduledEndTime),
        new Date(existing.scheduledStartTime),
        new Date(existing.scheduledEndTime)
      )
    ) {
      conflicts.push(
        `Double-booking: ${existing.clientName} already has an appointment with this staff at ${formatTime(existing.scheduledStartTime)}`
      );
    }

    // 2. Client conflict: Same client, overlapping time
    if (
      appointment.clientId === existing.clientId &&
      appointment.id !== existing.id &&
      timeRangesOverlap(
        new Date(appointment.scheduledStartTime),
        new Date(appointment.scheduledEndTime),
        new Date(existing.scheduledStartTime),
        new Date(existing.scheduledEndTime)
      )
    ) {
      conflicts.push(
        `Client conflict: ${existing.clientName} already has another appointment at ${formatTime(existing.scheduledStartTime)}`
      );
    }

    // 3. Buffer time violation: Same staff, appointments too close together
    const BUFFER_MINUTES = 10; // Default buffer time
    
    if (appointment.staffId === existing.staffId) {
      const gapBefore = Math.abs(
        (new Date(appointment.scheduledStartTime).getTime() - 
         new Date(existing.scheduledEndTime).getTime()) / 60000
      );
      
      const gapAfter = Math.abs(
        (new Date(existing.scheduledStartTime).getTime() - 
         new Date(appointment.scheduledEndTime).getTime()) / 60000
      );

      const minGap = Math.min(gapBefore, gapAfter);
      
      if (minGap < BUFFER_MINUTES && minGap > 0) {
        conflicts.push(
          `Buffer time violation: Appointments are only ${Math.round(minGap)} minutes apart (minimum ${BUFFER_MINUTES} minutes required)`
        );
      }
    }
  });

  // 4. Business hours check (8am - 8pm default)
  const startHour = new Date(appointment.scheduledStartTime).getHours();
  const endHour = new Date(appointment.scheduledEndTime).getHours();
  const endMinutes = new Date(appointment.scheduledEndTime).getMinutes();
  
  if (startHour < 8 || (endHour > 20 || (endHour === 20 && endMinutes > 0))) {
    conflicts.push(
      `Business hours violation: Appointment is outside business hours (8:00 AM - 8:00 PM)`
    );
  }

  // 5. Staff availability check (simplified - would check staff schedule in real implementation)
  // This would integrate with staff availability management

  return conflicts;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if staff is available at given time
 * @param staffId Staff ID
 * @param startTime Start time
 * @param endTime End time
 * @param existingAppointments All appointments
 * @returns true if available, false if not
 */
export function isStaffAvailable(
  staffId: string,
  startTime: Date,
  endTime: Date,
  existingAppointments: LocalAppointment[]
): boolean {
  // Filter out cancelled/no-show appointments
  const activeAppointments = existingAppointments.filter(
    apt => apt.staffId === staffId && 
           apt.status !== 'cancelled' && 
           apt.status !== 'no-show'
  );

  // Check for overlaps
  return !activeAppointments.some(apt =>
    timeRangesOverlap(
      startTime,
      endTime,
      new Date(apt.scheduledStartTime),
      new Date(apt.scheduledEndTime)
    )
  );
}

/**
 * Find available staff for a time slot
 * @param startTime Start time
 * @param endTime End time
 * @param allStaffIds All staff IDs to check
 * @param existingAppointments All appointments
 * @returns Array of available staff IDs
 */
export function findAvailableStaff(
  startTime: Date,
  endTime: Date,
  allStaffIds: string[],
  existingAppointments: LocalAppointment[]
): string[] {
  return allStaffIds.filter(staffId =>
    isStaffAvailable(staffId, startTime, endTime, existingAppointments)
  );
}

