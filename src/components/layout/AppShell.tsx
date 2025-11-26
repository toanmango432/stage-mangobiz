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
import { HeaderColorPreview } from '../HeaderColorPreview';
import { TicketColorPreview } from '../TicketColorPreview';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectPendingTickets } from '../../store/slices/uiTicketsSlice';
import { fetchAllStaff } from '../../store/slices/staffSlice';
import { addLocalAppointment } from '../../store/slices/appointmentsSlice';
import { setOnlineStatus } from '../../store/slices/syncSlice';
import { initializeDatabase, db } from '../../db/schema';
import { seedDatabase, getTestSalonId } from '../../db/seed';
import { syncManager } from '../../services/syncManager';
import { NetworkStatus } from '../NetworkStatus';
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

        // 2. Check if we need to seed data (first run)
        const staffCount = await db.staff.count();
        if (staffCount === 0) {
          console.log('🌱 First run detected - seeding database...');
          await seedDatabase();
          console.log('✅ Database seeded');
        } else {
          console.log(`✅ Database already seeded (${staffCount} staff members)`);
        }

        // 3. Load staff into Redux
        await dispatch(fetchAllStaff(salonId));
        console.log('✅ Staff loaded into Redux');

        // 4. Load appointments into Redux
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

        // 5. Start sync manager
        syncManager.start();
        console.log('✅ Sync Manager started');

        // 6. Set initial online status
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
      case 'header-preview':
        return <HeaderColorPreview />;
      case 'ticket-preview':
        return <TicketColorPreview />;
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
      {/* Network Status Indicator */}
      <NetworkStatus />

      {/* Top Header - Always visible, but navigation hidden on mobile/tablet */}
      <TopHeaderBar
        onFrontDeskSettingsClick={activeModule === 'frontdesk' ? () => setShowFrontDeskSettings(true) : undefined}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        pendingCount={pendingCount}
        hideNavigation={showBottomNav}
      />

      {/* Main Content Area */}
      <main className={`relative flex-1 flex flex-col min-h-0 overflow-hidden pt-14 bg-white ${showBottomNav ? 'pb-[72px]' : ''}`}>
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
