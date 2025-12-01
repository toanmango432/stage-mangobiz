import { SyncStatus } from './common';

// ==================== ENUMS & BASIC TYPES ====================

export type BlockReason = 'no_show' | 'late_cancellation' | 'inappropriate_behavior' | 'non_payment' | 'other';

export type ClientGender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';

export type ClientSource =
  | 'walk_in'
  | 'online_booking'
  | 'referral'
  | 'social_media'
  | 'google'
  | 'yelp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'advertisement'
  | 'event'
  | 'gift_card'
  | 'other';

export type CommunicationChannel = 'email' | 'sms' | 'phone' | 'app_notification';

export type ContactTimePreference = 'morning' | 'afternoon' | 'evening' | 'anytime';

// Hair profile types
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairTexture = 'fine' | 'medium' | 'coarse';
export type HairDensity = 'thin' | 'medium' | 'thick';
export type HairPorosity = 'low' | 'normal' | 'high';
export type ScalpCondition = 'normal' | 'dry' | 'oily' | 'sensitive' | 'dandruff';

// Skin profile types
export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
export type SkinConcern =
  | 'acne' | 'aging' | 'hyperpigmentation' | 'rosacea' | 'eczema'
  | 'dehydration' | 'sun_damage' | 'fine_lines' | 'large_pores'
  | 'uneven_texture' | 'dark_circles' | 'other';

// Nail profile types
export type NailCondition = 'healthy' | 'brittle' | 'peeling' | 'ridged' | 'discolored';
export type NailShape = 'round' | 'square' | 'oval' | 'almond' | 'coffin' | 'stiletto';

// Patch test result
export type PatchTestResult = 'pass' | 'fail' | 'pending';

// Form section types
export type FormSectionType =
  | 'client_details' | 'text_input' | 'single_choice' | 'multi_choice'
  | 'date_picker' | 'number_input' | 'file_upload' | 'signature'
  | 'consent_checkbox' | 'info_text';

// ==================== EMBEDDED INTERFACES ====================

/** Staff Alert - High visibility alert displayed across all views (PRD 2.3.1) */
export interface StaffAlert {
  message: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

/** Emergency Contact (PRD 2.3.1) */
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  notes?: string;
}

/** Color Formula for hair services */
export interface ColorFormula {
  id: string;
  date: string;
  formula: string;
  brand?: string;
  developer?: string;
  processingTime?: string;
  notes?: string;
  staffId?: string;
  staffName?: string;
}

/** Hair Profile */
export interface HairProfile {
  type?: HairType;
  texture?: HairTexture;
  density?: HairDensity;
  porosity?: HairPorosity;
  scalpCondition?: ScalpCondition;
  naturalColor?: string;
  currentColor?: string;
  previousColorHistory?: string;
  chemicalTreatments?: string[];
  colorFormulas?: ColorFormula[];
}

/** Skin Profile */
export interface SkinProfile {
  type?: SkinType;
  concerns?: SkinConcern[];
  fitzpatrickScale?: number; // 1-6 skin phototype
  allergies?: string[];
  sensitivities?: string[];
  currentProducts?: string;
  treatmentHistory?: string;
}

/** Nail Profile */
export interface NailProfile {
  condition?: NailCondition;
  preferredShape?: NailShape;
  allergies?: string[];
  preferredColors?: string[];
  notes?: string;
}

/** Medical Information (PRD 2.3.3) */
export interface MedicalInfo {
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  pregnancyStatus?: 'not_applicable' | 'pregnant' | 'nursing' | 'trying';
  pacemaker?: boolean;
  bloodThinner?: boolean;
  diabetic?: boolean;
  hasLatexAllergy?: boolean;
  recentSurgeries?: string;
  consentFormSigned?: boolean;
  consentFormDate?: string;
  notes?: string;
}

/** Client Preferences */
export interface ClientPreferences {
  preferredStaffIds?: string[];
  preferredServices?: string[];
  preferredDays?: number[]; // 0-6 (Sun-Sat)
  preferredTimes?: ContactTimePreference;
  beveragePreference?: string;
  musicPreference?: string;
  magazinePreference?: string;
  roomTemperature?: 'warm' | 'cool' | 'no_preference';
  pressurePreference?: 'light' | 'medium' | 'firm' | 'deep';
  quietEnvironment?: boolean;
  otherNotes?: string;
}

/** Communication Preferences (PRD 2.3.1) */
export interface CommunicationPreferences {
  allowEmail: boolean;
  allowSms: boolean;
  allowPhone: boolean;
  allowMarketing: boolean;
  appointmentReminders: boolean;
  reminderTiming: number; // hours before
  birthdayGreetings: boolean;
  promotionalOffers: boolean;
  newsletterSubscribed: boolean;
  preferredLanguage?: string;
  preferredContact?: CommunicationChannel;
  bestTimeToContact?: ContactTimePreference;
  // Consent tracking (PRD 2.3.1)
  smsOptInDate?: string;
  emailOptInDate?: string;
  marketingConsentDate?: string;
  photoConsent?: boolean;
  doNotContact?: boolean;
}

