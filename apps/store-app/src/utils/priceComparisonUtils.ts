/**
 * Price Comparison Utilities
 *
 * Provides utility functions for detecting, calculating, and formatting
 * price changes between booking and checkout. These functions are pure
 * and have no dependencies on Redux or React.
 *
 * @module priceComparisonUtils
 */

import { roundToCents, subtractAmount } from './currency';
import type { PriceDecision } from '../types/Ticket';
import type { PricingPolicyMode } from '../types/settings';

// ============================================
// TYPES
// ============================================

/**
 * Direction of price change: increased, decreased, or no change.
 */
export type PriceChangeDirection = 'increase' | 'decrease' | 'none';

/**
 * Result of price change detection.
 */
export interface PriceChangeResult {
  /** Whether there is a price difference between booked and catalog prices */
  hasChange: boolean;
  /** Absolute variance (finalPrice - bookedPrice). Positive = increase, negative = decrease. */
  variance: number;
  /** Variance as a percentage of booked price (e.g., 10 for 10%). */
  variancePercent: number;
  /** Direction of the price change */
  direction: PriceChangeDirection;
}

/**
 * Thresholds for determining if a variance is significant.
 */
export interface VarianceThresholds {
  /** Absolute dollar amount threshold (e.g., 5 for $5.00) */
  amountThreshold: number;
  /** Percentage threshold (e.g., 10 for 10%) */
  percentThreshold: number;
}

// ============================================
// DEFAULT THRESHOLDS
// ============================================

/**
 * Default thresholds for determining significant price variance.
 * Variance is considered significant if it exceeds EITHER threshold.
 *
 * - Amount: $5.00 or more
 * - Percentage: 10% or more
 */
