/**
 * Loyalty Program Types
 * PRD Reference: 2.3.7 Loyalty Program
 */

import type { LoyaltyTier, LoyaltyTierConfig } from './client';

// Re-export from client for convenience
export type { LoyaltyTierConfig };

/** Eligible item types for earning points */
export type LoyaltyEligibleItem = 'services' | 'products' | 'memberships' | 'packages';

/** Loyalty program settings (store-level configuration) */
export interface LoyaltySettings {
  // Core settings
  enabled: boolean;
  pointsPerDollar: number;              // Base points earned per dollar spent (default: 1)
  pointsRedemptionRate: number;         // Points needed per $1 discount (default: 100)

  // Eligible items
  eligibleItems: LoyaltyEligibleItem[];
  includeTaxInCalculation: boolean;     // Include taxes when calculating points

  // Points expiration
  pointsExpire: boolean;
  expirationMonths: number;             // Months until points expire (0 = never)

  // Tier system
  tierSystem: LoyaltyTierConfig[];
  tierEvaluationPeriod: 'lifetime' | 'rolling_12_months';

  // Bonus events (future feature)
  bonusEventsEnabled: boolean;
}

/** Points transaction record */
export interface PointsTransaction {
  id: string;
  clientId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
  points: number;              // Positive for earned/bonus, negative for redeemed/expired
  description: string;
  transactionId?: string;      // Link to sales transaction
  ticketId?: string;           // Link to ticket
  adjustedBy?: string;         // Staff ID for manual adjustments
  createdAt: string;
}

/** Result of loyalty points calculation */
export interface LoyaltyCalculationResult {
  pointsEarned: number;
  tierMultiplier: number;
  eligibleAmount: number;
  newTotalPoints: number;
  newLifetimePoints: number;
  tierChanged: boolean;
  newTier?: LoyaltyTier;
  previousTier?: LoyaltyTier;
}

/** Input for earning points */
export interface EarnPointsInput {
  clientId: string;
  transactionId: string;
  ticketId?: string;
  subtotal: number;
  servicesTotal: number;
  productsTotal: number;
  includeTax?: boolean;
  taxAmount?: number;
}

/** Input for redeeming points */
export interface RedeemPointsInput {
  clientId: string;
  pointsToRedeem: number;
  transactionId?: string;
  ticketId?: string;
}
