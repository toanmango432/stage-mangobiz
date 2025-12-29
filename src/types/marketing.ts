/**
 * Marketing Types
 * PRD Reference: PRD-API-Specifications.md Section 4.3
 *
 * Marketing campaigns, promotions, client segments,
 * and loyalty account management.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Promotion type */
export type PromotionType = 'percentage' | 'fixed' | 'free-service' | 'buy-one-get-one';

/** Campaign status */
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

/** Campaign channel */
export type CampaignChannel = 'sms' | 'email' | 'push' | 'all';

/** Client segment type */
export type ClientSegmentType =
  | 'vip'                 // Top 20% by spend OR 10+ visits
  | 'new'                 // First visit within 30 days
  | 'returning'           // 2+ visits, active within 60 days
  | 'lapsed'              // No visit in 60-180 days
  | 'lost'                // No visit in 180+ days
  | 'birthday-this-month' // Birthday in current month
  | 'high-value'          // Average ticket > $X
  | 'custom';             // Custom segment

/** Loyalty tier */
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// ============================================
// PROMOTION ENTITY
// ============================================

/**
 * A promotional discount or offer.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Promotion extends BaseSyncableEntity {
  /** Promo code */
  code: string;

  /** Promotion name */
  name: string;

  /** Description */
  description?: string;

  /** Type of discount */
  type: PromotionType;

  /**
   * Value of the discount:
   * - percentage: 20 = 20% off
   * - fixed: 10 = $10 off
   * - free-service: serviceId
   * - buy-one-get-one: second item discount %
   */
  value: number;

  /** Start date */
  validFrom: string;

  /** End date */
  validTo: string;

  /** Maximum number of uses (null = unlimited) */
  usageLimit?: number;

  /** Current usage count */
  usageCount: number;

  /** Maximum uses per client */
  usagePerClient?: number;

  /** Minimum order amount to apply */
  minimumOrderAmount?: number;

  /** Specific services this applies to (empty = all) */
  serviceIds?: string[];

  /** Whether promotion is active */
  isActive: boolean;

  /** Whether it stacks with other promotions */
  isStackable: boolean;

  /** Auto-apply at checkout (no code needed) */
  autoApply: boolean;

  /** Client segments this is available to */
  targetSegments?: ClientSegmentType[];

  /** First-time clients only */
  newClientsOnly?: boolean;
}

// ============================================
// CAMPAIGN ENTITY
// ============================================

/**
 * A marketing campaign.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Campaign extends BaseSyncableEntity {
  /** Campaign name */
  name: string;

  /** Description */
  description?: string;

  /** Target client segment */
  segment: ClientSegmentType;

  /** Custom segment filter (when segment = 'custom') */
  customFilter?: CampaignFilter;

  /** Delivery channel */
  channel: CampaignChannel;

  /** Notification template ID */
  templateId: string;

  /** Template name (denormalized) */
  templateName?: string;

  /** Current status */
  status: CampaignStatus;

  /** Scheduled send time */
  scheduledAt?: string;

  /** Actual send time */
  sentAt?: string;

  /** Campaign creator */
  createdByName?: string;

  /** Campaign metrics */
  metrics: CampaignMetrics;

  /** Associated promotion (optional) */
  promotionId?: string;

  /** Promotion code (denormalized) */
  promotionCode?: string;

  /** A/B test variant (optional) */
  abTestVariant?: 'A' | 'B';

  /** Tags for organization */
  tags?: string[];
}

/**
 * Campaign targeting filter for custom segments.
 */
export interface CampaignFilter {
  /** Minimum spend amount */
  minSpend?: number;

  /** Maximum spend amount */
  maxSpend?: number;

  /** Minimum visits */
  minVisits?: number;

  /** Maximum visits */
  maxVisits?: number;

  /** Days since last visit */
  daysSinceLastVisit?: number;

  /** Specific services purchased */
  servicesPurchased?: string[];

  /** Staff member served by */
  servedBy?: string[];

