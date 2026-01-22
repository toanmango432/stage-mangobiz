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
// Selectively export from service (avoiding ServiceStatus duplicate with common.ts)
export type { Service } from './service';
// Rename ServiceStatus from service.ts to avoid conflict with common.ts
export { type ServiceStatus as ServiceArchiveStatus } from './service';
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
  // Gift Card Management types (Catalog Module)
  type GiftCardDenomination,
  type CreateGiftCardDenominationInput,
  type GiftCardSettings,
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

// ============================================
// API MODULE TYPES (PRD-API-Specifications.md)
// ============================================

// Gift Cards
export * from './gift-card';

// Memberships
export * from './membership';

// Client Packages (pre-paid service bundles)
export * from './client-package';

// Inventory & Products
export * from './inventory';

// Organization & Multi-Location
export * from './organization';

// Waitlist
export * from './waitlist';

// Deposits
export * from './deposit';

// Reviews & Reputation
// Selectively export from review.ts (avoiding ReviewRequest duplicate with client.ts)
export {
  type ReviewSource,
  type ReputationTrend,
  type Review,
  type ReviewRequest as ReputationReviewRequest,
  type ReputationSummary,
  type NPSResponse,
  type NPSSummary,
  type ReviewSettings,
  type SubmitReviewInput,
  type RespondToReviewInput,
  type SendReviewRequestInput,
  getStarDisplay,
  getRatingColor,
  calculateNPS,
  getNPSCategory,
  getTrendDisplay,
  createDefaultReviewSettings,
  formatTimeSince,
} from './review';

// Notifications
export * from './notification';

// Marketing & Campaigns
// Selectively export from marketing.ts (avoiding ClientSegment/LoyaltyTier duplicates with client.ts)
export {
  type PromotionType,
  type CampaignStatus,
  type CampaignChannel,
  type ClientSegmentType,
  type LoyaltyTier as MarketingLoyaltyTier,
  type Promotion,
  type Campaign,
  type CampaignFilter,
  type CampaignMetrics,
  type ClientSegment as MarketingClientSegment,
  type LoyaltyAccount,
  type LoyaltyTransaction,
  type CreatePromotionInput,
  type CreateCampaignInput,
  type AdjustLoyaltyPointsInput,
  getCampaignStatusInfo,
  getLoyaltyTierInfo,
  isValidPromoCode,
  isPromotionValid,
  calculatePromotionDiscount,
  createEmptyCampaignMetrics,
  determineLoyaltyTier,
  getDefaultSegments,
} from './marketing';

// Integrations & Webhooks
export * from './integration';

// Settings Module (selective export to avoid conflicts)
export type {
  BusinessType,
  DateFormat,
  TimeFormat,
  TipCalculation,
  TipDistributionMethod,
  TipDefaultSelection,
  ServiceChargeApplyTo,
  RoundingMethod,
  GatewayProvider,
  GatewayApiMode,
  TerminalType,
  ConnectionStatus,
  HardwareDeviceType,
  ConnectionType,
  ThemeMode,
  DefaultView,
  SidebarPosition,
  FontSize,
  LicenseStatus,
  LicenseTier,
  SubscriptionPlan,
  BillingCycle,
  SocialMedia,
  BusinessAddress,
  BusinessLocale,
  OperatingHours as SettingsOperatingHours,
  SpecialHours,
  ClosedPeriod as SettingsClosedPeriod,
  TaxRate as SettingsTaxRate,
  TaxExemption,
  TaxSettings,
  BusinessProfile,
  BusinessContact,
  BusinessSettings,
  TipSettings,
  TipDistribution,
  DiscountSettings,
  ServiceChargeSettings,
  RoundingSettings,
  PaymentMethodsSettings,
  PaymentTerminal,
  PaymentGateway,
  HardwareDevice,
  CheckoutSettings,
  ReceiptHeader,
  ReceiptFooter,
  ReceiptOptions,
  ReceiptSettings,
  NotificationChannel as SettingsNotificationChannel,
  ClientNotifications,
  StaffNotifications,
  OwnerNotifications,
  NotificationSettings as SettingsNotificationSettings,
  AccountInfo,
  SecuritySettings,
  SubscriptionInfo,
  LicenseInfo,
  AccountSettings,
  RegisteredDevice,
  ThemeSettings,
  LayoutSettings,
  ModuleVisibility,
  SystemSettings,
  StoreSettings,
  SettingsCategory,
} from './settings';

// Activity Logs (audit trail)
export * from './activityLog';

// Member Authentication (Supabase Auth integration)
export * from './memberAuth';

// Connect Integration (Mango Connect SDK)
export * from './connectIntegration';
