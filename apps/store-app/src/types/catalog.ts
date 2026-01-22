/**
 * Catalog Module Types
 * Single source of truth for salon/spa service menu management
 *
 * This file consolidates and replaces menu-settings/types.ts
 * All UI components should import from here.
 *
 * See: docs/PRD-Catalog-Module.md
 */

import { SyncStatus, BaseSyncableEntity } from './common';

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type PricingType = 'fixed' | 'from' | 'free' | 'varies' | 'hourly';
export type ServiceStatus = 'active' | 'inactive' | 'archived';
export type BookingAvailability = 'online' | 'in-store' | 'both' | 'disabled';
export type ExtraTimeType = 'processing' | 'blocked' | 'finishing';
export type BundleBookingMode = 'single-session' | 'multiple-visits';

// ============================================
// SERVICE CATEGORY
// ============================================

/**
 * ServiceCategory - Represents a service category in the catalog
 * Extends BaseSyncableEntity for multi-device sync support
 *
 * @see docs/DATA_STORAGE_STRATEGY.md Section 2.1
 */
export interface ServiceCategory extends BaseSyncableEntity {
  // Core fields
  name: string;
  description?: string;
  color: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;

  // Hierarchy
  parentCategoryId?: string;

  // Online Booking (MNU-P1-006)
  showOnlineBooking?: boolean;
}

/**
 * Input type for creating a new ServiceCategory
 * Omits all BaseSyncableEntity fields that are auto-generated
 */
export type CreateCategoryInput = Omit<ServiceCategory,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

// ============================================
// SERVICE VARIANT
// ============================================

/**
 * ServiceVariant - Represents a variant of a service (e.g., "Short Hair", "Long Hair")
 * Extends BaseSyncableEntity for multi-device sync support
 *
 * @see docs/DATA_STORAGE_STRATEGY.md Section 2.1
 */
export interface ServiceVariant extends BaseSyncableEntity {
  serviceId: string;

  // Core fields
  name: string; // e.g., "Short Hair", "Medium Hair", "Long Hair"
  duration: number; // minutes
  price: number;

  // Extra time (Fresha-style)
  extraTime?: number; // minutes
  extraTimeType?: ExtraTimeType;

  isDefault: boolean;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Input type for creating a new ServiceVariant
 * Omits all BaseSyncableEntity fields that are auto-generated
 */
export type CreateVariantInput = Omit<ServiceVariant,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

// ============================================
// MENU SERVICE (Enhanced Service)
// ============================================

/**
 * MenuService - Represents a service in the catalog
 * Extends BaseSyncableEntity for multi-device sync support
 *
 * @see docs/DATA_STORAGE_STRATEGY.md Section 2.1
 */
export interface MenuService extends BaseSyncableEntity {
  categoryId: string;

  // Core fields
  name: string;
  description?: string;
  sku?: string; // Stock Keeping Unit for inventory/reporting

  // Pricing
  pricingType: PricingType;
  price: number; // Base price or starting price
  priceMax?: number; // For 'varies' pricing type
  cost?: number; // Cost of goods sold (COGS)
  taxable: boolean;

  // Duration
  duration: number; // minutes

  // Extra time (Fresha-style: processing, blocked, finishing)
  extraTime?: number;
  extraTimeType?: ExtraTimeType;

  // Client care
  aftercareInstructions?: string; // Post-service care instructions
  requiresPatchTest?: boolean; // Requires patch test before service (e.g., hair color)

  // Variants
  hasVariants: boolean;
  variantCount: number; // Number of variants for this service
  // Note: Variants stored in separate table for sync efficiency

  // Staff assignment
  allStaffCanPerform: boolean;
  // Note: Staff assignments stored in separate table

  // Booking settings
  bookingAvailability: BookingAvailability;
  onlineBookingEnabled: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  depositPercentage?: number;

  // Online booking limits (MNU-P1-017)
  onlineBookingBufferMinutes?: number;  // Minimum time before booking
  advanceBookingDaysMin?: number;        // Minimum days in advance
  advanceBookingDaysMax?: number;        // Maximum days in advance

  // Rebook reminder (days after service)
  rebookReminderDays?: number;