/** Loyalty Information (PRD 2.3.7) */
export interface LoyaltyInfo {
  tier: LoyaltyTier;
  pointsBalance: number;
  lifetimePoints: number;
  memberSince?: string;
  lastTierUpdate?: string;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;
  rewardsRedeemed: number;
  excludeFromLoyalty?: boolean;
}

/** Membership Information (PRD 2.3.6) */
export interface MembershipInfo {
  hasMembership: boolean;
  membershipType?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  autoRenew?: boolean;
  monthlyCredits?: number;
  creditsRemaining?: number;
  membershipPrice?: number;
  notes?: string;
}

/** Gift Card Balance (PRD 2.3.6) */
export interface GiftCardBalance {
  cardNumber: string;
  balance: number;
  expirationDate?: string;
  isActive: boolean;
}

/** Visit Summary (PRD 2.3.11) */
export interface VisitSummary {
  totalVisits: number;
  totalSpent: number;
  averageTicket: number;
  lastVisitDate?: string;
  lastServiceDate?: string;
  lastPurchaseDate?: string;
  favoriteService?: string;
  visitFrequency?: number; // average days between visits
  noShowCount: number;
  lateCancelCount: number;
  rebookRate?: number;
}

/** Client Tag */
export interface ClientTag {
  id: string;
  name: string;
  color: string;
}

/** Client Note */
export interface ClientNote {
  id: string;
  date: string;
  content: string;
  type: 'general' | 'service' | 'preference' | 'medical' | 'important';
  isPrivate: boolean;
  createdBy: string;
  createdByName?: string;
}

/** Client Address */
export interface ClientAddress {
  street?: string;
  apt?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// ==================== PATCH TEST (PRD 2.3.3) ====================

/** Patch Test Record */
export interface PatchTest {
  id: string;
  clientId: string;
  serviceId: string;
  serviceName?: string;
  testDate: string;
  result: PatchTestResult;
  expiresAt: string;
  performedBy: string;
  performedByName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// ==================== FORMS (PRD 2.3.4) ====================

/** Form Section */
export interface FormSection {
  id: string;
  type: FormSectionType;
  label: string;
  required: boolean;
  config: Record<string, any>;
  order: number;
}

/** Form Template */
export interface FormTemplate {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  sendMode: 'automatic' | 'manual';
  frequency?: 'every_time' | 'once';
  linkedServiceIds?: string[];
  requiresSignature: boolean;
  sections: FormSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/** Client Form Response */
export interface ClientFormResponse {
  id: string;
  formTemplateId: string;
  templateName?: string;
  clientId: string;
  appointmentId?: string;
  responses: Record<string, any>;
  signatureImage?: string;
  status: 'pending' | 'completed' | 'expired';
  sentAt: string;
  completedAt?: string;
  completedBy: 'client' | string; // 'client' or staff ID
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// ==================== REFERRALS (PRD 2.3.8) ====================

/** Referral */
export interface Referral {
  id: string;
  referrerClientId: string;
  referredClientId: string;
  referredClientName?: string;
  referralLinkCode: string;
  firstAppointmentId?: string;
  referrerRewardIssued: boolean;
  referredRewardIssued: boolean;
  createdAt: string;
  completedAt?: string;
  syncStatus: SyncStatus;
}

// ==================== REVIEWS (PRD 2.3.9) ====================

/** Client Review */
export interface ClientReview {
  id: string;
  clientId: string;
  appointmentId?: string;
  staffId?: string;
  rating: number; // 1-5
  comment?: string;
  platform: 'internal' | 'google' | 'yelp' | 'facebook';
  staffResponse?: string;
  respondedAt?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

// ==================== LOYALTY REWARDS (PRD 2.3.7) ====================

/** Loyalty Reward */
export interface LoyaltyReward {
  id: string;
  clientId: string;
  type: 'amount_discount' | 'percentage_discount' | 'free_service' | 'free_product';
  value: number;
  productId?: string;
  serviceId?: string;
  minSpend?: number;
  expiresAt?: string;
  earnedFrom: 'points' | 'tier' | 'referral' | 'manual';
  redeemedAt?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

// ==================== MAIN CLIENT INTERFACE ====================

/**
 * Client Entity - Complete client record for salon/spa
 * PRD v4.2 Section 2.3
 */
export interface Client {
  // Core identification
  id: string;
  salonId: string;

  // Basic info (PRD 2.3.1)
  firstName: string;
  lastName: string;
  displayName?: string;
  nickname?: string;
  phone: string;
  email?: string;
  avatar?: string;
  gender?: ClientGender;
  birthday?: string;
  anniversary?: string;
  preferredLanguage?: string;

  // Address
  address?: ClientAddress;

