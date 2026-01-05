/**
 * Mode Context
 *
 * Provides device mode state (online-only vs offline-enabled) to the app.
 * Determines whether IndexedDB should be initialized and used.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectDevice,
  selectIsOfflineEnabled,
  selectDeviceMode,
  updateDeviceMode,
  clearDevice,
} from '@/store/slices/authSlice';
import { revocationChecker, clearLocalData, hasPendingData } from '@/services/revocationChecker';
import type { DeviceMode } from '@/types/device';
import type { AppDispatch } from '@/store';

// ==================== TYPES ====================

interface ModeContextValue {
  /** Current device mode */
  mode: DeviceMode | null;

  /** Whether offline features are enabled */
  isOfflineEnabled: boolean;

  /** Whether IndexedDB is initialized and available */
  isDbReady: boolean;

  /** Whether currently initializing */
  isInitializing: boolean;

  /** Error during initialization */
  error: string | null;

  /** Check if there's pending unsynced data */
  checkPendingData: () => Promise<{ hasPending: boolean; count: number }>;

  /** Switch device mode (requires user confirmation for data clearing) */
  switchMode: (newMode: DeviceMode) => Promise<{ success: boolean; error?: string }>;

  /** Reinitialize after mode change */
  reinitialize: () => Promise<void>;
}

const ModeContext = createContext<ModeContextValue | null>(null);

// ==================== PROVIDER ====================

interface ModeProviderProps {
  children: ReactNode;
}

export function ModeProvider({ children }: ModeProviderProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const device = useSelector(selectDevice);
  const isOfflineEnabled = useSelector(selectIsOfflineEnabled);
  const mode = useSelector(selectDeviceMode);

  // Local state
  const [isDbReady, setIsDbReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    async function initialize() {
      setIsInitializing(true);
      setError(null);

      try {
        // Only initialize database if offline mode is enabled
        if (isOfflineEnabled && mode === 'offline-enabled') {
          // Dynamic import to avoid loading Dexie in online-only mode
          const { initializeDatabase } = await import('@/db/schema');
          const success = await initializeDatabase();

          if (!success) {
            throw new Error('Failed to initialize offline database');
          }

          setIsDbReady(true);
          console.log('[ModeContext] Database initialized for offline mode');
        } else {
          // Online-only mode - no database needed
          setIsDbReady(false);
          console.log('[ModeContext] Running in online-only mode (no local database)');
        }

        // Start revocation checker if we have a device
        if (device?.id) {
          revocationChecker.start(device.id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown initialization error';
        console.error('[ModeContext] Initialization error:', message);
        setError(message);
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();

    // Cleanup revocation checker on unmount
    return () => {
      revocationChecker.stop();
    };
  }, [device?.id, isOfflineEnabled, mode]);

  // ==================== REVOCATION HANDLING ====================

  useEffect(() => {
    // Subscribe to revocation events
    const unsubscribe = revocationChecker.onRevocation(async (event) => {
      console.warn('[ModeContext] Device revoked:', event);

      // Clear local data
      await clearLocalData();

      // Clear device state
      dispatch(clearDevice());

      // Reset database ready state
      setIsDbReady(false);

      // The app should show a logout/reauth screen
      // This is handled by auth state changes in Redux
    });

    return unsubscribe;
  }, [dispatch]);

  // ==================== ACTIONS ====================

  const checkPendingData = useCallback(async () => {
    if (!isDbReady) {
      return { hasPending: false, count: 0 };
    }
    return hasPendingData();
  }, [isDbReady]);

  const switchMode = useCallback(async (newMode: DeviceMode): Promise<{ success: boolean; error?: string }> => {
    try {
      // If switching from offline to online, check for pending data
      if (mode === 'offline-enabled' && newMode === 'online-only') {
        const { hasPending, count } = await hasPendingData();

        if (hasPending) {
          return {
            success: false,
            error: `Cannot switch to online-only mode. You have ${count} pending changes that need to sync first.`,
          };
        }

        // Clear local data before switching
        await clearLocalData();
        setIsDbReady(false);
      }

      // Update device mode in Redux
      dispatch(updateDeviceMode(newMode));

      // If switching to offline mode, we need to reinitialize
      if (newMode === 'offline-enabled') {
        setIsInitializing(true);
        const { initializeDatabase } = await import('@/db/schema');
        const success = await initializeDatabase();

        if (!success) {
          return { success: false, error: 'Failed to initialize offline database' };
        }

        setIsDbReady(true);
        setIsInitializing(false);
      }

      console.log(`[ModeContext] Mode switched to ${newMode}`);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch mode';
      console.error('[ModeContext] Switch mode error:', message);
      return { success: false, error: message };
    }
  }, [mode, dispatch]);

  const reinitialize = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      if (isOfflineEnabled) {
        const { initializeDatabase } = await import('@/db/schema');
        const success = await initializeDatabase();
        setIsDbReady(success);

        if (!success) {
          setError('Failed to reinitialize database');
        }
      } else {
        setIsDbReady(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reinitialize error';
      setError(message);
    } finally {
      setIsInitializing(false);
    }
  }, [isOfflineEnabled]);

  // ==================== CONTEXT VALUE ====================

  const value = useMemo<ModeContextValue>(() => ({
    mode,
    isOfflineEnabled,
    isDbReady,
    isInitializing,
    error,
    checkPendingData,
    switchMode,
    reinitialize,
  }), [mode, isOfflineEnabled, isDbReady, isInitializing, error, checkPendingData, switchMode, reinitialize]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

// ==================== HOOKS ====================

/**
 * Access mode context
 */
export function useModeContext(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useModeContext must be used within a ModeProvider');
  }
  return context;
}

/**
 * Check if offline features are available
 */
export function useIsOffline(): boolean {
  const { isOfflineEnabled, isDbReady } = useModeContext();
  return isOfflineEnabled && isDbReady;
}

/**
 * Get device mode
 */
export function useDeviceMode(): DeviceMode | null {
  const { mode } = useModeContext();
  return mode;
}
