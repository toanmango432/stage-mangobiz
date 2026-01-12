/**
 * Unit Tests for Utility Functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatPhone,
  formatPhoneSimple,
  isValidPhone,
  isValidEmail,
  generateCheckInNumber,
  getGreeting,
  calculateTotalPrice,
  calculateTotalDuration,
  formatDuration,
  formatPrice,
  generateId,
  formatDate,
  formatTime,
} from './index';

describe('formatPhone', () => {
  it('formats a 10-digit phone number correctly', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567');
  });

  it('formats partial phone numbers correctly (3 digits)', () => {
    expect(formatPhone('555')).toBe('555');
  });

  it('formats partial phone numbers correctly (6 digits)', () => {
    expect(formatPhone('555123')).toBe('(555) 123');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });

  it('strips non-digit characters', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhone('555.123.4567')).toBe('(555) 123-4567');
  });

  it('truncates to 10 digits', () => {
    expect(formatPhone('55512345678901')).toBe('(555) 123-4567');
  });
});

describe('formatPhoneSimple', () => {
  it('formats a 10-digit phone number with dashes', () => {
    expect(formatPhoneSimple('5551234567')).toBe('555-123-4567');
  });

  it('formats 3 digits correctly', () => {
    expect(formatPhoneSimple('555')).toBe('555');
  });

  it('formats 6 digits correctly', () => {
    expect(formatPhoneSimple('555123')).toBe('555-123');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhoneSimple('')).toBe('');
  });
});

describe('isValidPhone', () => {
  it('returns true for valid 10-digit phone', () => {
    expect(isValidPhone('5551234567')).toBe(true);
  });

  it('returns true for formatted phone', () => {
    expect(isValidPhone('(555) 123-4567')).toBe(true);
  });

  it('returns false for short phone', () => {
    expect(isValidPhone('55512345')).toBe(false);
  });

  it('returns false for long phone', () => {
    expect(isValidPhone('555123456789')).toBe(false);
  });

  it('returns false for empty phone', () => {
    expect(isValidPhone('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('returns true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('returns false for invalid email (no @)', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('returns false for invalid email (no domain)', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('returns false for invalid email (no local part)', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('returns false for invalid email with spaces', () => {
    expect(isValidEmail('test @example.com')).toBe(false);
  });
});

describe('generateCheckInNumber', () => {
  it('generates check-in number with A prefix', () => {
    expect(generateCheckInNumber(0)).toBe('A001');
  });

  it('increments the count correctly', () => {
    expect(generateCheckInNumber(1)).toBe('A002');
    expect(generateCheckInNumber(9)).toBe('A010');
    expect(generateCheckInNumber(99)).toBe('A100');
  });

  it('pads small numbers with zeros', () => {
    expect(generateCheckInNumber(0)).toBe('A001');
    expect(generateCheckInNumber(4)).toBe('A005');
  });

  it('handles large numbers', () => {
    expect(generateCheckInNumber(998)).toBe('A999');
    expect(generateCheckInNumber(999)).toBe('A1000');
  });
});

describe('getGreeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Good morning" before 12pm', () => {
    vi.setSystemTime(new Date(2026, 0, 11, 9, 0, 0));
    expect(getGreeting()).toBe('Good morning');
  });

  it('returns "Good afternoon" between 12pm and 5pm', () => {
    vi.setSystemTime(new Date(2026, 0, 11, 14, 0, 0));
    expect(getGreeting()).toBe('Good afternoon');
  });

  it('returns "Good evening" after 5pm', () => {
    vi.setSystemTime(new Date(2026, 0, 11, 18, 0, 0));
    expect(getGreeting()).toBe('Good evening');
  });

  it('returns "Good morning" at midnight', () => {
    vi.setSystemTime(new Date(2026, 0, 11, 0, 0, 0));
    expect(getGreeting()).toBe('Good morning');
  });

  it('returns "Good afternoon" at noon', () => {
    vi.setSystemTime(new Date(2026, 0, 11, 12, 0, 0));
    expect(getGreeting()).toBe('Good afternoon');
  });

  it('returns "Good evening" at 5pm', () => {
    vi.setSystemTime(new Date(2026, 0, 11, 17, 0, 0));
    expect(getGreeting()).toBe('Good evening');
  });
});

describe('calculateTotalPrice', () => {
  it('calculates total for multiple services', () => {
    const services = [{ price: 25 }, { price: 35 }, { price: 50 }];
    expect(calculateTotalPrice(services)).toBe(110);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalPrice([])).toBe(0);
  });

  it('handles single service', () => {
    expect(calculateTotalPrice([{ price: 100 }])).toBe(100);
  });

  it('handles decimal prices', () => {
    const services = [{ price: 25.5 }, { price: 10.25 }];
    expect(calculateTotalPrice(services)).toBeCloseTo(35.75);
  });
});

describe('calculateTotalDuration', () => {
  it('calculates total duration for multiple services', () => {
    const services = [
      { durationMinutes: 30 },
      { durationMinutes: 45 },
      { durationMinutes: 60 },
    ];
    expect(calculateTotalDuration(services)).toBe(135);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotalDuration([])).toBe(0);
  });

  it('handles single service', () => {
    expect(calculateTotalDuration([{ durationMinutes: 90 }])).toBe(90);
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
    expect(formatDuration(135)).toBe('2h 15m');
  });

  it('handles edge cases', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(1)).toBe('1m');
    expect(formatDuration(59)).toBe('59m');
  });
});

describe('formatPrice', () => {
  it('formats whole dollar amounts', () => {
    expect(formatPrice(25)).toBe('$25.00');
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('formats decimal amounts', () => {
    expect(formatPrice(25.5)).toBe('$25.50');
    expect(formatPrice(99.99)).toBe('$99.99');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formats large amounts with comma', () => {
    expect(formatPrice(1000)).toBe('$1,000.00');
    expect(formatPrice(1500.5)).toBe('$1,500.50');
  });
});

describe('generateId', () => {
  it('generates a valid UUID', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 11, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats today as "Today"', () => {
    expect(formatDate(new Date(2026, 0, 11, 14, 30, 0))).toBe('Today');
    expect(formatDate('2026-01-11T14:30:00')).toBe('Today');
  });

  it('formats tomorrow as "Tomorrow"', () => {
    expect(formatDate(new Date(2026, 0, 12, 14, 30, 0))).toBe('Tomorrow');
    expect(formatDate('2026-01-12T14:30:00')).toBe('Tomorrow');
  });

  it('formats other dates with weekday', () => {
    const result = formatDate(new Date(2026, 0, 15, 14, 30, 0));
    expect(result).toMatch(/Thu, Jan 15/);
  });

  it('handles Date objects', () => {
    expect(formatDate(new Date(2026, 0, 11))).toBe('Today');
  });

  it('handles ISO strings', () => {
    // Note: UTC midnight may be previous day in local time depending on timezone
    const todayStr = new Date(2026, 0, 11, 12, 0, 0).toISOString().slice(0, 10);
    expect(formatDate(`${todayStr}T12:00:00`)).toBe('Today');
  });
});

describe('formatTime', () => {
  it('formats morning time', () => {
    expect(formatTime(new Date(2026, 0, 11, 9, 30, 0))).toBe('9:30 AM');
  });

  it('formats afternoon time', () => {
    expect(formatTime(new Date(2026, 0, 11, 14, 30, 0))).toBe('2:30 PM');
  });

  it('formats noon', () => {
    expect(formatTime(new Date(2026, 0, 11, 12, 0, 0))).toBe('12:00 PM');
  });

  it('formats midnight', () => {
    expect(formatTime(new Date(2026, 0, 11, 0, 0, 0))).toBe('12:00 AM');
  });

  it('handles ISO strings', () => {
    expect(formatTime('2026-01-11T14:30:00')).toBe('2:30 PM');
  });
});
