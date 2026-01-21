import { useEffect, useState, useCallback, useRef } from 'react';
import { Provider } from 'react-redux';
import { Toaster, toast } from 'react-hot-toast';
import { store } from './store';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { setUserContext, clearUserContext } from './services/monitoring/sentry';
import { dataCleanupService } from './services/dataCleanupService';
import { storeAuthManager, type StoreAuthState } from './services/storeAuthManager';
import { StoreLoginScreen } from './components/auth/StoreLoginScreen';
import { initializeDatabase } from './db/schema';
import { setStoreSession, setFullSession, setAvailableStores } from './store/slices/authSlice';
import { authService } from './services/supabase';
import { TooltipProvider } from './components/ui/tooltip';
import { SupabaseSyncProvider } from './providers/SupabaseSyncProvider';
import { ConflictNotificationProvider } from './providers/ConflictNotificationContext';
import { AuthProvider } from './providers/AuthProvider';
import { ForceLogoutAlert } from './components/auth/ForceLogoutAlert';
import { AuthCallback } from './components/auth/AuthCallback';
import { MigrationProgress, type MigrationProgressInfo } from './components/MigrationProgress';
import { isMigrationNeeded, runDataMigration } from './services/migrationService';
import { getSQLiteAdapter } from './services/sqliteServices';
import { cacheMigrationStatus } from './config/featureFlags';

// NOTE: Removed auto-deletion of IndexedDB - it was destroying session data after login
// If you need to clear the database, do it manually via browser DevTools
// or uncomment this code temporarily:
// if (import.meta.env.DEV) {
//   indexedDB.deleteDatabase('mango-pos-db');
//   console.log('✅ IndexedDB cleared');
// }

