/**
 * Data Service
 *
 * Provides a unified interface for data operations that automatically
 * routes to local IndexedDB or server API based on device mode.
 *
 * This is the key abstraction for the opt-in offline mode feature.
 * Components should use this service instead of directly accessing
 * database operations or API calls.
 */

import { store } from '@/store';
import { selectIsOfflineEnabled, selectDeviceMode } from '@/store/slices/authSlice';
import type { DeviceMode } from '@/types/device';

// ==================== TYPES ====================

export type DataSourceType = 'local' | 'server';

export interface DataServiceConfig {
  /** Force a specific data source */
  forceSource?: DataSourceType;
  /** Skip cache and fetch fresh data */
  skipCache?: boolean;
  /** Custom timeout for server requests */
  timeout?: number;
}

export interface DataResult<T> {
  data: T | null;
  source: DataSourceType;
  error?: string;
  cached?: boolean;
}

// ==================== HELPERS ====================

/**
 * Get current device mode from Redux store
 */
function getMode(): DeviceMode | null {
  const state = store.getState();
  return selectDeviceMode(state);
}

/**
 * Check if offline mode is enabled
 */
function isOfflineEnabled(): boolean {
  const state = store.getState();
  return selectIsOfflineEnabled(state);
}

/**
 * Check if browser is online
 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Determine which data source to use
 */
function getDataSource(config?: DataServiceConfig): DataSourceType {
  // Respect forced source
  if (config?.forceSource) {
    return config.forceSource;
  }

  const mode = getMode();
  const offlineEnabled = isOfflineEnabled();
  const online = isOnline();

  // Online-only mode: always use server
  if (!offlineEnabled || mode === 'online-only') {
    return 'server';
  }

  // Offline-enabled mode: use local when offline, prefer local when online
  if (!online) {
    return 'local';
  }

  // When online in offline-enabled mode, prefer local for reads (faster)
  return 'local';
}

// ==================== DATA SERVICE ====================

/**
 * Create a mode-aware data operation
 *
 * @param localFn - Function to execute for local database
 * @param serverFn - Function to execute for server API
 * @param config - Optional configuration
 */
export async function executeDataOperation<T>(
  localFn: () => Promise<T>,
  serverFn: () => Promise<T>,
  config?: DataServiceConfig
): Promise<DataResult<T>> {
  const source = getDataSource(config);

  try {
    if (source === 'local') {
      const data = await localFn();
      return { data, source: 'local' };
    } else {
      const data = await serverFn();
      return { data, source: 'server' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // If server fails and we have offline capability, fallback to local
    if (source === 'server' && isOfflineEnabled() && getMode() === 'offline-enabled') {
      console.warn('[DataService] Server failed, falling back to local:', message);
      try {
        const data = await localFn();
        return { data, source: 'local', cached: true };
      } catch (localError) {
        return { data: null, source: 'local', error: message };
      }
    }

    return { data: null, source, error: message };
  }
}

/**
 * Execute a write operation with proper sync handling
 *
 * For offline-enabled mode:
 * - Writes to local database immediately
 * - Queues for sync with server
 *
 * For online-only mode:
 * - Writes directly to server
 */
export async function executeWriteOperation<T>(
  localFn: () => Promise<T>,
  serverFn: () => Promise<T>,
  syncQueueFn?: () => Promise<void>,
  _config?: DataServiceConfig
): Promise<DataResult<T>> {
  const mode = getMode();
  const offlineEnabled = isOfflineEnabled();
  const online = isOnline();

  // Online-only mode: write directly to server
  if (!offlineEnabled || mode === 'online-only') {
    if (!online) {
      return {
        data: null,
        source: 'server',
        error: 'Cannot save changes while offline. Please check your internet connection.',
      };
    }

    try {
      const data = await serverFn();
      return { data, source: 'server' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      return { data: null, source: 'server', error: message };
    }
  }

  // Offline-enabled mode: write to local, queue for sync
  try {
    const data = await localFn();

    // Queue for sync if online and sync function provided
    if (online && syncQueueFn) {
      try {
        await syncQueueFn();
      } catch (syncError) {
        console.warn('[DataService] Failed to queue sync:', syncError);
        // Don't fail the operation, sync will retry later
      }
    }

    return { data, source: 'local' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save locally';
    return { data: null, source: 'local', error: message };
  }
}

// ==================== CONVENIENCE WRAPPERS ====================

/**
 * Check if local database should be used for the current operation
 */
export function shouldUseLocalDB(): boolean {
  return getDataSource() === 'local';
}

/**
 * Check if server should be used for the current operation
 */
export function shouldUseServer(): boolean {
  return getDataSource() === 'server';
}

/**
 * Check if sync operations should run
 */
export function shouldSync(): boolean {
  const offlineEnabled = isOfflineEnabled();
  const online = isOnline();
  return offlineEnabled && online;
}

/**
 * Get current mode info for debugging/logging
 */
export function getModeInfo(): {
  mode: DeviceMode | null;
  offlineEnabled: boolean;
  online: boolean;
  dataSource: DataSourceType;
} {
  return {
    mode: getMode(),
    offlineEnabled: isOfflineEnabled(),
    online: isOnline(),
    dataSource: getDataSource(),
  };
}

// ==================== EXPORTS ====================

export const dataService = {
  execute: executeDataOperation,
  write: executeWriteOperation,
  shouldUseLocalDB,
  shouldUseServer,
  shouldSync,
  getModeInfo,
  getDataSource,
};

export default dataService;
