/**
 * @mango/sqlite-adapter
 *
 * Cross-platform SQLite adapter for Mango POS local storage.
 * Supports Electron (better-sqlite3), Capacitor (iOS/Android), and Web (wa-sqlite/OPFS).
 */

// Core types - will be implemented
export type { SQLiteAdapter, SQLiteConfig, Migration, MigrationRecord } from './types';

// Factory - will be implemented
export { createSQLiteAdapter } from './factory';

// Service manager - will be implemented
export { SQLiteService, getSQLiteService, initializeSQLite } from './SQLiteService';

// Services - will be implemented
// export { ClientSQLiteService } from './services/clientService';
// export { TicketSQLiteService } from './services/ticketService';
// export { StaffSQLiteService } from './services/staffService';
