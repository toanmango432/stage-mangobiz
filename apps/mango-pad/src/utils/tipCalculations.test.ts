/**
 * tipCalculations Unit Tests
 * US-016: Tests for tip calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTipAmount,
  calculateTipPercent,
  calculateTip,
  formatCurrency,
  validateTipAmount,
  getSuggestedTips,
} from './tipCalculations';

describe('tipCalculations', () => {
  describe('calculateTipAmount', () => {
    it('should calculate percentage-based tip correctly', () => {
      expect(calculateTipAmount(100, 20, 'percentage')).toBe(20);
      expect(calculateTipAmount(76.31, 18, 'percentage')).toBe(13.74);
      expect(calculateTipAmount(76.31, 20, 'percentage')).toBe(15.26);
      expect(calculateTipAmount(76.31, 25, 'percentage')).toBe(19.08);
    });

    it('should return dollar amount directly for dollar-based tip', () => {
      expect(calculateTipAmount(100, 5, 'dollar')).toBe(5);
      expect(calculateTipAmount(100, 10, 'dollar')).toBe(10);
      expect(calculateTipAmount(50, 15, 'dollar')).toBe(15);
    });

    it('should handle zero base total', () => {
      expect(calculateTipAmount(0, 20, 'percentage')).toBe(0);
    });

    it('should handle small amounts with rounding', () => {
      expect(calculateTipAmount(9.99, 15, 'percentage')).toBe(1.5);
    });
  });

  describe('calculateTipPercent', () => {
    it('should calculate tip percentage correctly', () => {
      expect(calculateTipPercent(100, 20)).toBe(20);
      expect(calculateTipPercent(100, 15)).toBe(15);
      expect(calculateTipPercent(50, 10)).toBe(20);
    });

    it('should return null for zero base total', () => {
      expect(calculateTipPercent(0, 10)).toBeNull();
    });

    it('should return null for negative base total', () => {
      expect(calculateTipPercent(-50, 10)).toBeNull();
    });

    it('should handle decimal percentages', () => {
      const percent = calculateTipPercent(76.31, 15);
      expect(percent).toBeCloseTo(19.7, 1);
    });
  });

  describe('calculateTip', () => {
    it('should return full tip calculation for percentage', () => {
      const result = calculateTip(100, 20, 'percentage');
      expect(result.tipAmount).toBe(20);
      expect(result.tipPercent).toBe(20);
      expect(result.total).toBe(120);
    });

    it('should return full tip calculation for dollar', () => {
      const result = calculateTip(100, 15, 'dollar');
      expect(result.tipAmount).toBe(15);
      expect(result.tipPercent).toBe(15);
      expect(result.total).toBe(115);
    });

    it('should calculate correct total with rounding', () => {
      const result = calculateTip(76.31, 18, 'percentage');
      expect(result.tipAmount).toBe(13.74);
      expect(result.tipPercent).toBe(18);
      expect(result.total).toBe(90.05);
    });
  });

  describe('formatCurrency', () => {
    it('should format whole numbers', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format decimal amounts', () => {
      expect(formatCurrency(76.31)).toBe('$76.31');
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format large amounts with commas', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00');
      expect(formatCurrency(10.001)).toBe('$10.00');
    });
  });

  describe('validateTipAmount', () => {
    it('should accept valid positive amounts', () => {
      expect(validateTipAmount(10)).toBe(true);
      expect(validateTipAmount(0)).toBe(true);
      expect(validateTipAmount(100.50)).toBe(true);
    });

    it('should reject negative amounts', () => {
      expect(validateTipAmount(-5)).toBe(false);
      expect(validateTipAmount(-0.01)).toBe(false);
    });

    it('should reject non-finite numbers', () => {
      expect(validateTipAmount(Infinity)).toBe(false);
      expect(validateTipAmount(-Infinity)).toBe(false);
      expect(validateTipAmount(NaN)).toBe(false);
    });
  });

  describe('getSuggestedTips', () => {
    it('should return formatted suggestions for percentage type', () => {
      const suggestions = getSuggestedTips(100, [18, 20, 25], 'percentage');
      
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toEqual({
        suggestion: 18,
        displayAmount: '$18.00',
        displayLabel: '18%',
      });
      expect(suggestions[1]).toEqual({
        suggestion: 20,
        displayAmount: '$20.00',
        displayLabel: '20%',
      });
      expect(suggestions[2]).toEqual({
        suggestion: 25,
        displayAmount: '$25.00',
        displayLabel: '25%',
      });
    });

    it('should return formatted suggestions for dollar type', () => {
      const suggestions = getSuggestedTips(100, [5, 10, 15], 'dollar');
      
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]).toEqual({
        suggestion: 5,
        displayAmount: '$5.00',
        displayLabel: '$5.00',
      });
      expect(suggestions[1]).toEqual({
        suggestion: 10,
        displayAmount: '$10.00',
        displayLabel: '$10.00',
      });
    });

    it('should calculate correct amounts for percentage on real total', () => {
      const suggestions = getSuggestedTips(76.31, [18, 20, 25, 30], 'percentage');
      
      expect(suggestions[0].displayAmount).toBe('$13.74');
      expect(suggestions[1].displayAmount).toBe('$15.26');
      expect(suggestions[2].displayAmount).toBe('$19.08');
      expect(suggestions[3].displayAmount).toBe('$22.89');
    });

    it('should handle empty suggestions array', () => {
      const suggestions = getSuggestedTips(100, [], 'percentage');
      expect(suggestions).toHaveLength(0);
    });
  });
});
