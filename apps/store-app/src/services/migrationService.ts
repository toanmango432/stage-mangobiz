/**
 * Migration Service
 *
 * App-level service for managing Dexie to SQLite data migration.
 * Provides a high-level API for initiating, tracking, and validating migrations.
 *
 * This service coordinates between:
 * - Dexie (IndexedDB) - source database
 * - SQLite (via @mango/sqlite-adapter) - target database
 * - Feature flags - to determine if migration is needed
 * - Local storage - for migration state persistence
 */

import {
  migrateFromDexie,
  getMigrationTables,
  estimateMigrationSize,
  type MigrationResult,
  type MigrationProgressCallback,
  type DexieDatabaseForMigration,
  type SQLiteAdapter,
} from '@mango/sqlite-adapter';
import { db as dexieDb } from '../db/schema';
import { shouldUseSQLite, isElectron } from '../config/featureFlags';

/**
 * Migration status enum
 */
export type MigrationStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'not_applicable';

/**
 * Migration state stored in localStorage
 */
export interface MigrationState {
  /** Current migration status */
  status: MigrationStatus;
  /** Timestamp when migration started */
  startedAt?: string;
  /** Timestamp when migration completed */
  completedAt?: string;
  /** Total records migrated */
  totalRecords?: number;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Error message if failed */
  error?: string;
  /** Last migrated table (for resume) */
  lastMigratedTable?: string;
  /** Migration version (to detect schema changes) */
  version: number;
}

/** Current migration version - increment when schema changes */
const MIGRATION_VERSION = 1;

/** LocalStorage key for migration state */
const MIGRATION_STATE_KEY = 'mango_sqlite_migration_state';

/**
 * Get the current migration state from localStorage
 */
