/**
 * Dual-Write Service
 *
 * Provides bi-directional data synchronization between SQLite and Dexie (IndexedDB)
 * during the SQLite stabilization period.
 *
 * PURPOSE:
 * When SQLite is enabled, this service ensures that writes also propagate to Dexie
 * in the background. This provides a safety net: if users need to rollback from
 * SQLite to Dexie due to issues, their data is not lost.
 *
 * HOW IT WORKS:
 * 1. Primary write goes to SQLite (when enabled)
 * 2. Secondary write to Dexie happens asynchronously in background (non-blocking)
 * 3. Dexie errors are logged but don't fail the operation
 * 4. After VITE_DUAL_WRITE_DAYS (default 30), dual-write can be disabled
 *
 * USAGE:
 * Instead of calling sqliteDB.create() directly, use:
 *   dualWrite.create('clients', sqliteClientsDB, clientsDB, data)
 *
 * This ensures both databases stay in sync during the transition period.
 */

import { shouldUseSQLite } from '@/config/featureFlags';

// ==================== CONFIGURATION ====================

/**
 * Number of days to keep dual-write enabled after migration.
 * After this period, set VITE_DUAL_WRITE_ENABLED=false to disable backup writes.
 * Default: 30 days
 */
const DUAL_WRITE_DAYS = parseInt(import.meta.env.VITE_DUAL_WRITE_DAYS || '30', 10);

/**
 * Force disable dual-write (overrides automatic behavior).
 * Set to 'false' to completely disable dual-write backup.
 */
const DUAL_WRITE_ENABLED = import.meta.env.VITE_DUAL_WRITE_ENABLED !== 'false';

/**
 * Storage key for tracking dual-write start date
 */
const DUAL_WRITE_START_KEY = 'mango:sqlite:dual_write_start';

// ==================== TYPES ====================

/**
 * Database operation interface - matches the pattern used by SQLite and Dexie services
 */
export interface DatabaseService<T> {
  getById?: (id: string) => Promise<T | null | undefined>;
  create?: (data: Omit<T, 'id'> | Partial<T>, ...args: unknown[]) => Promise<T>;
  update?: (id: string, updates: Partial<T>, ...args: unknown[]) => Promise<T | null | undefined>;
  delete?: (id: string) => Promise<void | boolean>;
  // Support for addRaw (used by some services like tickets)
  addRaw?: (data: T, ...args: unknown[]) => Promise<T | string>;
}

/**
 * Dual-write operation result
 */
export interface DualWriteResult<T> {
  /** The primary operation result (from SQLite) */
  primary: T;
  /** Whether the backup write to Dexie succeeded */
  backupSuccess: boolean;
  /** Error message if backup failed */
  backupError?: string;
}

/**
 * Statistics about dual-write operations
 */
export interface DualWriteStats {
  /** Whether dual-write is currently active */
  isActive: boolean;
  /** Days remaining until dual-write can be disabled */
  daysRemaining: number;
  /** Number of successful backup writes */
  successCount: number;
  /** Number of failed backup writes */
  failureCount: number;
  /** Last error message (if any) */
  lastError?: string;
}

// ==================== STATE ====================

let _stats = {
  successCount: 0,
  failureCount: 0,
  lastError: undefined as string | undefined,
};

// ==================== HELPERS ====================

/**
 * Check if dual-write should be active.
 *
 * Conditions for dual-write:
 * 1. SQLite must be enabled (dual-write only matters when using SQLite)
 * 2. VITE_DUAL_WRITE_ENABLED must not be 'false'
 * 3. Must be within DUAL_WRITE_DAYS from migration start
 */
export function isDualWriteActive(): boolean {
  // Only relevant when SQLite is primary
  if (!shouldUseSQLite()) {
    return false;
  }

  // Check if explicitly disabled
  if (!DUAL_WRITE_ENABLED) {
    return false;
  }

  // Check if within the dual-write period
  const startDate = getDualWriteStartDate();
  if (!startDate) {
    // No start date - start tracking now
    setDualWriteStartDate();
    return true;
  }

  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceStart < DUAL_WRITE_DAYS;
}

/**
 * Get the dual-write start date from localStorage
 */
function getDualWriteStartDate(): Date | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(DUAL_WRITE_START_KEY);
    if (!stored) return null;
    return new Date(stored);
  } catch {
    return null;
  }
}

/**
 * Set the dual-write start date in localStorage
 */
function setDualWriteStartDate(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DUAL_WRITE_START_KEY, new Date().toISOString());
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get days remaining in dual-write period
 */