export function App() {
  const [authState, setAuthState] = useState<StoreAuthState | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [isMigrationComplete, setIsMigrationComplete] = useState(false);
  const [isAuthCallback, setIsAuthCallback] = useState(false);
  const migrationProgressRef = useRef<MigrationProgressInfo | null>(null);

  // Check if we're on the auth callback route (magic link return)
  useEffect(() => {
    const isCallback = window.location.pathname.includes('/auth/callback');
    setIsAuthCallback(isCallback);
  }, []);

  // Initialize database FIRST (before any other operations)
  useEffect(() => {
    async function initDB() {
      console.log('🗄️ Initializing database...');
      try {
        const dbReady = await initializeDatabase();
        if (dbReady) {
          console.log('✅ Database initialized successfully');

          // Check if SQLite migration is needed
          if (isMigrationNeeded()) {
            console.log('🔄 SQLite migration needed, showing migration modal...');
            setShowMigration(true);
          } else {
            setIsMigrationComplete(true);
          }

          setIsDbInitialized(true);
        } else {
          console.error('❌ Database initialization failed');
          setIsMigrationComplete(true); // Skip migration on DB init failure
          setIsDbInitialized(true); // Still set to true to prevent infinite loading
        }
      } catch (error) {
        console.error('❌ Database initialization error:', error);
        setIsMigrationComplete(true); // Skip migration on error
        setIsDbInitialized(true); // Still set to true to prevent infinite loading
      }
    }

    initDB();
  }, []);

  // Migration handlers
  const handleMigrationStart = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const sqliteDb = await getSQLiteAdapter();

      const result = await runDataMigration(sqliteDb, (info) => {
        migrationProgressRef.current = info;
        // Force re-render for progress updates (via MigrationProgress component)
      });

      if (result.success) {
        // Cache successful migration status for quick synchronous checks
        cacheMigrationStatus({
          completed: true,
          version: 1,
          migratedAt: new Date().toISOString(),
        });
        console.log('✅ Migration completed successfully');
        return { success: true };
      } else {
        console.error('❌ Migration failed:', result.errors);
        return { success: false, error: result.errors.join('; ') };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
      console.error('❌ Migration error:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  const handleMigrationSkip = useCallback(() => {
    console.log('⏭️ Migration skipped, continuing with IndexedDB');
    toast('Continuing with IndexedDB. You can migrate later from Settings.', {
      icon: '📢',
      duration: 5000,
    });
  }, []);

  const handleMigrationComplete = useCallback((success: boolean) => {
    setShowMigration(false);
    setIsMigrationComplete(true);
    if (success) {
      toast.success('Database migrated successfully!', { duration: 3000 });
    }
  }, []);

  // Initialize store auth manager (AFTER database and migration are ready)
  useEffect(() => {
    // Wait for database to be initialized and migration to complete first
    if (!isDbInitialized || !isMigrationComplete) {
      return;
    }

    async function initializeAuth() {
      console.log('🔐 Checking store authentication...');

      try {
        const state = await storeAuthManager.initialize();
        setAuthState(state);

        // CRITICAL: Sync restored auth state to Redux
        // This ensures components using Redux selectors (like TopHeaderBar) see the restored session
        if (state.status === 'active' && state.store) {
          console.log('🔄 Syncing restored auth state to Redux...');

          if (state.member) {
            // Full session (store + member)
            store.dispatch(setFullSession({
              store: {
                storeId: state.store.storeId,
                storeName: state.store.storeName,
                storeLoginId: state.store.storeLoginId,
                tenantId: state.store.tenantId,
                tier: state.store.tier || 'starter',
              },
              member: {
                memberId: state.member.memberId,
                memberName: state.member.memberName,
                firstName: state.member.firstName,
                lastName: state.member.lastName,
                email: state.member.email,
                role: state.member.role,
                avatarUrl: state.member.avatarUrl,
                permissions: state.member.permissions,
              },
            }));

            // Also restore available stores for store switching
            // Fetch from member's store_ids if available
            const memberSession = authService.getCurrentMember();
            if (memberSession?.storeIds && memberSession.storeIds.length > 1) {
              const availableStores = await Promise.all(
                memberSession.storeIds.map(async (storeId) => {
                  const storeDetails = await authService.getStoreById(storeId);
                  return storeDetails;
                })
              );
              const validStores = availableStores.filter((s): s is NonNullable<typeof s> => s !== null);
              if (validStores.length > 0) {
                store.dispatch(setAvailableStores(validStores));
              }
            }

            console.log('✅ Redux synced with full session (store + member)');
          } else {
            // Store-only session
            store.dispatch(setStoreSession({
              storeId: state.store.storeId,
              storeName: state.store.storeName,
              storeLoginId: state.store.storeLoginId,
              tenantId: state.store.tenantId,
              tier: state.store.tier || 'starter',
            }));
            console.log('✅ Redux synced with store session only');
          }
        }

        // Subscribe to auth state changes
        const unsubscribe = storeAuthManager.subscribe((newState) => {
          setAuthState(newState);
        });

        setIsAuthChecked(true);

        return unsubscribe;
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        setIsAuthChecked(true);
      }
    }

    const cleanup = initializeAuth();

    return () => {
      cleanup?.then((unsubscribe) => unsubscribe?.());
    };
  }, [isDbInitialized, isMigrationComplete]);

  // Set Sentry user context when auth state changes
  useEffect(() => {
    if (authState?.status === 'active' && authState.store) {
      setUserContext({
        id: authState.member?.memberId || authState.store.storeId,
        storeId: authState.store.storeId,
        storeName: authState.store.storeName,
        role: authState.member?.role,
      });
    } else {
      clearUserContext();
    }
  }, [authState]);

  // Data cleanup (only for authenticated mode)
  useEffect(() => {
    if (!isAuthChecked || !authState) return;
    if (!storeAuthManager.isOperational()) return;

    // Run data cleanup on startup and schedule daily cleanup
    // Use store ID from auth state
    const storeId = authState.store?.storeId || 'salon_123';

    // Schedule automatic cleanup
    const cleanupInterval = dataCleanupService.scheduleAutoCleanup(storeId);

    // Check database size on startup
    dataCleanupService.checkDatabaseSize().then(sizeInfo => {
      if (sizeInfo.warning) {
        console.warn(`Database using ${sizeInfo.percentUsed.toFixed(1)}% of available storage`);
      }
    });

    // Cleanup on unmount
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [isAuthChecked, authState]);

  // Toaster configuration
  const toasterConfig = {
    position: 'top-right' as const,
    toastOptions: {
      duration: 3000,
      style: {
        background: '#fff',
        color: '#374151',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      success: {
        iconTheme: {
          primary: '#10B981',
          secondary: '#fff',
        },
      },
      error: {
        iconTheme: {
          primary: '#EF4444',
          secondary: '#fff',
        },
      },
    },
  };

  // Show migration modal if migration is needed
  if (showMigration) {
    return (
      <MigrationProgress
        onStart={handleMigrationStart}
        onSkip={handleMigrationSkip}
        onComplete={handleMigrationComplete}
      />
    );
  }

  // Handle magic link callback route
  if (isAuthCallback) {
    return (
      <Provider store={store}>
        <AuthCallback
          onSuccess={() => {
            // Successfully authenticated via magic link
            // Re-initialize auth state and clear callback flag
            setIsAuthCallback(false);
            storeAuthManager.initialize().then((state) => {
              setAuthState(state);
            });
          }}
          onError={() => {
            // Clear callback flag on error so user can try again
            setIsAuthCallback(false);
          }}
        />
      </Provider>
    );
  }

  // Show loading while checking auth OR database OR migration
  if (!isDbInitialized || !isMigrationComplete || !isAuthChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mango POS</h2>
          <p className="text-gray-600">
            {!isDbInitialized
              ? 'Initializing database...'
              : !isMigrationComplete
                ? 'Preparing migration...'
                : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  // NOTE: Station heartbeats are published via usePosHeartbeat in PadConnectionIndicator
  // after login, so they use the correct station-specific topic
  if (storeAuthManager.isLoginRequired()) {
    return (
      <Provider store={store}>
        <StoreLoginScreen
          initialState={authState || undefined}
          onLoggedIn={() => {
            // Login successful - auth state will be updated by subscription
            // Just force a re-render by updating the state
            const currentState = storeAuthManager.getState();
            setAuthState(currentState);
          }}
        />
      </Provider>
    );
  }

  // Normal app flow
  // NOTE: Station heartbeats are published via usePosHeartbeat in PadConnectionIndicator
  // which uses the correct station-specific topic: salon/{storeId}/station/{stationId}/heartbeat
  return (
    <ErrorBoundary module="app">
      <Provider store={store}>
        <AuthProvider loginContext="member">
          <SupabaseSyncProvider autoSyncInterval={0} enableRealtime={true}>
            <ConflictNotificationProvider>
              <TooltipProvider>
                <AppShell />
                <ForceLogoutAlert />
                <Toaster {...toasterConfig} />
              </TooltipProvider>
            </ConflictNotificationProvider>
          </SupabaseSyncProvider>
        </AuthProvider>
      </Provider>
    </ErrorBoundary>
  );
}