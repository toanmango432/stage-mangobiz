/**
 * Price Comparison Utilities Tests
 * Tests for price change detection, formatting, and decision recommendation
 */

import { describe, it, expect } from 'vitest';
import {
  detectPriceChange,
  formatPriceVariance,
  isSignificantVariance,
  getPriceDecisionRecommendation,
  DEFAULT_VARIANCE_THRESHOLDS,
  type PriceChangeResult,
  type VarianceThresholds,
} from '../priceComparisonUtils';

describe('priceComparisonUtils', () => {
  // ============================================
  // detectPriceChange
  // ============================================
  describe('detectPriceChange', () => {
    it('should detect no change when prices are equal', () => {
      const result = detectPriceChange(50, 50);
      expect(result.hasChange).toBe(false);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
      expect(result.direction).toBe('none');
    });

    it('should detect price increase', () => {
      const result = detectPriceChange(50, 55);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(5);
      expect(result.variancePercent).toBe(10);
      expect(result.direction).toBe('increase');
    });

    it('should detect price decrease', () => {
      const result = detectPriceChange(100, 80);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(-20);
      expect(result.variancePercent).toBe(-20);
      expect(result.direction).toBe('decrease');
    });

    it('should handle null booked price gracefully', () => {
      const result = detectPriceChange(null, 55);
      expect(result.hasChange).toBe(false);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
      expect(result.direction).toBe('none');
    });

    it('should handle null catalog price gracefully', () => {
      const result = detectPriceChange(50, null);
      expect(result.hasChange).toBe(false);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
      expect(result.direction).toBe('none');
    });

    it('should handle undefined prices gracefully', () => {
      const result = detectPriceChange(undefined, undefined);
      expect(result.hasChange).toBe(false);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
      expect(result.direction).toBe('none');
    });

    it('should handle zero booked price', () => {
      const result = detectPriceChange(0, 50);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(50);
      expect(result.variancePercent).toBe(0); // Cannot calculate percent of zero
      expect(result.direction).toBe('increase');
    });

    it('should handle negative booked price', () => {
      const result = detectPriceChange(-10, 50);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(50);
      expect(result.variancePercent).toBe(0); // Cannot calculate percent of negative
      expect(result.direction).toBe('increase');
    });

    it('should handle floating-point precision', () => {
      // 49.99 to 50.00 should show small increase
      const result = detectPriceChange(49.99, 50);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(0.01);
      expect(result.direction).toBe('increase');
    });

    it('should handle very small price changes below tolerance', () => {
      // Very small change within tolerance (0.001)
      const result = detectPriceChange(50, 50.0001);
      expect(result.hasChange).toBe(false);
      expect(result.direction).toBe('none');
    });

    it('should calculate correct percentage for large decrease', () => {
      const result = detectPriceChange(200, 100);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(-100);
      expect(result.variancePercent).toBe(-50);
      expect(result.direction).toBe('decrease');
    });

    it('should calculate correct percentage for small values', () => {
      const result = detectPriceChange(10, 15);
      expect(result.hasChange).toBe(true);
      expect(result.variance).toBe(5);
      expect(result.variancePercent).toBe(50);
      expect(result.direction).toBe('increase');
    });
  });

  // ============================================
  // formatPriceVariance
  // ============================================
  describe('formatPriceVariance', () => {
    it('should format positive variance with plus sign', () => {
      expect(formatPriceVariance(5, 10)).toBe('+$5.00 (+10%)');
    });

    it('should format negative variance with minus sign', () => {
      expect(formatPriceVariance(-20, -20)).toBe('-$20.00 (-20%)');
    });

    it('should format zero variance without sign', () => {
      expect(formatPriceVariance(0, 0)).toBe('$0.00 (0%)');
    });

    it('should format small increase correctly', () => {
      expect(formatPriceVariance(2.50, 5)).toBe('+$2.50 (+5%)');
    });

    it('should format large variance correctly', () => {
      expect(formatPriceVariance(100, 50)).toBe('+$100.00 (+50%)');
    });

    it('should round percentage to whole number', () => {
      expect(formatPriceVariance(5.55, 11.11)).toBe('+$5.55 (+11%)');
    });

    it('should always show two decimal places for amount', () => {
      expect(formatPriceVariance(5, 10)).toBe('+$5.00 (+10%)');
      expect(formatPriceVariance(5.1, 10)).toBe('+$5.10 (+10%)');
    });

    it('should handle negative percentage with negative amount', () => {
      expect(formatPriceVariance(-15.75, -15)).toBe('-$15.75 (-15%)');
    });

    it('should round amount to cents', () => {
      expect(formatPriceVariance(5.555, 10)).toBe('+$5.56 (+10%)');
    });
  });

  // ============================================
  // isSignificantVariance
  // ============================================
  describe('isSignificantVariance', () => {
    it('should return true when variance exceeds amount threshold', () => {
      // $6 > $5 threshold
      expect(isSignificantVariance(6, 5)).toBe(true);
    });

    it('should return true when variance exceeds percent threshold', () => {
      // 15% > 10% threshold
      expect(isSignificantVariance(3, 15)).toBe(true);
    });

    it('should return false when below both thresholds', () => {
      // $2 < $5 and 5% < 10%
      expect(isSignificantVariance(2, 5)).toBe(false);
    });

    it('should return true when at exact amount threshold', () => {
      // $5 >= $5 threshold
      expect(isSignificantVariance(5, 5)).toBe(true);
    });

    it('should return true when at exact percent threshold', () => {
      // 10% >= 10% threshold
      expect(isSignificantVariance(3, 10)).toBe(true);
    });

    it('should use absolute values for negative variance', () => {
      // -$6 absolute > $5 threshold
      expect(isSignificantVariance(-6, -5)).toBe(true);
    });

    it('should use absolute values for negative percent', () => {
      // -15% absolute > 10% threshold
      expect(isSignificantVariance(-3, -15)).toBe(true);
    });

    it('should support custom thresholds', () => {
      const customThresholds: VarianceThresholds = {
        amountThreshold: 10,
        percentThreshold: 20,
      };
      // $8 < $10 and 5% < 20% with custom thresholds
      expect(isSignificantVariance(8, 5, customThresholds)).toBe(false);
      // $12 > $10 with custom thresholds
      expect(isSignificantVariance(12, 5, customThresholds)).toBe(true);
      // 25% > 20% with custom thresholds
      expect(isSignificantVariance(5, 25, customThresholds)).toBe(true);
    });

    it('should use default thresholds when not specified', () => {
      // Verify default thresholds are $5 and 10%
      expect(DEFAULT_VARIANCE_THRESHOLDS.amountThreshold).toBe(5);
      expect(DEFAULT_VARIANCE_THRESHOLDS.percentThreshold).toBe(10);
    });

    it('should handle zero variance', () => {
      expect(isSignificantVariance(0, 0)).toBe(false);
    });

    it('should handle edge case: just below both thresholds', () => {
      expect(isSignificantVariance(4.99, 9.99)).toBe(false);
    });
  });

  // ============================================
  // getPriceDecisionRecommendation
  // ============================================
  describe('getPriceDecisionRecommendation', () => {
    describe('deposit lock (highest priority)', () => {
      it('should always return booked price with deposit_locked when deposit paid', () => {
        const result = getPriceDecisionRecommendation('use_current', 50, 60, { depositPaid: true });
        expect(result.recommendedPrice).toBe(50);
        expect(result.priceDecision).toBe('deposit_locked');
        expect(result.requiresStaffInput).toBe(false);
        expect(result.requiresManagerApproval).toBe(false);
      });

      it('should override all modes when deposit paid', () => {
        // Test with each mode
        const modes = ['honor_booked', 'use_current', 'honor_lower', 'ask_staff'] as const;
        for (const mode of modes) {
          const result = getPriceDecisionRecommendation(mode, 50, 60, { depositPaid: true });
          expect(result.recommendedPrice).toBe(50);
          expect(result.priceDecision).toBe('deposit_locked');
        }
      });

      it('should lock deposit even when catalog price is lower', () => {
        const result = getPriceDecisionRecommendation('honor_lower', 60, 50, { depositPaid: true });
        expect(result.recommendedPrice).toBe(60);
        expect(result.priceDecision).toBe('deposit_locked');
      });
    });

    describe('no price change', () => {
      it('should return booked_honored when prices are equal', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50, 50);
        expect(result.recommendedPrice).toBe(50);
        expect(result.priceDecision).toBe('booked_honored');
        expect(result.requiresStaffInput).toBe(false);
        expect(result.requiresManagerApproval).toBe(false);
      });

      it('should not require staff input when no change in ask_staff mode', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 75.99, 75.99);
        expect(result.requiresStaffInput).toBe(false);
      });
    });

    describe('honor_booked mode', () => {
      it('should always return booked price', () => {
        const result = getPriceDecisionRecommendation('honor_booked', 50, 60);
        expect(result.recommendedPrice).toBe(50);
        expect(result.priceDecision).toBe('booked_honored');
        expect(result.requiresStaffInput).toBe(false);
      });

      it('should honor booked even when catalog is lower', () => {
        const result = getPriceDecisionRecommendation('honor_booked', 60, 50);
        expect(result.recommendedPrice).toBe(60);
        expect(result.priceDecision).toBe('booked_honored');
      });
    });

    describe('use_current mode', () => {
      it('should always return catalog price', () => {
        const result = getPriceDecisionRecommendation('use_current', 50, 60);
        expect(result.recommendedPrice).toBe(60);
        expect(result.priceDecision).toBe('catalog_applied');
        expect(result.requiresStaffInput).toBe(false);
      });

      it('should use current when catalog is lower', () => {
        const result = getPriceDecisionRecommendation('use_current', 60, 50);
        expect(result.recommendedPrice).toBe(50);
        expect(result.priceDecision).toBe('catalog_applied');
      });
    });

    describe('honor_lower mode', () => {
      it('should return catalog price when it is lower', () => {
        const result = getPriceDecisionRecommendation('honor_lower', 50, 45);
        expect(result.recommendedPrice).toBe(45);
        expect(result.priceDecision).toBe('lower_applied');
        expect(result.requiresStaffInput).toBe(false);
      });

      it('should return booked price when it is lower', () => {
        const result = getPriceDecisionRecommendation('honor_lower', 45, 50);
        expect(result.recommendedPrice).toBe(45);
        expect(result.priceDecision).toBe('booked_honored');
        expect(result.requiresStaffInput).toBe(false);
      });

      it('should return booked when prices are equal', () => {
        const result = getPriceDecisionRecommendation('honor_lower', 50, 50);
        expect(result.recommendedPrice).toBe(50);
        expect(result.priceDecision).toBe('booked_honored');
      });
    });

    describe('ask_staff mode', () => {
      it('should require staff input when prices differ', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50, 60);
        expect(result.requiresStaffInput).toBe(true);
        expect(result.recommendedPrice).toBe(50); // Default to booked (client-friendly)
        expect(result.priceDecision).toBe('booked_honored');
      });

      it('should require staff input when catalog is lower without autoApplyLower', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 60, 50);
        expect(result.requiresStaffInput).toBe(true);
      });

      it('should auto-apply lower price when autoApplyLower is enabled and catalog dropped', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 60, 50, { autoApplyLower: true });
        expect(result.recommendedPrice).toBe(50);
        expect(result.priceDecision).toBe('lower_applied');
        expect(result.requiresStaffInput).toBe(false);
      });

      it('should still require staff input when catalog increased even with autoApplyLower', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50, 60, { autoApplyLower: true });
        expect(result.requiresStaffInput).toBe(true);
        expect(result.recommendedPrice).toBe(50);
      });

      it('should not require staff input when no price change', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50, 50, { autoApplyLower: true });
        expect(result.requiresStaffInput).toBe(false);
      });
    });

    describe('autoApplyLower flag behavior', () => {
      it('should only affect ask_staff mode', () => {
        // honor_booked mode should ignore autoApplyLower
        const result1 = getPriceDecisionRecommendation('honor_booked', 60, 50, { autoApplyLower: true });
        expect(result1.recommendedPrice).toBe(60);
        expect(result1.priceDecision).toBe('booked_honored');

        // use_current mode should ignore autoApplyLower
        const result2 = getPriceDecisionRecommendation('use_current', 60, 50, { autoApplyLower: true });
        expect(result2.recommendedPrice).toBe(50);
        expect(result2.priceDecision).toBe('catalog_applied');
      });

      it('should not apply when price increased', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50, 60, { autoApplyLower: true });
        expect(result.priceDecision).toBe('booked_honored');
        expect(result.requiresStaffInput).toBe(true);
      });
    });

    describe('requiresManagerApproval field', () => {
      it('should always return false (handled by caller based on thresholds)', () => {
        const result1 = getPriceDecisionRecommendation('ask_staff', 50, 100);
        expect(result1.requiresManagerApproval).toBe(false);

        const result2 = getPriceDecisionRecommendation('use_current', 50, 100);
        expect(result2.requiresManagerApproval).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle very small price differences', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50.00, 50.01);
        expect(result.requiresStaffInput).toBe(true); // Prices are different
      });

      it('should handle large price differences', () => {
        const result = getPriceDecisionRecommendation('ask_staff', 50, 500);
        expect(result.requiresStaffInput).toBe(true);
      });

      it('should handle decimal prices correctly', () => {
        const result = getPriceDecisionRecommendation('honor_lower', 29.99, 24.99);
        expect(result.recommendedPrice).toBe(24.99);
        expect(result.priceDecision).toBe('lower_applied');
      });

      it('should default to ask_staff behavior for unknown modes', () => {
        // TypeScript would normally prevent this, but testing runtime safety
        const result = getPriceDecisionRecommendation('unknown_mode' as any, 50, 60);
        expect(result.requiresStaffInput).toBe(true);
      });
    });
  });

  // ============================================
  // Constants
  // ============================================
  describe('constants', () => {
    it('should have correct default variance thresholds', () => {
      expect(DEFAULT_VARIANCE_THRESHOLDS).toEqual({
        amountThreshold: 5.00,
        percentThreshold: 10,
      });
    });
  });
});
