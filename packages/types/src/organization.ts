/**
 * Organization & Multi-Location Types
 * PRD Reference: PRD-API-Specifications.md Section 4.12
 *
 * Enterprise multi-location and franchise management,
 * including centralized settings, cross-location features,
 * and consolidated reporting.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Organization type */
export type OrganizationType = 'single' | 'multi-location' | 'franchise';

/** Day of week for business hours */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ============================================
// ADDRESS
// ============================================

/**
 * Physical address for a location.
 */
export interface Address {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// BUSINESS HOURS
// ============================================

/**
 * Business hours for a single day.
 */
export interface DayHours {
  /** Day of the week */
  day: DayOfWeek;

  /** Whether open on this day */
  isOpen: boolean;

  /** Opening time (HH:MM format, 24-hour) */
  openTime?: string;

  /** Closing time (HH:MM format, 24-hour) */
  closeTime?: string;

  /** Break periods during the day */
  breaks?: {
    startTime: string;
    endTime: string;
    label?: string;
  }[];
}

/**
 * Full week of business hours.
 */
export type BusinessHours = DayHours[];

// ============================================
// ORGANIZATION SETTINGS
// ============================================

/**
 * Organization-level settings (applies to all locations unless overridden).
 */
export interface OrganizationSettings {
  /** Allow clients to book at any location */
  allowCrossLocationBooking: boolean;

  /** Share client database across locations */
  sharedClientDatabase: boolean;

  /** Gift cards redeemable at any location */
  sharedGiftCards: boolean;

  /** Memberships valid at any location */
  sharedMemberships: boolean;

  /** Generate cross-location reports */
  centralizedReporting: boolean;

  /** For franchises: fee percentage charged to franchisees */
  franchiseeFeePercentage?: number;

  /** Default booking lead time (hours) */
  defaultBookingLeadTime?: number;

  /** Default cancellation policy hours */
  defaultCancellationHours?: number;

  /** Require deposits for new clients */
  requireNewClientDeposit?: boolean;

  /** Default deposit percentage */
  defaultDepositPercent?: number;

  /** Branding settings */
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// ============================================
// LOCATION SETTINGS
// ============================================

/**
 * Location-specific settings (can override organization settings).
 */
export interface LocationSettings {
  /** Override booking lead time */
  bookingLeadTime?: number;

  /** Override cancellation policy */
  cancellationHours?: number;

  /** Override deposit requirement */
  requireNewClientDeposit?: boolean;

  /** Override deposit percentage */
  depositPercent?: number;

  /** Location-specific booking buffer (minutes between appointments) */
  bookingBuffer?: number;

  /** Accept walk-ins */
  acceptWalkIns?: boolean;

  /** Online booking enabled */
  onlineBookingEnabled?: boolean;

  /** Time slot interval for booking (minutes) */
  timeSlotInterval?: number;

  /** Tax rate for this location */
  taxRate?: number;

  /** Receipt header text */
  receiptHeader?: string;

  /** Receipt footer text */
  receiptFooter?: string;
}

// ============================================
// LOCATION ENTITY
// ============================================

/**
 * A physical salon location.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Location extends BaseSyncableEntity {
  /** Reference to parent organization */
  organizationId: string;

  /** Location name (e.g., "Downtown Branch") */
  name: string;

  /** Physical address */
  address: Address;

  /** Main phone number */
  phone: string;

  /** Email address */
  email: string;

  /** Location timezone (e.g., "America/Los_Angeles") */
  timezone: string;

  /** Weekly business hours */
  businessHours: BusinessHours;

  /** Whether location is operational */
  isActive: boolean;

  /** Location-specific settings (overrides org settings) */
  settings: LocationSettings;

  /** Manager user ID */
  managerId?: string;

  /** Manager name (denormalized) */
  managerName?: string;

  /** Number of active staff at this location */
  staffCount?: number;

  /** External IDs for integrations */
  externalIds?: Record<string, string>;

  /** Sort order in location list */
  sortOrder?: number;

  /** Location image URL */
  imageUrl?: string;

  /** Google Place ID for reviews */
  googlePlaceId?: string;

  /** Yelp business ID */
  yelpBusinessId?: string;
}

// ============================================
// ORGANIZATION ENTITY
// ============================================

/**
 * An organization (single salon or multi-location brand).
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Organization extends BaseSyncableEntity {
  /** Organization/brand name */
  name: string;

  /** Organization type */
  type: OrganizationType;

  /** Subscription/billing plan */
  billingPlan: string;

  /** Primary contact user ID */
  primaryContactId: string;