  // Turn weight for queue calculations (MNU-P1-019)
  turnWeight?: number;  // 0.0 - 5.0, default 1.0

  // Additional settings
  commissionRate?: number; // percentage
  color?: string; // Override category color
  images?: string[];
  tags?: string[];

  // Visibility & Status
  status: ServiceStatus; // 'active' | 'inactive' | 'archived'
  displayOrder: number;
  showPriceOnline: boolean;
  allowCustomDuration: boolean;

  // === ARCHIVE FIELDS ===
  /**
   * ISO timestamp when the service was archived.
   * Only set when status is 'archived'.
   *
   * @example '2024-01-15T10:30:00.000Z'
   */
  archivedAt?: string;

  /**
   * Staff ID of the person who archived this service.
   * Only set when status is 'archived'.
   *
   * @example 'staff-abc123'
   */
  archivedBy?: string;
}

/**
 * Input type for creating a new MenuService
 * Omits all BaseSyncableEntity fields that are auto-generated
 */
export type CreateMenuServiceInput = Omit<MenuService,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

// ============================================
// SERVICE PACKAGE / BUNDLE
// ============================================

/**
 * ServicePackage - Represents a bundled package of services
 * Extends BaseSyncableEntity for multi-device sync support
 *
 * @see docs/DATA_STORAGE_STRATEGY.md Section 2.1
 */
export interface ServicePackage extends BaseSyncableEntity {
  // Core fields
  name: string;
  description?: string;

  // Services included (stored as embedded array for simplicity)
  services: PackageServiceItem[];

  // Pricing
  originalPrice: number; // Sum of individual services
  packagePrice: number; // Discounted price
  discountType: 'fixed' | 'percentage';
  discountValue: number;

  // Booking mode (Fresha-style)
  bookingMode: BundleBookingMode;

  // Validity
  validityDays?: number; // How long the package is valid after purchase
  usageLimit?: number; // How many times can be used

  // Booking settings
  bookingAvailability: BookingAvailability;
  onlineBookingEnabled: boolean;

  // Staff restrictions (MNU-P2-037)
  restrictedStaffIds?: string[];  // If set, only these staff can perform the package

  // Status
  isActive: boolean;
  displayOrder: number;

  // Visual
  color?: string;
  images?: string[];
}

export interface PackageServiceItem {
  serviceId: string;
  serviceName: string; // Denormalized for display
  variantId?: string;
  variantName?: string;
  quantity: number;
  originalPrice: number;
}

/**
 * Input type for creating a new ServicePackage
 * Omits all BaseSyncableEntity fields that are auto-generated
 */
export type CreatePackageInput = Omit<ServicePackage,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

// ============================================
// ADD-ON GROUP & OPTIONS (Fresha-style)
// ============================================

/**
 * AddOnGroup - Represents a group of add-on options that can be selected for services
 * Extends BaseSyncableEntity for multi-device sync support
 *
 * @see docs/DATA_STORAGE_STRATEGY.md Section 2.1
 */
export interface AddOnGroup extends BaseSyncableEntity {
  // Core fields
  name: string;
  description?: string;

  // Selection rules
  selectionMode: 'single' | 'multiple';
  minSelections: number;
  maxSelections?: number;
  isRequired: boolean;

  // Applicability
  applicableToAll: boolean;
  applicableCategoryIds: string[];
  applicableServiceIds: string[];

  // Status
  isActive: boolean;
  displayOrder: number;
  onlineBookingEnabled: boolean;
}

/**
 * AddOnOption - Represents a single add-on option within an AddOnGroup
 * Extends BaseSyncableEntity for multi-device sync support
 *
 * @see docs/DATA_STORAGE_STRATEGY.md Section 2.1
 */
export interface AddOnOption extends BaseSyncableEntity {
  groupId: string;

  // Core fields
  name: string;
  description?: string;

  // Pricing & Duration
  price: number;
  duration: number; // minutes