function getDaysRemaining(): number {
  const startDate = getDualWriteStartDate();
  if (!startDate) return DUAL_WRITE_DAYS;

  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, DUAL_WRITE_DAYS - daysSinceStart);
}

/**
 * Execute backup write to Dexie (async, non-blocking)
 * Errors are caught and logged but don't affect the primary operation.
 */
async function executeBackupWrite(
  operation: string,
  entityType: string,
  backupFn: () => Promise<unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await backupFn();
    _stats.successCount++;
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    _stats.failureCount++;
    _stats.lastError = errorMessage;
    console.warn(
      `[DualWrite] Backup ${operation} to Dexie failed for ${entityType}:`,
      errorMessage
    );
    return { success: false, error: errorMessage };
  }
}

// ==================== DUAL-WRITE OPERATIONS ====================

/**
 * Perform a dual-write CREATE operation.
 *
 * Primary: SQLite (when enabled)
 * Backup: Dexie (async, non-blocking)
 *
 * @param entityType - Entity type for logging (e.g., 'clients', 'tickets')
 * @param sqliteService - SQLite service with create method
 * @param dexieService - Dexie service with create method
 * @param data - Data to create
 * @param args - Additional arguments for create method (e.g., storeId)
 * @returns Primary result with backup status
 */
export async function dualWriteCreate<T extends { id?: string }>(
  entityType: string,
  sqliteService: DatabaseService<T>,
  dexieService: DatabaseService<T>,
  data: Omit<T, 'id'> | Partial<T>,
  ...args: unknown[]
): Promise<DualWriteResult<T>> {
  // Primary write to SQLite
  if (!sqliteService.create) {
    throw new Error(`[DualWrite] ${entityType} SQLite service missing create method`);
  }
  const result = await sqliteService.create(data, ...args);

  // Check if dual-write is active
  if (!isDualWriteActive()) {
    return { primary: result, backupSuccess: true };
  }

  // Backup write to Dexie (non-blocking)
  if (!dexieService.create) {
    console.warn(`[DualWrite] ${entityType} Dexie service missing create method`);
    return { primary: result, backupSuccess: false, backupError: 'Missing create method' };
  }

  // Don't await - run in background
  executeBackupWrite('create', entityType, async () => {
    // For backup, use the full created object (with id) to ensure consistency
    if (dexieService.addRaw) {
      await dexieService.addRaw(result, ...args);
    } else {
      await dexieService.create!(result as Omit<T, 'id'>, ...args);
    }
  }).then(backupResult => {
    if (!backupResult.success) {
      // Log but don't fail
    }
  });

  // Return immediately (don't wait for backup)
  return { primary: result, backupSuccess: true };
}

/**
 * Perform a dual-write UPDATE operation.
 *
 * Primary: SQLite (when enabled)
 * Backup: Dexie (async, non-blocking)
 *
 * @param entityType - Entity type for logging
 * @param sqliteService - SQLite service with update method
 * @param dexieService - Dexie service with update method
 * @param id - Entity ID to update
 * @param updates - Partial updates to apply
 * @param args - Additional arguments for update method
 * @returns Primary result with backup status
 */
export async function dualWriteUpdate<T>(
  entityType: string,
  sqliteService: DatabaseService<T>,
  dexieService: DatabaseService<T>,
  id: string,
  updates: Partial<T>,
  ...args: unknown[]
): Promise<DualWriteResult<T | null>> {
  // Primary write to SQLite
  if (!sqliteService.update) {
    throw new Error(`[DualWrite] ${entityType} SQLite service missing update method`);
  }
  const result = await sqliteService.update(id, updates, ...args);

  // Check if dual-write is active
  if (!isDualWriteActive()) {
    return { primary: result ?? null, backupSuccess: true };
  }

  // Backup write to Dexie (non-blocking)
  if (!dexieService.update) {
    console.warn(`[DualWrite] ${entityType} Dexie service missing update method`);
    return { primary: result ?? null, backupSuccess: false, backupError: 'Missing update method' };
  }

  // Don't await - run in background
  executeBackupWrite('update', entityType, async () => {
    await dexieService.update!(id, updates, ...args);
  });

  // Return immediately (don't wait for backup)
  return { primary: result ?? null, backupSuccess: true };
}

/**
 * Perform a dual-write DELETE operation.
 *
 * Primary: SQLite (when enabled)
 * Backup: Dexie (async, non-blocking)
 *
 * @param entityType - Entity type for logging
 * @param sqliteService - SQLite service with delete method
 * @param dexieService - Dexie service with delete method
 * @param id - Entity ID to delete
 * @returns Void with backup status
 */
