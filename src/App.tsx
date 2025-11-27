import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { AppShell } from './components/layout/AppShell';
import { dataCleanupService } from './services/dataCleanupService';
import { licenseManager, type LicenseState } from './services/licenseManager';
import { ActivationScreen } from './components/licensing/ActivationScreen';
import { initializeDatabase } from './db/schema';

// NOTE: Database clearing disabled to preserve license key during development
// To manually clear the database, use DevTools > Application > IndexedDB > Delete 'mango_biz_store_app'
// if (import.meta.env.DEV) {
//   indexedDB.deleteDatabase('mango_biz_store_app');
//   console.log('✅ IndexedDB cleared - using fresh mock data with lastVisitDate');
// }

export function App() {
  const [licenseState, setLicenseState] = useState<LicenseState | null>(null);
  const [isLicenseChecked, setIsLicenseChecked] = useState(false);

  useEffect(() => {
    // Initialize database first, then license manager
    async function initializeLicense() {
      console.log('🔐 Initializing database and checking license...');

      try {
        // Initialize database FIRST (required for license manager to read settings)
        const dbReady = await initializeDatabase();
        if (!dbReady) {
          console.error('Failed to initialize database');
          setIsLicenseChecked(true);
          return;
        }
        console.log('✅ Database initialized');

        // Now check license
        const state = await licenseManager.initialize();
        setLicenseState(state);

        // Subscribe to license changes
        const unsubscribe = licenseManager.subscribe((newState) => {
          setLicenseState(newState);
          // Ensure isLicenseChecked is true when we have a valid state
          if (newState.status !== 'checking') {
            setIsLicenseChecked(true);
          }
        });

        // Start background checks if operational
        if (state.status === 'active' || state.status === 'offline_grace') {
          licenseManager.startBackgroundChecks();
        }

        setIsLicenseChecked(true);

        return unsubscribe;
      } catch (error) {
        console.error('❌ License initialization failed:', error);
        setIsLicenseChecked(true);
      }
    }

    const cleanup = initializeLicense();

    return () => {
      cleanup?.then((unsubscribe) => unsubscribe?.());
      licenseManager.stopBackgroundChecks();
    };
  }, []);

  useEffect(() => {
    if (!isLicenseChecked || !licenseState) return;
    if (!licenseManager.isOperational()) return;

    // Run data cleanup on startup and schedule daily cleanup
    // Using hardcoded salonId for now - should come from auth context
    const salonId = 'salon_123';

    // Schedule automatic cleanup
    const cleanupInterval = dataCleanupService.scheduleAutoCleanup(salonId);

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
  }, [isLicenseChecked, licenseState]);

  // Show loading while checking license
  if (!isLicenseChecked || !licenseState) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mango POS</h2>
          <p className="text-gray-600">Checking license...</p>
        </div>
      </div>
    );
  }

  // Show activation screen if not operational
  if (licenseManager.isBlocked()) {
    return (
      <ActivationScreen
        initialState={licenseState}
        onActivated={() => {
          // Force re-check
          setIsLicenseChecked(false);
        }}
      />
    );
  }

  // Normal app flow
  return (
    <Provider store={store}>
      <AppShell />
      <Toaster
        position="top-right"
        toastOptions={{
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
        }}
      />
    </Provider>
  );
}