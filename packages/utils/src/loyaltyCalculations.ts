/**
 * Loyalty Program Calculation Utilities
 * Handles points earning, redemption, and tier evaluation
 * PRD Reference: 2.3.7 Loyalty Program
 */

import type {
  Client,
  LoyaltyTier,
  LoyaltyInfo,
  LoyaltyCalculationResult,
  EarnPointsInput,
} from '@mango/types';

// ============================================================================
// Local type definitions (different from @mango/types LoyaltyTierConfig entity)
// These are configuration objects used for tier calculation, not DB entities
// ============================================================================

/** Local tier configuration for loyalty calculations */
interface LocalLoyaltyTierConfig {
  tier: LoyaltyTier;
  name: string;
  minSpend: number;
  pointsMultiplier: number;
  color: string;
  benefits: string[];
}

/** Local loyalty settings that uses the calculation-specific tier config */
interface LoyaltySettings {
  enabled: boolean;
  pointsPerDollar: number;
  pointsRedemptionRate: number;
  eligibleItems: ('services' | 'products' | 'memberships' | 'packages')[];
  includeTaxInCalculation: boolean;
  pointsExpire: boolean;
  expirationMonths: number;
  tierSystem: LocalLoyaltyTierConfig[];
  tierEvaluationPeriod: 'lifetime' | 'rolling_12_months';
  bonusEventsEnabled: boolean;
}

// ============================================================================
// Default loyalty configuration (inlined from loyaltyConfig)
// ============================================================================

/** Default tier configuration matching PRD thresholds */
const DEFAULT_TIER_CONFIG: LocalLoyaltyTierConfig[] = [
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
  pointsPerDollar: 1,
  pointsRedemptionRate: 100,
  eligibleItems: ['services', 'products'],
  includeTaxInCalculation: false,
  pointsExpire: false,
  expirationMonths: 0,
  tierSystem: DEFAULT_TIER_CONFIG,
  tierEvaluationPeriod: 'lifetime',
  bonusEventsEnabled: false,
};

/**
 * Get tier configuration by tier name
 */
