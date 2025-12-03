// Export all types
export * from './common';
export * from './appointment';
export * from './Ticket';
export * from './transaction';
// NOTE: './staff' exports StaffSchedule which is already in './schedule'
// NOTE: './timesheet' exports PaymentMethod and createEmptyHoursBreakdown which are already in './common'
// Selectively export from staff (avoiding StaffSchedule duplicate)
export type { Staff } from './staff';
// Selectively export from timesheet (avoiding PaymentMethod and createEmptyHoursBreakdown duplicates)
export type { TimesheetEntry, TimesheetStatus, HoursBreakdown } from './timesheet';
export * from './client';
export * from './service';
export * from './sync';
// Export from catalog - renaming ServiceStatus to avoid conflict with common.ts
export {
  type PricingType,
  type ServiceStatus as CatalogServiceStatus,
  type BookingAvailability,
  type ExtraTimeType,
  type BundleBookingMode,
  type ServiceCategory,
  type CreateCategoryInput,
  type ServiceVariant,
  type CreateVariantInput,
  type MenuService,
  type CreateMenuServiceInput,
  type ServicePackage,
  type PackageServiceItem,
  type CreatePackageInput,
  type AddOnGroup,
  type AddOnOption,
  type CreateAddOnGroupInput,
  type CreateAddOnOptionInput,
  type StaffServiceAssignment,
  type CreateStaffAssignmentInput,
  type CatalogSettings,
  type BookingSequence,
  type CreateBookingSequenceInput,
  type CatalogTab,
  type CatalogViewMode,
  type CatalogUIState,
  type CatalogState,
  type ServiceWithVariants,
  type CategoryWithCount,
  type AddOnGroupWithOptions,
  type ServiceAddOn,
  toServiceAddOn,
  fromServiceAddOn,
  type EmbeddedVariant,
  toEmbeddedVariant,
  type MenuServiceWithEmbeddedVariants,
  type StaffServicePermission,
  buildStaffPermission,
  type MenuSettingsTab,
  type ViewMode,
  type CategoryModalProps,
  type ServiceModalProps,
  type PackageModalProps,
  type AddOnModalProps,
  type MenuGeneralSettings,
  toMenuGeneralSettings,
  fromMenuGeneralSettings,
} from './catalog';
// Alias for backward compatibility
export type { MenuService as CatalogService } from './catalog';
export type { PackageServiceItem as PackageItem } from './catalog';
// Do NOT export from './schedule' - it causes ServiceStatus duplicate
// export * from './schedule';
// Selectively export from payroll (avoiding PaymentMethod duplicate with common.ts)
export type {
  PayRunStatus,
  AdjustmentType,
  PayPeriodType,
  PayRunAdjustment,
  PayRunHoursBreakdown,
  PayRunCommissionBreakdown,
  StaffPayment,
  PayRunTotals,
  PayRun,
  CreatePayRunParams,
  AddAdjustmentParams,
  CalculatedPayData,
} from './payroll';
export type { PaymentMethod as PayrollPaymentMethod } from './payroll';
