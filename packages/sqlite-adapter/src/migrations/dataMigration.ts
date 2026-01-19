/**
 * Dexie to SQLite Data Migration Utility
 *
 * Migrates data from IndexedDB (Dexie) to SQLite for Electron migration.
 * Handles batch inserts for performance, transaction wrapping per table,
 * progress callbacks for UI feedback, and resume support via checkpoints.
 *
 * Key features:
 * - Checkpointing every 100 records for resume support on failure
 * - Progress tracking stored in _migration_progress table
 * - If migration fails at record 25k of 50k, resume from 25k (not 0)
 * - Checkpoints cleared after successful full migration
 *
 * Migration order respects dependencies:
 * Phase 1: Core tables (no dependencies)
 *   - staff, clients, services, settings
 * Phase 2: Operational tables (depend on Phase 1)
 *   - appointments, tickets, transactions, syncQueue
 * Phase 3: Team & CRM tables
 *   - teamMembers, patchTests, formTemplates, formResponses, referrals, clientReviews, loyaltyRewards, reviewRequests, customSegments
 * Phase 4: Catalog tables
 *   - serviceCategories, menuServices, serviceVariants, servicePackages, addOnGroups, addOnOptions, staffServiceAssignments, catalogSettings, products
 * Phase 5: Scheduling tables
 *   - timeOffTypes, timeOffRequests, blockedTimeTypes, blockedTimeEntries, businessClosedPeriods, resources, resourceBookings, staffSchedules
 * Phase 6: Gift Card tables
 *   - giftCardDenominations, giftCardSettings, giftCards, giftCardTransactions, giftCardDesigns
 * Phase 7: Infrastructure tables
 *   - deviceSettings, timesheets, payRuns
 */

import type { SQLiteAdapter, SQLiteValue } from '../types';
import { toISOString, boolToSQLite, toJSONString } from '../utils/typeConversions';

// ============================================================================
// Checkpoint Types and Constants
// ============================================================================

/** Status of a table's migration checkpoint */
export type MigrationCheckpointStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Migration progress checkpoint for a single table
 * Stored in _migration_progress table for resume support
 */
export interface MigrationCheckpoint {
  /** Table name (snake_case in DB, camelCase in code) */
  tableName: string;
  /** Index of last successfully migrated record (0-based) */
  lastMigratedIndex: number;
  /** Total number of records in Dexie for this table */
  totalCount: number;
  /** Number of records successfully inserted */
  insertedCount: number;
  /** Status of this table's migration */
  status: MigrationCheckpointStatus;
  /** Timestamp of last checkpoint update */
  updatedAt: string;
  /** Error message if status is 'failed' */
  errorMessage?: string;
}

/** Checkpoint save interval - save every N records */
const CHECKPOINT_INTERVAL = 100;

/**
 * Progress callback for migration updates
 * @param table - Current table being migrated
 * @param current - Number of records migrated so far for this table
 * @param total - Total records to migrate for this table
 */
export type MigrationProgressCallback = (table: string, current: number, total: number) => void;

/**
 * Result of a data migration operation
 */
export interface MigrationResult {
  /** Whether the migration completed successfully */
  success: boolean;
  /** Per-table migration statistics */
  tables: TableMigrationResult[];
  /** Errors encountered during migration */
  errors: string[];
  /** Total records migrated across all tables */
  totalRecords: number;
  /** Total duration in milliseconds */
  durationMs: number;
}

/**
 * Result for a single table migration
 */
