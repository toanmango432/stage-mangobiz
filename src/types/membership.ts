/**
 * Membership Types
 * PRD Reference: PRD-API-Specifications.md Section 4.8
 *
 * Memberships provide recurring revenue through subscription plans
 * with benefits like discounts, free services, and priority booking.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Billing cycle for memberships */
export type MembershipBillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'annually';

/** Type of membership benefit */
export type MembershipBenefitType =
  | 'discount'           // Percentage off services/products
  | 'free-service'       // Free service(s) per cycle
  | 'priority-booking'   // Book before non-members
  | 'free-product'       // Free product(s) per cycle
  | 'points-multiplier'; // Loyalty points multiplier

/** Member status in membership */
export type MemberStatus =
  | 'active'       // Currently subscribed and paid
  | 'paused'       // Temporarily paused (not billing)
  | 'cancelled'    // Cancelled by member or admin
  | 'past_due'     // Payment failed, grace period
  | 'pending';     // Awaiting first payment

// ============================================
// MEMBERSHIP BENEFIT
// ============================================

/**
 * A single benefit included in a membership plan.
 */
export interface MembershipBenefit {
  /** Unique identifier within the plan */
  id: string;

  /** Type of benefit */
  type: MembershipBenefitType;

  /**
   * Value of the benefit:
   * - For discount: percentage (e.g., 20 for 20% off)
   * - For free-service/product: quantity per cycle
   * - For points-multiplier: multiplier (e.g., 2 for 2x points)
   */
  value: number;

  /** Specific services this benefit applies to (empty = all) */
  serviceIds?: string[];

  /** Maximum uses per billing cycle (null = unlimited) */
  limit?: number;

  /** Human-readable description for display */
  description: string;
}

// ============================================
// MEMBERSHIP PLAN ENTITY
// ============================================

/**
 * A membership plan that clients can subscribe to.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface MembershipPlan extends BaseSyncableEntity {
  /** Plan name (e.g., "VIP Monthly", "Unlimited Blowouts") */
  name: string;

  /** Detailed description of the plan */
  description: string;

  /** Monthly/weekly/etc. price */
  price: number;

  /** How often to bill */
  billingCycle: MembershipBillingCycle;

  /** One-time setup/enrollment fee */
  setupFee?: number;

  /** Benefits included in this plan */
  benefits: MembershipBenefit[];

  /** Whether the plan is currently available for enrollment */
  isActive: boolean;

  /** Maximum number of members (null = unlimited) */
  maxMembers?: number;

  /** Number of currently enrolled members */
  currentMemberCount?: number;

  /** Minimum commitment period in months */
  minimumTermMonths?: number;

  /** Whether plan auto-renews after minimum term */
  autoRenew: boolean;

  /** Tax rate for membership fees (percentage) */
  taxRate?: number;

  /** Display order in plan list */
  sortOrder?: number;
}

// ============================================
// MEMBER ENTITY
// ============================================

/**
 * A client's membership subscription.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Member extends BaseSyncableEntity {
  /** Reference to the client */
  clientId: string;

  /** Client name (denormalized for display) */
  clientName?: string;

  /** Reference to the membership plan */
  membershipPlanId: string;

  /** Plan name (denormalized for display) */
  planName?: string;

  /** Current membership status */
  status: MemberStatus;

  /** When membership started */
  startDate: string;

  /** Next billing date */
  nextBillingDate: string;

  /** When membership was paused (if paused) */
  pausedAt?: string;

  /** When pause will end (if paused temporarily) */
  pauseEndsAt?: string;

  /** When membership was cancelled */
  cancelledAt?: string;

  /** Reason for cancellation */
  cancelReason?: string;

  /** Requested cancellation date (for future cancellation) */
  cancellationRequestedAt?: string;

  /** Payment method for recurring billing */
  paymentMethodId: string;

  /** Last 4 digits of payment method (for display) */
  paymentMethodLast4?: string;

  /** Benefits used this billing cycle: { benefitId: countUsed } */
  benefitsUsedThisCycle: Record<string, number>;

  /** Total amount billed to date */
  totalBilled?: number;

  /** Number of successful billing cycles */
  billingCycleCount?: number;

  /** Number of failed payment attempts */
  failedPaymentCount?: number;

  /** End of minimum commitment period */
  minimumTermEndsAt?: string;
}

// ============================================
// MEMBERSHIP BILLING
// ============================================

/**
 * Record of a membership billing event.
 */
export interface MembershipBillingRecord extends BaseSyncableEntity {
  /** Reference to the member */
  memberId: string;

  /** Reference to the membership plan */
  membershipPlanId: string;

  /** Billing period start */
  periodStart: string;

  /** Billing period end */
  periodEnd: string;

  /** Amount billed */
  amount: number;

  /** Tax amount */
  taxAmount?: number;

  /** Total amount charged */
  totalAmount: number;

  /** Payment status */
  status: 'pending' | 'paid' | 'failed' | 'refunded';

  /** Payment transaction ID */
  transactionId?: string;

  /** Failure reason (if failed) */
  failureReason?: string;

  /** Number of retry attempts */
  retryCount?: number;

  /** When payment was processed */
  processedAt?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating a membership plan.
 */
export interface CreateMembershipPlanInput {
  name: string;
  description: string;
  price: number;
  billingCycle: MembershipBillingCycle;
  setupFee?: number;
  benefits: Omit<MembershipBenefit, 'id'>[];
  maxMembers?: number;
  minimumTermMonths?: number;
  autoRenew?: boolean;
  taxRate?: number;
}

/**
 * Input for enrolling a client in a membership.
 */
export interface EnrollMemberInput {
  clientId: string;
  membershipPlanId: string;
  paymentMethodId: string;
  startDate?: string; // Defaults to today
  promoCode?: string;
}

/**
 * Input for pausing a membership.
 */
export interface PauseMembershipInput {
  memberId: string;
  pauseEndsAt?: string; // Optional end date for temporary pause
  reason?: string;
}

/**
 * Input for cancelling a membership.
 */
export interface CancelMembershipInput {
  memberId: string;
  reason: string;
  cancelImmediately?: boolean; // If false, cancels at end of current period
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets status display info for a member.
 */
export function getMemberStatusInfo(status: MemberStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'paused':
      return { label: 'Paused', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'past_due':
      return { label: 'Past Due', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'pending':
      return { label: 'Pending', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Calculates billing cycle in days.
 */
export function getBillingCycleDays(cycle: MembershipBillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'quarterly':
      return 90;
    case 'annually':
      return 365;
    default:
      return 30;
  }
}

/**
 * Checks if a member can use a specific benefit.
 */
export function canUseBenefit(
  member: Member,
  benefit: MembershipBenefit
): { canUse: boolean; remaining?: number } {
  if (member.status !== 'active') {
    return { canUse: false };
  }

  if (!benefit.limit) {
    return { canUse: true };
  }

  const used = member.benefitsUsedThisCycle[benefit.id] || 0;
  const remaining = benefit.limit - used;

  return {
    canUse: remaining > 0,
    remaining: remaining > 0 ? remaining : 0,
  };
}

/**
 * Calculates the annual value of a membership.
 */
export function calculateAnnualValue(plan: MembershipPlan): number {
  const cyclesPerYear = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    annually: 1,
  };

  return plan.price * cyclesPerYear[plan.billingCycle] + (plan.setupFee || 0);
}