  // Status
  isActive: boolean;
  displayOrder: number;
}

/**
 * Input type for creating a new AddOnGroup
 * Omits all BaseSyncableEntity fields that are auto-generated
 */
export type CreateAddOnGroupInput = Omit<AddOnGroup,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

/**
 * Input type for creating a new AddOnOption
 * Omits all BaseSyncableEntity fields that are auto-generated
 */
export type CreateAddOnOptionInput = Omit<AddOnOption,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

// ============================================
// STAFF-SERVICE ASSIGNMENT
// ============================================

export interface StaffServiceAssignment {
  id: string;
  storeId: string;
  staffId: string;
  serviceId: string;

  // Custom pricing/duration for this staff member
  customPrice?: number;
  customDuration?: number;

  // Commission override
  customCommissionRate?: number;

  // Status
  isActive: boolean;

  // Timestamps & Sync (ISO 8601 strings)
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export type CreateStaffAssignmentInput = Omit<StaffServiceAssignment,
  'id' | 'storeId' | 'createdAt' | 'updatedAt' | 'syncStatus'
>;

// ============================================
// CATALOG SETTINGS
// ============================================

export interface CatalogSettings {
  id: string;
  storeId: string;

  // Default values
  defaultDuration: number;
  defaultExtraTime: number;
  defaultExtraTimeType: ExtraTimeType;

  // Pricing defaults
  defaultTaxRate: number;
  currency: string;
  currencySymbol: string;

  // Online booking defaults
  showPricesOnline: boolean;
  requireDepositForOnlineBooking: boolean;
  defaultDepositPercentage: number;

  // Feature toggles
  enablePackages: boolean;
  enableAddOns: boolean;
  enableVariants: boolean;
  allowCustomPricing: boolean;
  bookingSequenceEnabled: boolean;

  // Timestamps & Sync
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// ============================================
// BOOKING SEQUENCE
// ============================================

/**
 * BookingSequence - Defines the order services should be performed
 * Used to ensure services are booked in a logical order (e.g., Cut → Color → Style)
 */
export interface BookingSequence {
  id: string;
  storeId: string;

  // Ordered list of service IDs
  serviceOrder: string[];

  // Whether this sequence is enabled
  isEnabled: boolean;

  // Timestamps & Sync
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export type CreateBookingSequenceInput = Omit<BookingSequence,
  'id' | 'storeId' | 'createdAt' | 'updatedAt' | 'syncStatus'
>;

// ============================================
// UI STATE TYPES (for Redux slice)
// ============================================

export type CatalogTab = 'categories' | 'services' | 'packages' | 'products' | 'addons' | 'giftcards' | 'staff' | 'settings' | 'archived';
export type CatalogViewMode = 'grid' | 'list' | 'compact';

export interface CatalogUIState {
  activeTab: CatalogTab;
  selectedCategoryId: string | null;
  searchQuery: string;
  viewMode: CatalogViewMode;
  showInactive: boolean;
  expandedCategories: string[];
}

// ============================================
// REDUX STATE SHAPE
// ============================================

export interface CatalogState {
  // Data
  categories: ServiceCategory[];
  services: MenuService[];
  variants: ServiceVariant[];
  packages: ServicePackage[];
  addOnGroups: AddOnGroup[];
  addOnOptions: AddOnOption[];
  staffAssignments: StaffServiceAssignment[];
  settings: CatalogSettings | null;

