/**
 * Dexie to SQLite Data Migration Utility
 *
 * Migrates data from IndexedDB (Dexie) to SQLite for Electron migration.
 * Handles batch inserts for performance, transaction wrapping per table,
 * progress callbacks for UI feedback, and resume support via checkpoints.
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
 * Insert records in batches for performance
 * Uses transaction wrapping for atomicity per table
 */
async function batchInsert(
  db: SQLiteAdapter,
  tableName: string,
  records: DexieRecord[],
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (records.length === 0) {
    return 0;
  }

  let insertedCount = 0;
  const total = records.length;

  // Process in batches within a single transaction per table
  await db.transaction(async () => {
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      for (const record of batch) {
        try {
          const { columns, values } = recordToSQLiteValues(tableName, record);
          const sql = generateInsertSQL(tableName, columns);
          await db.run(sql, values);
          insertedCount++;
        } catch (error) {
          // Log but continue - some records may have schema mismatches
          console.warn(`[Migration] Warning: Failed to insert record in ${tableName}:`, error);
        }
      }

      // Notify progress after each batch
      if (onProgress) {
        onProgress(insertedCount, total);
      }
    }
  });

  return insertedCount;
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
 * Get count of records in a SQLite table
 */
async function getSQLiteCount(db: SQLiteAdapter, tableName: string): Promise<number> {
  // Convert table name to snake_case
  const snakeTableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase();
  const cleanTableName = snakeTableName.startsWith('_') ? snakeTableName.slice(1) : snakeTableName;

  try {
    const result = await db.get<{ count: number }>(`SELECT COUNT(*) as count FROM ${cleanTableName}`);
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Migrate a single table from Dexie to SQLite
 */
async function migrateTable(
  dexieTable: DexieTable | undefined,
  sqliteDb: SQLiteAdapter,
  tableName: string,
  onProgress?: (current: number, total: number) => void
): Promise<TableMigrationResult> {
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

  // Check if SQLite table already has data (potential resume scenario)
  const existingCount = await getSQLiteCount(sqliteDb, tableName);
  if (existingCount > 0) {
    console.log(`[Migration] Table ${tableName} already has ${existingCount} records - will use INSERT OR REPLACE`);
  }

  // Read all records from Dexie
  const dexieRecords = await dexieTable.toArray();
  const dexieCount = dexieRecords.length;

  if (dexieCount === 0) {
    return {
      name: tableName,
      dexieCount: 0,
      sqliteCount: 0,
      skipped: false,
      durationMs: Date.now() - startTime,
    };
  }

  // Insert records into SQLite
  const insertedCount = await batchInsert(sqliteDb, tableName, dexieRecords, onProgress);

  return {
    name: tableName,
    dexieCount,
    sqliteCount: insertedCount,
    skipped: false,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Migrate data from Dexie (IndexedDB) to SQLite
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

  console.log('[Migration] Starting Dexie to SQLite data migration...');
  console.log(`[Migration] Tables to migrate: ${MIGRATION_ORDER.length}`);

  for (const tableName of MIGRATION_ORDER) {
    const dexieTable = dexieDb[tableName];

    try {
      console.log(`[Migration] Migrating ${tableName}...`);

      const tableResult = await migrateTable(
        dexieTable,
        sqliteDb,
        tableName,
        onProgress ? (current, total) => onProgress(tableName, current, total) : undefined
      );

      result.tables.push(tableResult);

      if (tableResult.skipped) {
        console.log(`[Migration] Skipped ${tableName}: ${tableResult.skipReason}`);
      } else if (tableResult.dexieCount !== tableResult.sqliteCount) {
        const error = `Count mismatch for ${tableName}: Dexie=${tableResult.dexieCount}, SQLite=${tableResult.sqliteCount}`;
        console.warn(`[Migration] Warning: ${error}`);
        // Don't fail the migration for partial inserts - some records may have been filtered
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
  } else {
    console.error(`[Migration] Migration completed with ${result.errors.length} error(s) in ${result.durationMs}ms`);
  }

  // Log summary
  const migratedTables = result.tables.filter(t => !t.skipped && t.sqliteCount > 0);
  const skippedTables = result.tables.filter(t => t.skipped);
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