export const DEFAULT_VARIANCE_THRESHOLDS: VarianceThresholds = {
  amountThreshold: 5.00,
  percentThreshold: 10,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Detect price change between booked price and current catalog price.
 *
 * Compares two prices and calculates the variance (difference) and
 * variance percentage. Returns a structured result with change direction.
 *
 * @param bookedPrice - The original price captured at booking time.
 *                      If null/undefined, returns no change result.
 * @param catalogPrice - The current catalog price at checkout time.
 *                       If null/undefined, returns no change result.
 * @returns Object containing hasChange, variance, variancePercent, and direction.
 *
 * @example
 * // Price increased from $50 to $55
 * detectPriceChange(50, 55);
 * // Returns: { hasChange: true, variance: 5, variancePercent: 10, direction: 'increase' }
 *
 * @example
 * // Price decreased from $100 to $80
 * detectPriceChange(100, 80);
 * // Returns: { hasChange: true, variance: -20, variancePercent: -20, direction: 'decrease' }
 *
 * @example
 * // No price change
 * detectPriceChange(75, 75);
 * // Returns: { hasChange: false, variance: 0, variancePercent: 0, direction: 'none' }
 *
 * @example
 * // Handle missing prices gracefully
 * detectPriceChange(null, 55);
 * // Returns: { hasChange: false, variance: 0, variancePercent: 0, direction: 'none' }
 */
export function detectPriceChange(
  bookedPrice: number | null | undefined,
  catalogPrice: number | null | undefined
): PriceChangeResult {
  // Handle missing prices - treat as no change
  if (bookedPrice == null || catalogPrice == null) {
    return {
      hasChange: false,
      variance: 0,
      variancePercent: 0,
      direction: 'none',
    };
  }

  // Handle zero or negative booked price - avoid division by zero
  if (bookedPrice <= 0) {
    const variance = roundToCents(catalogPrice);
    return {
      hasChange: catalogPrice !== 0,
      variance,
      variancePercent: 0, // Cannot calculate percent of zero
      direction: catalogPrice > 0 ? 'increase' : catalogPrice < 0 ? 'decrease' : 'none',
    };
  }

  // Calculate variance (catalog - booked)
  const variance = subtractAmount(catalogPrice, bookedPrice);

  // Calculate percentage: ((catalog - booked) / booked) * 100
  const variancePercent = roundToCents((variance / bookedPrice) * 100);

  // Determine direction
  let direction: PriceChangeDirection = 'none';
  if (variance > 0.001) {
    direction = 'increase';
  } else if (variance < -0.001) {
    direction = 'decrease';
  }

  // Use tolerance for hasChange check (handles floating point precision)
  const hasChange = Math.abs(variance) > 0.001;

  return {
    hasChange,
    variance,
    variancePercent,
    direction,
  };
}

/**
 * Format price variance for display in UI.
 *
 * Creates a human-readable string showing the variance amount and percentage.
 * Positive variances are prefixed with '+', negative with '-'.
 *
 * @param variance - The absolute variance amount (positive or negative).
 * @param variancePercent - The variance as a percentage (positive or negative).
 * @returns Formatted string like '+$5.00 (+10%)' or '-$10.00 (-20%)'.
 *
 * @example
 * // Price increased
 * formatPriceVariance(5, 10);
 * // Returns: '+$5.00 (+10%)'
 *
 * @example
 * // Price decreased
 * formatPriceVariance(-20, -20);
 * // Returns: '-$20.00 (-20%)'
 *
 * @example
 * // No change
 * formatPriceVariance(0, 0);
 * // Returns: '$0.00 (0%)'
 *
 * @example
 * // Small increase
 * formatPriceVariance(2.50, 5);
 * // Returns: '+$2.50 (+5%)'
 */
export function formatPriceVariance(variance: number, variancePercent: number): string {
  const roundedVariance = roundToCents(variance);
  const roundedPercent = Math.round(variancePercent);

  // Determine sign prefix
  const amountSign = roundedVariance > 0 ? '+' : roundedVariance < 0 ? '' : '';
  const percentSign = roundedPercent > 0 ? '+' : roundedPercent < 0 ? '' : '';

  // Format amount as currency (always show 2 decimal places)
  const formattedAmount = `$${Math.abs(roundedVariance).toFixed(2)}`;
  const amountWithSign = roundedVariance < 0
    ? `-${formattedAmount}`
    : `${amountSign}${formattedAmount}`;

  // Format percentage
  const formattedPercent = `${percentSign}${roundedPercent}%`;

  return `${amountWithSign} (${formattedPercent})`;
}

/**
 * Determine if a price variance is significant based on thresholds.
 *
 * A variance is considered significant if it exceeds EITHER the amount
 * threshold OR the percentage threshold. This is an OR condition, not AND.
 *
 * @param variance - The absolute variance amount (positive or negative).
 * @param variancePercent - The variance as a percentage (positive or negative).
 * @param thresholds - Optional custom thresholds. Defaults to $5.00 / 10%.
 * @returns True if variance is significant (exceeds either threshold).
 *
 * @example
 * // Significant by amount ($6 > $5 threshold)
 * isSignificantVariance(6, 5);
 * // Returns: true
 *
 * @example
 * // Significant by percentage (15% > 10% threshold)
 * isSignificantVariance(3, 15);
 * // Returns: true
 *
 * @example
 * // Not significant (below both thresholds)
 * isSignificantVariance(2, 5);
 * // Returns: false
 *
 * @example
 * // At threshold (equals threshold, considered significant)
 * isSignificantVariance(5, 10);
 * // Returns: true
 *
 * @example
 * // Custom thresholds
 * isSignificantVariance(8, 5, { amountThreshold: 10, percentThreshold: 20 });
 * // Returns: false (8 < 10 and 5 < 20)
 */
export function isSignificantVariance(
  variance: number,
  variancePercent: number,
  thresholds: VarianceThresholds = DEFAULT_VARIANCE_THRESHOLDS
): boolean {
  const absVariance = Math.abs(variance);
  const absPercent = Math.abs(variancePercent);

  // Significant if variance >= amount threshold OR >= percent threshold
  return absVariance >= thresholds.amountThreshold ||
         absPercent >= thresholds.percentThreshold;
}

// ============================================
// TYPES FOR PRICE DECISION RECOMMENDATION
// ============================================

/**
 * Options for price decision recommendation.
 */
export interface PriceDecisionOptions {
  /** Whether a deposit has been paid (locks price) */
  depositPaid?: boolean;
  /** Whether to auto-apply lower prices (from policy settings) */
  autoApplyLower?: boolean;
}

/**
 * Result of price decision recommendation.
 */
export interface PriceDecisionRecommendation {
  /** The recommended price to charge */
  recommendedPrice: number;
  /** The decision type (how the price was determined) */
  priceDecision: PriceDecision;
  /** Whether staff input is required to finalize the price */
  requiresStaffInput: boolean;
  /** Whether manager approval is required for this decision */
  requiresManagerApproval: boolean;
}

// ============================================
// PRICE DECISION RECOMMENDATION
// ============================================

/**
 * Get price decision recommendation based on policy mode and options.
 *
 * This is the core decision engine that determines which price to use
 * when there's a difference between the booked price and the current
 * catalog price. The recommendation accounts for:
 *
 * 1. **Deposit Lock** - If deposit is paid, price is always locked
 * 2. **Policy Mode** - Honor booked, use current, ask staff, or honor lower
 * 3. **Auto-Apply Lower** - When enabled with 'ask_staff', lower prices apply automatically
 *
 * Priority order:
 * 1. Deposit lock (always takes priority)
 * 2. Policy mode rules
 * 3. Auto-apply lower (only with 'ask_staff' mode)
 *
 * @param mode - The pricing policy mode from settings.
 * @param bookedPrice - The original price captured at booking time.
 * @param catalogPrice - The current catalog price at checkout time.
 * @param options - Additional options (depositPaid, autoApplyLower).
 * @returns Recommendation with price, decision type, and input requirements.
 *
 * @example
 * // Deposit paid - price locked regardless of mode
 * getPriceDecisionRecommendation('use_current', 50, 60, { depositPaid: true });
 * // Returns: {
 * //   recommendedPrice: 50,
 * //   priceDecision: 'deposit_locked',
 * //   requiresStaffInput: false,
 * //   requiresManagerApproval: false
 * // }
 *
 * @example
 * // Honor booked mode - always use booked price
 * getPriceDecisionRecommendation('honor_booked', 50, 60);
 * // Returns: {
 * //   recommendedPrice: 50,
 * //   priceDecision: 'booked_honored',
 * //   requiresStaffInput: false,
 * //   requiresManagerApproval: false
 * // }
 *
 * @example
 * // Use current mode - always use catalog price
 * getPriceDecisionRecommendation('use_current', 50, 60);
 * // Returns: {
 * //   recommendedPrice: 60,
 * //   priceDecision: 'catalog_applied',
 * //   requiresStaffInput: false,
 * //   requiresManagerApproval: false
 * // }
 *
 * @example
 * // Ask staff mode with price difference - requires staff decision
 * getPriceDecisionRecommendation('ask_staff', 50, 60);
 * // Returns: {
 * //   recommendedPrice: 50,
 * //   priceDecision: 'booked_honored',
 * //   requiresStaffInput: true,
 * //   requiresManagerApproval: false
 * // }
 *
 * @example
 * // Ask staff mode with auto-apply lower - catalog is lower, auto-apply
 * getPriceDecisionRecommendation('ask_staff', 60, 50, { autoApplyLower: true });
 * // Returns: {
 * //   recommendedPrice: 50,
 * //   priceDecision: 'lower_applied',
 * //   requiresStaffInput: false,
 * //   requiresManagerApproval: false
 * // }
 *
 * @example
 * // Honor lower mode - automatically picks the lower price
 * getPriceDecisionRecommendation('honor_lower', 50, 45);
 * // Returns: {
 * //   recommendedPrice: 45,
 * //   priceDecision: 'lower_applied',
 * //   requiresStaffInput: false,
 * //   requiresManagerApproval: false
 * // }
 *
 * @example
 * // No price change - no decision needed
 * getPriceDecisionRecommendation('ask_staff', 50, 50);
 * // Returns: {
 * //   recommendedPrice: 50,
 * //   priceDecision: 'booked_honored',
 * //   requiresStaffInput: false,
 * //   requiresManagerApproval: false
 * // }
 */
export function getPriceDecisionRecommendation(
  mode: PricingPolicyMode,
  bookedPrice: number,
  catalogPrice: number,
  options: PriceDecisionOptions = {}
): PriceDecisionRecommendation {
  const { depositPaid = false, autoApplyLower = false } = options;

  // Check if there's actually a price difference
  const priceChange = detectPriceChange(bookedPrice, catalogPrice);

  // PRIORITY 1: Deposit lock - always takes precedence
  if (depositPaid) {
    return {
      recommendedPrice: bookedPrice,
      priceDecision: 'deposit_locked',
      requiresStaffInput: false,
      requiresManagerApproval: false,
    };
  }

  // If no price change, no decision needed - honor booked (same as catalog)
  if (!priceChange.hasChange) {
    return {
      recommendedPrice: bookedPrice,
      priceDecision: 'booked_honored',
      requiresStaffInput: false,
      requiresManagerApproval: false,
    };
  }

  // PRIORITY 2: Apply policy mode rules
  switch (mode) {
    case 'honor_booked':
      // Always use booked price
      return {
        recommendedPrice: bookedPrice,
        priceDecision: 'booked_honored',
        requiresStaffInput: false,
        requiresManagerApproval: false,
      };

    case 'use_current':
      // Always use current catalog price
      return {
        recommendedPrice: catalogPrice,
        priceDecision: 'catalog_applied',
        requiresStaffInput: false,
        requiresManagerApproval: false,
      };

    case 'honor_lower':
      // Automatically use the lower of the two prices
      if (catalogPrice < bookedPrice) {
        return {
          recommendedPrice: catalogPrice,
          priceDecision: 'lower_applied',
          requiresStaffInput: false,
          requiresManagerApproval: false,
        };
      } else {
        return {
          recommendedPrice: bookedPrice,
          priceDecision: 'booked_honored',
          requiresStaffInput: false,
          requiresManagerApproval: false,
        };
      }

    case 'ask_staff':
    default:
      // Check if auto-apply lower is enabled and catalog price dropped
      if (autoApplyLower && priceChange.direction === 'decrease') {
        return {
          recommendedPrice: catalogPrice,
          priceDecision: 'lower_applied',
          requiresStaffInput: false,
          requiresManagerApproval: false,
        };
      }

      // Prices differ, staff needs to decide
      // Default recommendation is booked price (client-friendly default)
      return {
        recommendedPrice: bookedPrice,
        priceDecision: 'booked_honored',
        requiresStaffInput: true,
        requiresManagerApproval: false,
      };
  }
}
