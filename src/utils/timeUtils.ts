/**
 * Time Utility Functions
 * CRITICAL: These formulas are preserved EXACTLY from jQuery calendar
 * DO NOT MODIFY without testing against original system
 */

// ============================================================================
// CONSTANTS (From jQuery Calendar)
// ============================================================================

/** Height per 15-minute slot in pixels */
export const HEIGHT_PER_15MIN = 22;

/** Working hours window offset (±2 hours in seconds) */
export const WORKING_HOURS_OFFSET = 7200; // 2 hours * 3600 seconds

/** Seconds per 15-minute interval */
export const SECONDS_PER_15MIN = 900;

/** Minutes per hour */
export const MINUTES_PER_HOUR = 60;

/** Seconds per minute */
export const SECONDS_PER_MINUTE = 60;

/** Seconds per hour */
export const SECONDS_PER_HOUR = 3600;

// ============================================================================
// TIME CALCULATIONS (Preserve Exact jQuery Logic)
// ============================================================================

/**
 * Convert time to seconds since midnight
 * PRESERVED FROM: jQuery calendar time calculations
 * 
 * @param time Date object or time string
 * @returns Seconds since midnight
 */
export function timeToSeconds(time: Date | string): number {
  const date = typeof time === 'string' ? new Date(time) : time;
  return (
    date.getHours() * SECONDS_PER_HOUR +
    date.getMinutes() * SECONDS_PER_MINUTE +
    date.getSeconds()
  );
}

/**
 * Convert seconds to time string (HH:mm)
 * 
 * @param seconds Seconds since midnight
 * @returns Time string in HH:mm format
 */
export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get start time with working hours offset
 * PRESERVED FROM: jQuery calendar
 * Original: let StartTime = parseInt($('.item[data-employee-id="9999"]').first()
 *   .attr('data-start-second-time')) - 7200;
 * 
 * @param startSecondTime Start time in seconds
 * @returns Adjusted start time with -2 hour offset
 */
export function getStartTimeWithOffset(startSecondTime: number): number {
  return startSecondTime - WORKING_HOURS_OFFSET;
}

/**
 * Calculate appointment top position
 * PRESERVED FROM: jQuery calendar positioning formula
 * Original: let distanceMix = ((distanceTime * 900) * heightAptDefault) / 900;
 *           let newTop = newFuncTop(careThis) + distanceMix;
 * 
 * @param baseTop Base top position
 * @param distanceTime Time distance in some unit
 * @returns Calculated top position in pixels
 */
export function calculateAppointmentTop(
  baseTop: number,
  distanceTime: number
): number {
  const distanceMix = ((distanceTime * SECONDS_PER_15MIN) * HEIGHT_PER_15MIN) / SECONDS_PER_15MIN;
  return baseTop + distanceMix;
}

/**
 * Calculate duration-based height
 * Formula: 22px per 15 minutes
 * 
 * @param durationMinutes Duration in minutes
 * @returns Height in pixels
 */
export function calculateAppointmentHeight(durationMinutes: number): number {
  return (durationMinutes / 15) * HEIGHT_PER_15MIN;
}

/**
 * Calculate time slot index (0-based)
 * Each slot is 15 minutes
 * 
 * @param time Date object
 * @returns Slot index (0 = 00:00, 4 = 01:00, etc.)
 */
export function getTimeSlotIndex(time: Date): number {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return hours * 4 + Math.floor(minutes / 15);
}

/**
 * Round time to nearest 15-minute interval
 * 
 * @param time Date object
 * @param direction 'up' | 'down' | 'nearest'
 * @returns Rounded date
 */
