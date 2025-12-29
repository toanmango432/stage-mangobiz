/**
 * Supabase Sync Provider
 *
 * LOCAL-FIRST: Provides real-time sync capabilities to the app.
 * - Initializes sync service when store is logged in
 * - Triggers initial data hydration on first login
 * - Handles real-time updates from Supabase
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { supabaseSyncService, type SyncState, type SyncableEntity } from '@/services/supabase';
import { storeAuthManager } from '@/services/storeAuthManager';
import { hydrationService, type HydrationProgress } from '@/services/hydrationService';
import { backgroundSyncService, type BackgroundSyncState } from '@/services/backgroundSyncService';
import { searchService } from '@/services/search';

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
  /** LOCAL-FIRST: Hydration state */
  isHydrating: boolean;
  /** LOCAL-FIRST: Hydration progress */
  hydrationProgress: HydrationProgress | null;
  /** LOCAL-FIRST: Background sync state */
  backgroundSyncState: BackgroundSyncState | null;
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
  isHydrating: false,
  hydrationProgress: null,
  backgroundSyncState: null,
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
  // LOCAL-FIRST: Hydration state
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationProgress, setHydrationProgress] = useState<HydrationProgress | null>(null);
  // LOCAL-FIRST: Background sync state
  const [bgSyncState, setBgSyncState] = useState<BackgroundSyncState | null>(null);

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

        // LOCAL-FIRST: Check if hydration is needed
        const needsHydration = await hydrationService.needsHydration(storeId);
        if (needsHydration && navigator.onLine) {
          console.log('💧 SupabaseSyncProvider: Starting initial hydration...');
          setIsHydrating(true);

          const result = await hydrationService.hydrateStore(storeId, (progress) => {
            setHydrationProgress(progress);
            console.log(`💧 Hydration: ${progress.message} (${progress.current}/${progress.total})`);
          });

          setIsHydrating(false);
          if (result.success) {
            console.log('✅ SupabaseSyncProvider: Hydration complete');
            // Build search index after hydration
            console.log('🔍 SupabaseSyncProvider: Building search index...');
            await searchService.initializeSearchIndex(storeId);
            console.log('✅ SupabaseSyncProvider: Search index ready');
          } else {
            console.warn('⚠️ SupabaseSyncProvider: Hydration failed:', result.error);
          }
        } else {
          // No hydration needed, build search index from existing local data
          console.log('🔍 SupabaseSyncProvider: Building search index from local data...');
          await searchService.initializeSearchIndex(storeId);
          console.log('✅ SupabaseSyncProvider: Search index ready');
        }

        // LOCAL-FIRST: Start background sync service
        backgroundSyncService.start();
        backgroundSyncService.subscribe(setBgSyncState);
        console.log('🔄 SupabaseSyncProvider: Background sync started');

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
        setIsHydrating(false);
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
      backgroundSyncService.stop();
    };
  }, [autoSyncInterval, enableRealtime, handleRealtimeChange]);

  // Re-initialize when auth state changes
  useEffect(() => {
    const unsubscribe = storeAuthManager.subscribe(async (authState) => {
      const storeId = authState.store?.storeId;

      if (storeId && !isInitialized) {
        // Store just logged in - initialize
        try {
          await supabaseSyncService.initialize(storeId);
          setIsInitialized(true);

          // LOCAL-FIRST: Check if hydration is needed
          const needsHydration = await hydrationService.needsHydration(storeId);
          if (needsHydration && navigator.onLine) {
            console.log('💧 Auth change: Starting initial hydration...');
            setIsHydrating(true);

            const result = await hydrationService.hydrateStore(storeId, (progress) => {
              setHydrationProgress(progress);
            });

            setIsHydrating(false);
            if (result.success) {
              // Build search index after hydration
              console.log('🔍 Auth change: Building search index...');
              await searchService.initializeSearchIndex(storeId);
              console.log('✅ Auth change: Search index ready');
            } else {
              console.warn('⚠️ Auth change: Hydration failed:', result.error);
            }
          } else {
            // No hydration needed, build search index from existing local data
            console.log('🔍 Auth change: Building search index from local data...');
            await searchService.initializeSearchIndex(storeId);
            console.log('✅ Auth change: Search index ready');
          }

          // LOCAL-FIRST: Start background sync service
          backgroundSyncService.start();
          backgroundSyncService.subscribe(setBgSyncState);

          if (autoSyncInterval > 0) {
            supabaseSyncService.startAutoSync(autoSyncInterval);
          }
          if (enableRealtime) {
            supabaseSyncService.subscribeToChanges(handleRealtimeChange);
          }
        } catch (error) {
          console.error('❌ Auth change: Initialization failed', error);
          setIsHydrating(false);
        }
      } else if (!storeId && isInitialized) {
        // Store logged out - cleanup
        supabaseSyncService.destroy();
        hydrationService.abort();
        backgroundSyncService.stop();
        setIsInitialized(false);
        setIsHydrating(false);
        setHydrationProgress(null);
        setSyncState(defaultSyncState);
        setBgSyncState(null);
      }
    });

    return unsubscribe;
  }, [isInitialized, autoSyncInterval, enableRealtime, handleRealtimeChange]);

  // Manual sync function - triggers background sync
  const syncNow = useCallback(async () => {
    if (!isInitialized) {
      console.warn('🔄 Cannot sync: Not initialized');
      return;
    }
    // LOCAL-FIRST: Trigger background sync service
    backgroundSyncService.triggerSync();
    // Also trigger the Supabase sync for realtime
    await supabaseSyncService.syncAll();
  }, [isInitialized]);

  const contextValue: SupabaseSyncContextValue = {
    syncState,
    isSyncing: syncState.status === 'syncing' || (bgSyncState?.isSyncing ?? false),
    isOnline: syncState.isOnline,
    syncNow,
    lastSyncAt: bgSyncState?.stats.lastSyncAt?.toISOString() || syncState.lastSyncAt,
    pendingCount: bgSyncState?.stats.pending ?? syncState.pendingCount,
    error: bgSyncState?.error || syncState.error,
    // LOCAL-FIRST: Hydration state
    isHydrating,
    hydrationProgress,
    // LOCAL-FIRST: Background sync state
    backgroundSyncState: bgSyncState,
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
