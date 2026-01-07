// Time Utilities from POS - Proven calculations
// Integrated for Mango's booking system

import { format, parse, addMinutes, isBefore, isEqual, parseISO } from 'date-fns';

export class BookingTimeUtils {
  /**
   * Convert "9:00 AM" to Date object for today
   */
  static parseTime(timeStr: string): Date {
    return parse(timeStr, 'h:mm a', new Date());
  }

  /**
   * Convert Date to "9:00 AM" format
   */
  static formatTime(date: Date): string {
    return format(date, 'h:mm a');
  }

  /**
   * Calculate end time given start time and duration
   */
  static calculateEndTime(startTime: string, durationMinutes: number): string {
    const start = this.parseTime(startTime);
    const end = addMinutes(start, durationMinutes);
    return this.formatTime(end);
  }

  /**
   * Generate time slots between start and end time
   */
  static generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number = 30
  ): string[] {
    const slots: string[] = [];
    let current = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    while (isBefore(current, end) || isEqual(current, end)) {
      slots.push(this.formatTime(current));
      current = addMinutes(current, intervalMinutes);
    }

    return slots;
  }

  /**
   * Check if a time slot can fit a service duration
   */
  static canFitDuration(
    slotTime: string,
    durationMinutes: number,
    endTime: string
  ): boolean {
    const slot = this.parseTime(slotTime);
    const serviceEnd = addMinutes(slot, durationMinutes);
    const businessEnd = this.parseTime(endTime);

    return isBefore(serviceEnd, businessEnd) || isEqual(serviceEnd, businessEnd);
  }

  /**
   * Group time slots by time of day
   */
  static groupTimeSlots(slots: string[]): {
    morning: string[];
    afternoon: string[];
    evening: string[];
  } {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    slots.forEach(slot => {
      const time = this.parseTime(slot);
      const hour = time.getHours();

      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }

  /**
   * Format duration in minutes to readable string
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    }

    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
  }

  /**
   * Check if a date is in the past
   */
  static isPastDate(dateStr: string): boolean {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  }

  /**
   * Check if a time slot is in the past for today
   */
  static isPastTime(dateStr: string, timeStr: string): boolean {
    const date = parseISO(dateStr);
    const today = new Date();
    
    // If not today, not past
    if (format(date, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) {
      return false;
    }

    // Compare times
    const slotTime = this.parseTime(timeStr);
    const now = new Date();
    
    return isBefore(slotTime, now);
  }

  /**
   * Get next 7 days from today
   */
  static getNext7Days(): Date[] {
    const days: Date[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  }

  /**
   * Get day of week
   */
  static getDayOfWeek(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'EEEE');
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const day = dateObj.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Convert date to ISO string (YYYY-MM-DD)
   */
  static toISODate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Find best time slot (most availability)
   */
  static findBestTimeSlot(
    slots: Array<{ time: string; available: boolean; staffCount?: number }>
  ): string | null {
    let bestSlot = null;
    let maxStaff = 0;

    slots.forEach(slot => {
      if (slot.available && (slot.staffCount || 0) > maxStaff) {
        maxStaff = slot.staffCount || 0;
        bestSlot = slot.time;
      }
    });

    return bestSlot;
  }

  /**
   * Calculate total duration for multiple services
   */
  static calculateTotalDuration(services: Array<{ duration: number }>): number {
    return services.reduce((total, service) => total + service.duration, 0);
  }

  /**
   * Check if two time ranges overlap
   */
  static doTimesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const s1 = this.parseTime(start1);
    const e1 = this.parseTime(end1);
    const s2 = this.parseTime(start2);
    const e2 = this.parseTime(end2);

    return (s1 < e2 && e1 > s2);
  }
}
