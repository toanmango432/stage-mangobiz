/**
 * Checkout Configuration Constants
 * Centralized configuration for checkout-related settings
 * Per PRD Section 9: Configuration & Settings
 *
 * NOTE: Tax and tip settings can be overridden by Control Center via system_configs.
 * Use useSystemConfig() hook or systemConfigService for dynamic values.
 */

import type { ServiceStatus } from '../types/common';
import { getDefaultTaxRateSync, getSystemConfigSync } from '../services/systemConfigService';

// ===================
// TAX CONFIGURATION
// ===================

/**
 * Default tax rate applied to checkout transactions
 * NOTE: This is the fallback. Use getDefaultTaxRate() or useTaxRate() hook
 * to get the configured rate from Control Center.
 * Value: 0.08 represents 8% tax (fallback if Control Center config unavailable)
 */
export const TAX_RATE = 0.08;

/**
 * Get the current tax rate from system config (sync)
 * Returns rate as decimal (e.g., 0.085 for 8.5%)
 */
export function getTaxRateFromConfig(): number {
  const ratePercent = getDefaultTaxRateSync();
  return ratePercent / 100; // Convert percentage to decimal
}

// ===================
// TIP CONFIGURATION
// ===================

/**
 * Get tip config from system config (sync)
 */
function getTipConfigFromSystemConfig() {
  const config = getSystemConfigSync();
  return {
    defaultPercentages: config.tipSettings.presetPercentages,
    allowCustomAmount: config.tipSettings.allowCustom,
    enabled: config.tipSettings.enabled,
  };
}

export const TIP_CONFIG = {
  /** Default tip percentage suggestions shown to customer */
  defaultPercentages: [18, 20, 22] as const,
  /** Whether tip is calculated on pre-tax or post-tax amount */
  calculationBasis: 'post-tax' as const,
  /** Show tip options on POS terminal */
  showOnPOS: true,
  /** Show tip options on payment terminal */
  showOnTerminal: true,
  /** Allow custom tip amount entry */
  allowCustomAmount: true,
  /** Include products in tip calculation (services only by default) */
  includeProductsInTip: false,
  /** Allow editing tips after checkout completion */
  postCheckoutEditEnabled: true,
  /** Time window for post-checkout tip edits (months) */
  postCheckoutEditWindowMonths: 6,
} as const;

/**
 * Get dynamic tip config from Control Center
 * Use this instead of TIP_CONFIG when you need the latest settings
 */
export function getDynamicTipConfig() {
  const systemTip = getTipConfigFromSystemConfig();
  return {
    ...TIP_CONFIG,
    defaultPercentages: systemTip.defaultPercentages.length > 0
      ? systemTip.defaultPercentages
      : TIP_CONFIG.defaultPercentages,
    allowCustomAmount: systemTip.allowCustomAmount,
    showOnPOS: systemTip.enabled,
    showOnTerminal: systemTip.enabled,
  };
}

// ===================
// DISCOUNT CONFIGURATION
// ===================

export const DISCOUNT_CONFIG = {
  /** Discount percentage threshold requiring manager approval */
  managerApprovalThreshold: 30,
  /** Require reason for all discounts */
  requireReason: true,
  /** Allow ticket total to go negative */
  allowNegativeTotal: false,
  /** Apply discounts to service charges */
  applyToServiceCharges: false,
  /** Preset discount reasons for quick selection */
  presetReasons: [
    'First-time client',
    'Loyalty reward',
    'Service recovery',
    'Staff discount',
    'Promotion',
    'Other',
  ] as const,
} as const;

// ===================
// DRAFT SALES CONFIGURATION
// ===================

export const DRAFT_CONFIG = {
  /** Auto-save interval in seconds */
  autoSaveIntervalSeconds: 30,
  /** Hours until draft expires */
  expirationHours: 24,
  /** Maximum drafts per staff member */
  maxDraftsPerStaff: 5,
  /** Notify staff when draft is about to expire */
  notifyOnExpiration: true,
} as const;

// ===================
// SELF-CHECKOUT CONFIGURATION
// ===================

export const SELF_CHECKOUT_CONFIG = {
  /** SMS checkout link validity (hours) */
  smsLinkValidityHours: 12,
  /** QR code validity for in-store display (minutes) */
  qrCodeValidityMinutes: 15,
  /** Allow tipping on self-checkout */
  allowTipping: true,
  /** Auto-save card option: 'yes' | 'no' | 'ask' */
  autoSaveCard: 'ask' as const,
  /** Send reminder if payment not completed */
  sendReminderIfUnpaid: true,
  /** Hours before sending reminder */
  reminderDelayHours: 2,
} as const;

// ===================
// RECEIPT CONFIGURATION
// ===================

export const RECEIPT_CONFIG = {
  /** Automatically print receipt after payment */
  autoPrint: false,
  /** Default receipt delivery method */
  defaultMethod: 'ask' as const,
  /** Include staff names on receipt */
  includeStaffNames: true,
  /** Include detailed service breakdown */
  includeServiceDetails: true,
  /** Custom footer text for receipts */
  customFooter: '',
  /** Business logo URL for receipts */
  logoUrl: null as string | null,
} as const;

// ===================
// PAYMENT CONFIGURATION
// ===================

export const PAYMENT_CONFIG = {
  /** Hours within which a transaction can be voided */
  voidWindowHours: 24,
  /** Maximum number of payment methods per transaction */
  maxSplitPayments: 10,
  /** Quick cash amount buttons */
  cashQuickAmounts: [20, 50, 100] as const,
} as const;

// ===================
// SERVICE STATUS COLORS
// ===================

export const SERVICE_STATUS_COLORS: Record<ServiceStatus, {
  bg: string;
  text: string;
  badge: string;
  border: string;
}> = {
  not_started: {
    bg: '#F3F4F6',
    text: '#6B7280',
    badge: 'gray',
    border: '#D1D5DB',
  },
  in_progress: {
    bg: '#DBEAFE',
    text: '#1D4ED8',
    badge: 'blue',
    border: '#93C5FD',
  },
  paused: {
    bg: '#FEF3C7',
    text: '#D97706',
    badge: 'yellow',
    border: '#FCD34D',
  },
  completed: {
    bg: '#D1FAE5',
    text: '#059669',
    badge: 'green',
    border: '#6EE7B7',
  },
};

// ===================
// SERVICE STATUS LABELS
// ===================

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
};

// ===================
// SYNC PRIORITIES
// Per DATA_STORAGE_STRATEGY.md Section 3.2
// ===================

export const SYNC_PRIORITIES = {
  /** Critical - transactions, payments */
  CRITICAL: 1,
  /** High - tickets, appointments */
  HIGH: 2,
  /** Normal - clients, staff updates */
  NORMAL: 3,
  /** Low - preferences, analytics */
  LOW: 4,
} as const;

// ===================
// TYPE EXPORTS
// ===================

export type TipCalculationBasis = 'pre-tax' | 'post-tax';
export type ReceiptMethod = 'print' | 'email' | 'sms' | 'ask';
export type AutoSaveCard = 'yes' | 'no' | 'ask';
export type TipPercentage = typeof TIP_CONFIG.defaultPercentages[number];
export type CashQuickAmount = typeof PAYMENT_CONFIG.cashQuickAmounts[number];
export type DiscountReason = typeof DISCOUNT_CONFIG.presetReasons[number];
