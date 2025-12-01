import { useState, useEffect } from 'react';
import { TopHeaderBar } from './TopHeaderBar';
import { BottomNavBar } from './BottomNavBar';
import { Book } from '../modules/Book';
import { FrontDesk } from '../modules/FrontDesk';
import { Tickets } from '../modules/Tickets';
import { Team } from '../modules/Team';
import { Pending } from '../modules/Pending';
import { Checkout } from '../modules/Checkout';
import { Sales } from '../modules/Sales';
import { More } from '../modules/More';
import { Schedule } from '../modules/Schedule';
import { HeaderColorPreview } from '../HeaderColorPreview';
import { TicketColorPreview } from '../TicketColorPreview';
import { LicenseSettings } from '../licensing/LicenseSettings';
import { MenuSettings } from '../menu-settings';
import { TeamSettings } from '../team-settings';
import { RoleSettings } from '../role-settings';
import { DeviceSettings } from '../device';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectPendingTickets } from '../../store/slices/uiTicketsSlice';
import { fetchAllStaff } from '../../store/slices/staffSlice';
import { addLocalAppointment } from '../../store/slices/appointmentsSlice';
import { setOnlineStatus } from '../../store/slices/syncSlice';
import {
  loadFrontDeskSettings,
  setSettings,
  subscribeToSettingsChanges,
} from '../../store/slices/frontDeskSettingsSlice';
import { initializeDatabase, db } from '../../db/schema';
import { seedDatabase, getTestSalonId } from '../../db/seed';
import { initializeCatalog } from '../../db/catalogSeed';
import { syncManager } from '../../services/syncManager';
import { NetworkStatus } from '../NetworkStatus';
import { LicenseBanner } from '../licensing/LicenseBanner';
import { defaultsPopulator } from '../../services/defaultsPopulator';
import { useBreakpoint } from '../../hooks/useMobileModal';

