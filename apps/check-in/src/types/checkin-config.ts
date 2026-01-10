/**
 * Check-In App Configuration Types
 *
 * These types define the configuration structure for the check-in kiosk.
 * All configurations are editable from the Control Center (Admin Portal).
 */

// ============================================================================
// STORE CONFIGURATION
// ============================================================================
export interface StoreConfig {
  /** Store display name */
  name: string;
  /** Store logo URL (null for default initial display) */
  logo: string | null;
  /** Store ID for API calls */
  storeId: string;
}

// ============================================================================
// PROMO/ANNOUNCEMENT CONFIGURATION
// ============================================================================
export type PromoType = 'special' | 'announcement' | 'reward' | 'event';

export interface PromoConfig {
  /** Whether promo is currently active */
  active: boolean;
  /** Type of promotion for styling */
  type: PromoType;
  /** Main headline (e.g., "Holiday Special") */
  headline: string;
  /** Main message/description */
  message: string;
  /** Optional subtext (e.g., "Limited time offer") */
  subtext?: string;
  /** Emoji or icon identifier */
  emoji: string;
  /** Tailwind gradient classes for background */
  bgGradient: string;
  /** Accent color hex */
  accentColor: string;
  /** Optional image URL for promo */
  imageUrl?: string;
  /** Start date for scheduled promos */
  startDate?: string;
  /** End date for scheduled promos */
  endDate?: string;
}

// ============================================================================
// AGREEMENT CONFIGURATION
// ============================================================================
export interface AgreementSection {
  /** Section heading */
  heading: string;
  /** Section content/body text */
  content: string;
}

export interface AgreementConfig {
  /** Whether agreement checkbox is enabled */
  enabled: boolean;
  /** Short text shown next to checkbox */
  shortText: string;
  /** Full agreement details */
  fullAgreement: {
    /** Modal title */
    title: string;
    /** Last updated date (ISO string) */
    lastUpdated: string;
    /** Agreement sections */
    sections: AgreementSection[];
  };
}

// ============================================================================
// CHECK-IN SETTINGS
// ============================================================================
export interface CheckInSettings {
  /** Idle timeout in milliseconds before reset */
  idleTimeoutMs: number;
  /** Warning shown before idle timeout (ms) */
  idleWarningMs: number;
  /** Whether QR code check-in is enabled */
  qrCodeEnabled: boolean;
  /** Whether to show loyalty points on confirmation */
  showLoyaltyPoints: boolean;
  /** Whether to allow guest additions */
  allowGuestAddition: boolean;
  /** Maximum guests per check-in */
  maxGuests: number;
}

// ============================================================================
// COMPLETE CHECK-IN CONFIGURATION
// ============================================================================
export interface CheckInConfig {
  store: StoreConfig;
  promo: PromoConfig;
  agreement: AgreementConfig;
  settings: CheckInSettings;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
export const DEFAULT_CHECK_IN_CONFIG: CheckInConfig = {
  store: {
    name: 'Salon Name',
    logo: null,
    storeId: '',
  },
  promo: {
    active: false,
    type: 'special',
    headline: 'Welcome!',
    message: 'We are excited to serve you today.',
    emoji: '✨',
    bgGradient: 'from-[#1a5f4a] to-[#2d7a5f]',
    accentColor: '#d4a853',
  },
  agreement: {
    enabled: true,
    shortText: 'I agree to the salon policies and service terms',
    fullAgreement: {
      title: 'Check-In Agreement',
      lastUpdated: new Date().toISOString().split('T')[0],
      sections: [
        {
          heading: 'Service Terms',
          content: 'By checking in, you acknowledge and agree to our service policies.',
        },
      ],
    },
  },
  settings: {
    idleTimeoutMs: 60000,
    idleWarningMs: 45000,
    qrCodeEnabled: true,
    showLoyaltyPoints: true,
    allowGuestAddition: true,
    maxGuests: 5,
  },
};

// ============================================================================
// API TYPES FOR BACKEND COMMUNICATION
// ============================================================================
export interface UpdatePromoRequest {
  storeId: string;
  promo: Partial<PromoConfig>;
}

export interface UpdateAgreementRequest {
  storeId: string;
  agreement: Partial<AgreementConfig>;
}

export interface GetCheckInConfigResponse {
  success: boolean;
  config: CheckInConfig;
}
