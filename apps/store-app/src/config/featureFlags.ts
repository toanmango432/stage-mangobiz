/**
 * Feature Flags
 *
 * Configuration for runtime feature toggles and platform detection.
 *
 * SQLite Backend Selection:
 * - VITE_USE_SQLITE=true enables SQLite backend on Electron
 * - Web and Capacitor platforms always use Dexie (IndexedDB)
 * - Electron can opt-in to SQLite via environment variable
 *
 * Rollback Safety:
 * - If SQLite encounters 3+ consecutive errors, auto-rollback to Dexie occurs
 * - VITE_FORCE_SQLITE=true overrides rollback state (for debugging)
 * - Use clearRollbackState() from databaseRecovery to manually re-enable
 */

// ==================== PLATFORM DETECTION ====================

/**
 * Check if running in Electron environment.
 * Detects electron via window.electron or process.type.
 */
export function isElectron(): boolean {
  // Check for Electron-specific APIs
  if (typeof window !== 'undefined') {
    // Check for preload-exposed electron API
    if ('electron' in window) {
      return true;
    }
    // Check for userAgent (less reliable but fallback)
    if (navigator.userAgent.toLowerCase().includes('electron')) {
      return true;
    }
  }

  // Check Node.js process (for main process)
  if (typeof process !== 'undefined' && process.versions && 'electron' in process.versions) {
    return true;
  }

  return false;
}

/**
 * Check if running in Capacitor environment (iOS/Android).
 */
export function isCapacitor(): boolean {
  if (typeof window !== 'undefined') {
    return 'Capacitor' in window || navigator.userAgent.includes('Capacitor');
  }
  return false;
}

/**
 * Check if running in web browser (not Electron or Capacitor).
 */
export function isWeb(): boolean {
  return !isElectron() && !isCapacitor();
}

/**
 * Get the current platform type.
 */
export function getPlatform(): 'electron' | 'capacitor' | 'web' {
  if (isElectron()) return 'electron';
  if (isCapacitor()) return 'capacitor';
  return 'web';
}

// ==================== SQLITE FEATURE FLAG ====================

// Track if we've logged the backend selection (to avoid spam on hot reload)
let hasLoggedSQLiteStatus = false;

/**
 * Storage key for rollback state (duplicated here to avoid circular imports)
 * Must match ROLLBACK_STATE_KEY in databaseRecovery.ts
 */
const ROLLBACK_STATE_KEY = 'mango:sqlite:rollback_state';

/**
 * Check if SQLite is in rollback state (sync check, no imports needed)
 * This is a minimal inline check to avoid circular dependencies.
 */
function isInRollbackState(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem(ROLLBACK_STATE_KEY);
    if (!stored) return false;
    const state = JSON.parse(stored);
    return state.isRolledBack === true;
  } catch (error) {
    console.warn('[FeatureFlags] Failed to parse rollback state:', error);
    return false;
  }
}

/**
 * Check if SQLite backend should be used.
 *
 * Behavior:
 * - Electron: SQLite is ENABLED BY DEFAULT (opt-out with VITE_DISABLE_SQLITE=true)
 * - Web: Always uses Dexie (IndexedDB)
 * - Capacitor (iOS/Android): Always uses Dexie (IndexedDB)
 *
 * Safety:
 * - If rollback is active (3+ consecutive SQLite errors), returns false
 * - VITE_FORCE_SQLITE=true overrides rollback state (for debugging)
 *
 * Environment Variables:
 * - VITE_DISABLE_SQLITE=true: Opt-out of SQLite on Electron (fallback to Dexie)
 * - VITE_FORCE_SQLITE=true: Force SQLite even if rollback is active (debugging)
 * - VITE_USE_SQLITE=true: Legacy opt-in flag (still works but deprecated)
 *
 * @returns true if SQLite should be used for data operations
 */
export function shouldUseSQLite(): boolean {
  // SQLite only available in Electron (requires better-sqlite3 native bindings)
  if (!isElectron()) {
    return false;
  }

  // Check for explicit opt-out (VITE_DISABLE_SQLITE=true disables SQLite)
  const disableSqliteEnv = import.meta.env.VITE_DISABLE_SQLITE;
  if (disableSqliteEnv === 'true') {
    return false;
  }

  // Check for force-enable override (VITE_FORCE_SQLITE=true)
  const forceSqliteEnv = import.meta.env.VITE_FORCE_SQLITE;
  if (forceSqliteEnv === 'true') {
    // Force SQLite even if rollback is active
    return true;
  }

  // Check rollback state - if rolled back due to errors, use Dexie
  if (isInRollbackState()) {
    return false;
  }

  // Default: SQLite is ENABLED on Electron
  // Legacy: VITE_USE_SQLITE=true still works but is no longer required
  return true;
}

/**
 * Get the backend type to use for data operations.
 *
 * - 'sqlite': Uses better-sqlite3 in Electron (when enabled)
 * - 'dexie': Uses IndexedDB via Dexie.js (default for all platforms)
 */
export function getBackendType(): 'dexie' | 'sqlite' {
  return shouldUseSQLite() ? 'sqlite' : 'dexie';
}

// ==================== LOGGING ====================

