/**
 * Database Health Monitoring Service
 *
 * Provides proactive database health checks to detect issues before they cause problems.
 * Uses SQLite PRAGMA commands to verify database integrity and detect corruption.
 *
 * Features:
 * - Quick health check on app start (PRAGMA quick_check)
 * - Full integrity check daily (PRAGMA integrity_check)
 * - Automatic corruption detection and rollback trigger
 * - Daily backup with 7-day retention
 * - Health check result logging
 *
 * @module sqlite-adapter/health/dbHealth
 */

import type { SQLiteAdapter } from '../types';

// ==================== TYPES ====================

/**
 * Result of a health check operation
 */
export interface HealthCheckResult {
  /** Whether the check passed */
  healthy: boolean;
  /** Type of check performed */
  checkType: 'quick' | 'full';
  /** Detailed messages from the check */
  messages: string[];
  /** When the check was performed */
  timestamp: string;
  /** Duration of the check in milliseconds */
  durationMs: number;
  /** Error message if check failed to run */
  error?: string;
}

/**
 * Database health status summary
 */
export interface DatabaseHealthStatus {
  /** Whether the database is healthy */
  healthy: boolean;
  /** Last quick check result */
  lastQuickCheck: HealthCheckResult | null;
  /** Last full integrity check result */
  lastFullCheck: HealthCheckResult | null;
  /** Last backup info */
  lastBackup: BackupInfo | null;
  /** Whether corruption has been detected */
  corruptionDetected: boolean;
  /** Corruption detection timestamp */
  corruptionDetectedAt: string | null;
}

/**
 * Backup file information
 */
export interface BackupInfo {
  /** Backup file path */
  filePath: string;
  /** When the backup was created */
  createdAt: string;
  /** Size in bytes */
  sizeBytes: number;
}

/**
 * Health check schedule status
 */
export interface HealthScheduleStatus {
  /** Whether scheduled checks are enabled */
  enabled: boolean;
  /** Last scheduled check timestamp */
  lastScheduledCheck: string | null;
  /** Next scheduled check timestamp */
  nextScheduledCheck: string | null;
  /** Interval in milliseconds */
  intervalMs: number;
}

/**
 * Callback for corruption detection
 */
export type CorruptionCallback = (result: HealthCheckResult) => void | Promise<void>;

/**
 * Backup operation result
 */
export interface BackupResult {
  /** Whether the backup succeeded */
  success: boolean;
  /** Backup file info if successful */
  backup?: BackupInfo;
  /** Error message if failed */
  error?: string;
  /** Old backups that were cleaned up */
  cleanedUp: string[];
}

// ==================== CONSTANTS ====================

/** Default interval for daily integrity check (24 hours in ms) */
const DEFAULT_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Maximum age for backup files in days */
const BACKUP_RETENTION_DAYS = 7;

/** Health check results table name */
const HEALTH_TABLE = '_db_health_checks';

/** localStorage key for last check timestamps */
const LAST_QUICK_CHECK_KEY = 'mango:sqlite:last_quick_check';
const LAST_FULL_CHECK_KEY = 'mango:sqlite:last_full_check';
const CORRUPTION_DETECTED_KEY = 'mango:sqlite:corruption_detected';

// ==================== SERVICE CLASS ====================

/**
 * Database health monitoring service
 *
 * @example
 * const health = new DatabaseHealthService(db);
 *
 * // Quick check on app start
 * const quickResult = await health.runQuickCheck();
 * if (!quickResult.healthy) {
 *   console.error('Database quick check failed:', quickResult.messages);
 * }
 *
 * // Schedule daily full checks
 * health.scheduleFullCheck(24 * 60 * 60 * 1000, (result) => {
 *   if (!result.healthy) {
 *     // Trigger rollback to IndexedDB
 *     rollbackToIndexedDB();
 *   }
 * });
 */
export class DatabaseHealthService {
  protected db: SQLiteAdapter;
  private scheduledCheckInterval: ReturnType<typeof setInterval> | null = null;
  private corruptionCallback: CorruptionCallback | null = null;
  private backupDirectory: string;

  constructor(db: SQLiteAdapter, backupDirectory: string = '.') {
    this.db = db;
    this.backupDirectory = backupDirectory;
  }

