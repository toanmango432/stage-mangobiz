/**
 * Menu Settings Types
 * @deprecated This file is deprecated. Import from '../../types/catalog' instead.
 *
 * This file now re-exports from the consolidated types/catalog.ts
 * to maintain backward compatibility during migration.
 */

// Re-export all types from the canonical location
export type {
  // Enums
  PricingType,
  ServiceStatus,
  BookingAvailability,
  ExtraTimeType,
  BundleBookingMode,

  // Core entities
  ServiceCategory,
  ServiceVariant,
  MenuService,
  ServicePackage,
  PackageServiceItem,
  AddOnGroup,
  AddOnOption,
  StaffServiceAssignment,
  CatalogSettings,

  // Legacy/UI compatibility types
  ServiceAddOn,
  EmbeddedVariant,
  MenuServiceWithEmbeddedVariants,
  StaffServicePermission,
  MenuGeneralSettings,

  // Aggregate types
  ServiceWithVariants,
  CategoryWithCount,
  AddOnGroupWithOptions,

  // UI types
  CatalogTab,
  CatalogViewMode,
  MenuSettingsTab,
  ViewMode,
  CatalogUIState,

  // Modal props
  CategoryModalProps,
  ServiceModalProps,
  PackageModalProps,
  AddOnModalProps,

  // Input types
  CreateCategoryInput,
  CreateMenuServiceInput,
  CreateVariantInput,
  CreatePackageInput,
  CreateAddOnGroupInput,
  CreateAddOnOptionInput,
  CreateStaffAssignmentInput,
} from '../../types/catalog';

// Re-export conversion functions
export {
  toServiceAddOn,
  fromServiceAddOn,
  toEmbeddedVariant,
  buildStaffPermission,
  toMenuGeneralSettings,
  fromMenuGeneralSettings,
} from '../../types/catalog';

// ============================================
// DEPRECATED TYPE ALIASES
// These are kept for backward compatibility only
// ============================================

/**
 * @deprecated Use MenuServiceWithEmbeddedVariants.variants instead
 * This interface was embedded in MenuService, now use ServiceVariant table
 */
export interface ServiceVariantLegacy {
  id: string;
  name: string;
  duration: number;
  price: number;
  processingTime?: number;
  isDefault?: boolean;
}

/**
 * @deprecated Use StaffServiceAssignment instead
 */
export interface StaffCustomPricing {
  serviceId: string;
  price: number;
}

/**
 * @deprecated Use StaffServiceAssignment instead
 */
export interface StaffCustomDuration {
  serviceId: string;
  duration: number;
}

/**
 * @deprecated Use CatalogUIState instead
 */
export interface MenuSettingsUIState {
  activeTab: import('../../types/catalog').MenuSettingsTab;
  selectedCategoryId: string | null;
  searchQuery: string;
  viewMode: import('../../types/catalog').ViewMode;
  showInactive: boolean;
  expandedCategories: string[];
}

/**
 * @deprecated Not used with new architecture (Dexie live queries)
 */
export interface MenuSettingsState {
  categories: import('../../types/catalog').ServiceCategory[];
  services: import('../../types/catalog').MenuService[];
  packages: import('../../types/catalog').ServicePackage[];
  addOns: import('../../types/catalog').ServiceAddOn[];
  staffPermissions: import('../../types/catalog').StaffServicePermission[];
  settings: import('../../types/catalog').MenuGeneralSettings;
}
