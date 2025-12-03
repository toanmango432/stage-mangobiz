/**
 * React Hook for Supabase Sync
 * Provides easy access to sync state and operations in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseSyncService, SyncState, SyncableEntity, SyncResult } from './supabaseSyncService';

interface UseSupabaseSyncReturn {
  // State
  state: SyncState;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  error: string | null;

  // Actions
  syncAll: () => Promise<SyncResult>;
  syncEntity: (entity: SyncableEntity) => Promise<SyncResult>;
  initialize: (storeId: string) => Promise<void>;
  startAutoSync: (intervalMs?: number) => void;
  stopAutoSync: () => void;

  // Real-time
  subscribeToChanges: (
    callback: (payload: { entity: SyncableEntity; action: string; record: Record<string, unknown> }) => void
  ) => void;
  unsubscribeFromChanges: () => void;
}

/**
 * Hook to access Supabase sync functionality
 */
export function useSupabaseSync(): UseSupabaseSyncReturn {
  const [state, setState] = useState<SyncState>(supabaseSyncService.getState());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = supabaseSyncService.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  // Memoized actions
  const syncAll = useCallback(() => {
    return supabaseSyncService.syncAll();
  }, []);

  const syncEntity = useCallback((entity: SyncableEntity) => {
    return supabaseSyncService.syncEntity(entity);
  }, []);

  const initialize = useCallback((storeId: string) => {
    return supabaseSyncService.initialize(storeId);
  }, []);

  const startAutoSync = useCallback((intervalMs?: number) => {
    supabaseSyncService.startAutoSync(intervalMs);
  }, []);

  const stopAutoSync = useCallback(() => {
    supabaseSyncService.stopAutoSync();
  }, []);

  const subscribeToChanges = useCallback(
    (callback: (payload: { entity: SyncableEntity; action: string; record: Record<string, unknown> }) => void) => {
      supabaseSyncService.subscribeToChanges(callback);
    },
    []
  );

  const unsubscribeFromChanges = useCallback(() => {
    supabaseSyncService.unsubscribeFromChanges();
  }, []);

  return {
    // State
    state,
    isOnline: state.isOnline,
    isSyncing: state.status === 'syncing',
    lastSyncAt: state.lastSyncAt,
    pendingCount: state.pendingCount,
    error: state.error,

    // Actions
    syncAll,
    syncEntity,
    initialize,
    startAutoSync,
    stopAutoSync,

    // Real-time
    subscribeToChanges,
    unsubscribeFromChanges,
  };
}

/**
 * Hook to auto-initialize sync for a store
 */
export function useSupabaseSyncWithStore(storeId: string | null): UseSupabaseSyncReturn {
  const sync = useSupabaseSync();

  useEffect(() => {
    if (storeId) {
      sync.initialize(storeId);
    }
  }, [storeId]);

  return sync;
}

export default useSupabaseSync;