/**
 * Log the current backend selection.
 * Call this once on app initialization.
 * Logs only once per session to avoid spam on hot reload.
 */
export function logBackendSelection(): void {
  // Only log once per session
  if (hasLoggedSQLiteStatus) {
    return;
  }
  hasLoggedSQLiteStatus = true;

  const backend = getBackendType();
  const platform = getPlatform();
  const rollbackActive = isInRollbackState();

  if (backend === 'sqlite') {
    console.log(`[DataService] ✓ SQLite backend ACTIVE (platform: ${platform})`);
    console.log('[DataService] Using native SQLite for data operations');
    console.log('[DataService] To opt-out, set VITE_DISABLE_SQLITE=true');
  } else if (platform === 'electron' && rollbackActive) {
    console.log(`[DataService] ⚠️ Using Dexie/IndexedDB - ROLLBACK MODE (platform: ${platform})`);
    console.log('[DataService] SQLite disabled due to errors. See databaseRecovery for details.');
    console.log('[DataService] To force SQLite, set VITE_FORCE_SQLITE=true');
  } else if (platform === 'electron') {
    console.log(`[DataService] Using Dexie/IndexedDB (platform: ${platform})`);
    console.log('[DataService] SQLite disabled via VITE_DISABLE_SQLITE=true');
  } else {
    console.log(`[DataService] Using Dexie/IndexedDB (platform: ${platform})`);
  }
}

// ==================== OTHER FEATURE FLAGS ====================

/**
 * Check if API mode is enabled (uses REST API instead of local-first).
 */
export function isAPIMode(): boolean {
  return import.meta.env.VITE_USE_API_LAYER === 'true';
}

/**
 * Check if development mode is enabled.
 */
export function isDevMode(): boolean {
  return import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV === true;
}

/**
 * Check if offline mode is enabled.
 */
export function isOfflineModeEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false';
}

/**
 * Check if MQTT communication is enabled.
 */
export function isMQTTEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MQTT !== 'false';
}

// ==================== MIGRATION STATUS ====================

// Storage key for migration status in localStorage
const MIGRATION_STATUS_KEY = 'mango:sqlite:migration_status';

/**
 * Migration status stored in localStorage for quick access.
 * This is a cache of the SQLite _data_migration_status table.
 */
interface LocalMigrationStatus {
  completed: boolean;
  version: number;
  migratedAt: string;
}

/**
 * Current migration format version
 * Must match CURRENT_MIGRATION_VERSION in sqlite-adapter
 */
const CURRENT_MIGRATION_VERSION = 1;

/**
 * Get cached migration status from localStorage
 * @returns Migration status or null if not cached
 */
function getCachedMigrationStatus(): LocalMigrationStatus | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LocalMigrationStatus;
  } catch (error) {
    console.warn('[FeatureFlags] Failed to parse cached migration status:', error);
    return null;
  }
}

/**
 * Cache migration status to localStorage
 * @param status - Status to cache
 */
export function cacheMigrationStatus(status: LocalMigrationStatus): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
    }
  } catch (error) {
    console.warn('[FeatureFlags] Failed to cache migration status:', error);
  }
}

/**
 * Clear cached migration status
 * Used when resetting migration for debugging
 */
export function clearCachedMigrationStatus(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(MIGRATION_STATUS_KEY);
    }
  } catch (error) {
    console.warn('[FeatureFlags] Failed to clear cached migration status:', error);
  }
}

/**
 * Check if Dexie-to-SQLite data migration is needed.
 *
 * Returns true if:
 * 1. Running in Electron with SQLite enabled, AND
 * 2. Migration has not been completed (or was completed with older version)
 *
 * This is a synchronous check using cached localStorage status.
 * For definitive async check, use the SQLite status table directly.
 *
 * @returns true if data migration should be triggered
 *
 * @example
 * ```typescript
 * if (needsMigration()) {
 *   showMigrationModal();
 *   const result = await runDataMigration();
 *   if (result.success) {
 *     cacheMigrationStatus({ completed: true, version: CURRENT_MIGRATION_VERSION, migratedAt: new Date().toISOString() });
 *   }
 * }
 * ```
 */
export function needsMigration(): boolean {
  // Migration only applies to Electron with SQLite enabled
  if (!shouldUseSQLite()) {
    return false;
  }

  // Check cached status (fast, synchronous)
  const cached = getCachedMigrationStatus();

  // No cached status - migration likely needed (defer to async check)
  if (!cached) {
    return true;
  }

  // Not completed yet
  if (!cached.completed) {
    return true;
  }

  // Completed but with older version - upgrade needed
  if (cached.version < CURRENT_MIGRATION_VERSION) {
    return true;
  }

  // Migration complete and current
  return false;
}

/**
 * Check if migration is definitely complete (synchronous check)
 *
 * Returns true only if we have cached confirmation that migration
 * is complete with the current version. Returns false if uncertain.
 *
 * @returns true if migration is definitely complete
 */
export function isMigrationDefinitelyComplete(): boolean {
  const cached = getCachedMigrationStatus();
  return cached !== null && cached.completed && cached.version >= CURRENT_MIGRATION_VERSION;
}
