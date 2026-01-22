// Client Settings Types - Comprehensive client management for salon/spa

import { SyncStatus } from '../../types/common';

// Client Gender
export type ClientGender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';

// Loyalty Tiers
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';

// Communication preferences
export type CommunicationChannel = 'email' | 'sms' | 'phone' | 'app_notification';
export type ContactTimePreference = 'morning' | 'afternoon' | 'evening' | 'anytime';

// Staff Alert
export interface StaffAlert {
  message: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
}

// Client source/referral
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

// Hair profile types (for hair salons)
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairTexture = 'fine' | 'medium' | 'coarse';
export type HairDensity = 'thin' | 'medium' | 'thick';
export type HairPorosity = 'low' | 'normal' | 'high';
export type ScalpCondition = 'normal' | 'dry' | 'oily' | 'sensitive' | 'dandruff';

// Skin profile types (for spas/estheticians)
export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
export type SkinConcern =
  | 'acne'
  | 'aging'
  | 'hyperpigmentation'
  | 'rosacea'
  | 'eczema'
  | 'dehydration'
  | 'sun_damage'
  | 'fine_lines'
  | 'large_pores'
  | 'uneven_texture'
  | 'dark_circles'
  | 'other';

// Nail profile types
export type NailCondition = 'healthy' | 'brittle' | 'peeling' | 'ridged' | 'discolored';
export type NailShape = 'round' | 'square' | 'oval' | 'almond' | 'coffin' | 'stiletto';

// Client contact information
export interface ClientContact {
  phone: string;
  phoneType: 'mobile' | 'home' | 'work';
  email?: string;
  alternatePhone?: string;
  preferredContact: CommunicationChannel;
}

// Client address
export interface ClientAddress {
  street?: string;
  apt?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Emergency contact
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Hair profile for hair salons
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

// Color formula history
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

// Skin profile for spas
export interface SkinProfile {
  type?: SkinType;
  concerns?: SkinConcern[];
  fitzpatrickScale?: number; // 1-6 skin phototype
  allergies?: string[];
  sensitivities?: string[];
  currentProducts?: string;
  treatmentHistory?: string;
}

// Nail profile
export interface NailProfile {
  condition?: NailCondition;
  preferredShape?: NailShape;
  allergies?: string[];
  preferredColors?: string[];
  notes?: string;
}

// Medical/health information (important for treatments)
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

// Client preferences
export interface ClientPreferences {
  preferredStaffIds?: string[];
  preferredServices?: string[];
  preferredDays?: number[]; // 0-6 (Sun-Sat)
  preferredTimes?: ContactTimePreference;
  beveragePreference?: string;
  musicPreference?: string;
  magazinePreference?: string;
  roomTemperature?: 'warm' | 'cool' | 'no_preference';
  pressurePreference?: 'light' | 'medium' | 'firm' | 'deep'; // For massage
  quietEnvironment?: boolean;
  otherNotes?: string;
}

// Communication preferences
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
  bestTimeToContact?: ContactTimePreference;
}

// Loyalty & rewards
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
}

// Membership info (for subscription-based services)
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

// Gift cards
export interface GiftCardBalance {
  cardNumber: string;
  balance: number;
  expirationDate?: string;
  isActive: boolean;
}

// Visit summary
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

// Client tags for segmentation
export interface ClientTag {
  id: string;
  name: string;
  color: string;
}

// Client note
export interface ClientNote {
  id: string;
  date: string;
  content: string;
  type: 'general' | 'service' | 'preference' | 'medical' | 'important';
  isPrivate: boolean;
  createdBy: string;
  createdByName?: string;
}

// Full enhanced client type
export interface EnhancedClient {
  // Core identification
  id: string;
  storeId: string;

  // Basic info
  firstName: string;
  lastName: string;
  displayName?: string;
  nickname?: string;
  avatar?: string;
  gender?: ClientGender;
  birthday?: string;

  // Contact information
  contact: ClientContact;
  address?: ClientAddress;
  emergencyContact?: EmergencyContact;

  // Staff Alert
  staffAlert?: StaffAlert;

  // Source/referral tracking
  source?: ClientSource;
  sourceDetails?: string;
  referredByClientId?: string;
  referredByClientName?: string;

  // Profiles (salon/spa specific)
  hairProfile?: HairProfile;
  skinProfile?: SkinProfile;
  nailProfile?: NailProfile;
  medicalInfo?: MedicalInfo;

  // Preferences
  preferences?: ClientPreferences;
  communicationPreferences: CommunicationPreferences;

  // Loyalty & membership
  loyaltyInfo: LoyaltyInfo;
  membership?: MembershipInfo;
  giftCards?: GiftCardBalance[];

  // Financial summary
  visitSummary: VisitSummary;
  outstandingBalance?: number;
  storeCredit?: number;

  // Tags & notes
  tags?: ClientTag[];
  notes?: ClientNote[];

  // System fields
  isVip: boolean;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// UI State Types
export type ClientSettingsSection =
  | 'profile'
  | 'preferences'
  | 'beauty-profile'
  | 'safety'
  | 'history'
  | 'wallet'
  | 'notes'
  | 'loyalty'
  | 'membership'
  | 'documents'
  | 'data-requests';

export interface ClientSettingsUIState {
  selectedClientId: string | null;
  activeSection: ClientSettingsSection;
  searchQuery: string;
  filterTier: LoyaltyTier | 'all';
  filterStatus: 'all' | 'active' | 'blocked' | 'vip';
  sortBy: 'name' | 'lastVisit' | 'totalSpent' | 'visitCount';
  sortOrder: 'asc' | 'desc';
  isAddingNew: boolean;
  hasUnsavedChanges: boolean;
}

// Form validation types
export interface ClientFormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  birthday?: string;
}

// Search/filter options
export interface ClientFilters {
  searchQuery: string;
  loyaltyTier?: LoyaltyTier | 'all';
  status?: 'all' | 'active' | 'blocked' | 'vip';
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