export function AppShell() {
  // Mobile/tablet detection for responsive navigation
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const showBottomNav = isMobile || isTablet;

  // Set appropriate default module based on device
  // Mobile/tablet: default to 'team' since 'frontdesk' is not available
  // Desktop: default to 'frontdesk'
  const [activeModule, setActiveModule] = useState(() => {
    // Check initial window width to determine default
    return window.innerWidth < 1024 ? 'team' : 'frontdesk';
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFrontDeskSettings, setShowFrontDeskSettings] = useState(false);

  // Handle module switch when device type changes (e.g., resize)
  useEffect(() => {
    // If on mobile/tablet and activeModule is 'frontdesk', switch to 'team'
    if (showBottomNav && activeModule === 'frontdesk') {
      setActiveModule('team');
    }
    // If on desktop and activeModule is 'team' or 'tickets', switch to 'frontdesk'
    if (isDesktop && (activeModule === 'team' || activeModule === 'tickets')) {
      setActiveModule('frontdesk');
    }
  }, [showBottomNav, isDesktop, activeModule]);

  // PERFORMANCE: Use direct Redux selector for pending count to avoid unnecessary re-renders
  const pendingTickets = useAppSelector(selectPendingTickets);
  const pendingCount = pendingTickets.length;

  const dispatch = useAppDispatch();
  const salonId = getTestSalonId();

  // Initialize database and sync manager on app load
  useEffect(() => {
    async function initApp() {
      try {
        console.log('🚀 Initializing Mango POS...');

        // 1. Initialize IndexedDB
        const dbReady = await initializeDatabase();
        if (!dbReady) {
          console.error('Failed to initialize database');
          return;
        }
        console.log('✅ Database initialized');

        // 2. Apply defaults from license (first-time setup)
        try {
          await defaultsPopulator.applyDefaults(salonId);
        } catch (error) {
          console.error('⚠️ Failed to apply defaults:', error);
        }

        // 3. Check if we need to seed data (first run)
        const staffCount = await db.staff.count();
        if (staffCount === 0) {
          console.log('🌱 First run detected - seeding database...');
          await seedDatabase();
          console.log('✅ Database seeded');
        } else {
          console.log(`✅ Database already seeded (${staffCount} staff members)`);
        }

        // 3b. Initialize catalog (migrate legacy services or seed if empty)
        try {
          const catalogResult = await initializeCatalog(salonId, true);
          console.log(`✅ Catalog initialized: ${catalogResult.action}`, catalogResult.details);
        } catch (error) {
          console.error('⚠️ Failed to initialize catalog:', error);
        }

        // 4. Load staff into Redux
        await dispatch(fetchAllStaff(salonId));
        console.log('✅ Staff loaded into Redux');

        // 5. Load appointments into Redux
        const appointments = await db.appointments.toArray();
        appointments.forEach((apt: any) => {
          dispatch(addLocalAppointment({
            ...apt,
            scheduledStartTime: new Date(apt.scheduledStartTime),
            scheduledEndTime: new Date(apt.scheduledEndTime),
            actualStartTime: apt.actualStartTime ? new Date(apt.actualStartTime) : undefined,
            actualEndTime: apt.actualEndTime ? new Date(apt.actualEndTime) : undefined,
            checkInTime: apt.checkInTime ? new Date(apt.checkInTime) : undefined,
            createdAt: new Date(apt.createdAt),
            updatedAt: new Date(apt.updatedAt),
          }));
        });
        console.log(`✅ Loaded ${appointments.length} appointments into Redux`);


        // 6. Load front desk settings from IndexedDB (per-user)
        await dispatch(loadFrontDeskSettings());
        console.log('✅ Front desk settings loaded');

        // 7. Start sync manager
        syncManager.start();
        console.log('✅ Sync Manager started');

        // 8. Set initial online status
        dispatch(setOnlineStatus(navigator.onLine));

        setIsInitialized(true);
        console.log('🎉 App initialization complete!');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    }

    initApp();

    // Cleanup on unmount
    return () => {
      syncManager.stop();
      console.log('🛑 Sync Manager stopped');
    };
  }, [dispatch, salonId]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Cross-tab sync for front desk settings
  useEffect(() => {
    // Subscribe to settings changes from other tabs
    const unsubscribe = subscribeToSettingsChanges((newSettings) => {
      console.log('📡 Settings updated from another tab');
      dispatch(setSettings(newSettings));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const renderModule = () => {
    switch (activeModule) {
      case 'book':
        return <Book />;
      case 'frontdesk':
        return <FrontDesk showFrontDeskSettings={showFrontDeskSettings} setShowFrontDeskSettings={setShowFrontDeskSettings} />;
      case 'tickets':
        return <Tickets />;
      case 'team':
        return <Team />;
      case 'pending':
        return <Pending />;
      case 'checkout':
        return <Checkout />;
      case 'sales':
        return <Sales />;
      case 'more':
        return <More onNavigate={setActiveModule} />;
      case 'schedule':
        return <Schedule />;
      case 'category':
        return <MenuSettings onBack={() => setActiveModule('more')} />;
      case 'license':
        return <LicenseSettings />;
      case 'header-preview':
        return <HeaderColorPreview />;
      case 'ticket-preview':
        return <TicketColorPreview />;
      case 'team-settings':
        return <TeamSettings onBack={() => setActiveModule('more')} />;
      case 'role-settings':
        return <RoleSettings onBack={() => setActiveModule('more')} />;
      case 'frontdesk-settings':
        return <FrontDesk showFrontDeskSettings={true} setShowFrontDeskSettings={(show) => {
          if (!show) setActiveModule('more');
        }} />;
      case 'devices':
        return <DeviceSettings onBack={() => setActiveModule('more')} />;
      default:
        return <FrontDesk />;
    }
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mango POS</h2>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* License Status Banner */}
      <LicenseBanner />

      {/* Network Status Indicator */}
      <NetworkStatus />

      {/* Top Header - Always visible, but navigation hidden on mobile/tablet */}
      <TopHeaderBar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        pendingCount={pendingCount}
        hideNavigation={showBottomNav}
      />

      {/* Main Content Area - responsive padding for header height (h-12 mobile, h-16 desktop) */}
      <main className={`relative flex-1 flex flex-col min-h-0 overflow-hidden pt-12 md:pt-16 bg-white ${showBottomNav ? 'pb-[68px] sm:pb-[72px]' : ''}`}>
        {renderModule()}
      </main>

      {/* Bottom Navigation - Only on mobile and tablet */}
      {showBottomNav && (
        <BottomNavBar
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          pendingCount={pendingCount}
        />
      )}
    </div>
  );
}
