/**
 * useSync Hook
 * React hook for offline/online synchronization
 *
 * LOCAL-FIRST: All devices are always offline-enabled.
 * Sync happens in background, never blocks UI.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { syncService, SyncStatus } from '../services/syncService';
import {
  selectIsOnline,
  selectIsSyncing,
  selectPendingOperations,
  selectLastSyncAt,
  selectSyncEnabled,
  selectSyncDisabledReason,
  selectShouldSync,
} from '../store/slices/syncSlice';
import { selectIsOfflineEnabled, selectDeviceMode } from '../store/slices/authSlice';

/**
 * Basic sync hook (legacy compatibility)
 */
export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncService.subscribe(setStatus);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    syncNow: () => syncService.syncNow(),
  };
}

/**
 * Mode-aware sync hook
 * Provides complete sync status including offline mode info
 */
export function useModeAwareSync() {
  // Redux state
  const isOnline = useSelector(selectIsOnline);
  const isSyncing = useSelector(selectIsSyncing);
  const pendingOperations = useSelector(selectPendingOperations);
  const lastSyncAt = useSelector(selectLastSyncAt);
  const syncEnabled = useSelector(selectSyncEnabled);
  const syncDisabledReason = useSelector(selectSyncDisabledReason);
  const shouldSync = useSelector(selectShouldSync);

  // Device mode state
  const isOfflineEnabled = useSelector(selectIsOfflineEnabled);
  const deviceMode = useSelector(selectDeviceMode);

  // Sync action
  const syncNow = useCallback(async () => {
    if (!syncEnabled) {
      console.warn('[useModeAwareSync] Sync not enabled for this device');
      return { success: false, error: syncDisabledReason || 'Sync not enabled' };
    }
    return syncService.syncNow();
  }, [syncEnabled, syncDisabledReason]);

  return {
    // Network status
    isOnline,
    isSyncing,

    // Sync status
    syncEnabled,
    syncDisabledReason,
    shouldSync,
    pendingOperations,
    lastSyncAt,

    // Device mode
    isOfflineEnabled,
    deviceMode,

    // Actions
    syncNow,

    // Computed
    /** Whether device can work offline - LOCAL-FIRST: Always true */
    canWorkOffline: true,
    /** Whether device needs to sync pending changes */
    hasPendingSync: pendingOperations > 0,
    /** Status message for UI */
    statusMessage: getStatusMessage({
      isOnline,
      isSyncing,
      syncEnabled,
      pendingOperations,
      deviceMode,
    }),
  };
}

/**
 * Get human-readable status message
 * LOCAL-FIRST: Simplified for always-offline-first architecture
 */
function getStatusMessage(params: {
  isOnline: boolean;
  isSyncing: boolean;
  syncEnabled: boolean;
  pendingOperations: number;
  deviceMode: string | null;
}): string {
  const { isOnline, isSyncing, pendingOperations } = params;

  if (!isOnline) {
    return pendingOperations > 0
      ? `Offline - ${pendingOperations} changes pending`
      : 'Offline - changes will sync when online';
  }

  if (isSyncing) {
    return 'Syncing...';
  }

  if (pendingOperations > 0) {
    return `${pendingOperations} changes pending sync`;
  }

  return 'All changes synced';
}

/**
 * Hook for checking if device can operate
 * LOCAL-FIRST: Always returns true - all devices can work offline
 */
export function useCanOperate(): { canOperate: boolean; reason: string | null } {
  // LOCAL-FIRST: All devices can always operate
  return { canOperate: true, reason: null };
}
