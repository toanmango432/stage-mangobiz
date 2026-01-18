/**
 * Database Recovery Service
 *
 * Provides automatic rollback safety mechanism for SQLite database issues.
 * When SQLite experiences issues in production, this service automatically
 * falls back to Dexie (IndexedDB) to prevent data loss and maintain app stability.
 *
 * FEATURES:
 * - Automatic rollback after 3 consecutive SQLite errors
 * - Manual rollback via rollbackToIndexedDB()
 * - Rollback state persisted in localStorage (survives app restart)
 * - User notification when rollback occurs
 * - Manual re-enable via clearRollbackState() or env var
 *
 * INTEGRATION:
 * The dual-write service (US-038) ensures no data loss on rollback by keeping
 * Dexie in sync with SQLite during the stabilization period.
 *
 * @module store-app/services/databaseRecovery
 */

// ==================== TYPES ====================

/**
 * Database issue detection result
 */
export interface DatabaseIssueResult {
  /** Whether any issues were detected */
  hasIssues: boolean;
  /** Type of issue detected */
  issueType?: 'corruption' | 'error' | 'timeout' | 'unknown';
  /** Detailed error message */
  message?: string;
  /** Timestamp of detection */
  detectedAt: string;
  /** Number of consecutive errors */
  consecutiveErrors: number;
}

/**
 * Rollback state stored in localStorage
 */
export interface RollbackState {
  /** Whether rollback is active */
  isRolledBack: boolean;
  /** Timestamp when rollback occurred */
  rolledBackAt: string | null;
  /** Reason for rollback */
  reason: string | null;
  /** Number of consecutive errors before rollback */
  errorCount: number;
  /** Whether auto-rollback is disabled */
  autoRollbackDisabled: boolean;
}

/**
 * Callback for rollback notification
 */
export type RollbackNotificationCallback = (state: RollbackState, reason: string) => void;

// ==================== CONSTANTS ====================

/** Storage key for rollback state */
const ROLLBACK_STATE_KEY = 'mango:sqlite:rollback_state';

/** Storage key for error counter */
const ERROR_COUNTER_KEY = 'mango:sqlite:error_counter';

/** Number of consecutive errors before auto-rollback */
const AUTO_ROLLBACK_THRESHOLD = 3;

/** Storage key for last error timestamp */
const LAST_ERROR_KEY = 'mango:sqlite:last_error';

/** Error count reset timeout (5 minutes) - if no errors in this period, reset count */
const ERROR_COUNT_RESET_MS = 5 * 60 * 1000;

// ==================== STATE ====================

let _notificationCallback: RollbackNotificationCallback | null = null;
let _isInitialized = false;

// ==================== STORAGE HELPERS ====================

/**
 * Get the current rollback state from localStorage
 */
export function getRollbackState(): RollbackState {
  try {
    if (typeof localStorage === 'undefined') {
      return getDefaultRollbackState();
    }
    const stored = localStorage.getItem(ROLLBACK_STATE_KEY);
    if (!stored) {
      return getDefaultRollbackState();
    }
    return JSON.parse(stored) as RollbackState;
  } catch {
    return getDefaultRollbackState();
  }
}

/**
 * Get default rollback state
 */
function getDefaultRollbackState(): RollbackState {
  return {
    isRolledBack: false,
    rolledBackAt: null,
    reason: null,
    errorCount: 0,
    autoRollbackDisabled: false,
  };
}

/**
 * Save rollback state to localStorage
 */
function saveRollbackState(state: RollbackState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ROLLBACK_STATE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get consecutive error count
 */
function getErrorCount(): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const stored = localStorage.getItem(ERROR_COUNTER_KEY);
    if (!stored) return 0;
    return parseInt(stored, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Set consecutive error count
 */
function setErrorCount(count: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ERROR_COUNTER_KEY, String(count));
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Get last error timestamp
 */
function getLastErrorTimestamp(): number | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem(LAST_ERROR_KEY);
    if (!stored) return null;
    return parseInt(stored, 10) || null;
  } catch {
    return null;
  }
}

/**
 * Set last error timestamp
 */
function setLastErrorTimestamp(timestamp: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_ERROR_KEY, String(timestamp));
    }
  } catch {
    // Ignore localStorage errors
  }
}

// ==================== CORE FUNCTIONS ====================

/**
 * Check if SQLite is currently in rollback mode (using Dexie instead)
 *
 * When true, shouldUseSQLite() should return false to use Dexie.
 *
 * @returns true if currently rolled back to Dexie
 */
export function isRolledBack(): boolean {
  const state = getRollbackState();
  return state.isRolledBack;
}

/**
 * Detect database issues by checking various indicators
 *
 * This function checks:
 * 1. Corruption status from health service (via localStorage)
 * 2. Recent error count
 * 3. Error patterns
 *
 * @returns Detection result with issue details
 */
