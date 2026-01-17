/**
 * Dexie to SQLite Data Migration Utility
 *
 * Migrates data from IndexedDB (Dexie) to SQLite for Electron migration.
 * Handles batch inserts for performance and validates record counts.
 *
 * Migration order respects dependencies:
 * 1. staff - no dependencies
 * 2. clients - no dependencies
 * 3. services - no dependencies
 * 4. appointments - may reference clients, staff
 * 5. tickets - may reference clients, appointments
 */

import type { SQLiteAdapter, SQLiteValue } from '../types';

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
}

/**
 * Result for a single table migration
 */
export interface TableMigrationResult {
  /** Table name */
  name: string;
  /** Number of records migrated */
  count: number;
}

/**
 * Dexie database interface for migration
 * Loosely typed to support any Dexie database structure
 */
interface DexieDatabase {
  staff?: { toArray: () => Promise<DexieRecord[]> };
  clients?: { toArray: () => Promise<DexieRecord[]> };
  services?: { toArray: () => Promise<DexieRecord[]> };
  appointments?: { toArray: () => Promise<DexieRecord[]> };
  tickets?: { toArray: () => Promise<DexieRecord[]> };
}

/**
 * Generic Dexie record type
 */
type DexieRecord = Record<string, unknown>;

/** Batch size for SQLite inserts */
const BATCH_SIZE = 500;

/**
 * Tables to migrate in dependency order
 */
const MIGRATION_ORDER = ['staff', 'clients', 'services', 'appointments', 'tickets'] as const;

/**
 * SQL INSERT statements for each table
 * Column names must match SQLite schema from v001/v002 migrations
 */
