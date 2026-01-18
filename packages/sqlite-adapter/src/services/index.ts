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
