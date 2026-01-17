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
export { runMigrations, getAppliedMigrations, rollbackLastMigration, migrateFromDexie } from './migrations';

// Factory - will be implemented
export { createSQLiteAdapter } from './factory';

// Service manager - will be implemented
export { SQLiteService, getSQLiteService, initializeSQLite } from './SQLiteService';

// Services
export {
  ClientSQLiteService,
  type Client as SQLiteClient,
  type ClientFilters as SQLiteClientFilters,
  type ClientSortOptions as SQLiteClientSortOptions,
  TicketSQLiteService,
  type Ticket as SQLiteTicket,
  type TicketService as SQLiteTicketService,
  type TicketProduct as SQLiteTicketProduct,
  type Payment as SQLitePayment,
  type TicketStatus as SQLiteTicketStatus,
  type ServiceStatus as SQLiteServiceStatus,
  type DailyStats as SQLiteDailyStats,
} from './services';