export function getTierConfig(tier: LoyaltyTier, settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS): LocalLoyaltyTierConfig {
  const config = settings.tierSystem.find((t: LocalLoyaltyTierConfig) => t.tier === tier);
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
 * Calculate loyalty points to be earned from a transaction
 * and determine if tier should change
 */
export function calculateLoyaltyEarnings(
  client: Client,
  input: EarnPointsInput,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): LoyaltyCalculationResult {
  // Check if loyalty is enabled and client is not excluded
  if (!settings.enabled || client.loyaltyInfo?.excludeFromLoyalty) {
    return {
      pointsEarned: 0,
      tierMultiplier: 1,
      eligibleAmount: 0,
      newTotalPoints: client.loyaltyInfo?.pointsBalance || 0,
      newLifetimePoints: client.loyaltyInfo?.lifetimePoints || 0,
      tierChanged: false,
    };
  }

  // Calculate eligible amount based on settings
  let eligibleAmount = 0;

  if (settings.eligibleItems.includes('services')) {
    eligibleAmount += input.servicesTotal;
  }
  if (settings.eligibleItems.includes('products')) {
    eligibleAmount += input.productsTotal;
  }
  if (settings.includeTaxInCalculation && input.taxAmount) {
    eligibleAmount += input.taxAmount;
  }

  // Get current tier and calculate points
  const currentTier = client.loyaltyInfo?.tier || 'bronze';
  const tierConfig = getTierConfig(currentTier, settings);
  const pointsEarned = calculatePointsEarned(eligibleAmount, currentTier, settings);

  // Calculate new totals
  const currentPoints = client.loyaltyInfo?.pointsBalance || 0;
  const currentLifetimePoints = client.loyaltyInfo?.lifetimePoints || 0;
  const newTotalPoints = currentPoints + pointsEarned;
  const newLifetimePoints = currentLifetimePoints + pointsEarned;

  // Calculate new lifetime spend and check for tier change
  const currentLifetimeSpend = client.visitSummary?.totalSpent || 0;
  const newLifetimeSpend = currentLifetimeSpend + input.subtotal;
  const newTier = getTierBySpend(newLifetimeSpend, settings);
  const tierChanged = newTier !== currentTier;

  return {
    pointsEarned,
    tierMultiplier: tierConfig.pointsMultiplier,
    eligibleAmount,
    newTotalPoints,
    newLifetimePoints,
    tierChanged,
    newTier: tierChanged ? newTier : undefined,
    previousTier: tierChanged ? currentTier : undefined,
  };
}

/**
 * Build updated loyalty info after earning points
 */
export function buildUpdatedLoyaltyInfo(
  currentLoyaltyInfo: LoyaltyInfo | undefined,
  calculationResult: LoyaltyCalculationResult
): LoyaltyInfo {
  const now = new Date().toISOString();

  return {
    tier: calculationResult.newTier || currentLoyaltyInfo?.tier || 'bronze',
    pointsBalance: calculationResult.newTotalPoints,
    lifetimePoints: calculationResult.newLifetimePoints,
    memberSince: currentLoyaltyInfo?.memberSince || now,
    lastTierUpdate: calculationResult.tierChanged ? now : currentLoyaltyInfo?.lastTierUpdate,
    referralCode: currentLoyaltyInfo?.referralCode,
    referredBy: currentLoyaltyInfo?.referredBy,
    referralCount: currentLoyaltyInfo?.referralCount || 0,
    rewardsRedeemed: currentLoyaltyInfo?.rewardsRedeemed || 0,
    excludeFromLoyalty: currentLoyaltyInfo?.excludeFromLoyalty,
  };
}

/**
 * Build updated loyalty info after redeeming points
 */
export function buildLoyaltyInfoAfterRedemption(
  currentLoyaltyInfo: LoyaltyInfo | undefined,
  pointsRedeemed: number
): LoyaltyInfo {
  const currentPoints = currentLoyaltyInfo?.pointsBalance || 0;

  return {
    tier: currentLoyaltyInfo?.tier || 'bronze',
    pointsBalance: Math.max(0, currentPoints - pointsRedeemed),
    lifetimePoints: currentLoyaltyInfo?.lifetimePoints || 0,
    memberSince: currentLoyaltyInfo?.memberSince,
    lastTierUpdate: currentLoyaltyInfo?.lastTierUpdate,
    referralCode: currentLoyaltyInfo?.referralCode,
    referredBy: currentLoyaltyInfo?.referredBy,
    referralCount: currentLoyaltyInfo?.referralCount || 0,
    rewardsRedeemed: (currentLoyaltyInfo?.rewardsRedeemed || 0) + 1,
    excludeFromLoyalty: currentLoyaltyInfo?.excludeFromLoyalty,
  };
}

/**
 * Check if client can redeem a specific number of points
 */
export function canRedeemPoints(
  client: Client,
  pointsToRedeem: number,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): { canRedeem: boolean; reason?: string } {
  if (!settings.enabled) {
    return { canRedeem: false, reason: 'Loyalty program is disabled' };
  }

  if (client.loyaltyInfo?.excludeFromLoyalty) {
    return { canRedeem: false, reason: 'Client is excluded from loyalty program' };
  }

  const availablePoints = client.loyaltyInfo?.pointsBalance || 0;

  if (pointsToRedeem > availablePoints) {
    return { canRedeem: false, reason: `Insufficient points. Available: ${availablePoints}` };
  }

  if (pointsToRedeem < settings.pointsRedemptionRate) {
    return { canRedeem: false, reason: `Minimum redemption: ${settings.pointsRedemptionRate} points` };
  }

  return { canRedeem: true };
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Get tier display name and color
 */
export function getTierDisplay(
  tier: LoyaltyTier,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): { name: string; color: string } {
  const config = getTierConfig(tier, settings);
  return {
    name: config.name,
    color: config.color,
  };
}

/**
 * Calculate progress to next tier
 */
export function calculateTierProgress(
  lifetimeSpend: number,
  currentTier: LoyaltyTier,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS
): { nextTier: LoyaltyTier | null; amountNeeded: number; percentProgress: number } {
  const sortedTiers = [...settings.tierSystem].sort((a, b) => a.minSpend - b.minSpend);
  const currentTierIndex = sortedTiers.findIndex(t => t.tier === currentTier);

  // If already at highest tier
  if (currentTierIndex === sortedTiers.length - 1) {
    return { nextTier: null, amountNeeded: 0, percentProgress: 100 };
  }

  const currentTierConfig = sortedTiers[currentTierIndex];
  const nextTierConfig = sortedTiers[currentTierIndex + 1];

  const amountNeeded = nextTierConfig.minSpend - lifetimeSpend;
  const tierRange = nextTierConfig.minSpend - currentTierConfig.minSpend;
  const progress = lifetimeSpend - currentTierConfig.minSpend;
  const percentProgress = Math.min(100, Math.max(0, (progress / tierRange) * 100));

  return {
    nextTier: nextTierConfig.tier,
    amountNeeded: Math.max(0, amountNeeded),
    percentProgress,
  };
}
