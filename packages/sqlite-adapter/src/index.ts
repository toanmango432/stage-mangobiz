/**
 * @mango/sqlite-adapter
 *
 * Cross-platform SQLite adapter for Mango POS local storage.
 * Supports Electron (better-sqlite3), Capacitor (iOS/Android), and Web (wa-sqlite/OPFS).
 */

// Core types
export type { SQLiteAdapter, SQLiteConfig, SQLiteValue, PaginatedResult } from './types';

// Database abstraction interfaces (platform-agnostic)
export type { DatabaseAdapter, QueryOptions, QueryResult } from './interfaces';

// Migration types and runner
export type { Migration, MigrationRecord } from './migrations/types';
export type { MigrationResult, TableMigrationResult } from './migrations/dataMigration';
export { runMigrations, getAppliedMigrations, rollbackLastMigration, migrateFromDexie, migration_001, migration_002 } from './migrations';

// Factory - will be implemented
export { createSQLiteAdapter } from './factory';

// Service manager - will be implemented
export { SQLiteService, getSQLiteService, initializeSQLite } from './SQLiteService';

// Services
export {
  // Base service class for building new services
  BaseSQLiteService,
  type TableSchema,
  type ColumnDefinition,
  type ColumnType,
  // Client service
  ClientSQLiteService,
  type Client as SQLiteClient,
  type ClientFilters as SQLiteClientFilters,
  type ClientSortOptions as SQLiteClientSortOptions,
  // Ticket service
  TicketSQLiteService,
  type Ticket as SQLiteTicket,
  type TicketService as SQLiteTicketService,
  type TicketProduct as SQLiteTicketProduct,
  type Payment as SQLitePayment,
  type TicketStatus as SQLiteTicketStatus,
  type ServiceStatus as SQLiteServiceStatus,
  type DailyStats as SQLiteDailyStats,
  // Appointment service
  AppointmentSQLiteService,
  type Appointment as SQLiteAppointment,
  type AppointmentService as SQLiteAppointmentService,
  type AppointmentStatus as SQLiteAppointmentStatus,
  type BookingSource as SQLiteBookingSource,
  type AppointmentRow as SQLiteAppointmentRow,
  // Transaction service
  TransactionSQLiteService,
  type Transaction as SQLiteTransaction,
  type TransactionRow as SQLiteTransactionRow,
  type TransactionTotals as SQLiteTransactionTotals,
  type TotalsByPaymentMethod as SQLiteTotalsByPaymentMethod,
  type PaymentMethod as SQLitePaymentMethod,
  type TransactionStatus as SQLiteTransactionStatus,
  // Staff service
  StaffSQLiteService,
  type Staff as SQLiteStaff,
  type StaffRow as SQLiteStaffRow,
  type StaffStatus as SQLiteStaffStatus,
  type StaffRole as SQLiteStaffRole,
  type StaffSchedule as SQLiteStaffSchedule,
  type ScheduleEntry as SQLiteScheduleEntry,
  // Service (menu item) service
  ServiceSQLiteService,
  type Service as SQLiteServiceType,
  type ServiceRow as SQLiteServiceRow,
  type ServiceAddOn as SQLiteServiceAddOn,
  type ServiceVariant as SQLiteServiceVariant,
  // Settings service (key-value store)
  SettingsSQLiteService,
  type Setting as SQLiteSetting,
  type SettingValue as SQLiteSettingValue,
  // Sync queue service (offline sync operations)
  SyncQueueSQLiteService,
  type SyncQueueOperation as SQLiteSyncQueueOperation,
  type AddSyncOperationInput as SQLiteAddSyncOperationInput,
  type SyncPriority as SQLiteSyncPriority,
  type SyncStatus as SQLiteSyncStatus,
  type SyncEntity as SQLiteSyncEntity,
  type SyncOperation as SQLiteSyncOperation,
  // Device settings service (device-specific configuration)
  DeviceSettingsSQLiteService,
  type DeviceSettings as SQLiteDeviceSettings,
  type DeviceSettingsInput as SQLiteDeviceSettingsInput,
  type DeviceConfig as SQLiteDeviceConfig,
  type DeviceMode as SQLiteDeviceMode,
  // Team member service (team management with soft delete)
  TeamMemberSQLiteService,
  type TeamMember as SQLiteTeamMember,
  type TeamMemberRow as SQLiteTeamMemberRow,
  type TeamMemberProfile as SQLiteTeamMemberProfile,
  type TeamMemberPermissions as SQLiteTeamMemberPermissions,
  type TeamMemberRole as SQLiteTeamMemberRole,
  type TeamMemberSyncStatus as SQLiteTeamMemberSyncStatus,
  type VectorClock as SQLiteVectorClock,
  // CRM services (client management, forms, reviews, loyalty)
  // Patch Test service (PRD 2.3.3)
  PatchTestSQLiteService,
  type PatchTest as SQLitePatchTest,
  type PatchTestRow as SQLitePatchTestRow,
  type PatchTestResult as SQLitePatchTestResult,
  // Form Template service (PRD 2.3.4)
  FormTemplateSQLiteService,
  type FormTemplate as SQLiteFormTemplate,
  type FormTemplateRow as SQLiteFormTemplateRow,
  type FormSection as SQLiteFormSection,
  type FormSectionType as SQLiteFormSectionType,
  // Form Response service (PRD 2.3.4)
  FormResponseSQLiteService,
  type FormResponse as SQLiteFormResponse,
  type FormResponseRow as SQLiteFormResponseRow,
  type FormResponseStatus as SQLiteFormResponseStatus,
  // Referral service (PRD 2.3.8)
  ReferralSQLiteService,
  type Referral as SQLiteReferral,
  type ReferralRow as SQLiteReferralRow,
  // Client Review service (PRD 2.3.9)
  ClientReviewSQLiteService,
  type ClientReview as SQLiteClientReview,
  type ClientReviewRow as SQLiteClientReviewRow,
  type ReviewPlatform as SQLiteReviewPlatform,
  // Loyalty Reward service (PRD 2.3.7)
  LoyaltyRewardSQLiteService,
  type LoyaltyReward as SQLiteLoyaltyReward,
  type LoyaltyRewardRow as SQLiteLoyaltyRewardRow,
  type LoyaltyRewardType as SQLiteLoyaltyRewardType,
  type LoyaltyRewardSource as SQLiteLoyaltyRewardSource,
  // Review Request service (PRD 2.3.9)
  ReviewRequestSQLiteService,
  type ReviewRequest as SQLiteReviewRequest,
  type ReviewRequestRow as SQLiteReviewRequestRow,
  type ReviewRequestStatus as SQLiteReviewRequestStatus,
  // Custom Segment service (PRD 2.3.10)
  CustomSegmentSQLiteService,
  type CustomSegment as SQLiteCustomSegment,
  type CustomSegmentRow as SQLiteCustomSegmentRow,
  type SegmentComparisonOperator as SQLiteSegmentComparisonOperator,
  type SegmentFilterCondition as SQLiteSegmentFilterCondition,
  type SegmentFilterGroup as SQLiteSegmentFilterGroup,
  // Catalog services (PRD Catalog Module)
  // Service Category service
  ServiceCategorySQLiteService,
  type ServiceCategory as SQLiteServiceCategory,
  type ServiceCategoryRow as SQLiteServiceCategoryRow,
  // Menu Service service
  MenuServiceSQLiteService,
  type MenuService as SQLiteMenuService,
  type MenuServiceRow as SQLiteMenuServiceRow,
  type PricingType as SQLitePricingType,
  type MenuServiceStatus as SQLiteMenuServiceStatus,
  type BookingAvailability as SQLiteBookingAvailability,
  type ExtraTimeType as SQLiteExtraTimeType,
  // Service Variant service
  ServiceVariantSQLiteService,
  type CatalogServiceVariant as SQLiteCatalogServiceVariant,
  type CatalogServiceVariantRow as SQLiteServiceVariantRow,
  // Service Package service
  ServicePackageSQLiteService,
  type ServicePackage as SQLiteServicePackage,
  type ServicePackageRow as SQLiteServicePackageRow,
  type PackageServiceItem as SQLitePackageServiceItem,
  type BundleBookingMode as SQLiteBundleBookingMode,
  // Add-On Group service
  AddOnGroupSQLiteService,
  type AddOnGroup as SQLiteAddOnGroup,
  type AddOnGroupRow as SQLiteAddOnGroupRow,
  // Add-On Option service
  AddOnOptionSQLiteService,
  type AddOnOption as SQLiteAddOnOption,
  type AddOnOptionRow as SQLiteAddOnOptionRow,
  // Staff Service Assignment service
  StaffServiceAssignmentSQLiteService,
  type StaffServiceAssignment as SQLiteStaffServiceAssignment,
  type StaffServiceAssignmentRow as SQLiteStaffServiceAssignmentRow,
  // Catalog Settings service
  CatalogSettingsSQLiteService,
  type CatalogSettings as SQLiteCatalogSettings,
  type CatalogSettingsRow as SQLiteCatalogSettingsRow,
  // Product service
  ProductSQLiteService,
  type CatalogProduct as SQLiteCatalogProduct,
  type CatalogProductRow as SQLiteCatalogProductRow,
  type CatalogSyncStatus as SQLiteCatalogSyncStatus,
} from './services';

// Type conversion utilities
export {
  toISOString,
  boolToSQLite,
  sqliteToBool,
  safeParseJSON,
  toJSONString,
} from './utils';

// Schema types and registry
export type {
  ColumnType as SchemaColumnType,
  ColumnSchema,
  ColumnMapping,
  ExtendedTableSchema,
  ForeignKeySchema,
  SchemaRegistry,
  CoreTableName,
  InfrastructureTableName,
  AllTableName,
} from './schema';

export {
  // Individual table schemas
  appointmentsSchema,
  ticketsSchema,
  clientsSchema,
  staffSchema,
  servicesSchema,
  transactionsSchema,
  // Registry and helpers
  schemaRegistry,
  getSchema,
  hasSchema,
  getTableNames,
} from './schema';