export interface TableMigrationResult {
  /** Table name */
  name: string;
  /** Number of records read from Dexie */
  dexieCount: number;
  /** Number of records written to SQLite */
  sqliteCount: number;
  /** Whether this table was skipped (e.g., doesn't exist or already migrated) */
  skipped: boolean;
  /** Reason for skipping, if applicable */
  skipReason?: string;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Dexie table interface for migration
 */
interface DexieTable<T = DexieRecord> {
  toArray: () => Promise<T[]>;
  count: () => Promise<number>;
}

/**
 * Dexie database interface for migration
 * Loosely typed to support any Dexie database structure
 */
export interface DexieDatabaseForMigration {
  // Core tables
  staff?: DexieTable;
  clients?: DexieTable;
  services?: DexieTable;
  settings?: DexieTable;
  // Operational tables
  appointments?: DexieTable;
  tickets?: DexieTable;
  transactions?: DexieTable;
  syncQueue?: DexieTable;
  // Team & CRM tables
  teamMembers?: DexieTable;
  patchTests?: DexieTable;
  formTemplates?: DexieTable;
  formResponses?: DexieTable;
  referrals?: DexieTable;
  clientReviews?: DexieTable;
  loyaltyRewards?: DexieTable;
  reviewRequests?: DexieTable;
  customSegments?: DexieTable;
  // Catalog tables
  serviceCategories?: DexieTable;
  menuServices?: DexieTable;
  serviceVariants?: DexieTable;
  servicePackages?: DexieTable;
  addOnGroups?: DexieTable;
  addOnOptions?: DexieTable;
  staffServiceAssignments?: DexieTable;
  catalogSettings?: DexieTable;
  products?: DexieTable;
  // Scheduling tables
  timeOffTypes?: DexieTable;
  timeOffRequests?: DexieTable;
  blockedTimeTypes?: DexieTable;
  blockedTimeEntries?: DexieTable;
  businessClosedPeriods?: DexieTable;
  resources?: DexieTable;
  resourceBookings?: DexieTable;
  staffSchedules?: DexieTable;
  // Gift Card tables
  giftCardDenominations?: DexieTable;
  giftCardSettings?: DexieTable;
  giftCards?: DexieTable;
  giftCardTransactions?: DexieTable;
  giftCardDesigns?: DexieTable;
  // Infrastructure tables
  deviceSettings?: DexieTable;
  timesheets?: DexieTable;
  payRuns?: DexieTable;
}

/**
 * Generic Dexie record type
 */
type DexieRecord = Record<string, unknown>;

/** Batch size for SQLite inserts */
const BATCH_SIZE = 100;

// ============================================================================
// Checkpoint Table Management
// ============================================================================

/**
 * Ensure the _migration_progress table exists
 * This table tracks per-table progress for resume support
 */
async function ensureCheckpointTableExists(db: SQLiteAdapter): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS _migration_progress (
      table_name TEXT PRIMARY KEY,
      last_migrated_index INTEGER NOT NULL DEFAULT -1,
      total_count INTEGER NOT NULL DEFAULT 0,
      inserted_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      updated_at TEXT NOT NULL,
      error_message TEXT
    )
  `);
}

/**
 * Get checkpoint for a specific table
 * Useful for checking the migration status of a specific table
 */
export async function getCheckpoint(db: SQLiteAdapter, tableName: string): Promise<MigrationCheckpoint | null> {
  const row = await db.get<{
    table_name: string;
    last_migrated_index: number;
    total_count: number;
    inserted_count: number;
    status: string;
    updated_at: string;
    error_message: string | null;
  }>(
    'SELECT * FROM _migration_progress WHERE table_name = ?',
    [tableName]
  );

  if (!row) return null;

  return {
    tableName: row.table_name,
    lastMigratedIndex: row.last_migrated_index,
    totalCount: row.total_count,
    insertedCount: row.inserted_count,
    status: row.status as MigrationCheckpointStatus,
    updatedAt: row.updated_at,
    errorMessage: row.error_message ?? undefined,
  };
}

/**
 * Get all checkpoints
 */
async function getAllCheckpoints(db: SQLiteAdapter): Promise<MigrationCheckpoint[]> {
  const rows = await db.all<{
    table_name: string;
    last_migrated_index: number;
    total_count: number;
    inserted_count: number;
    status: string;
    updated_at: string;
    error_message: string | null;
  }>('SELECT * FROM _migration_progress ORDER BY table_name');

  return rows.map((row) => ({
    tableName: row.table_name,
    lastMigratedIndex: row.last_migrated_index,
    totalCount: row.total_count,
    insertedCount: row.inserted_count,
    status: row.status as MigrationCheckpointStatus,
    updatedAt: row.updated_at,
    errorMessage: row.error_message ?? undefined,
  }));
}

/**
 * Save or update checkpoint for a table
 */
async function saveCheckpoint(
  db: SQLiteAdapter,
  checkpoint: MigrationCheckpoint
): Promise<void> {
  await db.run(
    `INSERT OR REPLACE INTO _migration_progress
     (table_name, last_migrated_index, total_count, inserted_count, status, updated_at, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      checkpoint.tableName,
      checkpoint.lastMigratedIndex,
      checkpoint.totalCount,
      checkpoint.insertedCount,
      checkpoint.status,
      checkpoint.updatedAt,
      checkpoint.errorMessage ?? null,
    ]
  );
}

