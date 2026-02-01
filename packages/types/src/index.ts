// Export all types
export * from './common';
export * from './appointment';
export * from './Ticket';
export * from './transaction';
// Staff exports including StaffSchedule
export * from './staff';
// Timesheet exports
export * from './timesheet';
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
// Schedule module (selective exports to avoid StaffSchedule conflict with staff.ts)
// The schedule/staffSchedule.ts has a more detailed StaffSchedule with week patterns
// while staff.ts has a simpler StaffSchedule for basic staff data
export {
  // Staff Schedule types (detailed version for multi-week patterns)
  type StaffSchedule as DetailedStaffSchedule,
  type SchedulePatternType,
  type WeekSchedule,
  type DayScheduleConfig,
  type ShiftConfig,
  type CreateStaffScheduleInput,
  // Time-Off types
  type TimeOffType as ScheduleTimeOffType,
  type TimeOffRequest as ScheduleTimeOffRequest,
  type TimeOffRequestStatus,
  type TimeOffStatusChange,
  type CreateTimeOffRequestInput,
  type CreateTimeOffTypeInput,
  type UpdateTimeOffTypeInput,
  // Blocked Time types
  type BlockedTimeType,
  type BlockedTimeEntry,
  type BlockedTimeFrequency,
  type CreateBlockedTimeTypeInput,
  type CreateBlockedTimeEntryInput,
  type UpdateBlockedTimeTypeInput,
  // Business Closure types
  type BusinessClosedPeriod,
  type CreateBusinessClosedPeriodInput,
  // Resource types
  type Resource,
  type ResourceCategory,
  type CreateResourceInput,
  type UpdateResourceInput,
  type ResourceBooking,
  type CreateResourceBookingInput,
  // Pagination
  type PaginatedResult,
  type PaginationParams,
  type TimeOffRequestFilters,
  type BlockedTimeEntryFilters,
  type ResourceBookingFilters,
  type CustomDateRange,
  isCustomDateRange,
  DEFAULT_PAGINATION,
  emptyPaginatedResult,
  // Constants
  DEFAULT_TIME_OFF_TYPES,
  DEFAULT_BLOCKED_TIME_TYPES,
  SCHEDULE_SYNC_PRIORITIES,
  SCHEDULE_ENTITY_TYPES,
  type ScheduleEntityType,
  // Errors
  type ScheduleErrorCode,
  ScheduleError,
  TimeOffTypeNotFoundError,
  TimeOffRequestNotFoundError,
  CannotDeleteSystemDefaultError,
  RequestNotPendingError,
  DenialReasonRequiredError,
  ConflictExistsError,
  InsufficientBalanceError,
  DateRangeInvalidError,
  BlockedTimeTypeNotFoundError,
  BlockedTimeEntryNotFoundError,
  CannotDeleteDefaultBlockedTimeTypeError,
  BlockedTimeTypeInUseError,
  DuplicateBlockedTimeTypeCodeError,
  BlockedTimeConflictError,
  InvalidRecurrenceConfigError,
  ResourceNotFoundError,
  ResourceBookingConflictError,
  StaffNotFoundError,
  StaffScheduleNotFoundError,
  UnauthorizedScheduleError,
  isScheduleError,
  isTimeOffTypeNotFoundError,
  isConflictExistsError,
  isCannotDeleteSystemDefaultError,
  isBlockedTimeTypeNotFoundError,
  isBlockedTimeEntryNotFoundError,
  isCannotDeleteDefaultBlockedTimeTypeError,
  isBlockedTimeTypeInUseError,
  isBlockedTimeConflictError,
  isInvalidRecurrenceConfigError,
} from './schedule';
// Payroll exports (renaming to avoid conflicts with timesheet.ts)
export {
  type PayRunStatus,
  type AdjustmentType,
  type PayPeriodType,
  type PayRunAdjustment,
  type PayRunHoursBreakdown,
  type PayRunCommissionBreakdown,
  type StaffPayment,
  type PayRunTotals,
  type PayRun,
  type CreatePayRunParams,
  type AddAdjustmentParams,
  type CalculatedPayData,
  type PaymentMethod as PayrollPaymentMethod,
  // Renamed to avoid conflict with timesheet.createEmptyHoursBreakdown
  createEmptyHoursBreakdown as createEmptyPayRunHoursBreakdown,
  createEmptyCommissionBreakdown,
  createEmptyTotals,
  createDefaultStaffPayment,
  calculatePayRunTotals,
  getPayRunStatusInfo,
  getAdjustmentTypeInfo,
} from './payroll';

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

// Reviews & Reputation (selective export to avoid ReviewRequest duplicate with client.ts)
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

// Loyalty types
export * from './loyalty';

// Marketing & Campaigns (selective export to avoid ClientSegment/LoyaltyTier duplicates with client.ts)
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

// Team Settings Types
export * from './team-settings';

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