const INSERT_SQL: Record<string, string> = {
  staff: `INSERT INTO staff (
    id, storeId, name, email, phone, avatar, specialties, specialty, skills, status,
    isActive, role, hireDate, commissionRate, clockedInAt, currentTicketId, schedule,
    turnQueuePosition, servicesCountToday, revenueToday, tipsToday, rating, vipPreferred,
    createdAt, updatedAt, syncStatus
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  clients: `INSERT INTO clients (
    id, storeId, firstName, lastName, phone, email, createdAt, updatedAt, syncStatus
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  services: `INSERT INTO services (
    id, storeId, name, category, description, duration, price, commissionRate,
    isActive, createdAt, updatedAt, syncStatus
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  appointments: `INSERT INTO appointments (
    id, storeId, clientId, staffId, status, scheduledStartTime, scheduledEndTime,
    createdAt, updatedAt, syncStatus
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

  tickets: `INSERT INTO tickets (
    id, storeId, clientId, status, services, createdAt, updatedAt, syncStatus
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
};

/**
 * Convert a Dexie staff record to SQLite values
 */
function staffToSQLiteValues(record: DexieRecord): SQLiteValue[] {
  const now = new Date().toISOString();
  return [
    String(record.id ?? ''),
    String(record.storeId ?? ''),
    String(record.name ?? ''),
    record.email != null ? String(record.email) : null,
    record.phone != null ? String(record.phone) : null,
    record.avatar != null ? String(record.avatar) : null,
    record.specialties != null ? JSON.stringify(record.specialties) : null,
    record.specialty != null ? String(record.specialty) : null,
    record.skills != null ? JSON.stringify(record.skills) : null,
    String(record.status ?? 'active'),
    record.isActive != null ? (record.isActive ? 1 : 0) : 1,
    record.role != null ? String(record.role) : null,
    record.hireDate != null ? String(record.hireDate) : null,
    record.commissionRate != null ? Number(record.commissionRate) : null,
    record.clockedInAt != null ? String(record.clockedInAt) : null,
    record.currentTicketId != null ? String(record.currentTicketId) : null,
    record.schedule != null ? JSON.stringify(record.schedule) : null,
    record.turnQueuePosition != null ? Number(record.turnQueuePosition) : null,
    record.servicesCountToday != null ? Number(record.servicesCountToday) : 0,
    record.revenueToday != null ? Number(record.revenueToday) : 0,
    record.tipsToday != null ? Number(record.tipsToday) : 0,
    record.rating != null ? Number(record.rating) : null,
    record.vipPreferred != null ? (record.vipPreferred ? 1 : 0) : null,
    String(record.createdAt ?? now),
    String(record.updatedAt ?? now),
    String(record.syncStatus ?? 'local'),
  ];
}

/**
 * Convert a Dexie client record to SQLite values
 */
function clientToSQLiteValues(record: DexieRecord): SQLiteValue[] {
  const now = new Date().toISOString();
  return [
    String(record.id ?? ''),
    String(record.storeId ?? ''),
    record.firstName != null ? String(record.firstName) : null,
    record.lastName != null ? String(record.lastName) : null,
    record.phone != null ? String(record.phone) : null,
    record.email != null ? String(record.email) : null,
    String(record.createdAt ?? now),
    String(record.updatedAt ?? now),
    String(record.syncStatus ?? 'local'),
  ];
}

/**
 * Convert a Dexie service record to SQLite values
 */
function serviceToSQLiteValues(record: DexieRecord): SQLiteValue[] {
  const now = new Date().toISOString();
  return [
    String(record.id ?? ''),
    String(record.storeId ?? ''),
    String(record.name ?? ''),
    record.category != null ? String(record.category) : null,
    record.description != null ? String(record.description) : null,
    Number(record.duration ?? 30),
    Number(record.price ?? 0),
    record.commissionRate != null ? Number(record.commissionRate) : null,
    record.isActive != null ? (record.isActive ? 1 : 0) : 1,
    String(record.createdAt ?? now),
    String(record.updatedAt ?? now),
    String(record.syncStatus ?? 'local'),
  ];
}

/**
 * Convert a Dexie appointment record to SQLite values
 */
function appointmentToSQLiteValues(record: DexieRecord): SQLiteValue[] {
  const now = new Date().toISOString();
  return [
    String(record.id ?? ''),
    String(record.storeId ?? ''),
    record.clientId != null ? String(record.clientId) : null,
    record.staffId != null ? String(record.staffId) : null,
    String(record.status ?? 'scheduled'),
    String(record.scheduledStartTime ?? now),
    record.scheduledEndTime != null ? String(record.scheduledEndTime) : null,
    String(record.createdAt ?? now),
    String(record.updatedAt ?? now),
    String(record.syncStatus ?? 'local'),
  ];
}

/**
 * Convert a Dexie ticket record to SQLite values
 */
function ticketToSQLiteValues(record: DexieRecord): SQLiteValue[] {
  const now = new Date().toISOString();
  return [
    String(record.id ?? ''),
    String(record.storeId ?? ''),
    record.clientId != null ? String(record.clientId) : null,
    String(record.status ?? 'waiting'),
    record.services != null ? JSON.stringify(record.services) : null,
    String(record.createdAt ?? now),
    String(record.updatedAt ?? now),
    String(record.syncStatus ?? 'local'),
  ];
}

/**
 * Get the conversion function for a table
 */
function getConverter(tableName: string): (record: DexieRecord) => SQLiteValue[] {
  switch (tableName) {
    case 'staff':
      return staffToSQLiteValues;
    case 'clients':
      return clientToSQLiteValues;
    case 'services':
      return serviceToSQLiteValues;
    case 'appointments':
      return appointmentToSQLiteValues;
    case 'tickets':
      return ticketToSQLiteValues;
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

/**
 * Insert records in batches for performance
 */
async function batchInsert(
  db: SQLiteAdapter,
  tableName: string,
  records: DexieRecord[],
  onBatchComplete?: (count: number) => void
): Promise<number> {
  if (records.length === 0) {
    return 0;
  }

  const insertSql = INSERT_SQL[tableName];
  if (!insertSql) {
    throw new Error(`No INSERT SQL defined for table: ${tableName}`);
  }

  const converter = getConverter(tableName);
  let insertedCount = 0;

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    // Use transaction for batch insert
    await db.transaction(async () => {
      for (const record of batch) {
        const values = converter(record);
        await db.run(insertSql, values);
        insertedCount++;
      }
    });

    // Notify progress after each batch
    if (onBatchComplete) {
      onBatchComplete(insertedCount);
    }
  }

  return insertedCount;
}

/**
 * Migrate data from Dexie (IndexedDB) to SQLite
 *
 * @param dexieDb - Dexie database instance with table accessors
 * @param sqliteDb - SQLite adapter instance
 * @param onProgress - Optional callback for progress updates
 * @returns Migration result with success status, table counts, and any errors
 *
 * @example
 * ```typescript
 * import { db } from './db/schema';
 * import { createElectronAdapter } from '@mango/sqlite-adapter';
 *
 * const sqliteDb = await createElectronAdapter({ dbName: 'mango' });
 * const result = await migrateFromDexie(db, sqliteDb, (table, count) => {
 *   console.log(`Migrated ${count} records from ${table}`);
 * });
 *
 * if (result.success) {
 *   console.log('Migration complete!');
 * } else {
 *   console.error('Migration failed:', result.errors);
 * }
 * ```
 */
export async function migrateFromDexie(
  dexieDb: DexieDatabase,
  sqliteDb: SQLiteAdapter,
  onProgress?: (table: string, count: number) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    tables: [],
    errors: [],
  };

  console.log('[Migration] Starting Dexie to SQLite data migration...');

  for (const tableName of MIGRATION_ORDER) {
    const dexieTable = dexieDb[tableName];

    // Skip if table doesn't exist in Dexie database
    if (!dexieTable) {
      console.log(`[Migration] Skipping ${tableName}: table not found in Dexie`);
      result.tables.push({ name: tableName, count: 0 });
      continue;
    }

    try {
      console.log(`[Migration] Reading ${tableName} from Dexie...`);

      // Read all records from Dexie
      const dexieRecords = await dexieTable.toArray();
      const dexieCount = dexieRecords.length;

      console.log(`[Migration] Found ${dexieCount} ${tableName} records to migrate`);

      if (dexieCount === 0) {
        result.tables.push({ name: tableName, count: 0 });
        if (onProgress) {
          onProgress(tableName, 0);
        }
        continue;
      }

      // Insert records into SQLite
      const insertedCount = await batchInsert(sqliteDb, tableName, dexieRecords);

      // Validate counts match
      if (insertedCount !== dexieCount) {
        const error = `[Migration] Count mismatch for ${tableName}: Dexie=${dexieCount}, SQLite=${insertedCount}`;
        console.error(error);
        result.errors.push(error);
        result.success = false;
      } else {
        console.log(`[Migration] Successfully migrated ${insertedCount} ${tableName} records`);
      }

      result.tables.push({ name: tableName, count: insertedCount });

      // Notify progress
      if (onProgress) {
        onProgress(tableName, insertedCount);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `[Migration] Error migrating ${tableName}: ${error.message}`
          : `[Migration] Unknown error migrating ${tableName}`;

      console.error(errorMessage);
      result.errors.push(errorMessage);
      result.success = false;

      // Continue with other tables even if one fails
      result.tables.push({ name: tableName, count: 0 });
    }
  }

  if (result.success) {
    const totalRecords = result.tables.reduce((sum, t) => sum + t.count, 0);
    console.log(`[Migration] Migration complete! Total records: ${totalRecords}`);
  } else {
    console.error(`[Migration] Migration completed with errors: ${result.errors.length} error(s)`);
  }

  return result;
}