export function getMigrationState(): MigrationState {
  try {
    const stored = localStorage.getItem(MIGRATION_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[MigrationService] Failed to read migration state:', e);
  }

  return {
    status: 'not_started',
    version: MIGRATION_VERSION,
  };
}

/**
 * Save migration state to localStorage
 */
function saveMigrationState(state: MigrationState): void {
  try {
    localStorage.setItem(MIGRATION_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[MigrationService] Failed to save migration state:', e);
  }
}

/**
 * Check if migration is needed
 *
 * Migration is needed when:
 * 1. Running on Electron (SQLite is available)
 * 2. shouldUseSQLite() returns true
 * 3. Migration has not been completed yet
 * 4. Migration version matches (no schema changes)
 */
export function isMigrationNeeded(): boolean {
  // Only applicable on Electron with SQLite
  if (!isElectron() || !shouldUseSQLite()) {
    return false;
  }

  const state = getMigrationState();

  // Already completed and version matches
  if (state.status === 'completed' && state.version === MIGRATION_VERSION) {
    return false;
  }

  // If version changed, need to re-migrate
  if (state.version !== MIGRATION_VERSION) {
    console.log('[MigrationService] Migration version changed, re-migration needed');
    return true;
  }

  // Not started or failed - need migration
  return state.status !== 'completed';
}

/**
 * Get estimated migration size (total records across all tables)
 */
export async function getEstimatedMigrationSize(): Promise<number> {
  return estimateMigrationSize(dexieDb as unknown as DexieDatabaseForMigration);
}

/**
 * Get list of tables that will be migrated
 */
export function getMigrationTableList(): string[] {
  return getMigrationTables();
}

/**
 * Progress info for UI
 */
export interface MigrationProgressInfo {
  /** Current table being migrated */
  currentTable: string;
  /** Records migrated for current table */
  currentTableProgress: number;
  /** Total records in current table */
  currentTableTotal: number;
  /** Total tables */
  totalTables: number;
  /** Tables completed */
  tablesCompleted: number;
  /** Overall percentage (0-100) */
  overallPercent: number;
}

/**
 * Run the data migration from Dexie to SQLite
 *
 * @param sqliteDb - SQLite adapter instance (must be initialized with schema)
 * @param onProgress - Optional callback for progress updates
 * @returns Migration result
 *
 * @example
 * ```typescript
 * import { runDataMigration, getMigrationState } from '@/services/migrationService';
 * import { getSQLiteAdapter } from '@/config/featureFlags';
 *
 * // Check if migration needed
 * if (isMigrationNeeded()) {
 *   const sqliteDb = await getSQLiteAdapter();
 *
 *   // Run migration with progress UI
 *   const result = await runDataMigration(sqliteDb, (info) => {
 *     setProgressUI(info.overallPercent);
 *     setCurrentTable(info.currentTable);
 *   });
 *
 *   if (result.success) {
 *     console.log(`Migration complete: ${result.totalRecords} records`);
 *   }
 * }
 * ```
 */
export async function runDataMigration(
  sqliteDb: SQLiteAdapter,
  onProgress?: (info: MigrationProgressInfo) => void
): Promise<MigrationResult> {
  const tables = getMigrationTables();
  const totalTables = tables.length;
  let tablesCompleted = 0;
  let overallRecordsMigrated = 0;

  // Update state to in_progress
  saveMigrationState({
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    version: MIGRATION_VERSION,
  });

  console.log('[MigrationService] Starting data migration...');

  try {
    // Create progress wrapper that tracks table completion
    const progressCallback: MigrationProgressCallback = (table, current, total) => {
      // If we're done with a table, increment counter
      if (current === total && total > 0) {
        tablesCompleted++;
        overallRecordsMigrated += total;
      }

      if (onProgress) {
        const overallPercent = Math.round(
          ((tablesCompleted / totalTables) * 100 + (current / Math.max(total, 1)) * (100 / totalTables))
        );

        onProgress({
          currentTable: table,
          currentTableProgress: current,
          currentTableTotal: total,
          totalTables,
          tablesCompleted,
          overallPercent: Math.min(overallPercent, 100),
        });
      }

      // Update last migrated table for resume support
      if (current === total) {
        const currentState = getMigrationState();
        saveMigrationState({
          ...currentState,
          lastMigratedTable: table,
        });
      }
    };

    // Run the actual migration
    const result = await migrateFromDexie(
      dexieDb as unknown as DexieDatabaseForMigration,
      sqliteDb,
      progressCallback
    );

    // Update final state
    if (result.success) {
      saveMigrationState({
        status: 'completed',
        startedAt: getMigrationState().startedAt,
        completedAt: new Date().toISOString(),
        totalRecords: result.totalRecords,
        durationMs: result.durationMs,
        version: MIGRATION_VERSION,
      });

      console.log(
        `[MigrationService] Migration completed successfully: ${result.totalRecords} records in ${result.durationMs}ms`
      );
    } else {
      saveMigrationState({
        status: 'failed',
        startedAt: getMigrationState().startedAt,
        completedAt: new Date().toISOString(),
        error: result.errors.join('; '),
        totalRecords: result.totalRecords,
        durationMs: result.durationMs,
        version: MIGRATION_VERSION,
      });

      console.error('[MigrationService] Migration completed with errors:', result.errors);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    saveMigrationState({
      status: 'failed',
      startedAt: getMigrationState().startedAt,
      completedAt: new Date().toISOString(),
      error: errorMessage,
      version: MIGRATION_VERSION,
    });

    console.error('[MigrationService] Migration failed:', error);

    return {
      success: false,
      tables: [],
      errors: [errorMessage],
      totalRecords: 0,
      durationMs: 0,
    };
  }
}

/**
 * Reset migration state (for testing or retry)
 */
export function resetMigrationState(): void {
  localStorage.removeItem(MIGRATION_STATE_KEY);
  console.log('[MigrationService] Migration state reset');
}

/**
 * Validate migration by comparing record counts between Dexie and SQLite
 *
 * @param sqliteDb - SQLite adapter instance
 * @returns Validation result with any discrepancies
 */
export async function validateMigration(
  sqliteDb: SQLiteAdapter
): Promise<{
  valid: boolean;
  discrepancies: Array<{ table: string; dexieCount: number; sqliteCount: number }>;
}> {
  const discrepancies: Array<{ table: string; dexieCount: number; sqliteCount: number }> = [];
  const tables = getMigrationTables();

  for (const table of tables) {
    const dexieTable = (dexieDb as unknown as DexieDatabaseForMigration)[table as keyof DexieDatabaseForMigration];
    if (!dexieTable) continue;

    try {
      const dexieCount = await dexieTable.count();

      // Convert table name to snake_case for SQLite
      const snakeTableName = table.replace(/([A-Z])/g, '_$1').toLowerCase();
      const cleanTableName = snakeTableName.startsWith('_') ? snakeTableName.slice(1) : snakeTableName;

      const result = await sqliteDb.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${cleanTableName}`
      );
      const sqliteCount = result?.count ?? 0;

      if (dexieCount !== sqliteCount) {
        discrepancies.push({ table, dexieCount, sqliteCount });
      }
    } catch (e) {
      // Table might not exist in SQLite, which is a discrepancy
      const dexieCount = await dexieTable.count().catch(() => 0);
      if (dexieCount > 0) {
        discrepancies.push({ table, dexieCount, sqliteCount: 0 });
      }
    }
  }

  return {
    valid: discrepancies.length === 0,
    discrepancies,
  };
}

/**
 * Log migration statistics
 */
export function logMigrationStats(): void {
  const state = getMigrationState();

  console.log('[MigrationService] Migration Statistics:');
  console.log(`  Status: ${state.status}`);
  console.log(`  Version: ${state.version}`);

  if (state.startedAt) {
    console.log(`  Started: ${state.startedAt}`);
  }
  if (state.completedAt) {
    console.log(`  Completed: ${state.completedAt}`);
  }
  if (state.totalRecords !== undefined) {
    console.log(`  Total Records: ${state.totalRecords}`);
  }
  if (state.durationMs !== undefined) {
    console.log(`  Duration: ${state.durationMs}ms`);
  }
  if (state.error) {
    console.log(`  Error: ${state.error}`);
  }
  if (state.lastMigratedTable) {
    console.log(`  Last Migrated Table: ${state.lastMigratedTable}`);
  }
}
