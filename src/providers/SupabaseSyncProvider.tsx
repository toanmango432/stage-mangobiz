/**
 * Supabase Sync Provider
 *
 * Provides real-time sync capabilities to the app.
 * Initializes sync service when store is logged in and
 * handles real-time updates from Supabase.
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { supabaseSyncService, type SyncState, type SyncableEntity } from '@/services/supabase';
import { storeAuthManager } from '@/services/storeAuthManager';

// ==================== TYPES ====================

interface SupabaseSyncContextValue {
  /** Current sync state */
  syncState: SyncState;
  /** Whether currently syncing */
  isSyncing: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Trigger a manual sync */
  syncNow: () => Promise<void>;
  /** Last sync timestamp */
  lastSyncAt: string | null;
  /** Number of pending changes */
  pendingCount: number;
  /** Any sync error */
  error: string | null;
}

const defaultSyncState: SyncState = {
  status: 'idle',
  isOnline: true,
  lastSyncAt: null,
  pendingCount: 0,
  error: null,
};

const SupabaseSyncContext = createContext<SupabaseSyncContextValue>({
  syncState: defaultSyncState,
  isSyncing: false,
  isOnline: true,
  syncNow: async () => {},
  lastSyncAt: null,
  pendingCount: 0,
  error: null,
});

// ==================== PROVIDER ====================

interface SupabaseSyncProviderProps {
  children: ReactNode;
  /** Auto-sync interval in ms (default: 30000 = 30 seconds) */
  autoSyncInterval?: number;
  /** Enable real-time subscriptions (default: true) */
  enableRealtime?: boolean;
}

export function SupabaseSyncProvider({
  children,
  autoSyncInterval = 30000,
  enableRealtime = true,
}: SupabaseSyncProviderProps) {
  const dispatch = useDispatch();
  const [syncState, setSyncState] = useState<SyncState>(defaultSyncState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle real-time changes from Supabase
  const handleRealtimeChange = useCallback(
    (payload: { entity: SyncableEntity; action: string; record: Record<string, unknown> }) => {
      console.log(`📡 Real-time update: ${payload.entity} ${payload.action}`, payload.record);

      // Dispatch Redux actions based on entity type
      // This will be expanded as we integrate with more slices
      switch (payload.entity) {
        case 'clients':
          // TODO: Dispatch to clientsSlice when implemented
          // dispatch(clientsActions.handleRealtimeUpdate({ action: payload.action, data: payload.record }));
          break;
        case 'staff':
          // TODO: Dispatch to staffSlice when implemented
          // dispatch(staffActions.handleRealtimeUpdate({ action: payload.action, data: payload.record }));
          break;
        case 'appointments':
          // TODO: Dispatch to appointmentsSlice when implemented
          // dispatch(appointmentsActions.handleRealtimeUpdate({ action: payload.action, data: payload.record }));
          break;
        case 'tickets':
          // TODO: Dispatch to ticketsSlice when implemented
          // dispatch(ticketsActions.handleRealtimeUpdate({ action: payload.action, data: payload.record }));
          break;
        case 'services':
          // TODO: Dispatch to servicesSlice when implemented
          break;
        case 'transactions':
          // TODO: Dispatch to transactionsSlice when implemented
          break;
      }
    },
    [dispatch]
  );

  // Initialize sync service when store is logged in
  useEffect(() => {
    const authState = storeAuthManager.getState();
    const storeId = authState.store?.storeId;

    if (!storeId) {
      console.log('🔄 SupabaseSyncProvider: No store ID, skipping initialization');
      return;
    }

    const initSync = async () => {
      try {
        // Initialize sync service
        await supabaseSyncService.initialize(storeId);
        setIsInitialized(true);

        // Start auto-sync if interval provided
        if (autoSyncInterval > 0) {
          supabaseSyncService.startAutoSync(autoSyncInterval);
        }

        // Subscribe to real-time changes
        if (enableRealtime) {
          supabaseSyncService.subscribeToChanges(handleRealtimeChange);
        }

        console.log('✅ SupabaseSyncProvider: Initialized for store', storeId);
      } catch (error) {
        console.error('❌ SupabaseSyncProvider: Initialization failed', error);
      }
    };

    initSync();

    // Subscribe to sync state changes
    const unsubscribe = supabaseSyncService.subscribe((state) => {
      setSyncState(state);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      supabaseSyncService.stopAutoSync();
      supabaseSyncService.unsubscribeFromChanges();
    };
  }, [autoSyncInterval, enableRealtime, handleRealtimeChange]);

  // Re-initialize when auth state changes
  useEffect(() => {
    const unsubscribe = storeAuthManager.subscribe((authState) => {
      const storeId = authState.store?.storeId;

      if (storeId && !isInitialized) {
        // Store just logged in - initialize
        supabaseSyncService.initialize(storeId).then(() => {
          setIsInitialized(true);
          if (autoSyncInterval > 0) {
            supabaseSyncService.startAutoSync(autoSyncInterval);
          }
          if (enableRealtime) {
            supabaseSyncService.subscribeToChanges(handleRealtimeChange);
          }
        });
      } else if (!storeId && isInitialized) {
        // Store logged out - cleanup
        supabaseSyncService.destroy();
        setIsInitialized(false);
        setSyncState(defaultSyncState);
      }
    });

    return unsubscribe;
  }, [isInitialized, autoSyncInterval, enableRealtime, handleRealtimeChange]);

  // Manual sync function
  const syncNow = useCallback(async () => {
    if (!isInitialized) {
      console.warn('🔄 Cannot sync: Not initialized');
      return;
    }
    await supabaseSyncService.syncAll();
  }, [isInitialized]);

  const contextValue: SupabaseSyncContextValue = {
    syncState,
    isSyncing: syncState.status === 'syncing',
    isOnline: syncState.isOnline,
    syncNow,
    lastSyncAt: syncState.lastSyncAt,
    pendingCount: syncState.pendingCount,
    error: syncState.error,
  };

  return (
    <SupabaseSyncContext.Provider value={contextValue}>
      {children}
    </SupabaseSyncContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * Hook to access sync state and controls
 */
export function useSupabaseSync() {
  const context = useContext(SupabaseSyncContext);
  if (!context) {
    throw new Error('useSupabaseSync must be used within a SupabaseSyncProvider');
  }
  return context;
}

export default SupabaseSyncProvider;
