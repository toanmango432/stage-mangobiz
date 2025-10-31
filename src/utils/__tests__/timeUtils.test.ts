import { describe, it, expect } from 'vitest';
import {
  timeToSeconds,
  secondsToTime,
  getStartTimeWithOffset,
  calculateAppointmentTop,
  calculateAppointmentHeight,
  getTimeSlotIndex,
  roundToQuarterHour,
  formatDateForAPI,
  formatTimeForAPI,
  parseAPIDate,
  combineDateAndTime,
  timeRangesOverlap,
  getTimeSlots,
  calculateDuration,
  addMinutes,
  formatTimeDisplay,
  formatDateDisplay,
  formatDurationDisplay,
  isWithinBusinessHours,
  isToday,
  isPast,
  startOfDay,
  endOfDay,
  formatPhoneNumber,
  cleanPhoneNumber,
  HEIGHT_PER_15MIN,
  WORKING_HOURS_OFFSET,
} from '../timeUtils';

describe('timeUtils', () => {
  // ============================================================================
  // TIME CALCULATIONS
  // ============================================================================

  describe('timeToSeconds', () => {
    it('should convert midnight to 0 seconds', () => {
      const date = new Date('2025-01-01T00:00:00');
      expect(timeToSeconds(date)).toBe(0);
    });

    it('should convert 9:30 AM to correct seconds', () => {
      const date = new Date('2025-01-01T09:30:00');
      expect(timeToSeconds(date)).toBe(9 * 3600 + 30 * 60); // 34200
    });

    it('should convert 11:59:59 PM to correct seconds', () => {
      const date = new Date('2025-01-01T23:59:59');
      expect(timeToSeconds(date)).toBe(23 * 3600 + 59 * 60 + 59); // 86399
    });
  });

  describe('secondsToTime', () => {
    it('should convert 0 seconds to 00:00', () => {
      expect(secondsToTime(0)).toBe('00:00');
    });

    it('should convert 34200 seconds to 09:30', () => {
      expect(secondsToTime(34200)).toBe('09:30');
    });

    it('should convert 86399 seconds to 23:59', () => {
      expect(secondsToTime(86399)).toBe('23:59');
    });
  });

  describe('getStartTimeWithOffset', () => {
    it('should subtract 2 hours (7200 seconds) from start time', () => {
      const startTime = 36000; // 10:00 AM
      expect(getStartTimeWithOffset(startTime)).toBe(28800); // 8:00 AM
    });

    it('should handle working hours offset correctly', () => {
      expect(getStartTimeWithOffset(WORKING_HOURS_OFFSET)).toBe(0);
    });
  });

  describe('calculateAppointmentTop', () => {
    it('should calculate correct top position', () => {
      const baseTop = 100;
      const distanceTime = 2; // 2 units
      const expected = baseTop + ((distanceTime * 900) * HEIGHT_PER_15MIN) / 900;
      expect(calculateAppointmentTop(baseTop, distanceTime)).toBe(expected);
    });

    it('should return baseTop when distanceTime is 0', () => {
      expect(calculateAppointmentTop(100, 0)).toBe(100);
    });
  });

  describe('calculateAppointmentHeight', () => {
    it('should calculate height for 15 minutes', () => {
      expect(calculateAppointmentHeight(15)).toBe(HEIGHT_PER_15MIN);
    });

    it('should calculate height for 30 minutes', () => {
      expect(calculateAppointmentHeight(30)).toBe(HEIGHT_PER_15MIN * 2);
    });

    it('should calculate height for 60 minutes', () => {
      expect(calculateAppointmentHeight(60)).toBe(HEIGHT_PER_15MIN * 4);
    });

    it('should calculate height for 90 minutes', () => {
      expect(calculateAppointmentHeight(90)).toBe(HEIGHT_PER_15MIN * 6);
    });
  });

  describe('getTimeSlotIndex', () => {
    it('should return 0 for midnight', () => {
      const date = new Date('2025-01-01T00:00:00');
      expect(getTimeSlotIndex(date)).toBe(0);
    });

    it('should return 4 for 1:00 AM', () => {
      const date = new Date('2025-01-01T01:00:00');
      expect(getTimeSlotIndex(date)).toBe(4);
    });

    it('should return 38 for 9:30 AM', () => {
      const date = new Date('2025-01-01T09:30:00');
      expect(getTimeSlotIndex(date)).toBe(38); // 9 * 4 + 2
    });
  });

  describe('roundToQuarterHour', () => {
    it('should round down to nearest 15 minutes', () => {
      const date = new Date('2025-01-01T09:37:00');
      const rounded = roundToQuarterHour(date, 'down');
      expect(rounded.getMinutes()).toBe(30);
    });

    it('should round up to nearest 15 minutes', () => {
      const date = new Date('2025-01-01T09:37:00');
      const rounded = roundToQuarterHour(date, 'up');
      expect(rounded.getMinutes()).toBe(45);
    });

    it('should round to nearest 15 minutes', () => {
      const date1 = new Date('2025-01-01T09:37:00');
      const rounded1 = roundToQuarterHour(date1, 'nearest');
      expect(rounded1.getMinutes()).toBe(30);

      const date2 = new Date('2025-01-01T09:38:00');
      const rounded2 = roundToQuarterHour(date2, 'nearest');
      expect(rounded2.getMinutes()).toBe(45);
    });

    it('should not change time already on 15-minute mark', () => {
      const date = new Date('2025-01-01T09:30:00');
      const rounded = roundToQuarterHour(date);
      expect(rounded.getMinutes()).toBe(30);
    });
  });

  // ============================================================================
  // DATE FORMATTING
  // ============================================================================

  describe('formatDateForAPI', () => {
    it('should format date as MM/dd/yyyy', () => {
      const date = new Date(2025, 0, 15); // Month is 0-indexed
      expect(formatDateForAPI(date)).toBe('01/15/2025');
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2025, 2, 5); // Month is 0-indexed
      expect(formatDateForAPI(date)).toBe('03/05/2025');
    });
  });

  describe('formatTimeForAPI', () => {
    it('should format time as HH:mm', () => {
      const date = new Date('2025-01-01T09:30:00');
      expect(formatTimeForAPI(date)).toBe('09:30');
    });

    it('should pad single digit hours and minutes', () => {
      const date = new Date('2025-01-01T03:05:00');
      expect(formatTimeForAPI(date)).toBe('03:05');
    });
  });

  describe('parseAPIDate', () => {
    it('should parse MM/dd/yyyy format', () => {
      const date = parseAPIDate('01/15/2025');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January = 0
      expect(date.getDate()).toBe(15);
    });
  });

  describe('combineDateAndTime', () => {
    it('should combine date and time strings', () => {
      const combined = combineDateAndTime('01/15/2025', '09:30');
      expect(combined.getFullYear()).toBe(2025);
      expect(combined.getMonth()).toBe(0);
      expect(combined.getDate()).toBe(15);
      expect(combined.getHours()).toBe(9);
      expect(combined.getMinutes()).toBe(30);
    });
  });

  // ============================================================================
  // TIME RANGE CALCULATIONS
  // ============================================================================

  describe('timeRangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      const start1 = new Date('2025-01-01T09:00:00');
      const end1 = new Date('2025-01-01T10:00:00');
      const start2 = new Date('2025-01-01T09:30:00');
      const end2 = new Date('2025-01-01T10:30:00');
      
      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect non-overlapping ranges', () => {
      const start1 = new Date('2025-01-01T09:00:00');
      const end1 = new Date('2025-01-01T10:00:00');
      const start2 = new Date('2025-01-01T10:00:00');
      const end2 = new Date('2025-01-01T11:00:00');
      
      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });
  });

  describe('getTimeSlots', () => {
    it('should generate 15-minute time slots', () => {
      const start = new Date('2025-01-01T09:00:00');
      const end = new Date('2025-01-01T10:00:00');
      const slots = getTimeSlots(start, end);
      
      expect(slots.length).toBe(4); // 9:00, 9:15, 9:30, 9:45
      expect(slots[0].getMinutes()).toBe(0);
      expect(slots[1].getMinutes()).toBe(15);
      expect(slots[2].getMinutes()).toBe(30);
      expect(slots[3].getMinutes()).toBe(45);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in minutes', () => {
      const start = new Date('2025-01-01T09:00:00');
      const end = new Date('2025-01-01T10:30:00');
      expect(calculateDuration(start, end)).toBe(90);
    });
  });

  describe('addMinutes', () => {
    it('should add minutes to date', () => {
      const date = new Date('2025-01-01T09:00:00');
      const result = addMinutes(date, 30);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(30);
    });

    it('should handle hour rollover', () => {
      const date = new Date('2025-01-01T09:45:00');
      const result = addMinutes(date, 30);
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(15);
    });
  });

  // ============================================================================
  // DISPLAY FORMATTING
  // ============================================================================

  describe('formatTimeDisplay', () => {
    it('should format time in 12-hour format with AM/PM', () => {
      const date = new Date('2025-01-01T09:30:00');
      expect(formatTimeDisplay(date)).toBe('9:30 AM');
    });

    it('should format PM time correctly', () => {
      const date = new Date('2025-01-01T14:30:00');
      expect(formatTimeDisplay(date)).toBe('2:30 PM');
    });

    it('should handle midnight', () => {
      const date = new Date('2025-01-01T00:00:00');
      expect(formatTimeDisplay(date)).toBe('12:00 AM');
    });

    it('should handle noon', () => {
      const date = new Date('2025-01-01T12:00:00');
      expect(formatTimeDisplay(date)).toBe('12:00 PM');
    });
  });

  describe('formatDurationDisplay', () => {
    it('should format minutes only', () => {
      expect(formatDurationDisplay(45)).toBe('45m');
    });

    it('should format hours only', () => {
      expect(formatDurationDisplay(60)).toBe('1h');
    });

    it('should format hours and minutes', () => {
      expect(formatDurationDisplay(90)).toBe('1h 30m');
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe('isWithinBusinessHours', () => {
    it('should return true for time within business hours', () => {
      const date = new Date('2025-01-01T10:00:00');
      expect(isWithinBusinessHours(date)).toBe(true);
    });

    it('should return false for time before business hours', () => {
      const date = new Date('2025-01-01T07:00:00');
      expect(isWithinBusinessHours(date)).toBe(false);
    });

    it('should return false for time after business hours', () => {
      const date = new Date('2025-01-01T21:00:00');
      expect(isWithinBusinessHours(date)).toBe(false);
    });
  });

  describe('startOfDay and endOfDay', () => {
    it('should get start of day', () => {
      const date = new Date('2025-01-15T14:30:45');
      const start = startOfDay(date);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should get end of day', () => {
      const date = new Date('2025-01-15T14:30:45');
      const end = endOfDay(date);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });
  });

  // ============================================================================
  // PHONE NUMBER FORMATTING
  // ============================================================================

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone number', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should format 11-digit phone number with country code', () => {
      expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567');
    });

    it('should handle already formatted numbers', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('should return original for non-standard format', () => {
      expect(formatPhoneNumber('123')).toBe('123');
    });
  });

  describe('cleanPhoneNumber', () => {
    it('should remove all formatting', () => {
      expect(cleanPhoneNumber('(555) 123-4567')).toBe('5551234567');
    });

    it('should handle already clean numbers', () => {
      expect(cleanPhoneNumber('5551234567')).toBe('5551234567');
    });
  });
});