export async function dualWriteDelete<T>(
  entityType: string,
  sqliteService: DatabaseService<T>,
  dexieService: DatabaseService<T>,
  id: string
): Promise<DualWriteResult<void>> {
  // Primary delete from SQLite
  if (!sqliteService.delete) {
    throw new Error(`[DualWrite] ${entityType} SQLite service missing delete method`);
  }
  await sqliteService.delete(id);

  // Check if dual-write is active
  if (!isDualWriteActive()) {
    return { primary: undefined, backupSuccess: true };
  }

  // Backup delete from Dexie (non-blocking)
  if (!dexieService.delete) {
    console.warn(`[DualWrite] ${entityType} Dexie service missing delete method`);
    return { primary: undefined, backupSuccess: false, backupError: 'Missing delete method' };
  }

  // Don't await - run in background
  executeBackupWrite('delete', entityType, async () => {
    await dexieService.delete!(id);
  });

  // Return immediately (don't wait for backup)
  return { primary: undefined, backupSuccess: true };
}

/**
 * Perform a dual-write ADD RAW operation (for services that support raw inserts).
 *
 * Primary: SQLite (when enabled)
 * Backup: Dexie (async, non-blocking)
 *
 * @param entityType - Entity type for logging
 * @param sqliteService - SQLite service with addRaw method
 * @param dexieService - Dexie service with addRaw method
 * @param data - Full entity data including ID
 * @param args - Additional arguments for addRaw method
 * @returns Primary result with backup status
 */
export async function dualWriteAddRaw<T extends { id?: string }>(
  entityType: string,
  sqliteService: DatabaseService<T>,
  dexieService: DatabaseService<T>,
  data: T,
  ...args: unknown[]
): Promise<DualWriteResult<T | string>> {
  // Primary write to SQLite
  if (!sqliteService.addRaw) {
    throw new Error(`[DualWrite] ${entityType} SQLite service missing addRaw method`);
  }
  const result = await sqliteService.addRaw(data, ...args);

  // Check if dual-write is active
  if (!isDualWriteActive()) {
    return { primary: result, backupSuccess: true };
  }

  // Backup write to Dexie (non-blocking)
  if (!dexieService.addRaw) {
    console.warn(`[DualWrite] ${entityType} Dexie service missing addRaw method`);
    return { primary: result, backupSuccess: false, backupError: 'Missing addRaw method' };
  }

  // Don't await - run in background
  executeBackupWrite('addRaw', entityType, async () => {
    await dexieService.addRaw!(data, ...args);
  });

  // Return immediately (don't wait for backup)
  return { primary: result, backupSuccess: true };
}

// ==================== STATISTICS & MONITORING ====================

/**
 * Get dual-write statistics for monitoring
 */
export function getDualWriteStats(): DualWriteStats {
  return {
    isActive: isDualWriteActive(),
    daysRemaining: getDaysRemaining(),
    successCount: _stats.successCount,
    failureCount: _stats.failureCount,
    lastError: _stats.lastError,
  };
}

/**
 * Reset dual-write statistics (for testing)
 */
export function resetDualWriteStats(): void {
  _stats = {
    successCount: 0,
    failureCount: 0,
    lastError: undefined,
  };
}

/**
 * Clear dual-write start date (for testing/debugging)
 * This will restart the dual-write period.
 */
export function resetDualWriteStartDate(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(DUAL_WRITE_START_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Log dual-write status for debugging
 */
export function logDualWriteStatus(): void {
  const stats = getDualWriteStats();
  console.log('[DualWrite] Status:', {
    active: stats.isActive,
    daysRemaining: stats.daysRemaining,
    successCount: stats.successCount,
    failureCount: stats.failureCount,
    lastError: stats.lastError,
    config: {
      enabled: DUAL_WRITE_ENABLED,
      periodDays: DUAL_WRITE_DAYS,
    },
  });
}

// ==================== CONVENIENCE WRAPPERS ====================

/**
 * Dual-write service object for easy import
 *
 * @example
 * import { dualWrite } from '@/services/dualWriteService';
 *
 * // Create with dual-write
 * const { primary: client } = await dualWrite.create(
 *   'clients',
 *   sqliteClientsDB,
 *   clientsDB,
 *   clientData
 * );
 */
export const dualWrite = {
  create: dualWriteCreate,
  update: dualWriteUpdate,
  delete: dualWriteDelete,
  addRaw: dualWriteAddRaw,
  getStats: getDualWriteStats,
  isActive: isDualWriteActive,
  logStatus: logDualWriteStatus,
  reset: {
    stats: resetDualWriteStats,
    startDate: resetDualWriteStartDate,
  },
};

export default dualWrite;