  // Emergency Contacts (PRD 2.3.1 - NEW)
  emergencyContacts?: EmergencyContact[];

  // Staff Alert (PRD 2.3.1 - NEW) - Single high-visibility alert
  staffAlert?: StaffAlert;

  // Blocking (PRD 2.3.2 - NEW)
  isBlocked: boolean;
  blockedAt?: string;
  blockedBy?: string;
  blockReason?: BlockReason;
  blockReasonNote?: string;

  // Source/referral tracking
  source?: ClientSource;
  sourceDetails?: string;
  referredByClientId?: string;
  referredByClientName?: string;

  // Beauty Profiles
  hairProfile?: HairProfile;
  skinProfile?: SkinProfile;
  nailProfile?: NailProfile;
  medicalInfo?: MedicalInfo;

  // Preferences
  preferences?: ClientPreferences;
  communicationPreferences?: CommunicationPreferences;

  // Loyalty & membership (PRD 2.3.6, 2.3.7)
  loyaltyInfo?: LoyaltyInfo;
  membership?: MembershipInfo;
  giftCards?: GiftCardBalance[];

  // Financial
  visitSummary?: VisitSummary;
  outstandingBalance?: number;
  storeCredit?: number;

  // Reviews (PRD 2.3.9 - NEW)
  averageRating?: number;
  totalReviews?: number;

  // Tags & notes
  tags?: ClientTag[];
  notes?: ClientNote[];

  // Status flags
  isVip: boolean;

  // System fields
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// ==================== LEGACY COMPATIBILITY ====================

/**
 * @deprecated Use Client interface instead
 * Kept for backward compatibility with existing code
 */
export interface LegacyClient {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  birthday?: Date;
  notes?: string;
  preferredStaff?: string[];
  loyaltyTier?: string;
  lastVisit?: Date;
  totalVisits: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

/** Convert legacy client to new format */
export function convertLegacyClient(legacy: LegacyClient): Client {
  const nameParts = legacy.name.split(' ');
  return {
    id: legacy.id,
    salonId: legacy.salonId,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: legacy.phone,
    email: legacy.email,
    avatar: legacy.avatar,
    birthday: legacy.birthday?.toISOString(),
    isBlocked: false,
    isVip: false,
    preferences: {
      preferredStaffIds: legacy.preferredStaff,
    },
    loyaltyInfo: {
      tier: (legacy.loyaltyTier as LoyaltyTier) || 'bronze',
      pointsBalance: 0,
      lifetimePoints: 0,
      referralCount: 0,
      rewardsRedeemed: 0,
    },
    visitSummary: {
      totalVisits: legacy.totalVisits,
      totalSpent: legacy.totalSpent,
      averageTicket: legacy.totalVisits > 0 ? legacy.totalSpent / legacy.totalVisits : 0,
      lastVisitDate: legacy.lastVisit?.toISOString(),
      noShowCount: 0,
      lateCancelCount: 0,
    },
    notes: legacy.notes ? [{
      id: 'legacy-note',
      date: legacy.createdAt.toISOString(),
      content: legacy.notes,
      type: 'general',
      isPrivate: false,
      createdBy: 'system',
    }] : undefined,
    createdAt: legacy.createdAt.toISOString(),
    updatedAt: legacy.updatedAt.toISOString(),
    syncStatus: legacy.syncStatus,
  };
}

// ==================== UI STATE TYPES ====================

export type ClientSettingsSection =
  | 'profile'
  | 'preferences'
  | 'beauty-profile'
  | 'safety'
  | 'history'
  | 'wallet'
  | 'membership'
  | 'notes'
  | 'loyalty'
  | 'documents';

export interface ClientFilters {
  searchQuery: string;
  loyaltyTier?: LoyaltyTier | 'all';
  status?: 'all' | 'active' | 'blocked' | 'vip';
  segment?: ClientSegment;
  hasUpcomingAppointment?: boolean;
  lastVisitRange?: 'week' | 'month' | 'quarter' | 'year' | 'over_year';
  tags?: string[];
  preferredStaff?: string[];
  source?: ClientSource;
}

export interface ClientSortOptions {
  field: 'name' | 'lastVisit' | 'totalSpent' | 'visitCount' | 'createdAt';
  order: 'asc' | 'desc';
}

// ==================== SEGMENTATION (PRD 2.3.10) ====================

export type ClientSegment =
  | 'active'        // Visited within last 60 days
  | 'at_risk'       // 60-90 days since last visit
  | 'lapsed'        // 90+ days since last visit
  | 'vip'           // Top 10% by lifetime spend
  | 'new'           // First visit within last 30 days
  | 'member'        // Has active membership
  | 'blocked';      // Currently blocked from booking

export interface SegmentDefinition {
  id: ClientSegment;
  name: string;
  description: string;
  filter: (client: Client) => boolean;
}

// ==================== BULK OPERATIONS ====================

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: { clientId: string; error: string }[];
}