  // ==================== HEALTH CHECKS ====================

  /**
   * Run a quick health check using PRAGMA quick_check
   *
   * This is a fast check that should be run on app start.
   * It checks the database structure without verifying all data.
   *
   * @returns Health check result
   *
   * @example
   * const result = await health.runQuickCheck();
   * console.log('Database healthy:', result.healthy);
   */
  async runQuickCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // PRAGMA quick_check returns 'ok' if database is healthy
      // or a list of problems if not
      const rows = await this.db.all<{ quick_check: string }>(
        'PRAGMA quick_check'
      );

      const messages = rows.map(row => row.quick_check);
      const healthy = messages.length === 1 && messages[0] === 'ok';

      const result: HealthCheckResult = {
        healthy,
        checkType: 'quick',
        messages,
        timestamp,
        durationMs: Date.now() - startTime,
      };

      // Log result
      await this.logHealthCheck(result);

      // Update last check timestamp
      this.setLastCheckTimestamp('quick', timestamp);

      // Handle corruption
      if (!healthy) {
        await this.handleCorruptionDetected(result);
      }

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        healthy: false,
        checkType: 'quick',
        messages: [],
        timestamp,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };

      await this.logHealthCheck(result);
      await this.handleCorruptionDetected(result);

      return result;
    }
  }

  /**
   * Run a full integrity check using PRAGMA integrity_check
   *
   * This is a thorough check that verifies all data in the database.
   * It can take several seconds on large databases.
   * Should be run daily (scheduled) rather than on every app start.
   *
   * @returns Health check result
   *
   * @example
   * const result = await health.runFullCheck();
   * if (!result.healthy) {
   *   console.error('Database corruption detected!');
   * }
   */
  async runFullCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // PRAGMA integrity_check returns 'ok' if database is healthy
      // or a list of problems if not
      const rows = await this.db.all<{ integrity_check: string }>(
        'PRAGMA integrity_check'
      );

      const messages = rows.map(row => row.integrity_check);
      const healthy = messages.length === 1 && messages[0] === 'ok';

      const result: HealthCheckResult = {
        healthy,
        checkType: 'full',
        messages,
        timestamp,
        durationMs: Date.now() - startTime,
      };

      // Log result
      await this.logHealthCheck(result);

      // Update last check timestamp
      this.setLastCheckTimestamp('full', timestamp);

      // Handle corruption
      if (!healthy) {
        await this.handleCorruptionDetected(result);
      }

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        healthy: false,
        checkType: 'full',
        messages: [],
        timestamp,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };

      await this.logHealthCheck(result);
      await this.handleCorruptionDetected(result);

      return result;
    }
  }

  /**
   * Get comprehensive database health status
   *
   * @returns Current health status including last check results
   */
  async getHealthStatus(): Promise<DatabaseHealthStatus> {
    const lastQuickCheck = await this.getLastHealthCheck('quick');
    const lastFullCheck = await this.getLastHealthCheck('full');
    const corruptionInfo = this.getCorruptionStatus();

    return {
      healthy: !corruptionInfo.detected &&
               (lastQuickCheck?.healthy ?? true) &&
               (lastFullCheck?.healthy ?? true),
      lastQuickCheck,
      lastFullCheck,
      lastBackup: null, // Will be populated when backup methods are called
      corruptionDetected: corruptionInfo.detected,
      corruptionDetectedAt: corruptionInfo.detectedAt,
    };
  }

  // ==================== SCHEDULING ====================

  /**
   * Schedule periodic full integrity checks
   *
   * @param intervalMs - Interval between checks (default: 24 hours)
   * @param onCorruption - Callback when corruption is detected
   * @returns Schedule status
   *
   * @example
   * health.scheduleFullCheck(24 * 60 * 60 * 1000, async (result) => {
   *   await rollbackToIndexedDB();
   * });
   */
  scheduleFullCheck(
    intervalMs: number = DEFAULT_CHECK_INTERVAL_MS,
    onCorruption?: CorruptionCallback
  ): HealthScheduleStatus {
    // Clear any existing schedule
    this.cancelScheduledCheck();

    // Store corruption callback
    if (onCorruption) {
      this.corruptionCallback = onCorruption;
    }

    // Schedule recurring check
    this.scheduledCheckInterval = setInterval(async () => {
      console.log('[DatabaseHealth] Running scheduled full integrity check...');
      const result = await this.runFullCheck();
      console.log(`[DatabaseHealth] Full check complete: ${result.healthy ? 'HEALTHY' : 'CORRUPTION DETECTED'}`);
    }, intervalMs);

    const now = new Date();
    const nextCheck = new Date(now.getTime() + intervalMs);

    return {
      enabled: true,
      lastScheduledCheck: this.getLastCheckTimestamp('full'),
      nextScheduledCheck: nextCheck.toISOString(),
      intervalMs,
    };
  }

  /**
   * Cancel scheduled integrity checks
   */
  cancelScheduledCheck(): void {
    if (this.scheduledCheckInterval) {
      clearInterval(this.scheduledCheckInterval);
      this.scheduledCheckInterval = null;
    }
  }

  /**
   * Get current schedule status
   */
  getScheduleStatus(): HealthScheduleStatus {
    return {
      enabled: this.scheduledCheckInterval !== null,
      lastScheduledCheck: this.getLastCheckTimestamp('full'),
      nextScheduledCheck: null, // Cannot determine without tracking
      intervalMs: DEFAULT_CHECK_INTERVAL_MS,
    };
  }

  // ==================== BACKUP OPERATIONS ====================

  /**
   * Create a backup of the database
   *
   * Uses SQLite's VACUUM INTO command to create a clean backup file.
   * Also cleans up old backups beyond the retention period.
   *
   * @param customPath - Optional custom backup path
   * @returns Backup result
   *
   * @example
   * const result = await health.createBackup();
   * if (result.success) {
   *   console.log('Backup created:', result.backup?.filePath);
   * }
   */
  async createBackup(customPath?: string): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `mango-backup-${timestamp}.db`;
    const filePath = customPath ?? `${this.backupDirectory}/${fileName}`;

    try {
      // Use VACUUM INTO to create a clean backup
      // Note: This requires SQLite 3.27.0+ (2019-02-07)
      await this.db.exec(`VACUUM INTO '${filePath}'`);

      const backup: BackupInfo = {
        filePath,
        createdAt: new Date().toISOString(),
        sizeBytes: 0, // Size cannot be determined without filesystem access
      };

      // Clean up old backups
      const cleanedUp = await this.cleanupOldBackups();

      return {
        success: true,
        backup,
        cleanedUp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        cleanedUp: [],
      };
    }
  }

  /**
   * Clean up backup files older than retention period
   *
   * Note: This method requires filesystem access which may not be available
   * in all contexts. It logs the intent but actual deletion depends on platform.
   *
   * @returns List of files that should be cleaned up
   */
  async cleanupOldBackups(): Promise<string[]> {
    // This is a placeholder - actual filesystem operations
    // would require platform-specific implementation
    console.log(`[DatabaseHealth] Backup cleanup: would remove backups older than ${BACKUP_RETENTION_DAYS} days`);
    return [];
  }

  // ==================== CORRUPTION HANDLING ====================

  /**
   * Handle corruption detection
   *
   * Marks corruption status and triggers callback if registered.
   */
  private async handleCorruptionDetected(result: HealthCheckResult): Promise<void> {
    const timestamp = new Date().toISOString();

    // Mark corruption in localStorage
    try {
      localStorage.setItem(CORRUPTION_DETECTED_KEY, JSON.stringify({
        detected: true,
        detectedAt: timestamp,
        checkType: result.checkType,
        messages: result.messages,
      }));
    } catch {
      // localStorage may not be available
    }

    console.error('[DatabaseHealth] CORRUPTION DETECTED:', result.messages);

    // Trigger callback
    if (this.corruptionCallback) {
      try {
        await this.corruptionCallback(result);
      } catch (callbackError) {
        console.error('[DatabaseHealth] Corruption callback error:', callbackError);
      }
    }
  }

  /**
   * Get corruption detection status
   */
  getCorruptionStatus(): { detected: boolean; detectedAt: string | null } {
    try {
      const stored = localStorage.getItem(CORRUPTION_DETECTED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          detected: parsed.detected ?? false,
          detectedAt: parsed.detectedAt ?? null,
        };
      }
    } catch {
      // localStorage may not be available or corrupted
    }
    return { detected: false, detectedAt: null };
  }

  /**
   * Clear corruption status (e.g., after successful recovery)
   */
  clearCorruptionStatus(): void {
    try {
      localStorage.removeItem(CORRUPTION_DETECTED_KEY);
    } catch {
      // localStorage may not be available
    }
  }

  /**
   * Check if database corruption has been detected
   */
  isCorruptionDetected(): boolean {
    return this.getCorruptionStatus().detected;
  }

  /**
   * Set corruption callback
   *
   * @param callback - Function to call when corruption is detected
   */
  onCorruption(callback: CorruptionCallback): void {
    this.corruptionCallback = callback;
  }

  // ==================== LOGGING ====================

  /**
   * Ensure health check log table exists
   */
  async ensureHealthTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${HEALTH_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_type TEXT NOT NULL,
        healthy INTEGER NOT NULL,
        messages TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        error TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create index for efficient queries
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_health_checks_type_created
      ON ${HEALTH_TABLE}(check_type, created_at DESC)
    `);
  }

  /**
   * Log a health check result to the database
   */
  private async logHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      await this.ensureHealthTable();

      await this.db.run(
        `INSERT INTO ${HEALTH_TABLE} (check_type, healthy, messages, duration_ms, error, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          result.checkType,
          result.healthy ? 1 : 0,
          JSON.stringify(result.messages),
          result.durationMs,
          result.error ?? null,
          result.timestamp,
        ]
      );

      // Cleanup old log entries (keep last 100)
      await this.db.run(
        `DELETE FROM ${HEALTH_TABLE}
         WHERE id NOT IN (
           SELECT id FROM ${HEALTH_TABLE}
           ORDER BY created_at DESC
           LIMIT 100
         )`
      );
    } catch (error) {
      // Don't fail health check if logging fails
      console.error('[DatabaseHealth] Failed to log health check:', error);
    }
  }

  /**
   * Get the last health check of a specific type from the database
   */
  private async getLastHealthCheck(checkType: 'quick' | 'full'): Promise<HealthCheckResult | null> {
    try {
      await this.ensureHealthTable();

      const row = await this.db.get<{
        check_type: string;
        healthy: number;
        messages: string;
        duration_ms: number;
        error: string | null;
        created_at: string;
      }>(
        `SELECT * FROM ${HEALTH_TABLE}
         WHERE check_type = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [checkType]
      );

      if (!row) {
        return null;
      }

      return {
        checkType: row.check_type as 'quick' | 'full',
        healthy: row.healthy === 1,
        messages: JSON.parse(row.messages),
        durationMs: row.duration_ms,
        error: row.error ?? undefined,
        timestamp: row.created_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get health check history
   *
   * @param limit - Maximum number of results (default: 20)
   * @param checkType - Filter by check type (optional)
   * @returns Array of health check results
   */
  async getHealthCheckHistory(
    limit: number = 20,
    checkType?: 'quick' | 'full'
  ): Promise<HealthCheckResult[]> {
    try {
      await this.ensureHealthTable();

      let sql = `SELECT * FROM ${HEALTH_TABLE}`;
      const params: (string | number)[] = [];

      if (checkType) {
        sql += ' WHERE check_type = ?';
        params.push(checkType);
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const rows = await this.db.all<{
        check_type: string;
        healthy: number;
        messages: string;
        duration_ms: number;
        error: string | null;
        created_at: string;
      }>(sql, params);

      return rows.map(row => ({
        checkType: row.check_type as 'quick' | 'full',
        healthy: row.healthy === 1,
        messages: JSON.parse(row.messages),
        durationMs: row.duration_ms,
        error: row.error ?? undefined,
        timestamp: row.created_at,
      }));
    } catch {
      return [];
    }
  }

  // ==================== TIMESTAMP HELPERS ====================

  /**
   * Get last check timestamp from localStorage
   */
  private getLastCheckTimestamp(checkType: 'quick' | 'full'): string | null {
    try {
      const key = checkType === 'quick' ? LAST_QUICK_CHECK_KEY : LAST_FULL_CHECK_KEY;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Set last check timestamp in localStorage
   */
  private setLastCheckTimestamp(checkType: 'quick' | 'full', timestamp: string): void {
    try {
      const key = checkType === 'quick' ? LAST_QUICK_CHECK_KEY : LAST_FULL_CHECK_KEY;
      localStorage.setItem(key, timestamp);
    } catch {
      // localStorage may not be available
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if a full check should be run based on time since last check
   *
   * @param intervalMs - Minimum interval between full checks (default: 24 hours)
   * @returns Whether a full check is due
   */
  isFullCheckDue(intervalMs: number = DEFAULT_CHECK_INTERVAL_MS): boolean {
    const lastCheck = this.getLastCheckTimestamp('full');
    if (!lastCheck) {
      return true;
    }

    const lastCheckTime = new Date(lastCheck).getTime();
    const now = Date.now();
    return now - lastCheckTime >= intervalMs;
  }

  /**
   * Run quick check on app start if not recently run
   *
   * This is a convenience method that combines the check with
   * a "cooldown" to avoid running on every hot reload during development.
   *
   * @param cooldownMs - Minimum time between quick checks (default: 5 minutes)
   * @returns Health check result or null if skipped due to cooldown
   */
  async runQuickCheckIfNeeded(cooldownMs: number = 5 * 60 * 1000): Promise<HealthCheckResult | null> {
    const lastCheck = this.getLastCheckTimestamp('quick');
    if (lastCheck) {
      const lastCheckTime = new Date(lastCheck).getTime();
      const now = Date.now();
      if (now - lastCheckTime < cooldownMs) {
        console.log('[DatabaseHealth] Quick check skipped (cooldown)');
        return null;
      }
    }

    console.log('[DatabaseHealth] Running quick check on app start...');
    const result = await this.runQuickCheck();
    console.log(`[DatabaseHealth] Quick check result: ${result.healthy ? 'OK' : 'ISSUES DETECTED'} (${result.durationMs}ms)`);
    return result;
  }

  /**
   * Get database file info using PRAGMA
   *
   * @returns Basic database statistics
   */
  async getDatabaseInfo(): Promise<{
    pageCount: number;
    pageSize: number;
    totalSizeBytes: number;
    walMode: boolean;
    foreignKeys: boolean;
  }> {
    const [pageCount, pageSize, walMode, foreignKeys] = await Promise.all([
      this.db.get<{ page_count: number }>('PRAGMA page_count'),
      this.db.get<{ page_size: number }>('PRAGMA page_size'),
      this.db.get<{ journal_mode: string }>('PRAGMA journal_mode'),
      this.db.get<{ foreign_keys: number }>('PRAGMA foreign_keys'),
    ]);

    const pages = pageCount?.page_count ?? 0;
    const size = pageSize?.page_size ?? 4096;

    return {
      pageCount: pages,
      pageSize: size,
      totalSizeBytes: pages * size,
      walMode: walMode?.journal_mode === 'wal',
      foreignKeys: (foreignKeys?.foreign_keys ?? 0) === 1,
    };
  }

  /**
   * Clean up resources when service is destroyed
   */
  destroy(): void {
    this.cancelScheduledCheck();
    this.corruptionCallback = null;
  }
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create a new DatabaseHealthService instance
 *
 * @param db - SQLite adapter instance
 * @param backupDirectory - Directory for backup files
 * @returns New health service instance
 */
export function createHealthService(
  db: SQLiteAdapter,
  backupDirectory?: string
): DatabaseHealthService {
  return new DatabaseHealthService(db, backupDirectory);
}

/**
 * Run a one-time quick check without creating a service instance
 *
 * @param db - SQLite adapter instance
 * @returns Health check result
 */
export async function quickHealthCheck(db: SQLiteAdapter): Promise<HealthCheckResult> {
  const service = new DatabaseHealthService(db);
  return service.runQuickCheck();
}

/**
 * Run a one-time full integrity check without creating a service instance
 *
 * @param db - SQLite adapter instance
 * @returns Health check result
 */
export async function fullHealthCheck(db: SQLiteAdapter): Promise<HealthCheckResult> {
  const service = new DatabaseHealthService(db);
  return service.runFullCheck();
}