  /** Has membership */
  hasMembership?: boolean;

  /** Has package */
  hasPackage?: boolean;

  /** Birthday month */
  birthdayMonth?: number;
}

/**
 * Campaign performance metrics.
 */
export interface CampaignMetrics {
  /** Total messages sent */
  sent: number;

  /** Messages delivered */
  delivered: number;

  /** Messages opened (email) */
  opened: number;

  /** Links clicked */
  clicked: number;

  /** Unsubscribes */
  unsubscribed: number;

  /** Conversions (bookings made) */
  conversions: number;

  /** Revenue attributed */
  revenue: number;

  /** Delivery rate */
  deliveryRate?: number;

  /** Open rate */
  openRate?: number;

  /** Click rate */
  clickRate?: number;

  /** Conversion rate */
  conversionRate?: number;

  /** Cost of campaign */
  cost?: number;

  /** ROI */
  roi?: number;
}

// ============================================
// CLIENT SEGMENT
// ============================================

/**
 * Definition of a client segment.
 */
export interface ClientSegment {
  /** Segment type */
  type: ClientSegmentType;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Number of clients in segment */
  count: number;

  /** Filter criteria */
  criteria: CampaignFilter;

  /** Whether this is a system segment */
  isSystem: boolean;

  /** Last calculated */
  calculatedAt: string;
}

// ============================================
// LOYALTY ACCOUNT
// ============================================

/**
 * A client's loyalty account.
 */
export interface LoyaltyAccount extends BaseSyncableEntity {
  /** Client ID */
  clientId: string;

  /** Client name (denormalized) */
  clientName?: string;

  /** Current points balance */
  points: number;

  /** Current tier */
  tier: LoyaltyTier;

  /** Lifetime points earned */
  lifetimePoints: number;

  /** Lifetime spend (for tier calculation) */
  lifetimeSpend: number;

  /** Total visits */
  totalVisits: number;

  /** When last earned points */
  lastEarnedAt?: string;

  /** When last redeemed points */
  lastRedeemedAt?: string;

  /** Points expiring soon */
  expiringPoints?: number;

  /** When points expire */
  pointsExpireAt?: string;

  /** Tier progress (percentage to next tier) */
  tierProgress?: number;

  /** Spend needed for next tier */
  spendToNextTier?: number;
}

/**
 * A loyalty points transaction.
 */
export interface LoyaltyTransaction extends BaseSyncableEntity {
  /** Client ID */
  clientId: string;

  /** Points amount (positive or negative) */
  amount: number;

  /** Transaction type */
  type: 'earn' | 'redeem' | 'adjust' | 'expire' | 'bonus';

  /** Description */
  description: string;

  /** Associated ticket */
  ticketId?: string;

  /** Associated appointment */
  appointmentId?: string;

  /** Balance after transaction */
  balanceAfter: number;

