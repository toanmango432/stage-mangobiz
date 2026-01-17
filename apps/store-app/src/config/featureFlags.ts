/**
 * Feature Flags
 *
 * Configuration for runtime feature toggles and platform detection.
 *
 * SQLite Backend Selection:
 * - VITE_USE_SQLITE=true enables SQLite backend on Electron
 * - Web and Capacitor platforms always use Dexie (IndexedDB)
 * - Electron can opt-in to SQLite via environment variable
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

/**
 * Check if SQLite backend should be used.
 *
 * Returns true only if:
 * 1. Running in Electron (SQLite requires native bindings)
 * 2. VITE_USE_SQLITE environment variable is set to 'true'
 *
 * Web and Capacitor platforms always return false (use Dexie/IndexedDB).
 */
export function shouldUseSQLite(): boolean {
  // SQLite only available in Electron (requires better-sqlite3 native bindings)
  if (!isElectron()) {
    return false;
  }

  // Check environment variable
  const useSqliteEnv = import.meta.env.VITE_USE_SQLITE;
  return useSqliteEnv === 'true';
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
 */
export function logBackendSelection(): void {
  const backend = getBackendType();
  const platform = getPlatform();
  console.log(`[DataService] Using backend: ${backend} (platform: ${platform})`);
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
