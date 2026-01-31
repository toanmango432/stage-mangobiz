/**
 * Referral System Configuration
 * PRD Reference: 2.3.8 Referral Program
 */

/** Referral reward settings */
export interface ReferralSettings {
  /** Reward amount for referrer (in dollars) */
  referrerRewardAmount: number;
  /** Reward type for referrer */
  referrerRewardType: 'cash' | 'credit' | 'points';
  /** Points equivalent if using points reward */
  referrerRewardPoints?: number;
  /** Discount for referred client on first visit (percentage) */
  referredDiscountPercent: number;
  /** Maximum discount amount for referred client */
  referredMaxDiscount?: number;
  /** Referral code format */
  codeFormat: 'alphanumeric' | 'numeric' | 'name_based';
  /** Code length (for alphanumeric/numeric) */
  codeLength: number;
  /** Code prefix */
  codePrefix?: string;
  /** Expiration days for referral (0 = never expires) */
  expirationDays: number;
  /** Minimum spend for referred client to qualify */
  minimumSpend?: number;
  /** Whether to auto-issue rewards */
  autoIssueRewards: boolean;
  /** Services that qualify for referral bonus */
  qualifyingServiceIds?: string[];
}

/** Default referral settings */
export const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  referrerRewardAmount: 25,
  referrerRewardType: 'credit',
  referrerRewardPoints: 2500, // 2500 points = $25
  referredDiscountPercent: 15,
  referredMaxDiscount: 50,
  codeFormat: 'alphanumeric',
  codeLength: 6,
  codePrefix: 'REF',
  expirationDays: 90,
  minimumSpend: 0,
  autoIssueRewards: true,
};

/** Characters for generating referral codes */
const ALPHANUMERIC_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars (0, O, I, 1)
const NUMERIC_CHARS = '0123456789';

/**
 * Generate a unique referral code
 * @param format - Code format type
 * @param length - Code length
 * @param prefix - Optional prefix
 * @param clientName - Client name for name-based codes
 */
export function generateReferralCode(
  format: ReferralSettings['codeFormat'] = 'alphanumeric',
  length = 6,
  prefix?: string,
  clientName?: string
): string {
  let code = '';

  if (format === 'name_based' && clientName) {
    // Use first 3 chars of name + random suffix
    const namePart = clientName
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3)
      .padEnd(3, 'X');
    const randomPart = generateRandomString(ALPHANUMERIC_CHARS, length - 3);
    code = namePart + randomPart;
  } else if (format === 'numeric') {
    code = generateRandomString(NUMERIC_CHARS, length);
  } else {
    code = generateRandomString(ALPHANUMERIC_CHARS, length);
  }

  return prefix ? `${prefix}${code}` : code;
}

/**
 * Generate random string from character set
 */
function generateRandomString(chars: string, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate referrer reward based on settings
 */
export function calculateReferrerReward(
  settings: ReferralSettings = DEFAULT_REFERRAL_SETTINGS
): { amount: number; type: 'cash' | 'credit' | 'points'; points?: number } {
  return {
    amount: settings.referrerRewardAmount,
    type: settings.referrerRewardType,
    points: settings.referrerRewardType === 'points' ? settings.referrerRewardPoints : undefined,
  };
}

/**
 * Calculate referred client discount
 */
export function calculateReferredDiscount(
  originalAmount: number,
  settings: ReferralSettings = DEFAULT_REFERRAL_SETTINGS
): { discountPercent: number; discountAmount: number; finalAmount: number } {
  const discountPercent = settings.referredDiscountPercent;
  let discountAmount = originalAmount * (discountPercent / 100);

  // Apply max discount cap if set
  if (settings.referredMaxDiscount && discountAmount > settings.referredMaxDiscount) {
    discountAmount = settings.referredMaxDiscount;
  }

  return {
    discountPercent,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round((originalAmount - discountAmount) * 100) / 100,
  };
}

/**
 * Check if a referral has expired
 */
export function isReferralExpired(
  createdAt: string,
  expirationDays: number = DEFAULT_REFERRAL_SETTINGS.expirationDays
): boolean {
  if (expirationDays === 0) return false; // Never expires

  const createdDate = new Date(createdAt);
  const expirationDate = new Date(createdDate.getTime() + expirationDays * 24 * 60 * 60 * 1000);
  return new Date() > expirationDate;
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  // Must be at least 4 characters
  if (code.length < 4) return false;
  // Must be alphanumeric
  return /^[A-Z0-9]+$/i.test(code);
}

/**
 * Generate referral share message
 */
export function generateShareMessage(
  code: string,
  salonName: string,
  discountPercent: number = DEFAULT_REFERRAL_SETTINGS.referredDiscountPercent
): string {
  return `Use my referral code ${code} at ${salonName} and get ${discountPercent}% off your first visit!`;
}

/**
 * Generate referral link
 */
export function generateReferralLink(
  code: string,
  baseUrl = 'https://book.mangospa.com'
): string {
  return `${baseUrl}/ref/${code}`;
}