  /** Staff who processed (for adjustments) */
  processedBy?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating a promotion.
 */
export interface CreatePromotionInput {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usagePerClient?: number;
  minimumOrderAmount?: number;
  serviceIds?: string[];
  isStackable?: boolean;
  autoApply?: boolean;
  targetSegments?: ClientSegmentType[];
  newClientsOnly?: boolean;
}

/**
 * Input for creating a campaign.
 */
export interface CreateCampaignInput {
  name: string;
  description?: string;
  segment: ClientSegmentType;
  customFilter?: CampaignFilter;
  channel: CampaignChannel;
  templateId: string;
  scheduledAt?: string;
  promotionId?: string;
  tags?: string[];
}

/**
 * Input for adjusting loyalty points.
 */
export interface AdjustLoyaltyPointsInput {
  clientId: string;
  amount: number;
  type: 'adjust' | 'bonus';
  description: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets campaign status display info.
 */
export function getCampaignStatusInfo(status: CampaignStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'scheduled':
      return { label: 'Scheduled', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'sending':
      return { label: 'Sending', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'sent':
      return { label: 'Sent', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Gets loyalty tier display info.
 */
export function getLoyaltyTierInfo(tier: LoyaltyTier): {
  label: string;
  color: string;
  bgColor: string;
  multiplier: number;
} {
  switch (tier) {
    case 'bronze':
      return { label: 'Bronze', color: 'text-orange-700', bgColor: 'bg-orange-100', multiplier: 1 };
    case 'silver':
      return { label: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-200', multiplier: 1.25 };
    case 'gold':
      return { label: 'Gold', color: 'text-yellow-700', bgColor: 'bg-yellow-100', multiplier: 1.5 };
    case 'platinum':
      return {
        label: 'Platinum',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        multiplier: 2,
      };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50', multiplier: 1 };
  }
}

/**
 * Validates a promotion code format.
 */
export function isValidPromoCode(code: string): boolean {
  // Alphanumeric, 4-20 characters, no spaces
  return /^[A-Z0-9]{4,20}$/.test(code.toUpperCase());
}

/**
 * Checks if a promotion is currently valid.
 */
export function isPromotionValid(promo: Promotion): boolean {
  if (!promo.isActive) return false;

  const now = new Date();
  const validFrom = new Date(promo.validFrom);
  const validTo = new Date(promo.validTo);

  if (now < validFrom || now > validTo) return false;

  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return false;

  return true;
}

/**
 * Calculates discount amount for a promotion.
 */
export function calculatePromotionDiscount(
  promo: Promotion,
  subtotal: number
): number {
  if (!isPromotionValid(promo)) return 0;
  if (promo.minimumOrderAmount && subtotal < promo.minimumOrderAmount) return 0;

  switch (promo.type) {
    case 'percentage':
      return Math.round(subtotal * (promo.value / 100) * 100) / 100;
    case 'fixed':
      return Math.min(promo.value, subtotal);
    case 'free-service':
      return 0; // Applied to specific service
    case 'buy-one-get-one':
      return 0; // Calculated at item level
    default:
      return 0;
  }
}

/**
 * Creates default campaign metrics.
 */
export function createEmptyCampaignMetrics(): CampaignMetrics {
  return {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    conversions: 0,
    revenue: 0,
  };
}

/**
 * Determines loyalty tier based on lifetime spend.
 */
export function determineLoyaltyTier(lifetimeSpend: number): LoyaltyTier {
  if (lifetimeSpend >= 5000) return 'platinum';
  if (lifetimeSpend >= 2000) return 'gold';
  if (lifetimeSpend >= 500) return 'silver';
  return 'bronze';
}

/**
 * Gets default segment definitions.
 */
export function getDefaultSegments(): ClientSegment[] {
  return [
    {
      type: 'vip',
      name: 'VIP Clients',
      description: 'Top 20% by spend or 10+ visits',
      count: 0,
      criteria: { minVisits: 10 },
      isSystem: true,
      calculatedAt: new Date().toISOString(),
    },
    {
      type: 'new',
      name: 'New Clients',
      description: 'First visit within 30 days',
      count: 0,
      criteria: { maxVisits: 1, daysSinceLastVisit: 30 },
      isSystem: true,
      calculatedAt: new Date().toISOString(),
    },
    {
      type: 'lapsed',
      name: 'Lapsed Clients',
      description: 'No visit in 60-180 days',
      count: 0,
      criteria: { daysSinceLastVisit: 60 },
      isSystem: true,
      calculatedAt: new Date().toISOString(),
    },
    {
      type: 'lost',
      name: 'Lost Clients',
      description: 'No visit in 180+ days',
      count: 0,
      criteria: { daysSinceLastVisit: 180 },
      isSystem: true,
      calculatedAt: new Date().toISOString(),
    },
    {
      type: 'birthday-this-month',
      name: 'Birthdays This Month',
      description: 'Clients with birthdays this month',
      count: 0,
      criteria: { birthdayMonth: new Date().getMonth() + 1 },
      isSystem: true,
      calculatedAt: new Date().toISOString(),
    },
  ];
}
