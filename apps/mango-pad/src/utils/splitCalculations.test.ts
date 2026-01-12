/**
 * splitCalculations Unit Tests
 * US-016: Tests for split payment calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplits,
  validateSplitAmounts,
  formatCurrency,
  getDefaultCustomSplits,
  adjustLastSplit,
} from './splitCalculations';

describe('splitCalculations', () => {
  describe('calculateEqualSplits', () => {
    it('should split evenly into 2', () => {
      const splits = calculateEqualSplits(100, 2);
      expect(splits).toHaveLength(2);
      expect(splits[0].amount).toBe(50);
      expect(splits[1].amount).toBe(50);
    });

    it('should split evenly into 3', () => {
      const splits = calculateEqualSplits(99, 3);
      expect(splits).toHaveLength(3);
      expect(splits[0].amount).toBe(33);
      expect(splits[1].amount).toBe(33);
      expect(splits[2].amount).toBe(33);
    });

    it('should split evenly into 4', () => {
      const splits = calculateEqualSplits(100, 4);
      expect(splits).toHaveLength(4);
      expect(splits[0].amount).toBe(25);
      expect(splits[1].amount).toBe(25);
      expect(splits[2].amount).toBe(25);
      expect(splits[3].amount).toBe(25);
    });

    it('should handle remainder by adding to first split', () => {
      const splits = calculateEqualSplits(100, 3);
      expect(splits[0].amount).toBeCloseTo(33.34, 2);
      expect(splits[1].amount).toBeCloseTo(33.33, 2);
      expect(splits[2].amount).toBeCloseTo(33.33, 2);
      const total = splits.reduce((sum, s) => sum + s.amount, 0);
      expect(total).toBeCloseTo(100, 2);
    });

    it('should handle odd penny amounts', () => {
      const splits = calculateEqualSplits(76.31, 2);
      expect(splits[0].amount).toBe(38.16);
      expect(splits[1].amount).toBe(38.15);
      const total = splits.reduce((sum, s) => sum + s.amount, 0);
      expect(total).toBeCloseTo(76.31, 2);
    });

    it('should include correct indices', () => {
      const splits = calculateEqualSplits(100, 3);
      expect(splits[0].index).toBe(0);
      expect(splits[1].index).toBe(1);
      expect(splits[2].index).toBe(2);
    });

    it('should throw for splits less than 2', () => {
      expect(() => calculateEqualSplits(100, 1)).toThrow('Number of splits must be between 2 and 4');
      expect(() => calculateEqualSplits(100, 0)).toThrow();
    });

    it('should throw for splits greater than 4', () => {
      expect(() => calculateEqualSplits(100, 5)).toThrow('Number of splits must be between 2 and 4');
    });
  });

  describe('validateSplitAmounts', () => {
    it('should validate correct split amounts', () => {
      const result = validateSplitAmounts([50, 50], 100);
      expect(result.isValid).toBe(true);
      expect(result.difference).toBe(0);
    });

    it('should validate with small rounding differences', () => {
      const result = validateSplitAmounts([33.33, 33.33, 33.34], 100);
      expect(result.isValid).toBe(true);
    });

    it('should detect under-payment', () => {
      const result = validateSplitAmounts([40, 40], 100);
      expect(result.isValid).toBe(false);
      expect(result.difference).toBe(20);
    });

    it('should detect over-payment', () => {
      const result = validateSplitAmounts([60, 60], 100);
      expect(result.isValid).toBe(false);
      expect(result.difference).toBe(-20);
    });

    it('should handle empty amounts', () => {
      const result = validateSplitAmounts([], 100);
      expect(result.isValid).toBe(false);
      expect(result.difference).toBe(100);
    });

    it('should handle single amount', () => {
      const result = validateSplitAmounts([100], 100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      expect(formatCurrency(50)).toBe('$50.00');
      expect(formatCurrency(123.45)).toBe('$123.45');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format large amounts', () => {
      expect(formatCurrency(10000)).toBe('$10,000.00');
    });
  });

  describe('getDefaultCustomSplits', () => {
    it('should return equal splits as array', () => {
      const amounts = getDefaultCustomSplits(100, 2);
      expect(amounts).toEqual([50, 50]);
    });

    it('should handle 3-way split', () => {
      const amounts = getDefaultCustomSplits(99, 3);
      expect(amounts).toHaveLength(3);
      expect(amounts.reduce((a, b) => a + b, 0)).toBeCloseTo(99, 2);
    });

    it('should handle odd amounts', () => {
      const amounts = getDefaultCustomSplits(76.31, 4);
      expect(amounts).toHaveLength(4);
      expect(amounts.reduce((a, b) => a + b, 0)).toBeCloseTo(76.31, 2);
    });
  });

  describe('adjustLastSplit', () => {
    it('should adjust last split to match total', () => {
      const adjusted = adjustLastSplit([50, 49], 100);
      expect(adjusted).toEqual([50, 50]);
    });

    it('should handle over-estimated splits', () => {
      const adjusted = adjustLastSplit([50, 51], 100);
      expect(adjusted).toEqual([50, 50]);
    });

    it('should handle rounding issues', () => {
      const adjusted = adjustLastSplit([33.33, 33.33, 33.33], 100);
      expect(adjusted[2]).toBe(33.34);
      expect(adjusted.reduce((a, b) => a + b, 0)).toBe(100);
    });

    it('should return empty array for empty input', () => {
      const adjusted = adjustLastSplit([], 100);
      expect(adjusted).toEqual([]);
    });

    it('should not allow negative last split', () => {
      const adjusted = adjustLastSplit([60, 60], 50);
      expect(adjusted[1]).toBe(0);
    });

    it('should handle single split', () => {
      const adjusted = adjustLastSplit([95], 100);
      expect(adjusted).toEqual([100]);
    });

    it('should preserve previous splits', () => {
      const adjusted = adjustLastSplit([25, 25, 25, 20], 100);
      expect(adjusted[0]).toBe(25);
      expect(adjusted[1]).toBe(25);
      expect(adjusted[2]).toBe(25);
      expect(adjusted[3]).toBe(25);
    });
  });
});