  /** Primary contact name (denormalized) */
  primaryContactName?: string;

  /** Primary contact email (denormalized) */
  primaryContactEmail?: string;

  /** Organization-wide settings */
  settings: OrganizationSettings;

  /** Number of locations */
  locationCount?: number;

  /** Total active staff across all locations */
  totalStaffCount?: number;

  /** Billing email */
  billingEmail?: string;

  /** Legal business name (for invoicing) */
  legalName?: string;

  /** Tax ID / EIN */
  taxId?: string;

  /** Website URL */
  website?: string;

  /** Default currency */
  currency?: string;

  /** Locale/language preference */
  locale?: string;
}

// ============================================
// CORPORATE USER & ROLES
// ============================================

/**
 * Permission scope for corporate roles.
 */
export type PermissionScope =
  | 'organization:read'
  | 'organization:write'
  | 'locations:read'
  | 'locations:write'
  | 'staff:read'
  | 'staff:write'
  | 'reports:read'
  | 'reports:write'
  | 'billing:read'
  | 'billing:write'
  | 'settings:read'
  | 'settings:write';

/**
 * A role for corporate users.
 */
export interface CorporateRole extends BaseSyncableEntity {
  /** Reference to organization */
  organizationId: string;

  /** Role name */
  name: string;

  /** Role description */
  description?: string;

  /** Permissions granted by this role */
  permissions: PermissionScope[];

  /** Locations this role has access to (empty = all) */
  locationIds?: string[];

  /** Whether this is a system role (cannot be deleted) */
  isSystemRole?: boolean;
}

/**
 * A user with corporate/multi-location access.
 */
export interface CorporateUser extends BaseSyncableEntity {
  /** Reference to organization */
  organizationId: string;

  /** User ID (references auth user) */
  userId: string;

  /** User's email */
  email: string;

  /** User's name */
  name: string;

  /** Role ID */
  roleId: string;

  /** Role name (denormalized) */
  roleName?: string;

  /** Specific locations this user can access (empty = all per role) */
  locationIds?: string[];

  /** Whether user is active */
  isActive: boolean;

  /** Last login timestamp */
  lastLoginAt?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating an organization.
 */
export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  billingPlan: string;
  primaryContactEmail: string;
  primaryContactName: string;
  legalName?: string;
  taxId?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * Input for creating a location.
 */
export interface CreateLocationInput {
  organizationId: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  timezone: string;
  businessHours: BusinessHours;
  settings?: Partial<LocationSettings>;
  managerId?: string;
}

/**
 * Input for updating organization settings.
 */
export interface UpdateOrganizationSettingsInput {
  organizationId: string;
  settings: Partial<OrganizationSettings>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Creates default business hours (Mon-Sat 9-6, Sun closed).
 */
export function createDefaultBusinessHours(): BusinessHours {
  const days: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return days.map((day) => ({
    day,
    isOpen: day !== 'sunday',
    openTime: day !== 'sunday' ? '09:00' : undefined,
    closeTime: day !== 'sunday' ? '18:00' : undefined,
  }));
}

/**
 * Creates default organization settings.
 */
export function createDefaultOrganizationSettings(): OrganizationSettings {
  return {
    allowCrossLocationBooking: true,
    sharedClientDatabase: true,
    sharedGiftCards: true,
    sharedMemberships: true,
    centralizedReporting: true,
    defaultBookingLeadTime: 24,
    defaultCancellationHours: 24,
    requireNewClientDeposit: false,
    defaultDepositPercent: 20,
  };
}

/**
 * Creates default location settings.
 */
export function createDefaultLocationSettings(): LocationSettings {
  return {
    acceptWalkIns: true,
    onlineBookingEnabled: true,
    timeSlotInterval: 15,
    bookingBuffer: 0,
  };
}

/**
 * Checks if a location is currently open.
 */
export function isLocationOpen(location: Location, date: Date = new Date()): boolean {
  const dayNames: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const currentDay = dayNames[date.getDay()];
  const dayHours = location.businessHours.find((h) => h.day === currentDay);

  if (!dayHours || !dayHours.isOpen || !dayHours.openTime || !dayHours.closeTime) {
    return false;
  }

  const currentTime = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return currentTime >= dayHours.openTime && currentTime <= dayHours.closeTime;
}

/**
 * Formats address for display.
 */
export function formatAddress(address: Address): string {
  const parts = [
    address.street,
    address.street2,
    address.city,
    `${address.state} ${address.postalCode}`,
  ].filter(Boolean);

  return parts.join(', ');
}
