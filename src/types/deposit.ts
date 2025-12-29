/**
 * Deposit Types
 * PRD Reference: PRD-API-Specifications.md Section 4.14
 *
 * Booking deposits and prepayments to reduce no-shows
 * and secure high-value appointments.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Deposit calculation type */
export type DepositType = 'percentage' | 'fixed' | 'full';

/** Who the deposit policy applies to */
export type DepositApplyTo =
  | 'all'               // All clients
  | 'new-clients'       // First-time clients only
  | 'high-value'        // Bookings over a certain amount
  | 'specific-services'; // Specific services only

/** Deposit status */
export type DepositStatus =
  | 'collected'   // Deposit received
  | 'applied'     // Applied to final payment
  | 'refunded'    // Returned to client
  | 'forfeited';  // Kept due to no-show/late cancel

// ============================================
// DEPOSIT POLICY
// ============================================

/**
 * A policy defining when and how deposits are required.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface DepositPolicy extends BaseSyncableEntity {
  /** Policy name (e.g., "New Client Deposit") */
  name: string;

  /** Type of deposit calculation */
  type: DepositType;

  /**
   * Amount based on type:
   * - percentage: 20 means 20%
   * - fixed: 50 means $50
   * - full: ignored (100%)
   */
  amount: number;

  /** Who this policy applies to */
  applyTo: DepositApplyTo;

  /** Specific service IDs (when applyTo = 'specific-services') */
  serviceIds?: string[];

  /** Minimum booking value to require deposit (for high-value) */
  minimumBookingValue?: number;

  /** Hours before appointment until deposit is refundable */
  refundableUntilHours: number;

  /** Whether policy is active */
  isActive: boolean;

  /** Description for clients */
  description?: string;

  /** Priority (higher = evaluated first) */
  priority?: number;
}

// ============================================
// DEPOSIT ENTITY
// ============================================

/**
 * A collected deposit for an appointment.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Deposit extends BaseSyncableEntity {
  /** Associated appointment ID */
  appointmentId: string;

  /** Client ID */
  clientId: string;

  /** Client name (denormalized) */
  clientName?: string;

  /** Deposit amount */
  amount: number;

  /** Current status */
  status: DepositStatus;

  /** Policy ID that triggered this deposit */
  policyId?: string;

  /** Policy name (denormalized) */
  policyName?: string;

  /** When deposit was collected */
  collectedAt: string;

  /** Payment method used */
  paymentMethodId: string;

  /** Payment method display (e.g., "Visa ****1234") */
  paymentMethodDisplay?: string;

  /** Transaction ID from payment processor */
  transactionId: string;

  /** Ticket ID deposit was applied to (when status = applied) */
  appliedToTicketId?: string;

  /** When deposit was applied to final payment */
  appliedAt?: string;

  /** When deposit was refunded */
  refundedAt?: string;

  /** Reason for refund */
  refundReason?: string;

  /** Refund transaction ID */
  refundTransactionId?: string;

  /** When deposit was forfeited */
  forfeitedAt?: string;

  /** Reason for forfeiture */
  forfeitReason?: string;

  /** Notes */
  notes?: string;
}

// ============================================
// DEPOSIT REQUIREMENT CHECK
// ============================================

/**
 * Result of checking if deposit is required.
 */
export interface DepositRequirement {
  /** Whether deposit is required */
  required: boolean;

  /** Amount required */
  amount?: number;

  /** Policy that requires it */
  policyId?: string;

  /** Policy name */
  policyName?: string;

  /** Reason for requiring deposit */
  reason?: string;

  /** Last datetime for free cancellation */
  freeCancellationUntil?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating a deposit policy.
 */
export interface CreateDepositPolicyInput {
  name: string;
  type: DepositType;
  amount: number;
  applyTo: DepositApplyTo;
  serviceIds?: string[];
  minimumBookingValue?: number;
  refundableUntilHours: number;
  description?: string;
  priority?: number;
}

/**
 * Input for collecting a deposit.
 */
export interface CollectDepositInput {
  appointmentId: string;
  clientId: string;
  amount: number;
  paymentMethodId: string;
  policyId?: string;
  notes?: string;
}

/**
 * Input for refunding a deposit.
 */
export interface RefundDepositInput {
  depositId: string;
  reason: string;
  refundAmount?: number; // Defaults to full deposit
}

/**
 * Input for applying deposit to final payment.
 */
export interface ApplyDepositInput {
  depositId: string;
  ticketId: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets status display info for a deposit.
 */
export function getDepositStatusInfo(status: DepositStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'collected':
      return { label: 'Collected', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'applied':
      return { label: 'Applied', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'refunded':
      return { label: 'Refunded', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'forfeited':
      return { label: 'Forfeited', color: 'text-red-700', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Calculates deposit amount based on policy and booking value.
 */
export function calculateDepositAmount(
  policy: DepositPolicy,
  bookingValue: number
): number {
  switch (policy.type) {
    case 'percentage':
      return Math.round(bookingValue * (policy.amount / 100) * 100) / 100;
    case 'fixed':
      return Math.min(policy.amount, bookingValue);
    case 'full':
      return bookingValue;
    default:
      return 0;
  }
}

/**
 * Checks if deposit is still refundable.
 */
export function isDepositRefundable(
  deposit: Deposit,
  appointmentTime: string,
  policy: DepositPolicy
): boolean {
  if (deposit.status !== 'collected') return false;

  const appointmentDate = new Date(appointmentTime);
  const refundDeadline = new Date(
    appointmentDate.getTime() - policy.refundableUntilHours * 60 * 60 * 1000
  );

  return new Date() < refundDeadline;
}

/**
 * Gets the free cancellation deadline.
 */
export function getFreeCancellationDeadline(
  appointmentTime: string,
  refundableUntilHours: number
): Date {
  const appointmentDate = new Date(appointmentTime);
  return new Date(
    appointmentDate.getTime() - refundableUntilHours * 60 * 60 * 1000
  );
}

/**
 * Formats the refund policy for display.
 */
export function formatRefundPolicy(policy: DepositPolicy): string {
  let amount: string;
  switch (policy.type) {
    case 'percentage':
      amount = `${policy.amount}%`;
      break;
    case 'fixed':
      amount = `$${policy.amount}`;
      break;
    case 'full':
      amount = 'full amount';
      break;
    default:
      amount = '';
  }

  return `${amount} deposit required. Refundable up to ${policy.refundableUntilHours} hours before appointment.`;
}

/**
 * Evaluates which deposit policy applies to a booking.
 */
export function evaluateDepositPolicy(
  policies: DepositPolicy[],
  context: {
    isNewClient: boolean;
    bookingValue: number;
    serviceIds: string[];
  }
): DepositPolicy | null {
  const activePolicies = policies
    .filter((p) => p.isActive)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const policy of activePolicies) {
    switch (policy.applyTo) {
      case 'all':
        return policy;

      case 'new-clients':
        if (context.isNewClient) return policy;
        break;

      case 'high-value':
        if (
          policy.minimumBookingValue &&
          context.bookingValue >= policy.minimumBookingValue
        ) {
          return policy;
        }
        break;

      case 'specific-services':
        if (
          policy.serviceIds &&
          context.serviceIds.some((id) => policy.serviceIds!.includes(id))
        ) {
          return policy;
        }
        break;
    }
  }

  return null;
}
