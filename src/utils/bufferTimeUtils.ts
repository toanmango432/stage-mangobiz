/**
 * Buffer Time Utilities
 * Calculate and visualize buffer times between appointments
 */

import { LocalAppointment } from '../types/appointment';

/**
 * Default buffer time in minutes
 */
export const DEFAULT_BUFFER_TIME = 10;

/**
 * Get buffer time for a service type (configurable per service)
 */
export function getBufferTimeForService(serviceName: string): number {
  // Service-specific buffer times
  const serviceBuffers: Record<string, number> = {
    'Pedicure': 15, // Longer service needs more buffer
    'Acrylic Full Set': 15,
    'Gel Manicure': 10,
    'Manicure': 10,
    'Haircut': 10,
    'Blow Dry': 5,
  };
  
  return serviceBuffers[serviceName] || DEFAULT_BUFFER_TIME;
}

/**
 * Calculate buffer time blocks for a staff member
 */
export function calculateBufferBlocks(
  appointments: LocalAppointment[],
  bufferMinutes: number = DEFAULT_BUFFER_TIME
): Array<{ startTime: Date; endTime: Date; type: 'before' | 'after' | 'gap' }> {
  const bufferBlocks: Array<{ startTime: Date; endTime: Date; type: 'before' | 'after' | 'gap' }> = [];
  
  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
  );
  
  sortedAppointments.forEach((apt, index) => {
    const aptStart = new Date(apt.scheduledStartTime);
    const aptEnd = new Date(apt.scheduledEndTime);
    
    // Get buffer time for this service
    const serviceBuffer = apt.services[0] 
      ? getBufferTimeForService(apt.services[0].serviceName)
      : bufferMinutes;
    
    // Buffer after appointment
    const bufferAfterEnd = new Date(aptEnd);
    bufferAfterEnd.setMinutes(bufferAfterEnd.getMinutes() + serviceBuffer);
    
    bufferBlocks.push({
      startTime: aptEnd,
      endTime: bufferAfterEnd,
      type: 'after',
    });
    
    // Check gap between appointments
    if (index < sortedAppointments.length - 1) {
      const nextApt = sortedAppointments[index + 1];
      const nextAptStart = new Date(nextApt.scheduledStartTime);
      
      const gapMinutes = (nextAptStart.getTime() - aptEnd.getTime()) / 60000;
      
      if (gapMinutes > 0 && gapMinutes < serviceBuffer * 2) {
        // Gap is smaller than double buffer - add gap buffer
        bufferBlocks.push({
          startTime: aptEnd,
          endTime: nextAptStart,
          type: 'gap',
        });
      }
    }
  });
  
  return bufferBlocks;
}

/**
 * Check if a time slot is within buffer time
 */
export function isInBufferTime(
  time: Date,
  appointments: LocalAppointment[],
  bufferMinutes: number = DEFAULT_BUFFER_TIME
): boolean {
  return appointments.some(apt => {
    const aptStart = new Date(apt.scheduledStartTime);
    const aptEnd = new Date(apt.scheduledEndTime);
    
    // Get buffer time for this service
    const serviceBuffer = apt.services[0] 
      ? getBufferTimeForService(apt.services[0].serviceName)
      : bufferMinutes;
    
    // Check if time is within buffer after appointment
    const bufferAfterEnd = new Date(aptEnd);
    bufferAfterEnd.setMinutes(bufferAfterEnd.getMinutes() + serviceBuffer);
    
    // Check if time is within buffer before next appointment
    const bufferBeforeStart = new Date(aptStart);
    bufferBeforeStart.setMinutes(bufferBeforeStart.getMinutes() - serviceBuffer);
    
    return (time >= aptEnd && time <= bufferAfterEnd) ||
           (time >= bufferBeforeStart && time <= aptStart);
  });
}

/**
 * Get buffer time style for rendering
 */
export function getBufferTimeStyle(type: 'before' | 'after' | 'gap'): string {
  const styles = {
    before: 'bg-yellow-100 border-yellow-200 border-dashed',
    after: 'bg-gray-100 border-gray-200 border-dashed',
    gap: 'bg-orange-100 border-orange-200 border-dashed',
  };
  
  return styles[type] || styles.after;
}