/**
 * Clear all checkpoints after successful migration
 */
async function clearAllCheckpoints(db: SQLiteAdapter): Promise<void> {
  await db.run('DELETE FROM _migration_progress');
}

/**
 * Check if migration has incomplete checkpoints (needs resume)
 */
export async function hasPendingMigration(db: SQLiteAdapter): Promise<boolean> {
  try {
    // First check if the table exists
    const tableExists = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='_migration_progress'`
    );
    if (!tableExists || tableExists.count === 0) {
      return false;
    }

    // Check for any non-completed tables
    const result = await db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM _migration_progress WHERE status IN ('pending', 'in_progress', 'failed')`
    );
    return (result?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Get migration resume info for UI display
 */
export async function getMigrationResumeInfo(db: SQLiteAdapter): Promise<{
  needsResume: boolean;
  totalTables: number;
  completedTables: number;
  failedTables: number;
  lastTable?: string;
  lastIndex?: number;
}> {
  try {
    await ensureCheckpointTableExists(db);
    const checkpoints = await getAllCheckpoints(db);

    if (checkpoints.length === 0) {
      return {
        needsResume: false,
        totalTables: 0,
        completedTables: 0,
        failedTables: 0,
      };
    }

    const completed = checkpoints.filter((c) => c.status === 'completed').length;
    const failed = checkpoints.filter((c) => c.status === 'failed').length;
    const inProgress = checkpoints.find((c) => c.status === 'in_progress');

    return {
      needsResume: completed < checkpoints.length,
      totalTables: checkpoints.length,
      completedTables: completed,
      failedTables: failed,
      lastTable: inProgress?.tableName,
      lastIndex: inProgress?.lastMigratedIndex,
    };
  } catch {
    return {
      needsResume: false,
      totalTables: 0,
      completedTables: 0,
      failedTables: 0,
    };
  }
}

/**
 * Tables to migrate in dependency order
 * Order matters: tables with foreign keys should come after their referenced tables
 */
const MIGRATION_ORDER: (keyof DexieDatabaseForMigration)[] = [
  // Phase 1: Core tables (no dependencies)
  'staff',
  'clients',
  'services',
  'settings',
  // Phase 2: Operational tables
  'appointments',
  'tickets',
  'transactions',
  'syncQueue',
  // Phase 3: Team & CRM tables
  'teamMembers',
  'patchTests',
  'formTemplates',
  'formResponses',
  'referrals',
  'clientReviews',
  'loyaltyRewards',
  'reviewRequests',
  'customSegments',
  // Phase 4: Catalog tables
  'serviceCategories',
  'menuServices',
  'serviceVariants',
  'servicePackages',
  'addOnGroups',
  'addOnOptions',
  'staffServiceAssignments',
  'catalogSettings',
  'products',
  // Phase 5: Scheduling tables
  'timeOffTypes',
  'timeOffRequests',
  'blockedTimeTypes',
  'blockedTimeEntries',
  'businessClosedPeriods',
  'resources',
  'resourceBookings',
  'staffSchedules',
  // Phase 6: Gift Card tables
  'giftCardDenominations',
  'giftCardSettings',
  'giftCards',
  'giftCardTransactions',
  'giftCardDesigns',
  // Phase 7: Infrastructure tables
  'deviceSettings',
  'timesheets',
  'payRuns',
];

/**
 * Generic record to SQLite values converter
 * Handles all tables by converting known field types appropriately
 */
function recordToSQLiteValues(tableName: string, record: DexieRecord): { columns: string[]; values: SQLiteValue[] } {
  const now = new Date().toISOString();
  const columns: string[] = [];
  const values: SQLiteValue[] = [];

  // Process each field in the record
  for (const [key, value] of Object.entries(record)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Convert camelCase to snake_case for column name
    const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    columns.push(columnName);

    // Determine value type and convert appropriately
    if (value === null) {
      values.push(null);
    } else if (typeof value === 'boolean') {
      values.push(boolToSQLite(value));
    } else if (typeof value === 'number') {
      values.push(value);
    } else if (typeof value === 'string') {
      values.push(value);
    } else if (value instanceof Date) {
      values.push(toISOString(value));
    } else if (Array.isArray(value) || typeof value === 'object') {
      // JSON serialize objects and arrays
      values.push(toJSONString(value));
    } else {
      // Fallback to string conversion
      values.push(String(value));
    }
  }

  // Ensure required audit fields exist with defaults
  if (!columns.includes('created_at')) {
    columns.push('created_at');
    values.push(now);
  }
  if (!columns.includes('updated_at')) {
    columns.push('updated_at');
    values.push(now);
  }
  if (!columns.includes('sync_status') && !['settings', 'device_settings'].includes(tableName)) {
    columns.push('sync_status');
    values.push('local');
  }

  return { columns, values };
}

/**
 * Generate INSERT OR REPLACE SQL statement
 */
function generateInsertSQL(tableName: string, columns: string[]): string {
  // Convert table name to snake_case
  const snakeTableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase();
  // Handle edge case where table name starts with uppercase
  const cleanTableName = snakeTableName.startsWith('_') ? snakeTableName.slice(1) : snakeTableName;

  const placeholders = columns.map(() => '?').join(', ');
  return `INSERT OR REPLACE INTO ${cleanTableName} (${columns.join(', ')}) VALUES (${placeholders})`;
}

/**
 * Options for batch insert with checkpointing
 */
interface BatchInsertOptions {
  /** Index to start from (for resume) */
  startIndex?: number;
  /** Callback for progress updates */
  onProgress?: (current: number, total: number) => void;
  /** Callback to save checkpoint */
  onCheckpoint?: (index: number, insertedCount: number) => Promise<void>;
}

/**
 * Insert records in batches for performance with checkpointing support
 * Saves checkpoint every CHECKPOINT_INTERVAL (100) records for resume support
 */
async function batchInsertWithCheckpoint(
  db: SQLiteAdapter,
  tableName: string,
  records: DexieRecord[],
  options: BatchInsertOptions = {}
): Promise<{ insertedCount: number; lastIndex: number }> {
  const { startIndex = 0, onProgress, onCheckpoint } = options;

  if (records.length === 0) {
    return { insertedCount: 0, lastIndex: -1 };
  }

  let insertedCount = 0;
  let lastSuccessfulIndex = startIndex - 1;
  const total = records.length;

  // Start from the specified index (for resume support)
  for (let i = startIndex; i < records.length; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE, records.length);
    const batch = records.slice(i, batchEnd);

    // Process batch within a transaction
    await db.transaction(async () => {
      for (let j = 0; j < batch.length; j++) {
        const record = batch[j];
        const recordIndex = i + j;

        try {
          const { columns, values } = recordToSQLiteValues(tableName, record);
          const sql = generateInsertSQL(tableName, columns);
          await db.run(sql, values);
          insertedCount++;
          lastSuccessfulIndex = recordIndex;
        } catch (error) {
          // Log but continue - some records may have schema mismatches
          console.warn(`[Migration] Warning: Failed to insert record ${recordIndex} in ${tableName}:`, error);
        }
      }
    });

    // Notify progress after each batch
    if (onProgress) {
      onProgress(insertedCount, total);
    }

    // Save checkpoint every CHECKPOINT_INTERVAL records
    if (onCheckpoint && (lastSuccessfulIndex + 1) % CHECKPOINT_INTERVAL === 0) {
      await onCheckpoint(lastSuccessfulIndex, insertedCount);
    }
  }

  // Save final checkpoint
  if (onCheckpoint && lastSuccessfulIndex >= 0) {
    await onCheckpoint(lastSuccessfulIndex, insertedCount);
  }

  return { insertedCount, lastIndex: lastSuccessfulIndex };
}

/**
 * Check if a table exists in SQLite
 */
async function tableExists(db: SQLiteAdapter, tableName: string): Promise<boolean> {
  // Convert table name to snake_case
  const snakeTableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase();
  const cleanTableName = snakeTableName.startsWith('_') ? snakeTableName.slice(1) : snakeTableName;

  const result = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
    [cleanTableName]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Options for table migration with checkpoint support
 */
interface MigrateTableOptions {
  /** Progress callback */
  onProgress?: (current: number, total: number) => void;
  /** Existing checkpoint for resume */
  checkpoint?: MigrationCheckpoint | null;
  /** Callback to save checkpoint during migration */
  onSaveCheckpoint?: (checkpoint: MigrationCheckpoint) => Promise<void>;
}

/**
 * Migrate a single table from Dexie to SQLite with checkpoint support
 */
async function migrateTableWithCheckpoint(
  dexieTable: DexieTable | undefined,
  sqliteDb: SQLiteAdapter,
  tableName: string,
  options: MigrateTableOptions = {}
): Promise<TableMigrationResult> {
  const { onProgress, checkpoint, onSaveCheckpoint } = options;
  const startTime = Date.now();

  // Check if table doesn't exist in Dexie
  if (!dexieTable) {
    return {
      name: tableName,
      dexieCount: 0,
      sqliteCount: 0,
      skipped: true,
      skipReason: 'Table not found in Dexie database',
      durationMs: Date.now() - startTime,
    };
  }

  // Check if SQLite table exists
  const exists = await tableExists(sqliteDb, tableName);
  if (!exists) {
    return {
      name: tableName,
      dexieCount: 0,
      sqliteCount: 0,
      skipped: true,
      skipReason: 'SQLite table does not exist (migration not run?)',
      durationMs: Date.now() - startTime,
    };
  }

  // Check if this table was already completed in a previous run
  if (checkpoint?.status === 'completed') {
    console.log(`[Migration] Table ${tableName} already completed (${checkpoint.insertedCount} records) - skipping`);
    return {
      name: tableName,
      dexieCount: checkpoint.totalCount,
      sqliteCount: checkpoint.insertedCount,
      skipped: true,
      skipReason: 'Already completed in previous run',
      durationMs: Date.now() - startTime,
    };
  }

  // Read all records from Dexie
  const dexieRecords = await dexieTable.toArray();
  const dexieCount = dexieRecords.length;

  if (dexieCount === 0) {
    // Save completed checkpoint for empty table
    if (onSaveCheckpoint) {
      await onSaveCheckpoint({
        tableName,
        lastMigratedIndex: -1,
        totalCount: 0,
        insertedCount: 0,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
    }
    return {
      name: tableName,
      dexieCount: 0,
      sqliteCount: 0,
      skipped: false,
      durationMs: Date.now() - startTime,
    };
  }

  // Determine starting point (for resume)
  const startIndex = checkpoint?.status === 'in_progress' ? checkpoint.lastMigratedIndex + 1 : 0;
  const alreadyInserted = checkpoint?.status === 'in_progress' ? checkpoint.insertedCount : 0;

  if (startIndex > 0) {
    console.log(`[Migration] Resuming ${tableName} from record ${startIndex} (${alreadyInserted} already inserted)`);
  }

  // Save initial in_progress checkpoint
  if (onSaveCheckpoint) {
    await onSaveCheckpoint({
      tableName,
      lastMigratedIndex: startIndex - 1,
      totalCount: dexieCount,
      insertedCount: alreadyInserted,
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });
  }

  // Insert records with checkpoint support
  const { insertedCount: newInserted, lastIndex } = await batchInsertWithCheckpoint(
    sqliteDb,
    tableName,
    dexieRecords,
    {
      startIndex,
      onProgress: onProgress ? (current, total) => onProgress(alreadyInserted + current, total) : undefined,
      onCheckpoint: onSaveCheckpoint
        ? async (index, count) => {
            await onSaveCheckpoint({
              tableName,
              lastMigratedIndex: index,
              totalCount: dexieCount,
              insertedCount: alreadyInserted + count,
              status: 'in_progress',
              updatedAt: new Date().toISOString(),
            });
          }
        : undefined,
    }
  );

  const totalInserted = alreadyInserted + newInserted;

  // Save completed checkpoint
  if (onSaveCheckpoint) {
    await onSaveCheckpoint({
      tableName,
      lastMigratedIndex: lastIndex,
      totalCount: dexieCount,
      insertedCount: totalInserted,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    name: tableName,
    dexieCount,
    sqliteCount: totalInserted,
    skipped: false,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Migrate data from Dexie (IndexedDB) to SQLite with checkpoint support
 *
 * Features:
 * - Checkpoints saved every 100 records for resume on failure
 * - If migration fails at record 25k of 50k, resume from 25k not 0
 * - Checkpoints cleared after successful full migration
 *
 * @param dexieDb - Dexie database instance with table accessors
 * @param sqliteDb - SQLite adapter instance
 * @param onProgress - Optional callback for progress updates (table, current, total)
 * @returns Migration result with success status, table counts, and any errors
 *
 * @example
 * ```typescript
 * import { db } from './db/schema';
 * import { createElectronAdapter } from '@mango/sqlite-adapter';
 *
 * const sqliteDb = await createElectronAdapter({ dbName: 'mango' });
 * const result = await migrateFromDexie(db, sqliteDb, (table, current, total) => {
 *   console.log(`Migrating ${table}: ${current}/${total} records`);
 *   setProgress({ table, current, total });
 * });
 *
 * if (result.success) {
 *   console.log(`Migration complete! ${result.totalRecords} records in ${result.durationMs}ms`);
 * } else {
 *   console.error('Migration failed:', result.errors);
 * }
 * ```
 */
export async function migrateFromDexie(
  dexieDb: DexieDatabaseForMigration,
  sqliteDb: SQLiteAdapter,
  onProgress?: MigrationProgressCallback
): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    success: true,
    tables: [],
    errors: [],
    totalRecords: 0,
    durationMs: 0,
  };

  // Ensure checkpoint table exists
  await ensureCheckpointTableExists(sqliteDb);

  // Check for existing checkpoints (resume scenario)
  const existingCheckpoints = await getAllCheckpoints(sqliteDb);
  const checkpointMap = new Map<string, MigrationCheckpoint>(
    existingCheckpoints.map((cp) => [cp.tableName, cp])
  );

  const isResume = existingCheckpoints.some((cp) => cp.status === 'in_progress' || cp.status === 'pending');
  if (isResume) {
    const completedCount = existingCheckpoints.filter((cp) => cp.status === 'completed').length;
    console.log(`[Migration] Resuming migration from checkpoint (${completedCount}/${MIGRATION_ORDER.length} tables completed)`);
  } else {
    console.log('[Migration] Starting fresh Dexie to SQLite data migration...');
  }
  console.log(`[Migration] Tables to migrate: ${MIGRATION_ORDER.length}`);

  for (const tableName of MIGRATION_ORDER) {
    const dexieTable = dexieDb[tableName];
    const checkpoint = checkpointMap.get(tableName) ?? null;

    try {
      console.log(`[Migration] Migrating ${tableName}...`);

      const tableResult = await migrateTableWithCheckpoint(dexieTable, sqliteDb, tableName, {
        checkpoint,
        onProgress: onProgress ? (current, total) => onProgress(tableName, current, total) : undefined,
        onSaveCheckpoint: async (cp) => {
          await saveCheckpoint(sqliteDb, cp);
        },
      });

      result.tables.push(tableResult);

      if (tableResult.skipped) {
        console.log(`[Migration] Skipped ${tableName}: ${tableResult.skipReason}`);
        result.totalRecords += tableResult.sqliteCount; // Count previously completed records
      } else if (tableResult.dexieCount !== tableResult.sqliteCount) {
        const error = `Count mismatch for ${tableName}: Dexie=${tableResult.dexieCount}, SQLite=${tableResult.sqliteCount}`;
        console.warn(`[Migration] Warning: ${error}`);
        result.totalRecords += tableResult.sqliteCount;
      } else {
        console.log(`[Migration] Migrated ${tableResult.sqliteCount} ${tableName} records in ${tableResult.durationMs}ms`);
        result.totalRecords += tableResult.sqliteCount;
      }

      // Notify completion for this table
      if (onProgress) {
        onProgress(tableName, tableResult.sqliteCount, tableResult.dexieCount);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Error migrating ${tableName}: ${error.message}`
          : `Unknown error migrating ${tableName}`;

      console.error(`[Migration] ${errorMessage}`);
      result.errors.push(errorMessage);
      result.success = false;

      // Save failed checkpoint
      await saveCheckpoint(sqliteDb, {
        tableName,
        lastMigratedIndex: checkpoint?.lastMigratedIndex ?? -1,
        totalCount: checkpoint?.totalCount ?? 0,
        insertedCount: checkpoint?.insertedCount ?? 0,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        errorMessage,
      });

      // Add failed table result
      result.tables.push({
        name: tableName,
        dexieCount: 0,
        sqliteCount: 0,
        skipped: false,
        durationMs: 0,
      });

      // Continue with other tables even if one fails
    }
  }

  result.durationMs = Date.now() - startTime;

  if (result.success) {
    console.log(`[Migration] Migration complete! Total: ${result.totalRecords} records in ${result.durationMs}ms`);
    // Clear checkpoints after successful full migration
    console.log('[Migration] Clearing checkpoints...');
    await clearAllCheckpoints(sqliteDb);
  } else {
    console.error(`[Migration] Migration completed with ${result.errors.length} error(s) in ${result.durationMs}ms`);
    console.log('[Migration] Checkpoints preserved for resume - restart to continue from last checkpoint');
  }

  // Log summary
  const migratedTables = result.tables.filter((t) => !t.skipped && t.sqliteCount > 0);
  const skippedTables = result.tables.filter((t) => t.skipped);
  console.log(`[Migration] Summary: ${migratedTables.length} tables migrated, ${skippedTables.length} skipped`);

  return result;
}

/**
 * Get list of tables that would be migrated
 * Useful for UI to show migration scope
 */
export function getMigrationTables(): string[] {
  return [...MIGRATION_ORDER];
}

/**
 * Estimate total records to migrate
 * Useful for progress calculation
 */
export async function estimateMigrationSize(dexieDb: DexieDatabaseForMigration): Promise<number> {
  let total = 0;

  for (const tableName of MIGRATION_ORDER) {
    const table = dexieDb[tableName];
    if (table) {
      try {
        const count = await table.count();
        total += count;
      } catch {
        // Table might not exist
      }
    }
  }

  return total;
}