export function detectDatabaseIssues(): DatabaseIssueResult {
  const timestamp = new Date().toISOString();
  const consecutiveErrors = getErrorCount();

  // Check corruption status from health service
  try {
    const corruptionKey = 'mango:sqlite:corruption_detected';
    const corruptionData = localStorage.getItem(corruptionKey);
    if (corruptionData) {
      const parsed = JSON.parse(corruptionData);
      if (parsed.detected) {
        return {
          hasIssues: true,
          issueType: 'corruption',
          message: `Database corruption detected at ${parsed.detectedAt}`,
          detectedAt: timestamp,
          consecutiveErrors,
        };
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Check consecutive error count
  if (consecutiveErrors >= AUTO_ROLLBACK_THRESHOLD) {
    return {
      hasIssues: true,
      issueType: 'error',
      message: `${consecutiveErrors} consecutive SQLite errors detected`,
      detectedAt: timestamp,
      consecutiveErrors,
    };
  }

  return {
    hasIssues: false,
    detectedAt: timestamp,
    consecutiveErrors,
  };
}

/**
 * Record a SQLite error for tracking
 *
 * Increments the error counter. If the counter reaches AUTO_ROLLBACK_THRESHOLD,
 * triggers automatic rollback to Dexie.
 *
 * @param error - The error that occurred
 * @returns Whether auto-rollback was triggered
 */
export function recordSQLiteError(error: Error | string): boolean {
  const now = Date.now();
  const lastError = getLastErrorTimestamp();

  // Reset error count if it's been a while since the last error
  if (lastError && (now - lastError) > ERROR_COUNT_RESET_MS) {
    setErrorCount(0);
  }

  // Increment error count
  const newCount = getErrorCount() + 1;
  setErrorCount(newCount);
  setLastErrorTimestamp(now);

  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[DatabaseRecovery] SQLite error recorded (${newCount}/${AUTO_ROLLBACK_THRESHOLD}):`, errorMessage);

  // Check if auto-rollback should be triggered
  const state = getRollbackState();
  if (!state.autoRollbackDisabled && newCount >= AUTO_ROLLBACK_THRESHOLD) {
    console.warn(`[DatabaseRecovery] Auto-rollback triggered after ${newCount} consecutive errors`);
    rollbackToIndexedDB(`Auto-rollback after ${newCount} consecutive errors: ${errorMessage}`);
    return true;
  }

  return false;
}

/**
 * Record a successful SQLite operation
 *
 * Resets the error counter to track only consecutive errors.
 */
export function recordSQLiteSuccess(): void {
  const currentCount = getErrorCount();
  if (currentCount > 0) {
    setErrorCount(0);
    console.log('[DatabaseRecovery] Error count reset after successful operation');
  }
}

/**
 * Rollback to IndexedDB (Dexie)
 *
 * Disables SQLite and falls back to Dexie for data operations.
 * This state persists across app restarts via localStorage.
 *
 * NOTE: The dual-write service (US-038) ensures Dexie has all data
 * that was written to SQLite, so no data loss should occur.
 *
 * @param reason - Reason for the rollback
 */
export function rollbackToIndexedDB(reason: string): void {
  const timestamp = new Date().toISOString();
  const errorCount = getErrorCount();

  const state: RollbackState = {
    isRolledBack: true,
    rolledBackAt: timestamp,
    reason,
    errorCount,
    autoRollbackDisabled: getRollbackState().autoRollbackDisabled,
  };

  saveRollbackState(state);

  console.warn('[DatabaseRecovery] ROLLBACK TO INDEXEDDB');
  console.warn('[DatabaseRecovery] Reason:', reason);
  console.warn('[DatabaseRecovery] SQLite disabled. Using Dexie/IndexedDB for data operations.');
  console.warn('[DatabaseRecovery] To re-enable SQLite, clear rollback state or set VITE_FORCE_SQLITE=true');

  // Notify via callback (for toast notifications)
  if (_notificationCallback) {
    try {
      _notificationCallback(state, reason);
    } catch (callbackError) {
      console.error('[DatabaseRecovery] Notification callback error:', callbackError);
    }
  }
}

/**
 * Clear rollback state and re-enable SQLite
 *
 * Use this to manually re-enable SQLite after issues have been resolved.
 * Also resets error counters.
 */
export function clearRollbackState(): void {
  const defaultState = getDefaultRollbackState();
  saveRollbackState(defaultState);
  setErrorCount(0);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LAST_ERROR_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }

  console.log('[DatabaseRecovery] Rollback state cleared. SQLite re-enabled.');
}

/**
 * Disable auto-rollback
 *
 * Prevents automatic rollback even after consecutive errors.
 * Manual rollback is still possible via rollbackToIndexedDB().
 */
export function disableAutoRollback(): void {
  const state = getRollbackState();
  state.autoRollbackDisabled = true;
  saveRollbackState(state);
  console.log('[DatabaseRecovery] Auto-rollback disabled');
}

/**
 * Enable auto-rollback
 */
export function enableAutoRollback(): void {
  const state = getRollbackState();
  state.autoRollbackDisabled = false;
  saveRollbackState(state);
  console.log('[DatabaseRecovery] Auto-rollback enabled');
}

// ==================== NOTIFICATION ====================

/**
 * Set callback for rollback notifications
 *
 * The callback is invoked when a rollback occurs, allowing the UI
 * to display a toast notification to the user.
 *
 * @param callback - Function to call when rollback occurs
 *
 * @example
 * setRollbackNotificationCallback((state, reason) => {
 *   toast.error(`Database switched to backup mode: ${reason}`);
 * });
 */
export function setRollbackNotificationCallback(callback: RollbackNotificationCallback): void {
  _notificationCallback = callback;
}

/**
 * Clear the rollback notification callback
 */
export function clearRollbackNotificationCallback(): void {
  _notificationCallback = null;
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the database recovery service
 *
 * Call this on app start to:
 * 1. Check for existing rollback state
 * 2. Log current status
 * 3. Set up error tracking
 *
 * @returns Current rollback state
 */
export function initDatabaseRecovery(): RollbackState {
  if (_isInitialized) {
    return getRollbackState();
  }

  _isInitialized = true;
  const state = getRollbackState();

  if (state.isRolledBack) {
    console.warn('[DatabaseRecovery] App started in ROLLBACK MODE');
    console.warn('[DatabaseRecovery] Using Dexie/IndexedDB instead of SQLite');
    console.warn('[DatabaseRecovery] Rollback reason:', state.reason);
    console.warn('[DatabaseRecovery] Rolled back at:', state.rolledBackAt);
  } else {
    const errorCount = getErrorCount();
    if (errorCount > 0) {
      console.log(`[DatabaseRecovery] ${errorCount} previous errors recorded (threshold: ${AUTO_ROLLBACK_THRESHOLD})`);
    }
  }

  return state;
}

// ==================== INTEGRATION WITH FEATURE FLAGS ====================

/**
 * Check if SQLite should be used considering rollback state
 *
 * This wraps the original shouldUseSQLite() check to also consider
 * rollback state. Use this instead of shouldUseSQLite() directly.
 *
 * @param originalShouldUseSQLite - Result from featureFlags.shouldUseSQLite()
 * @returns Whether SQLite should actually be used
 *
 * @example
 * import { shouldUseSQLite as originalShouldUseSQLite } from '@/config/featureFlags';
 * import { shouldUseSQLiteWithRecovery } from '@/services/databaseRecovery';
 *
 * const useSQLite = shouldUseSQLiteWithRecovery(originalShouldUseSQLite());
 */
export function shouldUseSQLiteWithRecovery(originalShouldUseSQLite: boolean): boolean {
  // If SQLite not enabled by feature flags, don't use it
  if (!originalShouldUseSQLite) {
    return false;
  }

  // Check for force-enable override via env var
  const forceEnable = import.meta.env.VITE_FORCE_SQLITE === 'true';
  if (forceEnable) {
    console.log('[DatabaseRecovery] VITE_FORCE_SQLITE=true - forcing SQLite despite rollback state');
    return true;
  }

  // Check rollback state
  const state = getRollbackState();
  if (state.isRolledBack) {
    return false;
  }

  return true;
}

// ==================== STATUS & MONITORING ====================

/**
 * Get comprehensive recovery status for monitoring/debugging
 */
export function getRecoveryStatus(): {
  rollbackState: RollbackState;
  errorCount: number;
  errorThreshold: number;
  lastErrorTimestamp: number | null;
  isInitialized: boolean;
  hasNotificationCallback: boolean;
} {
  return {
    rollbackState: getRollbackState(),
    errorCount: getErrorCount(),
    errorThreshold: AUTO_ROLLBACK_THRESHOLD,
    lastErrorTimestamp: getLastErrorTimestamp(),
    isInitialized: _isInitialized,
    hasNotificationCallback: _notificationCallback !== null,
  };
}

/**
 * Log recovery status for debugging
 */
export function logRecoveryStatus(): void {
  const status = getRecoveryStatus();
  console.log('[DatabaseRecovery] Status:', {
    isRolledBack: status.rollbackState.isRolledBack,
    reason: status.rollbackState.reason,
    rolledBackAt: status.rollbackState.rolledBackAt,
    errorCount: status.errorCount,
    errorThreshold: status.errorThreshold,
    autoRollbackDisabled: status.rollbackState.autoRollbackDisabled,
    forceEnabled: import.meta.env.VITE_FORCE_SQLITE === 'true',
  });
}

// ==================== CONVENIENCE EXPORTS ====================

/**
 * Database recovery service object for easy import
 */
export const databaseRecovery = {
  // State checks
  isRolledBack,
  getRollbackState,
  detectDatabaseIssues,
  shouldUseSQLiteWithRecovery,

  // Error tracking
  recordSQLiteError,
  recordSQLiteSuccess,

  // Rollback control
  rollbackToIndexedDB,
  clearRollbackState,
  disableAutoRollback,
  enableAutoRollback,

  // Notifications
  setRollbackNotificationCallback,
  clearRollbackNotificationCallback,

  // Initialization
  init: initDatabaseRecovery,

  // Monitoring
  getRecoveryStatus,
  logRecoveryStatus,
};

export default databaseRecovery;