  // UI State
  ui: CatalogUIState;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

// ============================================
// AGGREGATE TYPES (for UI convenience)
// ============================================

/**
 * Service with its variants pre-loaded (for UI display)
 */
export interface ServiceWithVariants extends MenuService {
  variants: ServiceVariant[];
}

/**
 * Category with its services count (for sidebar display)
 */
export interface CategoryWithCount extends ServiceCategory {
  servicesCount: number;
  activeServicesCount: number;
}

/**
 * Add-on group with its options pre-loaded
 */
export interface AddOnGroupWithOptions extends AddOnGroup {
  options: AddOnOption[];
}

// ============================================
// LEGACY/UI COMPATIBILITY TYPES
// These maintain backward compatibility with existing UI components
// ============================================

/**
 * ServiceAddOn - Flat add-on type for simpler UI components
 * Maps to AddOnGroup with a single AddOnOption
 * @deprecated Use AddOnGroup + AddOnOption for new code
 */
export interface ServiceAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  applicableToAll: boolean;
  applicableCategoryIds: string[];
  applicableServiceIds: string[];
  isActive: boolean;
  displayOrder: number;
  onlineBookingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert AddOnGroup + AddOnOption to legacy ServiceAddOn format
 */
export function toServiceAddOn(group: AddOnGroup, option: AddOnOption): ServiceAddOn {
  return {
    id: option.id,
    name: option.name,
    description: option.description || group.description,
    price: option.price,
    duration: option.duration,
    applicableToAll: group.applicableToAll,
    applicableCategoryIds: group.applicableCategoryIds,
    applicableServiceIds: group.applicableServiceIds,
    isActive: option.isActive && group.isActive,
    displayOrder: option.displayOrder,
    onlineBookingEnabled: group.onlineBookingEnabled,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt,
  };
}

/**
 * Convert legacy ServiceAddOn to CreateAddOnGroupInput + CreateAddOnOptionInput
 * Used for converting old flat add-on data to the new group/option structure
 *
 * Note: The returned objects are input types (not full entities) - they need
 * to be passed through create() methods to get sync fields populated
 */
export function fromServiceAddOn(addOn: ServiceAddOn, _storeId: string): {
  group: Omit<CreateAddOnGroupInput, 'displayOrder'> & { displayOrder: number };
  option: Omit<CreateAddOnOptionInput, 'groupId' | 'displayOrder'> & { displayOrder: number };
} {
  return {
    group: {
      name: addOn.name,
      description: addOn.description,
      selectionMode: 'single',
      minSelections: 0,
      maxSelections: 1,
      isRequired: false,
      applicableToAll: addOn.applicableToAll,
      applicableCategoryIds: addOn.applicableCategoryIds,
      applicableServiceIds: addOn.applicableServiceIds,
      isActive: addOn.isActive,
      displayOrder: addOn.displayOrder,
      onlineBookingEnabled: addOn.onlineBookingEnabled,
    },
    option: {
      name: addOn.name,
      description: addOn.description,
      price: addOn.price,
      duration: addOn.duration,
      isActive: addOn.isActive,
      displayOrder: 0,
    },
  };
}

/**
 * Embedded variant for UI display (matches old menu-settings format)
 * Used when variants need to be shown inline with service
 */
export interface EmbeddedVariant {
  id: string;
  name: string;
  duration: number;
  price: number;
  processingTime?: number;
  isDefault?: boolean;
}

/**
 * Convert ServiceVariant to embedded format for UI
 */
export function toEmbeddedVariant(variant: ServiceVariant): EmbeddedVariant {
  return {
    id: variant.id,
    name: variant.name,
    duration: variant.duration,
    price: variant.price,
    processingTime: variant.extraTime,
    isDefault: variant.isDefault,
  };
}

/**
 * MenuService with embedded variants for UI display
 */
export interface MenuServiceWithEmbeddedVariants extends Omit<MenuService, 'hasVariants'> {
  hasVariants: boolean;
  variants: EmbeddedVariant[];
  // Legacy field mapping
  processingTime?: number;
  assignedStaffIds?: string[];
}

/**
 * Staff permission view for UI (aggregated from StaffServiceAssignment)
 */
export interface StaffServicePermission {
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  serviceIds: string[];
  categoryIds: string[];
  canPerformAllServices: boolean;
  customPricing?: { serviceId: string; price: number }[];
  customDuration?: { serviceId: string; duration: number }[];
}

/**
 * Build StaffServicePermission from assignments
 */
export function buildStaffPermission(
  staffId: string,
  staffName: string,
  assignments: StaffServiceAssignment[],
  allServiceIds: string[],
  staffAvatar?: string
): StaffServicePermission {
  const staffAssignments = assignments.filter(a => a.staffId === staffId && a.isActive);
  const serviceIds = staffAssignments.map(a => a.serviceId);

  return {
    staffId,
    staffName,
    staffAvatar,
    serviceIds,
    categoryIds: [], // Would need to compute from services
    canPerformAllServices: serviceIds.length === allServiceIds.length,
    customPricing: staffAssignments
      .filter(a => a.customPrice !== undefined)
      .map(a => ({ serviceId: a.serviceId, price: a.customPrice! })),
    customDuration: staffAssignments
      .filter(a => a.customDuration !== undefined)
      .map(a => ({ serviceId: a.serviceId, duration: a.customDuration! })),
  };
}

// ============================================
// UI TYPE ALIASES (for cleaner imports)
// ============================================

/** @alias CatalogTab */
export type MenuSettingsTab = CatalogTab;

/** @alias CatalogViewMode */
export type ViewMode = CatalogViewMode;

// ============================================
// MODAL PROPS TYPES
// ============================================

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: ServiceCategory;
  onSave: (category: Partial<ServiceCategory>) => Promise<void> | void;
}

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: MenuServiceWithEmbeddedVariants;
  categories: ServiceCategory[];
  onSave: (service: Partial<MenuService>, variants?: EmbeddedVariant[]) => Promise<void> | void;
}

export interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  package?: ServicePackage;
  services: MenuServiceWithEmbeddedVariants[];
  onSave: (pkg: Partial<ServicePackage>) => Promise<void> | void;
}

export interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  addOn?: ServiceAddOn;
  categories: ServiceCategory[];
  services: MenuService[];
  onSave: (addOn: Partial<ServiceAddOn>) => Promise<void> | void;
}

// ============================================
// MENU GENERAL SETTINGS (UI compatibility)
// ============================================

/**
 * MenuGeneralSettings - UI-friendly settings format
 * Maps to CatalogSettings
 */
export interface MenuGeneralSettings {
  defaultDuration: number;
  defaultProcessingTime: number;
  showPricesOnline: boolean;
  requireDepositForOnlineBooking: boolean;
  defaultDepositPercentage: number;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  allowCustomPricing: boolean;
  enablePackages: boolean;
  enableAddOns: boolean;
}

/**
 * Convert CatalogSettings to MenuGeneralSettings
 */
export function toMenuGeneralSettings(settings: CatalogSettings): MenuGeneralSettings {
  return {
    defaultDuration: settings.defaultDuration,
    defaultProcessingTime: settings.defaultExtraTime,
    showPricesOnline: settings.showPricesOnline,
    requireDepositForOnlineBooking: settings.requireDepositForOnlineBooking,
    defaultDepositPercentage: settings.defaultDepositPercentage,
    taxRate: settings.defaultTaxRate,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    allowCustomPricing: settings.allowCustomPricing,
    enablePackages: settings.enablePackages,
    enableAddOns: settings.enableAddOns,
  };
}

/**
 * Convert MenuGeneralSettings updates to CatalogSettings
 */
export function fromMenuGeneralSettings(settings: MenuGeneralSettings): Partial<CatalogSettings> {
  return {
    defaultDuration: settings.defaultDuration,
    defaultExtraTime: settings.defaultProcessingTime,
    showPricesOnline: settings.showPricesOnline,
    requireDepositForOnlineBooking: settings.requireDepositForOnlineBooking,
    defaultDepositPercentage: settings.defaultDepositPercentage,
    defaultTaxRate: settings.taxRate,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    allowCustomPricing: settings.allowCustomPricing,
    enablePackages: settings.enablePackages,
    enableAddOns: settings.enableAddOns,
  };
}

// ============================================
// GIFT CARD MANAGEMENT TYPES
// ============================================

/**
 * GiftCardDenomination - Preset gift card amounts for quick sale
 * Managed in Catalog > Gift Cards tab
 */
export interface GiftCardDenomination {
  id: string;
  storeId: string;

  // Core fields
  amount: number;
  label?: string;  // e.g., "$50 Gift Card", "Holiday Special"

  // Status
  isActive: boolean;
  displayOrder: number;

  // Timestamps & Sync
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export type CreateGiftCardDenominationInput = Omit<GiftCardDenomination,
  'id' | 'storeId' | 'createdAt' | 'updatedAt' | 'syncStatus'
>;

/**
 * GiftCardSettings - Per-salon gift card configuration
 */
export interface GiftCardSettings {
  id: string;
  storeId: string;

  // Custom amount settings
  allowCustomAmount: boolean;
  minAmount: number;
  maxAmount: number;

  // Expiration
  defaultExpirationDays?: number;  // null/undefined = never expires

  // Online settings
  onlineEnabled: boolean;
  emailDeliveryEnabled: boolean;

  // Timestamps & Sync
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}
