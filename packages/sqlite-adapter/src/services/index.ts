/**
 * SQLite Services
 *
 * Service classes providing SQLite-based implementations of data operations.
 * These services use SQL WHERE clauses for efficient filtering instead of JS filtering.
 *
 * @module sqlite-adapter/services
 */

// Base service class
export {
  BaseSQLiteService,
  type TableSchema,
  type ColumnDefinition,
  type ColumnType,
} from './BaseSQLiteService';

// Client service
export {
  ClientSQLiteService,
  type Client,
  type ClientFilters,
  type ClientSortOptions,
} from './clientService';

// Ticket service
export {
  TicketSQLiteService,
  type Ticket,
  type TicketService,
  type TicketProduct,
  type Payment,
  type TicketStatus,
  type ServiceStatus,
  type DailyStats,
} from './ticketService';

// Appointment service
export {
  AppointmentSQLiteService,
  type Appointment,
  type AppointmentService,
  type AppointmentStatus,
  type BookingSource,
  type AppointmentRow,
} from './appointmentService';

// Transaction service
export {
  TransactionSQLiteService,
  type Transaction,
  type TransactionRow,
  type TransactionTotals,
  type TotalsByPaymentMethod,
  type PaymentMethod,
  type TransactionStatus,
} from './transactionService';

// Staff service
export {
  StaffSQLiteService,
  type Staff,
  type StaffRow,
  type StaffStatus,
  type StaffRole,
  type StaffSchedule,
  type ScheduleEntry,
} from './staffService';

// Service (menu item) service
export {
  ServiceSQLiteService,
  type Service,
  type ServiceRow,
  type ServiceAddOn,
  type ServiceVariant,
} from './serviceService';

// Settings service (key-value store)
export {
  SettingsSQLiteService,
  type Setting,
  type SettingValue,
} from './settingsService';

// Sync queue service (offline sync operations)
export {
  SyncQueueSQLiteService,
  type SyncQueueOperation,
  type AddSyncOperationInput,
  type SyncPriority,
  type SyncStatus,
  type SyncEntity,
  type SyncOperation,
} from './syncQueueService';

// Device settings service (device-specific configuration)
export {
  DeviceSettingsSQLiteService,
  type DeviceSettings,
  type DeviceSettingsInput,
  type DeviceConfig,
  type DeviceMode,
} from './deviceSettingsService';

// Team member service (team management with soft delete)
export {
  TeamMemberSQLiteService,
  type TeamMember,
  type TeamMemberRow,
  type TeamMemberProfile,
  type TeamMemberPermissions,
  type TeamMemberRole,
  type TeamMemberSyncStatus,
  type VectorClock,
} from './teamMemberService';

// CRM services (client management, forms, reviews, loyalty)
export {
  // Patch Test service (PRD 2.3.3)
  PatchTestSQLiteService,
  type PatchTest,
  type PatchTestRow,
  type PatchTestResult,
  // Form Template service (PRD 2.3.4)
  FormTemplateSQLiteService,
  type FormTemplate,
  type FormTemplateRow,
  type FormSection,
  type FormSectionType,
  // Form Response service (PRD 2.3.4)
  FormResponseSQLiteService,
  type FormResponse,
  type FormResponseRow,
  type FormResponseStatus,
  // Referral service (PRD 2.3.8)
  ReferralSQLiteService,
  type Referral,
  type ReferralRow,
  // Client Review service (PRD 2.3.9)
  ClientReviewSQLiteService,
  type ClientReview,
  type ClientReviewRow,
  type ReviewPlatform,
  // Loyalty Reward service (PRD 2.3.7)
  LoyaltyRewardSQLiteService,
  type LoyaltyReward,
  type LoyaltyRewardRow,
  type LoyaltyRewardType,
  type LoyaltyRewardSource,
  // Review Request service (PRD 2.3.9)
  ReviewRequestSQLiteService,
  type ReviewRequest,
  type ReviewRequestRow,
  type ReviewRequestStatus,
  // Custom Segment service (PRD 2.3.10)
  CustomSegmentSQLiteService,
  type CustomSegment,
  type CustomSegmentRow,
  type SegmentComparisonOperator,
  type SegmentFilterCondition,
  type SegmentFilterGroup,
} from './crmServices';

// Catalog services (service categories, menu services, packages, add-ons, products)
export {
  // Service Category service (PRD Catalog Module)
  ServiceCategorySQLiteService,
  type ServiceCategory,
  type ServiceCategoryRow,
  // Menu Service service (PRD Catalog Module)
  MenuServiceSQLiteService,
  type MenuService,
  type MenuServiceRow,
  type PricingType,
  type MenuServiceStatus,
  type BookingAvailability,
  type ExtraTimeType,
  // Service Variant service (PRD Catalog Module)
  ServiceVariantSQLiteService,
  type CatalogServiceVariant,
  type CatalogServiceVariantRow,
  // Service Package service (PRD Catalog Module)
  ServicePackageSQLiteService,
  type ServicePackage,
  type ServicePackageRow,
  type PackageServiceItem,
  type BundleBookingMode,
  // Add-On Group service (PRD Catalog Module)
  AddOnGroupSQLiteService,
  type AddOnGroup,
  type AddOnGroupRow,
  // Add-On Option service (PRD Catalog Module)
  AddOnOptionSQLiteService,
  type AddOnOption,
  type AddOnOptionRow,
  // Staff Service Assignment service (PRD Catalog Module)
  StaffServiceAssignmentSQLiteService,
  type StaffServiceAssignment,
  type StaffServiceAssignmentRow,
  // Catalog Settings service (PRD Catalog Module)
  CatalogSettingsSQLiteService,
  type CatalogSettings,
  type CatalogSettingsRow,
  // Product service (Inventory/Catalog Module)
  ProductSQLiteService,
  type Product as CatalogProduct,
  type ProductRow as CatalogProductRow,
  type CatalogSyncStatus,
} from './catalogServices';

// Scheduling services (time-off, blocked time, resources, staff schedules)
export {
  // Time Off Type service
  TimeOffTypeSQLiteService,
  type TimeOffType,
  type TimeOffTypeRow,
  // Time Off Request service
  TimeOffRequestSQLiteService,
  type TimeOffRequest,
  type TimeOffRequestRow,
  type TimeOffRequestStatus,
  type TimeOffStatusChange,
  // Blocked Time Type service
  BlockedTimeTypeSQLiteService,
  type BlockedTimeType,
  type BlockedTimeTypeRow,
  // Blocked Time Entry service
  BlockedTimeEntrySQLiteService,
  type BlockedTimeEntry,
  type BlockedTimeEntryRow,
  type BlockedTimeFrequency,
  // Business Closed Period service
  BusinessClosedPeriodSQLiteService,
  type BusinessClosedPeriod,
  type BusinessClosedPeriodRow,
  // Resource service
  ResourceSQLiteService,
  type Resource as SchedulingResource,
  type ResourceRow as SchedulingResourceRow,
  // Resource Booking service
  ResourceBookingSQLiteService,
  type ResourceBooking,
  type ResourceBookingRow,
  type ResourceAssignmentType,
  // Staff Schedule service
  StaffScheduleSQLiteService,
  type SchedulingStaffSchedule,
  type SchedulingStaffScheduleRow,
  type SchedulePatternType,
  type WeekSchedule,
  type DayScheduleConfig,
  type ShiftConfig,
  // Common scheduling types
  type ScheduleSyncStatus,
  type ScheduleVectorClock,
} from './schedulingServices';
