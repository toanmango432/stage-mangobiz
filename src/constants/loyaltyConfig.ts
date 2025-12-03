/**
 * Loyalty Program Configuration
 * Default settings for the loyalty program
 * PRD Reference: 2.3.7 Loyalty Program
 */

import type { LoyaltySettings, LoyaltyTierConfig } from '../types/loyalty';
import type { LoyaltyTier } from '../types/client';

/** Default tier configuration matching PRD thresholds */
export const DEFAULT_TIER_CONFIG: LoyaltyTierConfig[] = [
  {
    tier: 'bronze',
    name: 'Bronze',
    minSpend: 0,
    pointsMultiplier: 1.0,
    color: 'bg-amber-700 text-amber-50',
    benefits: ['Earn 1 point per $1 spent', 'Birthday reward'],
  },
  {
    tier: 'silver',
    name: 'Silver',
    minSpend: 500,
    pointsMultiplier: 1.25,
    color: 'bg-slate-400 text-slate-900',
    benefits: ['Earn 1.25 points per $1 spent', 'Birthday reward', 'Early access to promotions'],
  },
  {
    tier: 'gold',
    name: 'Gold',
    minSpend: 1500,
    pointsMultiplier: 1.5,
    color: 'bg-yellow-500 text-yellow-950',
    benefits: ['Earn 1.5 points per $1 spent', 'Birthday reward', 'Priority booking', 'Free add-on service'],
  },
  {
    tier: 'platinum',
    name: 'Platinum',
    minSpend: 5000,
    pointsMultiplier: 2.0,
    color: 'bg-slate-700 text-slate-50',
    benefits: ['Earn 2 points per $1 spent', 'Birthday reward', 'VIP priority', 'Complimentary upgrades', 'Exclusive events'],
  },
  {
    tier: 'vip',
    name: 'VIP',
    minSpend: 10000,
    pointsMultiplier: 2.5,
    color: 'bg-purple-600 text-purple-50',
    benefits: ['Earn 2.5 points per $1 spent', 'All Platinum benefits', 'Personal concierge', 'Surprise gifts'],
  },
];

/** Default loyalty settings */
export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerDollar: 1,                   // 1 point per $1 spent (base rate before tier multiplier)
  pointsRedemptionRate: 100,            // 100 points = $1 discount

  eligibleItems: ['services', 'products'],
  includeTaxInCalculation: false,

  pointsExpire: false,
  expirationMonths: 0,

  tierSystem: DEFAULT_TIER_CONFIG,
  tierEvaluationPeriod: 'lifetime',

  bonusEventsEnabled: false,
};

/** Points per dollar for redemption (100 points = $1) */
export const POINTS_PER_DOLLAR_REDEMPTION = 100;

/**
 * Get tier configuration by tier name
 */
export function getTierConfig(tier: LoyaltyTier, settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS): LoyaltyTierConfig {
  const config = settings.tierSystem.find(t => t.tier === tier);
  return config || settings.tierSystem[0]; // Default to bronze if not found
}

/**
 * Get tier by lifetime spend amount
 */
export function getTierBySpend(lifetimeSpend: number, settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS): LoyaltyTier {
  // Sort tiers by minSpend descending to find highest qualifying tier
  const sortedTiers = [...settings.tierSystem].sort((a, b) => b.minSpend - a.minSpend);

  for (const tierConfig of sortedTiers) {
    if (lifetimeSpend >= tierConfig.minSpend) {
      return tierConfig.tier;
    }
  }

  return 'bronze'; // Default to bronze
}

/**
 * Calculate points to be earned for a transaction
 */
export function calculatePointsEarned(
  eligibleAmount: number,
  tier: LoyaltyTier,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): number {
  const tierConfig = getTierConfig(tier, settings);
  const basePoints = eligibleAmount * settings.pointsPerDollar;
  const multipliedPoints = basePoints * tierConfig.pointsMultiplier;

  return Math.floor(multipliedPoints); // Round down to whole points
}

/**
 * Calculate discount value from points
 */
export function calculatePointsValue(
  points: number,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): number {
  return points / settings.pointsRedemptionRate;
}

/**
 * Calculate points needed for a given discount
 */
export function calculatePointsNeeded(
  discountAmount: number,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): number {
  return Math.ceil(discountAmount * settings.pointsRedemptionRate);
}
