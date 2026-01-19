/**
 * Core types for SQLite adapter
 */

/** Supported SQLite value types */
export type SQLiteValue = string | number | boolean | null | Uint8Array;

/** Configuration for SQLite adapter */
export interface SQLiteConfig {
  /** Database name (without extension) */
  dbName: string;
  /** Database file location (platform-specific) */
  location?: string;
  /** Enable WAL mode for better concurrency */
  enableWAL?: boolean;
  /** Enable foreign keys */
  enableForeignKeys?: boolean;
}

/** Platform-agnostic SQLite adapter interface */
export interface SQLiteAdapter {
  /** Execute SQL that doesn't return results */
  exec(sql: string): Promise<void>;

  /** Execute SQL with parameters, no results */
  run(sql: string, params?: SQLiteValue[]): Promise<{ changes: number; lastInsertRowid: number }>;

  /** Get single row */
  get<T = Record<string, SQLiteValue>>(sql: string, params?: SQLiteValue[]): Promise<T | undefined>;

  /** Get all rows */
  all<T = Record<string, SQLiteValue>>(sql: string, params?: SQLiteValue[]): Promise<T[]>;

  /** Run multiple statements in a transaction */
  transaction<T>(fn: () => Promise<T>): Promise<T>;

  /** Close database connection */
  close(): Promise<void>;
}

/** Database migration definition */
export interface Migration {
  /** Migration version number (must be unique and sequential) */
  version: number;
  /** Human-readable description */
  description: string;
  /** SQL to apply migration */
  up: string;
  /** SQL to rollback migration (optional) */
  down?: string;
}

/** Record of applied migrations */
export interface MigrationRecord {
  version: number;
  applied_at: string;
  description?: string;
}

/** Paginated query result */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
