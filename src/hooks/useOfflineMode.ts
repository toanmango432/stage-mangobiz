/**
 * useOfflineMode Hook
 *
 * Provides mode-aware data fetching and operations.
 * Automatically routes to local DB or API based on device mode.
 */

import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectIsOfflineEnabled, selectDeviceMode } from '@/store/slices/authSlice';
import type { DeviceMode } from '@/types/device';

// ==================== TYPES ====================

export interface OfflineModeState {
  /** Current device mode */
  mode: DeviceMode | null;

  /** Whether offline storage is enabled */
  isOfflineEnabled: boolean;

  /** Whether the device is currently online (network connectivity) */
  isOnline: boolean;

  /** Whether to use local database for operations */
  shouldUseLocalDB: boolean;

  /** Whether to sync with server */
  shouldSync: boolean;
}

export interface DataSource {
  /** Where to read data from */
  read: 'local' | 'server' | 'both';
  /** Where to write data to */
  write: 'local' | 'server' | 'both';
  /** Priority for reads when both are available */
  readPriority: 'local-first' | 'server-first';
}

// ==================== HOOK ====================

/**
 * Hook for determining data source based on device mode
 */
export function useOfflineMode(): OfflineModeState & { getDataSource: () => DataSource } {
  const mode = useSelector(selectDeviceMode);
  const isOfflineEnabled = useSelector(selectIsOfflineEnabled);

  // Track network connectivity
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Determine if we should use local database
  const shouldUseLocalDB = useMemo(() => {
    // Only use local DB if offline mode is enabled
    if (!isOfflineEnabled || mode !== 'offline-enabled') {
      return false;
    }
    return true;
  }, [isOfflineEnabled, mode]);

  // Determine if we should sync
  const shouldSync = useMemo(() => {
    // Only sync if offline-enabled and online
    return isOfflineEnabled && isOnline;
  }, [isOfflineEnabled, isOnline]);

  // Get data source configuration
  const getDataSource = useCallback((): DataSource => {
    // Online-only mode: always use server
    if (!isOfflineEnabled || mode === 'online-only') {
      return {
        read: 'server',
        write: 'server',
        readPriority: 'server-first',
      };
    }

    // Offline-enabled mode
    if (isOnline) {
      // When online: read from local first (faster), write to both
      return {
        read: 'both',
        write: 'both',
        readPriority: 'local-first',
      };
    } else {
      // When offline: only use local
      return {
        read: 'local',
        write: 'local',
        readPriority: 'local-first',
      };
    }
  }, [mode, isOfflineEnabled, isOnline]);

  return {
    mode,
    isOfflineEnabled,
    isOnline,
    shouldUseLocalDB,
    shouldSync,
    getDataSource,
  };
}

// ==================== HELPER HOOKS ====================

/**
 * Hook that returns true only when using online-only mode
 */
export function useIsOnlineOnly(): boolean {
  const { mode, isOfflineEnabled } = useOfflineMode();
  return !isOfflineEnabled || mode === 'online-only';
}

/**
 * Hook that returns true when local database should be used
 */
export function useShouldUseLocalDB(): boolean {
  const { shouldUseLocalDB } = useOfflineMode();
  return shouldUseLocalDB;
}

/**
 * Hook for getting network status with mode context
 */
export function useNetworkStatus(): { isOnline: boolean; canOperate: boolean } {
  const { isOnline, isOfflineEnabled } = useOfflineMode();

  // Can always operate in offline-enabled mode (uses local DB)
  // Can only operate in online-only mode when online
  const canOperate = isOfflineEnabled || isOnline;

  return { isOnline, canOperate };
}
