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
