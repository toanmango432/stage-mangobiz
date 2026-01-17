/**
 * Migration types for SQLite schema management
 *
 * These migrations use function-based up/down instead of raw SQL strings,
 * allowing for complex migration logic and data transformations.
 */

import type { SQLiteAdapter } from '../types';

/**
 * Database migration definition with function-based up/down
 */
export interface Migration {
  /** Migration version number (must be unique and sequential) */
  version: number;
  /** Human-readable migration name */
  name: string;
  /** Apply the migration */
  up: (db: SQLiteAdapter) => Promise<void>;
  /** Rollback the migration */
  down: (db: SQLiteAdapter) => Promise<void>;
}

/**
 * Record of an applied migration stored in _migrations table
 */
export interface MigrationRecord {
  /** Migration version number */
  version: number;
  /** Human-readable name of the migration */
  name: string;
  /** ISO timestamp when migration was applied */
  applied_at: string;
}
