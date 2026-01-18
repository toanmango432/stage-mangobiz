/**
 * Migration Status Tracking
 *
 * Tracks whether the Dexie-to-SQLite data migration has been completed
 * for this device. Uses a dedicated _data_migration_status table to
 * persist completion status across app restarts.
 *
 * This is separate from schema migrations (_migrations table) - this
 * tracks whether the one-time data migration from Dexie to SQLite
 * has been performed.
 *
 * Key functions:
 * - getMigrationStatus(): Check if migration is complete, get version/timestamp
 * - setMigrationComplete(): Mark data migration as done with version
 * - isMigrationComplete(): Quick boolean check
 * - resetMigrationStatus(): Clear status for re-migration (debugging)
 */

import type { SQLiteAdapter } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Data migration status information
 */
export interface MigrationStatus {
  /** Whether the data migration has been completed */
  completed: boolean;
  /** Migration format version (for future compatibility) */
  version: number;
  /** ISO timestamp when migration was completed */
  migratedAt: string;
  /** Total records migrated (0 if not completed) */
  totalRecords: number;
  /** Duration of migration in milliseconds (0 if not completed) */
  durationMs: number;
}

/**
 * Default status for devices that haven't completed migration
 */
const DEFAULT_STATUS: MigrationStatus = {
  completed: false,
  version: 0,
  migratedAt: '',
  totalRecords: 0,
  durationMs: 0,
};

/**
 * Current migration format version
 * Increment this when migration format changes significantly
 */
export const CURRENT_MIGRATION_VERSION = 1;

// ============================================================================
// Table Management
// ============================================================================

/**
 * Ensure the _data_migration_status table exists
 * This table tracks whether Dexie-to-SQLite data migration is complete
 */
async function ensureStatusTableExists(db: SQLiteAdapter): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS _data_migration_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      completed INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 0,
      migrated_at TEXT,
      total_records INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// ============================================================================
// Status Functions
// ============================================================================

/**
 * Get the current data migration status
 *
 * Returns information about whether the Dexie-to-SQLite migration
 * has been completed, including version and timestamp.
 *
 * @param db - SQLite adapter instance
 * @returns Migration status object
 *
 * @example
 * ```typescript
 * const status = await getMigrationStatus(db);
 * if (!status.completed) {
 *   await runDataMigration();
 * }
 * ```
 */
export async function getMigrationStatus(db: SQLiteAdapter): Promise<MigrationStatus> {
  try {
    await ensureStatusTableExists(db);

    const row = await db.get<{
      completed: number;
      version: number;
      migrated_at: string | null;
      total_records: number;
      duration_ms: number;
    }>(
      'SELECT completed, version, migrated_at, total_records, duration_ms FROM _data_migration_status WHERE id = 1'
    );

    if (!row) {
      return DEFAULT_STATUS;
    }

    return {
      completed: row.completed === 1,
      version: row.version,
      migratedAt: row.migrated_at ?? '',
      totalRecords: row.total_records,
      durationMs: row.duration_ms,
    };
  } catch (error) {
    // Table doesn't exist or other error - return default
    console.warn('[MigrationStatus] Error getting status:', error);
    return DEFAULT_STATUS;
  }
}

/**
 * Mark the data migration as complete
 *
 * Records that the Dexie-to-SQLite migration has been successfully
 * completed with the specified version. This prevents re-migration
 * on subsequent app starts.
 *
 * @param db - SQLite adapter instance
 * @param version - Migration version number (use CURRENT_MIGRATION_VERSION)
 * @param totalRecords - Total records migrated
 * @param durationMs - Duration of migration in milliseconds
 *
 * @example
 * ```typescript
 * const result = await migrateFromDexie(dexieDb, sqliteDb);
 * if (result.success) {
 *   await setMigrationComplete(db, CURRENT_MIGRATION_VERSION, result.totalRecords, result.durationMs);
 * }
 * ```
 */
export async function setMigrationComplete(
  db: SQLiteAdapter,
  version: number,
  totalRecords: number = 0,
  durationMs: number = 0
): Promise<void> {
  await ensureStatusTableExists(db);

  const migratedAt = new Date().toISOString();
  const updatedAt = migratedAt;

  await db.run(
    `INSERT OR REPLACE INTO _data_migration_status
     (id, completed, version, migrated_at, total_records, duration_ms, updated_at)
     VALUES (1, 1, ?, ?, ?, ?, ?)`,
    [version, migratedAt, totalRecords, durationMs, updatedAt]
  );

  console.log(`[MigrationStatus] Migration marked complete: version=${version}, records=${totalRecords}, duration=${durationMs}ms`);
}

/**
 * Quick check if migration is complete
 *
 * Use this for fast checks where you only need to know if
 * migration needs to run, without needing full status details.
 *
 * @param db - SQLite adapter instance
 * @returns true if migration is complete
 */
export async function isMigrationComplete(db: SQLiteAdapter): Promise<boolean> {
  const status = await getMigrationStatus(db);
  return status.completed;
}

/**
 * Reset migration status (for debugging/testing)
 *
 * Clears the migration completion status, allowing re-migration.
 * Should only be used for debugging or testing purposes.
 *
 * WARNING: This does NOT delete the migrated data. The next migration
 * will use INSERT OR REPLACE, potentially causing duplicate handling.
 *
 * @param db - SQLite adapter instance
 */
export async function resetMigrationStatus(db: SQLiteAdapter): Promise<void> {
  try {
    await ensureStatusTableExists(db);
    await db.run('DELETE FROM _data_migration_status WHERE id = 1');
    console.log('[MigrationStatus] Migration status reset');
  } catch (error) {
    console.warn('[MigrationStatus] Error resetting status:', error);
  }
}

/**
 * Check if migration should be performed
 *
 * Combines status check with version comparison. Returns true if:
 * - Migration has never been completed, OR
 * - Migration was completed with an older version
 *
 * @param db - SQLite adapter instance
 * @returns true if migration should be run
 */
export async function shouldRunMigration(db: SQLiteAdapter): Promise<boolean> {
  const status = await getMigrationStatus(db);

  // Not completed yet
  if (!status.completed) {
    return true;
  }

  // Completed but with older version
  if (status.version < CURRENT_MIGRATION_VERSION) {
    console.log(
      `[MigrationStatus] Upgrade needed: current=${status.version}, required=${CURRENT_MIGRATION_VERSION}`
    );
    return true;
  }

  return false;
}

/**
 * Get migration status as a log-friendly string
 */
export async function getMigrationStatusString(db: SQLiteAdapter): Promise<string> {
  const status = await getMigrationStatus(db);

  if (!status.completed) {
    return 'Data migration: NOT COMPLETED';
  }

  return `Data migration: COMPLETE (v${status.version}, ${status.totalRecords} records, ${status.migratedAt})`;
}