export function roundToQuarterHour(
  time: Date,
  direction: 'up' | 'down' | 'nearest' = 'nearest'
): Date {
  const minutes = time.getMinutes();
  const remainder = minutes % 15;
  
  let roundedMinutes: number;
  if (direction === 'up') {
    roundedMinutes = remainder === 0 ? minutes : minutes + (15 - remainder);
  } else if (direction === 'down') {
    roundedMinutes = minutes - remainder;
  } else {
    // nearest
    roundedMinutes = remainder < 7.5 ? minutes - remainder : minutes + (15 - remainder);
  }

  const result = new Date(time);
  result.setMinutes(roundedMinutes, 0, 0);
  return result;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date to MM/dd/yyyy (API format)
 * 
 * @param date Date object
 * @returns Formatted date string
 */
export function formatDateForAPI(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format time to HH:mm (API format)
 * 
 * @param date Date object
 * @returns Formatted time string
 */
export function formatTimeForAPI(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse API date string (MM/dd/yyyy) to Date
 * 
 * @param dateString Date string in MM/dd/yyyy format
 * @returns Date object
 */
export function parseAPIDate(dateString: string): Date {
  const [month, day, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Combine date and time strings into Date object
 * 
 * @param dateString Date in MM/dd/yyyy format
 * @param timeString Time in HH:mm format
 * @returns Combined Date object
 */
export function combineDateAndTime(dateString: string, timeString: string): Date {
  const date = parseAPIDate(dateString);
  const [hours, minutes] = timeString.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// ============================================================================
// TIME RANGE CALCULATIONS
// ============================================================================

/**
 * Check if two time ranges overlap
 * 
 * @param start1 Start of first range
 * @param end1 End of first range
 * @param start2 Start of second range
 * @param end2 End of second range
 * @returns True if ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Get time slots for a day
 * @param startHour Starting hour (0-23)
 * @param endHour Ending hour (0-23)
 * @param intervalMinutes Interval between slots in minutes
 */
export function getTimeSlots(
  startHour: number = 8,
  endHour: number = 20,
  intervalMinutes: number = 15
): string[] {
  const slots: string[] = [];
  const start = new Date();
  start.setHours(startHour, 0, 0, 0);

  const end = new Date();
  end.setHours(endHour, 0, 0, 0);

  let current = new Date(start);

  while (current < end) {
    slots.push(formatTimeDisplay(current));
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

/**
 * Generate time slots with full metadata
 * @param startHour Starting hour (0-23)
 * @param endHour Ending hour (0-23)
 * @param intervalMinutes Interval between slots in minutes
 */
export interface TimeSlot {
  time: string;
  timeInSeconds: number;
  date: Date;
}

export function generateTimeSlots(
  startHour: number = 8,
  endHour: number = 20,
  intervalMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date();
  start.setHours(startHour, 0, 0, 0);

  const end = new Date();
  end.setHours(endHour, 0, 0, 0);

  let current = new Date(start);

  while (current < end) {
    slots.push({
      time: formatTimeDisplay(current),
      timeInSeconds: timeToSeconds(current),
      date: new Date(current),
    });
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

/**
 * Calculate 2-hour window around appointments
 * @param appointments Array of appointments
 * @returns Start and end time in seconds, or null if no appointments
 */
export function calculate2HourWindow(
  appointments: Array<{ scheduledStartTime: Date }>
): { startTime: number; endTime: number } | null {
  if (appointments.length === 0) {
    return null;
  }

  const times = appointments.map(apt => timeToSeconds(apt.scheduledStartTime));
  const firstTime = Math.min(...times);
  const lastTime = Math.max(...times);

  return {
    startTime: firstTime - 7200, // -2 hours
    endTime: lastTime + 7200,    // +2 hours
  };
}

/**
 * Calculate duration between two times in minutes
 * 
 * @param start Start time
 * @param end End time
 * @returns Duration in minutes
 */
export function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Add minutes to a date
 * 
 * @param date Base date
 * @param minutes Minutes to add
 * @returns New date with minutes added
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// ============================================================================
// DISPLAY FORMATTING
// ============================================================================

/**
 * Format time for display (12-hour format)
 * 
 * @param date Date object
 * @param includeAmPm Include AM/PM
 * @returns Formatted time string (e.g., "9:30 AM")
 */
export function formatTimeDisplay(date: Date, includeAmPm: boolean = true): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const minutesStr = minutes.toString().padStart(2, '0');
  
  return includeAmPm ? `${hours}:${minutesStr} ${ampm}` : `${hours}:${minutesStr}`;
}

/**
 * Format date for display
 * 
 * @param date Date object
 * @param format 'short' | 'medium' | 'long'
 * @returns Formatted date string
 */
export function formatDateDisplay(
  date: Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const options: Intl.DateTimeFormatOptions = 
    format === 'short' ? { month: 'numeric', day: 'numeric' } :
    format === 'medium' ? { month: 'short', day: 'numeric', year: 'numeric' } :
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format duration for display
 * 
 * @param minutes Duration in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatDurationDisplay(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if time is within business hours
 * 
 * @param time Time to check
 * @param businessStart Business start time (default 8:00)
 * @param businessEnd Business end time (default 20:00)
 * @returns True if within business hours
 */
export function isWithinBusinessHours(
  time: Date,
  businessStart: number = 8,
  businessEnd: number = 20
): boolean {
  const hours = time.getHours();
  return hours >= businessStart && hours < businessEnd;
}

/**
 * Check if date is today
 * 
 * @param date Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 * 
 * @param date Date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Get start of day
 * 
 * @param date Date object
 * @returns Date at 00:00:00
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 * 
 * @param date Date object
 * @returns Date at 23:59:59
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

// ============================================================================
// PHONE NUMBER FORMATTING (From jQuery Calendar)
// ============================================================================

/**
 * Format phone number for display
 * Preserves jQuery calendar phone formatting logic
 * 
 * @param phone Raw phone number
 * @returns Formatted phone (e.g., "(555) 123-4567")
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if not standard format
}

/**
 * Clean phone number (remove formatting)
 * 
 * @param phone Formatted phone number
 * @returns Digits only
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
