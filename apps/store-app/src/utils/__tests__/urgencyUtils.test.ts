import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateWaitingMinutes,
  getUrgencyLevel,
  formatWaitingTime,
  getUrgencyPriority,
  sortByUrgency,
  hasUrgentTickets,
  getHighestUrgency,
  sortWaitingByUrgency,
  DEFAULT_URGENCY_THRESHOLDS,
  URGENCY_COLORS,
  type UrgencyLevel,
  type UrgencyThresholds,
} from '../urgencyUtils';

describe('urgencyUtils', () => {
  // Mock Date.now for consistent test results
  let mockNow: Date;

  beforeEach(() => {
    mockNow = new Date('2024-01-15T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateWaitingMinutes', () => {
    it('should return 0 for null/undefined input', () => {
      expect(calculateWaitingMinutes(null)).toBe(0);
      expect(calculateWaitingMinutes(undefined)).toBe(0);
    });

    it('should calculate minutes from Date object', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60 * 1000);
      expect(calculateWaitingMinutes(fiveMinutesAgo)).toBe(5);
    });

    it('should calculate minutes from ISO string', () => {
      const tenMinutesAgo = new Date(mockNow.getTime() - 10 * 60 * 1000).toISOString();
      expect(calculateWaitingMinutes(tenMinutesAgo)).toBe(10);
    });

    it('should return 0 for invalid date string', () => {
      expect(calculateWaitingMinutes('invalid-date')).toBe(0);
    });

    it('should handle future dates (negative diff)', () => {
      const fiveMinutesFromNow = new Date(mockNow.getTime() + 5 * 60 * 1000);
      expect(calculateWaitingMinutes(fiveMinutesFromNow)).toBe(-5);
    });

    it('should floor minutes correctly', () => {
      // 5.9 minutes ago should return 5
      const almostSixMinutesAgo = new Date(mockNow.getTime() - 5.9 * 60 * 1000);
      expect(calculateWaitingMinutes(almostSixMinutesAgo)).toBe(5);
    });

    it('should handle hour+ durations', () => {
      const twoHoursAgo = new Date(mockNow.getTime() - 2 * 60 * 60 * 1000);
      expect(calculateWaitingMinutes(twoHoursAgo)).toBe(120);
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return "normal" for null completedAt', () => {
      expect(getUrgencyLevel(null)).toBe('normal');
      expect(getUrgencyLevel(undefined)).toBe('normal');
    });

    it('should return "normal" when disabled', () => {
      const thirtyMinutesAgo = new Date(mockNow.getTime() - 30 * 60 * 1000);
      expect(getUrgencyLevel(thirtyMinutesAgo, DEFAULT_URGENCY_THRESHOLDS, false)).toBe('normal');
    });

    it('should return "normal" for wait time below attention threshold', () => {
      const twoMinutesAgo = new Date(mockNow.getTime() - 2 * 60 * 1000);
      expect(getUrgencyLevel(twoMinutesAgo)).toBe('normal');
    });

    it('should return "attention" for wait time >= 5 minutes', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60 * 1000);
      expect(getUrgencyLevel(fiveMinutesAgo)).toBe('attention');
    });

    it('should return "urgent" for wait time >= 10 minutes', () => {
      const tenMinutesAgo = new Date(mockNow.getTime() - 10 * 60 * 1000);
      expect(getUrgencyLevel(tenMinutesAgo)).toBe('urgent');
    });

    it('should return "critical" for wait time >= 20 minutes', () => {
      const twentyMinutesAgo = new Date(mockNow.getTime() - 20 * 60 * 1000);
      expect(getUrgencyLevel(twentyMinutesAgo)).toBe('critical');
    });

    it('should use custom thresholds', () => {
      const customThresholds: UrgencyThresholds = {
        attention: 15,
        urgent: 30,
        critical: 60,
      };

      const tenMinutesAgo = new Date(mockNow.getTime() - 10 * 60 * 1000);
      expect(getUrgencyLevel(tenMinutesAgo, customThresholds)).toBe('normal');

      const twentyMinutesAgo = new Date(mockNow.getTime() - 20 * 60 * 1000);
      expect(getUrgencyLevel(twentyMinutesAgo, customThresholds)).toBe('attention');

      const fortyMinutesAgo = new Date(mockNow.getTime() - 40 * 60 * 1000);
      expect(getUrgencyLevel(fortyMinutesAgo, customThresholds)).toBe('urgent');

      const ninetyMinutesAgo = new Date(mockNow.getTime() - 90 * 60 * 1000);
      expect(getUrgencyLevel(ninetyMinutesAgo, customThresholds)).toBe('critical');
    });

    it('should handle ISO string input', () => {
      const fifteenMinutesAgo = new Date(mockNow.getTime() - 15 * 60 * 1000).toISOString();
      expect(getUrgencyLevel(fifteenMinutesAgo)).toBe('urgent');
    });
  });

  describe('formatWaitingTime', () => {
    it('should return "Just now" for 0 minutes', () => {
      expect(formatWaitingTime(0)).toBe('Just now');
    });

    it('should return "Just now" for negative minutes', () => {
      expect(formatWaitingTime(-5)).toBe('Just now');
    });

    it('should format minutes correctly', () => {
      expect(formatWaitingTime(1)).toBe('1m');
      expect(formatWaitingTime(5)).toBe('5m');
      expect(formatWaitingTime(45)).toBe('45m');
      expect(formatWaitingTime(59)).toBe('59m');
    });

    it('should format hours and minutes correctly', () => {
      expect(formatWaitingTime(60)).toBe('1h 0m');
      expect(formatWaitingTime(65)).toBe('1h 5m');
      expect(formatWaitingTime(120)).toBe('2h 0m');
      expect(formatWaitingTime(135)).toBe('2h 15m');
    });
  });

  describe('getUrgencyPriority', () => {
    it('should return correct priority for each level', () => {
      expect(getUrgencyPriority('normal')).toBe(1);
      expect(getUrgencyPriority('attention')).toBe(2);
      expect(getUrgencyPriority('urgent')).toBe(3);
      expect(getUrgencyPriority('critical')).toBe(4);
    });

    it('should have increasing priority from normal to critical', () => {
      const levels: UrgencyLevel[] = ['normal', 'attention', 'urgent', 'critical'];
      for (let i = 1; i < levels.length; i++) {
        expect(getUrgencyPriority(levels[i])).toBeGreaterThan(getUrgencyPriority(levels[i - 1]));
      }
    });
  });

  describe('sortByUrgency', () => {
    it('should return tickets unchanged when disabled', () => {
      const tickets = [
        { id: '1', completedAt: new Date(mockNow.getTime() - 5 * 60 * 1000) },
        { id: '2', completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) },
      ];
      const result = sortByUrgency(tickets, DEFAULT_URGENCY_THRESHOLDS, false);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should sort by urgency level (most urgent first)', () => {
      const tickets = [
        { id: 'normal', completedAt: new Date(mockNow.getTime() - 2 * 60 * 1000) },
        { id: 'critical', completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) },
        { id: 'attention', completedAt: new Date(mockNow.getTime() - 6 * 60 * 1000) },
        { id: 'urgent', completedAt: new Date(mockNow.getTime() - 12 * 60 * 1000) },
      ];

      const result = sortByUrgency(tickets);

      expect(result[0].id).toBe('critical');
      expect(result[1].id).toBe('urgent');
      expect(result[2].id).toBe('attention');
      expect(result[3].id).toBe('normal');
    });

    it('should sort by wait time within same urgency level', () => {
      const tickets = [
        { id: 'urgent-12', completedAt: new Date(mockNow.getTime() - 12 * 60 * 1000) },
        { id: 'urgent-15', completedAt: new Date(mockNow.getTime() - 15 * 60 * 1000) },
        { id: 'urgent-11', completedAt: new Date(mockNow.getTime() - 11 * 60 * 1000) },
      ];

      const result = sortByUrgency(tickets);

      // Longest wait time first within same urgency level
      expect(result[0].id).toBe('urgent-15');
      expect(result[1].id).toBe('urgent-12');
      expect(result[2].id).toBe('urgent-11');
    });

    it('should not mutate original array', () => {
      const tickets = [
        { id: '1', completedAt: new Date(mockNow.getTime() - 2 * 60 * 1000) },
        { id: '2', completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) },
      ];
      const original = [...tickets];
      sortByUrgency(tickets);
      expect(tickets).toEqual(original);
    });

    it('should handle empty array', () => {
      const result = sortByUrgency([]);
      expect(result).toEqual([]);
    });
  });

  describe('hasUrgentTickets', () => {
    it('should return false when disabled', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) },
      ];
      expect(hasUrgentTickets(tickets, DEFAULT_URGENCY_THRESHOLDS, false)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasUrgentTickets([])).toBe(false);
    });

    it('should return false when no urgent tickets', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 2 * 60 * 1000) }, // normal
        { completedAt: new Date(mockNow.getTime() - 6 * 60 * 1000) }, // attention
      ];
      expect(hasUrgentTickets(tickets)).toBe(false);
    });

    it('should return true when urgent ticket exists', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 2 * 60 * 1000) }, // normal
        { completedAt: new Date(mockNow.getTime() - 12 * 60 * 1000) }, // urgent
      ];
      expect(hasUrgentTickets(tickets)).toBe(true);
    });

    it('should return true when critical ticket exists', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 2 * 60 * 1000) }, // normal
        { completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) }, // critical
      ];
      expect(hasUrgentTickets(tickets)).toBe(true);
    });
  });

  describe('getHighestUrgency', () => {
    it('should return "normal" when disabled', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) },
      ];
      expect(getHighestUrgency(tickets, DEFAULT_URGENCY_THRESHOLDS, false)).toBe('normal');
    });

    it('should return "normal" for empty array', () => {
      expect(getHighestUrgency([])).toBe('normal');
    });

    it('should return highest urgency from tickets', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 2 * 60 * 1000) }, // normal
        { completedAt: new Date(mockNow.getTime() - 6 * 60 * 1000) }, // attention
        { completedAt: new Date(mockNow.getTime() - 12 * 60 * 1000) }, // urgent
      ];
      expect(getHighestUrgency(tickets)).toBe('urgent');
    });

    it('should return "critical" when critical ticket exists', () => {
      const tickets = [
        { completedAt: new Date(mockNow.getTime() - 6 * 60 * 1000) }, // attention
        { completedAt: new Date(mockNow.getTime() - 25 * 60 * 1000) }, // critical
        { completedAt: new Date(mockNow.getTime() - 12 * 60 * 1000) }, // urgent
      ];
      expect(getHighestUrgency(tickets)).toBe('critical');
    });
  });

  describe('sortWaitingByUrgency', () => {
    it('should use waiting-specific thresholds (10/15/25 min)', () => {
      const tickets = [
        { id: 'normal', createdAt: new Date(mockNow.getTime() - 5 * 60 * 1000) }, // < 10 = normal
        { id: 'attention', createdAt: new Date(mockNow.getTime() - 12 * 60 * 1000) }, // >= 10 = attention
        { id: 'urgent', createdAt: new Date(mockNow.getTime() - 18 * 60 * 1000) }, // >= 15 = urgent
        { id: 'critical', createdAt: new Date(mockNow.getTime() - 30 * 60 * 1000) }, // >= 25 = critical
      ];

      const result = sortWaitingByUrgency(tickets);

      expect(result[0].id).toBe('critical');
      expect(result[1].id).toBe('urgent');
      expect(result[2].id).toBe('attention');
      expect(result[3].id).toBe('normal');
    });

    it('should sort by wait time within same urgency level', () => {
      const tickets = [
        { id: 'attention-11', createdAt: new Date(mockNow.getTime() - 11 * 60 * 1000) },
        { id: 'attention-14', createdAt: new Date(mockNow.getTime() - 14 * 60 * 1000) },
        { id: 'attention-12', createdAt: new Date(mockNow.getTime() - 12 * 60 * 1000) },
      ];

      const result = sortWaitingByUrgency(tickets);

      // All are attention level (10-14 min), sorted by longest wait first
      expect(result[0].id).toBe('attention-14');
      expect(result[1].id).toBe('attention-12');
      expect(result[2].id).toBe('attention-11');
    });

    it('should accept custom thresholds', () => {
      const tickets = [
        { id: 'normal', createdAt: new Date(mockNow.getTime() - 5 * 60 * 1000) },
        { id: 'critical', createdAt: new Date(mockNow.getTime() - 20 * 60 * 1000) },
      ];

      const customThresholds = {
        attention: 3,
        urgent: 10,
        critical: 15,
      };

      const result = sortWaitingByUrgency(tickets, customThresholds);

      expect(result[0].id).toBe('critical');
      expect(result[1].id).toBe('normal'); // 5 min = attention with custom thresholds
    });
  });

  describe('constants', () => {
    it('should have correct default thresholds', () => {
      expect(DEFAULT_URGENCY_THRESHOLDS).toEqual({
        attention: 5,
        urgent: 10,
        critical: 20,
      });
    });

    it('should have all urgency color classes defined', () => {
      const levels: UrgencyLevel[] = ['normal', 'attention', 'urgent', 'critical'];

      for (const level of levels) {
        expect(URGENCY_COLORS[level]).toBeDefined();
        expect(URGENCY_COLORS[level].border).toBeDefined();
        expect(URGENCY_COLORS[level].bg).toBeDefined();
        expect(URGENCY_COLORS[level].dot).toBeDefined();
        expect(URGENCY_COLORS[level].text).toBeDefined();
        expect(URGENCY_COLORS[level].glow).toBeDefined();
      }
    });

    it('should have expected color classes for critical level', () => {
      expect(URGENCY_COLORS.critical.border).toBe('border-red-400');
      expect(URGENCY_COLORS.critical.bg).toBe('bg-red-100');
      expect(URGENCY_COLORS.critical.dot).toBe('bg-red-600');
      expect(URGENCY_COLORS.critical.text).toBe('text-red-800');
    });
  });
});
