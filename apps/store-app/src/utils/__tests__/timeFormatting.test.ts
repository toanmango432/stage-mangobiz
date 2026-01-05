/**
 * Time Formatting Utilities Tests
 * Tests for time and date formatting functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTime,
  formatTime24,
  formatDate,
  formatHour,
  formatDuration,
  formatTimeRange,
  isToday,
  isPast,
  getRelativeTime,
} from '../timeFormatting';

describe('timeFormatting utilities', () => {
  describe('formatTime', () => {
    it('should format morning times correctly', () => {
      const date = new Date('2024-01-15T09:30:00');
      expect(formatTime(date)).toBe('9:30 AM');
    });

    it('should format afternoon times correctly', () => {
      const date = new Date('2024-01-15T14:45:00');
      expect(formatTime(date)).toBe('2:45 PM');
    });

    it('should format noon correctly', () => {
      const date = new Date('2024-01-15T12:00:00');
      expect(formatTime(date)).toBe('12:00 PM');
    });

    it('should format midnight correctly', () => {
      const date = new Date('2024-01-15T00:00:00');
      expect(formatTime(date)).toBe('12:00 AM');
    });

    it('should handle string input', () => {
      expect(formatTime('2024-01-15T15:30:00')).toBe('3:30 PM');
    });

    it('should pad minutes with zero', () => {
      const date = new Date('2024-01-15T09:05:00');
      expect(formatTime(date)).toBe('9:05 AM');
    });
  });

  describe('formatTime24', () => {
    it('should format morning times in 24-hour format', () => {
      const date = new Date('2024-01-15T09:30:00');
      expect(formatTime24(date)).toBe('09:30');
    });

    it('should format afternoon times in 24-hour format', () => {
      const date = new Date('2024-01-15T14:45:00');
      expect(formatTime24(date)).toBe('14:45');
    });

    it('should format midnight correctly', () => {
      const date = new Date('2024-01-15T00:05:00');
      expect(formatTime24(date)).toBe('00:05');
    });

    it('should handle string input', () => {
      expect(formatTime24('2024-01-15T23:59:00')).toBe('23:59');
    });
  });

  describe('formatHour', () => {
    it('should format midnight (0) as 12 AM', () => {
      expect(formatHour(0)).toBe('12 AM');
    });

    it('should format morning hours correctly', () => {
      expect(formatHour(9)).toBe('9 AM');
      expect(formatHour(11)).toBe('11 AM');
    });

    it('should format noon (12) as 12 PM', () => {
      expect(formatHour(12)).toBe('12 PM');
    });

    it('should format afternoon hours correctly', () => {
      expect(formatHour(13)).toBe('1 PM');
      expect(formatHour(23)).toBe('11 PM');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only when less than 60', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(45)).toBe('45m');
    });

    it('should format hours only when no remainder', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes when both present', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('formatTimeRange', () => {
    it('should format time range correctly', () => {
      const start = new Date('2024-01-15T09:00:00');
      const end = new Date('2024-01-15T10:30:00');
      expect(formatTimeRange(start, end)).toBe('9:00 AM - 10:30 AM');
    });

    it('should handle string inputs', () => {
      expect(formatTimeRange('2024-01-15T14:00:00', '2024-01-15T15:00:00'))
        .toBe('2:00 PM - 3:00 PM');
    });
  });

  describe('formatDate', () => {
    let mockToday: Date;

    beforeEach(() => {
      // Mock today's date
      mockToday = new Date('2024-01-15T12:00:00');
      vi.useFakeTimers();
      vi.setSystemTime(mockToday);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Today" for today\'s date', () => {
      expect(formatDate(mockToday)).toBe('Today');
    });

    it('should return "Tomorrow" for tomorrow\'s date', () => {
      const tomorrow = new Date('2024-01-16T12:00:00');
      expect(formatDate(tomorrow)).toBe('Tomorrow');
    });

    it('should format other dates in long style by default', () => {
      const otherDate = new Date('2024-01-20T12:00:00');
      expect(formatDate(otherDate)).toBe('January 20');
    });

    it('should include year for dates in different year', () => {
      const otherYear = new Date('2025-01-20T12:00:00');
      expect(formatDate(otherYear)).toBe('January 20, 2025');
    });

    it('should format in short style when specified', () => {
      const otherDate = new Date('2024-01-20T12:00:00');
      expect(formatDate(otherDate, { style: 'short' })).toBe('1/20/2024');
    });

    it('should format in full style when specified', () => {
      const otherDate = new Date('2024-01-20T12:00:00');
      const result = formatDate(otherDate, { style: 'full' });
      expect(result).toContain('Saturday');
      expect(result).toContain('January');
      expect(result).toContain('20');
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for today', () => {
      expect(isToday(new Date('2024-01-15T09:00:00'))).toBe(true);
      expect(isToday(new Date('2024-01-15T23:59:59'))).toBe(true);
    });

    it('should return false for other days', () => {
      expect(isToday(new Date('2024-01-14T12:00:00'))).toBe(false);
      expect(isToday(new Date('2024-01-16T12:00:00'))).toBe(false);
    });

    it('should handle string input', () => {
      expect(isToday('2024-01-15T12:00:00')).toBe(true);
    });
  });

  describe('isPast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for past dates', () => {
      expect(isPast(new Date('2024-01-14T12:00:00'))).toBe(true);
      expect(isPast(new Date('2024-01-15T11:59:00'))).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isPast(new Date('2024-01-16T12:00:00'))).toBe(false);
      expect(isPast(new Date('2024-01-15T12:01:00'))).toBe(false);
    });

    it('should handle string input', () => {
      expect(isPast('2024-01-14T12:00:00')).toBe(true);
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "now" for current time', () => {
      expect(getRelativeTime(new Date('2024-01-15T12:00:00'))).toBe('now');
    });

    it('should format minutes in the future', () => {
      expect(getRelativeTime(new Date('2024-01-15T12:30:00'))).toBe('in 30 minutes');
      expect(getRelativeTime(new Date('2024-01-15T12:01:00'))).toBe('in 1 minute');
    });

    it('should format hours in the future', () => {
      expect(getRelativeTime(new Date('2024-01-15T14:00:00'))).toBe('in 2 hours');
      expect(getRelativeTime(new Date('2024-01-15T13:00:00'))).toBe('in 1 hour');
    });

    it('should format days in the future', () => {
      expect(getRelativeTime(new Date('2024-01-17T12:00:00'))).toBe('in 2 days');
    });

    it('should format minutes in the past', () => {
      expect(getRelativeTime(new Date('2024-01-15T11:30:00'))).toBe('30 minutes ago');
      expect(getRelativeTime(new Date('2024-01-15T11:59:00'))).toBe('1 minute ago');
    });

    it('should format hours in the past', () => {
      expect(getRelativeTime(new Date('2024-01-15T10:00:00'))).toBe('2 hours ago');
    });

    it('should format days in the past', () => {
      expect(getRelativeTime(new Date('2024-01-13T12:00:00'))).toBe('2 days ago');
    });
  });
});
