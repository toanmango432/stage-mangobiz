/**
 * Currency Utilities Tests
 * Tests for safe monetary calculations
 */

import { describe, it, expect } from 'vitest';
import {
  roundToCents,
  addAmounts,
  subtractAmount,
  multiplyAmount,
  calculatePercentage,
  amountsEqual,
  isFullyPaid,
} from '../currency';

describe('currency utilities', () => {
  describe('roundToCents', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToCents(10.123)).toBe(10.12);
      expect(roundToCents(10.125)).toBe(10.13);
      expect(roundToCents(10.129)).toBe(10.13);
    });

    it('should handle whole numbers', () => {
      expect(roundToCents(10)).toBe(10);
      expect(roundToCents(100)).toBe(100);
    });

    it('should handle floating-point precision issues', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      expect(roundToCents(0.1 + 0.2)).toBe(0.3);
    });

    it('should handle negative amounts', () => {
      expect(roundToCents(-10.123)).toBe(-10.12);
      expect(roundToCents(-10.126)).toBe(-10.13);
    });

    it('should handle zero', () => {
      expect(roundToCents(0)).toBe(0);
    });
  });

  describe('addAmounts', () => {
    it('should add multiple amounts correctly', () => {
      expect(addAmounts(10, 20, 30)).toBe(60);
      expect(addAmounts(10.50, 20.25, 30.25)).toBe(61);
    });

    it('should handle single amount', () => {
      expect(addAmounts(10.50)).toBe(10.5);
    });

    it('should handle empty arguments', () => {
      expect(addAmounts()).toBe(0);
    });

    it('should handle null/undefined values', () => {
      expect(addAmounts(10, null as any, 20)).toBe(30);
      expect(addAmounts(10, undefined as any, 20)).toBe(30);
    });

    it('should round result to cents', () => {
      expect(addAmounts(0.1, 0.2)).toBe(0.3);
      expect(addAmounts(10.111, 10.222)).toBe(20.33);
    });
  });

  describe('subtractAmount', () => {
    it('should subtract correctly', () => {
      expect(subtractAmount(100, 30)).toBe(70);
      expect(subtractAmount(100.50, 30.25)).toBe(70.25);
    });

    it('should handle resulting in zero', () => {
      expect(subtractAmount(100, 100)).toBe(0);
    });

    it('should handle negative results', () => {
      expect(subtractAmount(30, 100)).toBe(-70);
    });

    it('should round result to cents', () => {
      expect(subtractAmount(0.3, 0.1)).toBe(0.2);
    });
  });

  describe('multiplyAmount', () => {
    it('should multiply correctly', () => {
      expect(multiplyAmount(100, 0.08)).toBe(8);
      expect(multiplyAmount(50, 2)).toBe(100);
    });

    it('should round result to cents', () => {
      expect(multiplyAmount(100, 0.0825)).toBe(8.25);
      expect(multiplyAmount(99.99, 0.0825)).toBe(8.25);
    });

    it('should handle zero factor', () => {
      expect(multiplyAmount(100, 0)).toBe(0);
    });

    it('should handle decimal factors', () => {
      expect(multiplyAmount(100, 0.5)).toBe(50);
      expect(multiplyAmount(100, 1.15)).toBe(115);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(100, 15)).toBe(15);
      expect(calculatePercentage(200, 20)).toBe(40);
    });

    it('should handle decimal percentages', () => {
      expect(calculatePercentage(100, 8.25)).toBe(8.25);
    });

    it('should handle zero percentage', () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    it('should handle 100%', () => {
      expect(calculatePercentage(100, 100)).toBe(100);
    });

    it('should round result to cents', () => {
      expect(calculatePercentage(33.33, 15)).toBe(5);
    });
  });

  describe('amountsEqual', () => {
    it('should return true for equal amounts', () => {
      expect(amountsEqual(100, 100)).toBe(true);
      expect(amountsEqual(99.99, 99.99)).toBe(true);
    });

    it('should return true for amounts within 1 cent tolerance', () => {
      expect(amountsEqual(100, 100.005)).toBe(true);
      expect(amountsEqual(100.009, 100)).toBe(true);
    });

    it('should return false for amounts differing by more than 1 cent', () => {
      expect(amountsEqual(100, 100.02)).toBe(false);
      expect(amountsEqual(100, 99.98)).toBe(false);
    });

    it('should handle floating-point precision', () => {
      expect(amountsEqual(0.1 + 0.2, 0.3)).toBe(true);
    });
  });

  describe('isFullyPaid', () => {
    it('should return true when fully paid', () => {
      expect(isFullyPaid(100, 100)).toBe(true);
    });

    it('should return true when overpaid', () => {
      expect(isFullyPaid(110, 100)).toBe(true);
    });

    it('should return true within 1 cent tolerance', () => {
      expect(isFullyPaid(99.995, 100)).toBe(true);
    });

    it('should return false when underpaid', () => {
      expect(isFullyPaid(90, 100)).toBe(false);
    });

    it('should return false when paid is zero', () => {
      expect(isFullyPaid(0, 100)).toBe(false);
    });

    it('should return false when paid is negative', () => {
      expect(isFullyPaid(-10, 100)).toBe(false);
    });
  });
});
