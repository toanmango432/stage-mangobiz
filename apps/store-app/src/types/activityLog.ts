/**
 * Activity Log Types
 *
 * Types for tracking business activities and audit trail entries.
 * Used for compliance, reporting, and debugging purposes.
 */

import type { PriceDecision } from './Ticket';

// ============================================
// BASE ACTIVITY LOG TYPES
// ============================================

/**
 * Base activity log entry type.
 * Specific log types extend this with additional fields.
 */
export interface BaseActivityLogEntry {
  /** Unique identifier for the log entry */
  id: string;

  /** Type of activity being logged */
  type: string;

  /** ISO 8601 timestamp when the activity occurred */
  timestamp: string;

  /** Staff ID who performed the activity */
  performedBy: string;
}

// ============================================
// PRICE OVERRIDE LOG
// ============================================

/**
 * Log entry for tracking price override decisions during checkout.
 *
 * This provides a complete audit trail for all price decisions when
 * the checkout price differs from the original booked price.
 *
 * @example
 * // Customer booked haircut at $50, catalog now shows $55
 * // Staff decides to honor the original price
 * const log: PriceOverrideLog = {
 *   id: 'pol_abc123',
 *   type: 'price_override',
 *   ticketId: 'tkt_xyz789',
 *   serviceLineItemId: 'sli_456',
 *   bookedPrice: 50,
 *   catalogPrice: 55,
 *   finalPrice: 50,
 *   variance: 0,           // 50 - 50 = 0 (no variance since we honored booked)
 *   variancePercent: 0,
 *   decision: 'booked_honored',
 *   performedBy: 'staff_001',
 *   timestamp: '2026-01-17T10:30:00.000Z'
 * };
 *
 * @example
 * // Manager approves a higher price override
 * const approvedLog: PriceOverrideLog = {
 *   id: 'pol_def456',
 *   type: 'price_override',
 *   ticketId: 'tkt_xyz789',
 *   serviceLineItemId: 'sli_789',
 *   bookedPrice: 100,
 *   catalogPrice: 120,
 *   finalPrice: 120,
 *   variance: 20,          // 120 - 100 = 20
 *   variancePercent: 20,   // (20 / 100) * 100 = 20%
 *   decision: 'catalog_applied',
 *   reason: 'Service upgraded to premium tier',
 *   performedBy: 'staff_001',
 *   approvedBy: 'manager_001',
 *   timestamp: '2026-01-17T11:00:00.000Z'
 * };
 */
export interface PriceOverrideLog extends BaseActivityLogEntry {
  /** Always 'price_override' for this log type */
  type: 'price_override';

  /** ID of the ticket being processed */
  ticketId: string;

  /** ID of the service line item within the ticket */
  serviceLineItemId: string;

  /**
   * Original price when the appointment was booked.
   * May be undefined for walk-in customers.
   */
  bookedPrice: number;

  /**
   * Current catalog price at checkout time.
   * This is the "standard" price in the menu.
   */
  catalogPrice: number;

  /**
   * Final price charged to the customer.
   * This is the price after staff decision/override.
   */
  finalPrice: number;

  /**
   * Difference between final price and booked price (finalPrice - bookedPrice).
   * Positive = customer pays more, Negative = customer pays less.
   */
  variance: number;

  /**
   * Variance as a percentage of booked price.
   * Calculated as: (variance / bookedPrice) * 100
   */
  variancePercent: number;

  /**
   * How the final price was determined.
   * @see PriceDecision
   */
  decision: PriceDecision;

  /**
   * Optional reason for the price decision.
   * Required when decision is 'manual_override' and requireOverrideReason is enabled.
   */
  reason?: string;

  /**
   * Manager ID who approved the price decision.
   * Present when manager approval was required (e.g., variance exceeds threshold).
   */
  approvedBy?: string;
}

// ============================================
// ACTIVITY LOG TYPES UNION
// ============================================

/**
 * Union type of all activity log entry types.
 * Extend this as new log types are added.
 */
export type ActivityLogEntry = PriceOverrideLog;
