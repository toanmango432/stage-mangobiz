/**
 * FrontDesk Time Utilities Tests
 * Tests for shared time calculation and formatting functions
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTime,
  getWaitTimeMinutes,
  formatWaitTime,
  getEstimatedStartTime,
  parseDuration,
  getEstimatedEndTime,
  formatDuration,
  getTimeRemaining,
} from '../timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    it('formats morning time correctly', () => {
      const date = new Date('2026-01-08T09:30:00');
      expect(formatTime(date)).toBe('9:30 AM');
    });

    it('formats afternoon time correctly', () => {
      const date = new Date('2026-01-08T14:45:00');
      expect(formatTime(date)).toBe('2:45 PM');
    });

    it('formats noon correctly', () => {
      const date = new Date('2026-01-08T12:00:00');
      expect(formatTime(date)).toBe('12:00 PM');
    });

    it('formats midnight correctly', () => {
      const date = new Date('2026-01-08T00:00:00');
      expect(formatTime(date)).toBe('12:00 AM');
    });

    it('formats evening time correctly', () => {
      const date = new Date('2026-01-08T20:15:00');
      expect(formatTime(date)).toBe('8:15 PM');
    });
  });

  describe('getWaitTimeMinutes', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates wait time correctly for string date', () => {
      const now = new Date('2026-01-08T10:30:00');
      vi.setSystemTime(now);

      const checkInTime = '2026-01-08T10:00:00';
      expect(getWaitTimeMinutes(checkInTime)).toBe(30);
    });

    it('calculates wait time correctly for Date object', () => {
      const now = new Date('2026-01-08T10:45:00');
      vi.setSystemTime(now);

      const checkInTime = new Date('2026-01-08T10:00:00');
      expect(getWaitTimeMinutes(checkInTime)).toBe(45);
    });

    it('returns 0 for just checked in', () => {
      const now = new Date('2026-01-08T10:00:00');
      vi.setSystemTime(now);

      const checkInTime = '2026-01-08T10:00:00';
      expect(getWaitTimeMinutes(checkInTime)).toBe(0);
    });

    it('handles hour+ wait times', () => {
      const now = new Date('2026-01-08T11:30:00');
      vi.setSystemTime(now);

      const checkInTime = '2026-01-08T10:00:00';
      expect(getWaitTimeMinutes(checkInTime)).toBe(90);
    });
  });

  describe('formatWaitTime', () => {
    it('returns "Just arrived" for 0 minutes', () => {
      expect(formatWaitTime(0)).toBe('Just arrived');
    });

    it('returns singular form for 1 minute', () => {
      expect(formatWaitTime(1)).toBe('1 minute');
    });

    it('returns plural form for multiple minutes', () => {
      expect(formatWaitTime(5)).toBe('5 minutes');
    });

    it('handles large wait times', () => {
      expect(formatWaitTime(120)).toBe('120 minutes');
    });
  });

  describe('getEstimatedStartTime', () => {
    it('calculates with default 15 minute wait', () => {
      const checkInTime = '2026-01-08T10:00:00';
      const result = getEstimatedStartTime(checkInTime);

      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(15);
    });

    it('calculates with custom wait time', () => {
      const checkInTime = '2026-01-08T10:00:00';
      const result = getEstimatedStartTime(checkInTime, 30);

      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(30);
    });

    it('handles Date object input', () => {
      const checkInTime = new Date('2026-01-08T10:00:00');
      const result = getEstimatedStartTime(checkInTime, 45);

      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(45);
    });

    it('handles hour rollover', () => {
      const checkInTime = '2026-01-08T10:45:00';
      const result = getEstimatedStartTime(checkInTime, 30);

      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(15);
    });
  });

  describe('parseDuration', () => {
    it('parses minutes only', () => {
      expect(parseDuration('45m')).toBe(45);
    });

    it('parses hours only', () => {
      expect(parseDuration('2h')).toBe(120);
    });

    it('parses hours and minutes', () => {
      expect(parseDuration('1h 30m')).toBe(90);
    });

    it('parses hours and minutes without space', () => {
      expect(parseDuration('1h30m')).toBe(90);
    });

    it('parses with extra spaces', () => {
      expect(parseDuration('2h  15m')).toBe(135);
    });

    it('defaults to 60 minutes for invalid input', () => {
      expect(parseDuration('')).toBe(60);
      expect(parseDuration('invalid')).toBe(60);
    });

    it('handles large values', () => {
      expect(parseDuration('3h 45m')).toBe(225);
    });
  });

  describe('getEstimatedEndTime', () => {
    it('calculates end time with minutes duration', () => {
      const startTime = '2026-01-08T10:00:00';
      const result = getEstimatedEndTime(startTime, '45m');

      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(45);
    });

    it('calculates end time with hours duration', () => {
      const startTime = '2026-01-08T10:00:00';
      const result = getEstimatedEndTime(startTime, '2h');

      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
    });

    it('calculates end time with hours and minutes', () => {
      const startTime = '2026-01-08T10:00:00';
      const result = getEstimatedEndTime(startTime, '1h 30m');

      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(30);
    });

    it('handles Date object input', () => {
      const startTime = new Date('2026-01-08T10:00:00');
      const result = getEstimatedEndTime(startTime, '30m');

      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('formatDuration', () => {
    it('formats minutes under an hour', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(45)).toBe('45m');
    });

    it('formats exact hours', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(75)).toBe('1h 15m');
    });

    it('handles large durations', () => {
      expect(formatDuration(180)).toBe('3h');
      expect(formatDuration(195)).toBe('3h 15m');
    });

    it('handles zero', () => {
      expect(formatDuration(0)).toBe('0m');
    });
  });

  describe('getTimeRemaining', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates remaining time correctly', () => {
      const now = new Date('2026-01-08T10:00:00');
      vi.setSystemTime(now);

      const endTime = new Date('2026-01-08T10:30:00');
      expect(getTimeRemaining(endTime)).toBe(30);
    });

    it('returns 0 when end time has passed', () => {
      const now = new Date('2026-01-08T11:00:00');
      vi.setSystemTime(now);

      const endTime = new Date('2026-01-08T10:30:00');
      expect(getTimeRemaining(endTime)).toBe(0);
    });

    it('returns 0 when exactly at end time', () => {
      const now = new Date('2026-01-08T10:30:00');
      vi.setSystemTime(now);

      const endTime = new Date('2026-01-08T10:30:00');
      expect(getTimeRemaining(endTime)).toBe(0);
    });

    it('handles fractional minutes by flooring', () => {
      const now = new Date('2026-01-08T10:00:30'); // 30 seconds past
      vi.setSystemTime(now);

      const endTime = new Date('2026-01-08T10:30:00');
      expect(getTimeRemaining(endTime)).toBe(29); // Should floor, not round
    });
  });
});
