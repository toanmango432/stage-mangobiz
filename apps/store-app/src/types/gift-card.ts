/**
 * Gift Card Types
 * PRD Reference: PRD-API-Specifications.md Section 4.7
 *
 * Gift cards can be physical or digital, with tracking for
 * purchases, redemptions, reloads, and balance history.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Gift card delivery type */
export type GiftCardType = 'physical' | 'digital';

/** Gift card status */
export type GiftCardStatus = 'active' | 'depleted' | 'expired' | 'voided';

/** Gift card transaction type */
export type GiftCardTransactionType = 'purchase' | 'redeem' | 'reload' | 'void' | 'refund';

/** Gift card delivery method */
export type GiftCardDeliveryMethod = 'email' | 'sms' | 'print' | 'none';

// ============================================
// GIFT CARD ENTITY
// ============================================

/**
 * A gift card that can be purchased and redeemed.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface GiftCard extends BaseSyncableEntity {
  /** Unique redemption code (e.g., "GC-XXXX-XXXX-XXXX") */
  code: string;

  /** Physical or digital gift card */
  type: GiftCardType;

  /** Original amount loaded on the card */
  originalAmount: number;

  /** Current remaining balance */
  currentBalance: number;

  /** Client ID of purchaser (optional for walk-in purchases) */
  purchaserId?: string;

  /** Recipient's name */
  recipientName?: string;

  /** Recipient's email (for digital delivery) */
  recipientEmail?: string;

  /** Recipient's phone (for SMS delivery) */
  recipientPhone?: string;

  /** Personal message from purchaser */
  message?: string;

  /** Design template ID (for custom card designs) */
  designId?: string;

  /** When the gift card was issued */
  issuedAt: string;

  /** Expiration date (optional, some jurisdictions require no expiry) */
  expiresAt?: string;

  /** Current status of the gift card */
  status: GiftCardStatus;

  /** Last time the card was used */
  lastUsedAt?: string;

  /** Ticket ID from purchase transaction */
  purchaseTicketId?: string;

  // ---- Delivery tracking fields ----

  /** How the gift card should be/was delivered */
  deliveryMethod?: GiftCardDeliveryMethod;

  /** Scheduled delivery date/time (for future delivery) */
  scheduledDeliveryAt?: string;

  /** When the gift card was actually delivered */
  deliveredAt?: string;

  /** Whether this gift card can be reloaded with additional balance */
  isReloadable?: boolean;

  /** Purchaser's name (denormalized for display) */
  purchaserName?: string;
}

// ============================================
// GIFT CARD TRANSACTION
// ============================================

/**
 * Transaction record for gift card activity.
 * Tracks all balance changes with full audit trail.
 */
export interface GiftCardTransaction extends BaseSyncableEntity {
  /** Reference to the gift card */
  giftCardId: string;

  /** Type of transaction */
  type: GiftCardTransactionType;

  /** Amount (positive for purchase/reload, negative for redeem) */
  amount: number;

  /** Balance after this transaction */
  balanceAfter: number;

  /** Associated ticket (for purchase/redeem) */
  ticketId?: string;

  /** Staff member who processed the transaction */
  staffId?: string;

  /** Staff member name (denormalized for display) */
  staffName?: string;

  /** Notes or reason for the transaction */
  notes?: string;
}

// ============================================
// GIFT CARD DESIGN
// ============================================

/** Gift card design category */
export type GiftCardDesignCategory = 'seasonal' | 'birthday' | 'thank-you' | 'general' | 'custom';

/**
 * Gift card design template for visual customization.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface GiftCardDesign extends BaseSyncableEntity {
  /** Design name for internal identification */
  name: string;

  /** Description of the design */
  description?: string;

  /** Full image URL for the gift card design */
  imageUrl: string;

  /** Thumbnail URL for selection UI */
  thumbnailUrl?: string;

  /** Design category for filtering */
  category: GiftCardDesignCategory;

  /** Whether this design is available for selection */
  isActive: boolean;

  /** Whether this is the default design for the store */
  isDefault?: boolean;

  /** Background color (hex) for text overlay */
  backgroundColor?: string;

  /** Text color (hex) for amount/message display */
  textColor?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for issuing a new gift card.
 */
export interface IssueGiftCardInput {
  /** Physical or digital gift card */
  type: GiftCardType;

  /** Amount to load on the card */
  amount: number;

  /** Client ID of purchaser (optional) */
  purchaserId?: string;

  /** Purchaser name for display */
  purchaserName?: string;

  /** Recipient's name */
  recipientName?: string;

  /** Recipient's email for digital delivery */
  recipientEmail?: string;

  /** Recipient's phone for SMS delivery */
  recipientPhone?: string;

  /** Personal message from purchaser */
  message?: string;

  /** Design template ID */
  designId?: string;

  /** Expiration date (ISO string) */
  expiresAt?: string;

  /** Delivery method */
  deliveryMethod?: GiftCardDeliveryMethod;

  /** Scheduled delivery date/time (ISO string, for future delivery) */
  scheduledDeliveryAt?: string;

  /** Whether this gift card can be reloaded */
  isReloadable?: boolean;

  /** @deprecated Use deliveryMethod instead */
  sendEmail?: boolean;
}

/**
 * Input for redeeming a gift card.
 */
export interface RedeemGiftCardInput {
  code: string;
  amount: number;
  ticketId: string;
  staffId: string;
}

/**
 * Input for reloading a gift card.
 */
export interface ReloadGiftCardInput {
  giftCardId: string;
  amount: number;
  ticketId?: string;
  staffId: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generates a unique gift card code.
 * Format: GC-XXXX-XXXX-XXXX
 */
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (0,O,1,I)
  const segments: string[] = [];

  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }

  return `GC-${segments.join('-')}`;
}

/**
 * Checks if a gift card is valid for redemption.
 */
export function isGiftCardRedeemable(giftCard: GiftCard): boolean {
  if (giftCard.status !== 'active') return false;
  if (giftCard.currentBalance <= 0) return false;
  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) return false;
  return true;
}

/**
 * Gets status display info for a gift card.
 */
export function getGiftCardStatusInfo(status: GiftCardStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'depleted':
      return { label: 'Depleted', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'expired':
      return { label: 'Expired', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'voided':
      return { label: 'Voided', color: 'text-red-700', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}
