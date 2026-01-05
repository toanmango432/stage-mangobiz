import { useState, useEffect, lazy, Suspense } from 'react';
import { TopHeaderBar } from './TopHeaderBar';
import { BottomNavBar } from './BottomNavBar';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import { useAuditContext } from '../../services/audit/auditLogger';
import type { StaffMember } from '../checkout/ServiceList';

// Lazy load ALL modules to reduce initial bundle size
// Core modules (frequently used but still lazy for faster initial load)
const Book = lazy(() => import('../modules/Book').then(m => ({ default: m.Book })));
const FrontDesk = lazy(() => import('../modules/FrontDesk').then(m => ({ default: m.FrontDesk })));
const Tickets = lazy(() => import('../modules/Tickets').then(m => ({ default: m.Tickets })));
const Team = lazy(() => import('../modules/Team').then(m => ({ default: m.Team })));
const Pending = lazy(() => import('../modules/Pending').then(m => ({ default: m.Pending })));
const TicketPanel = lazy(() => import('../checkout/TicketPanel'));
const ClosedTickets = lazy(() => import('../modules/ClosedTickets').then(m => ({ default: m.ClosedTickets })));
const More = lazy(() => import('../modules/More').then(m => ({ default: m.More })));
import { TicketPanelProvider, useTicketPanel } from '../../contexts/TicketPanelContext';

// Lazy load less frequently used modules to reduce initial bundle size
const TransactionRecords = lazy(() => import('../modules/TransactionRecords').then(m => ({ default: m.TransactionRecords })));
const TodaysSales = lazy(() => import('../modules/TodaysSales').then(m => ({ default: m.TodaysSales })));
const Schedule = lazy(() => import('../modules/Schedule').then(m => ({ default: m.Schedule })));
const HeaderColorPreview = lazy(() => import('../HeaderColorPreview').then(m => ({ default: m.HeaderColorPreview })));
const TicketColorPreview = lazy(() => import('../TicketColorPreview').then(m => ({ default: m.TicketColorPreview })));
const LicenseSettings = lazy(() => import('../licensing/LicenseSettings').then(m => ({ default: m.LicenseSettings })));
const MenuSettings = lazy(() => import('../menu-settings').then(m => ({ default: m.MenuSettings })));
const TeamSettings = lazy(() => import('../team-settings').then(m => ({ default: m.TeamSettings })));
const RoleSettings = lazy(() => import('../role-settings').then(m => ({ default: m.RoleSettings })));
// DeviceSettings removed - local-first architecture, no device mode toggle needed
const ClientSettings = lazy(() => import('../client-settings').then(m => ({ default: m.ClientSettings })));
const StoreSettings = lazy(() => import('../modules/StoreSettings').then(m => ({ default: m.StoreSettings })));
const SettingsPage = lazy(() => import('../modules/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const StoreAuditViewer = lazy(() => import('../modules/settings/StoreAuditViewer'));
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectPendingTickets, loadTickets } from '../../store/slices/uiTicketsSlice';
import { fetchAllStaff } from '../../store/slices/staffSlice';
import { loadStaff as loadUIStaff } from '../../store/slices/uiStaffSlice';
import { fetchClientsFromSupabase } from '../../store/slices/clientsSlice';
import { addLocalAppointment } from '../../store/slices/appointmentsSlice';
import { setOnlineStatus } from '../../store/slices/syncSlice';
import { setStoreSession, setAuthStatus, AuthStatus } from '../../store/slices/authSlice';
import {
  loadFrontDeskSettings,
  setSettings,
  subscribeToSettingsChanges,
} from '../../store/slices/frontDeskSettingsSlice';
import { storeAuthManager } from '../../services/storeAuthManager';
import { initializeDatabase, db } from '../../db/schema';
import { seedDatabase, getTestSalonId } from '../../db/seed';
import { initializeCatalog } from '../../db/catalogSeed';
import { syncManager } from '../../services/syncManager';
import { teamDB } from '../../db/teamOperations';
import { mockTeamMembers } from '../team-settings/constants';
import { NetworkStatus } from '../NetworkStatus';
import { LicenseBanner } from '../licensing/LicenseBanner';
import { AnnouncementBanner } from '../AnnouncementBanner';
import { defaultsPopulator } from '../../services/defaultsPopulator';
import { useBreakpoint } from '../../hooks/useMobileModal';

// Main AppShell wraps with TicketPanelProvider
export function AppShell() {
  return (
    <TicketPanelProvider>
      <AppShellContent />
    </TicketPanelProvider>
  );
}

// Inner component that uses the context
function AppShellContent() {
  // Initialize audit context (sets user/store info for audit logging)
  useAuditContext();

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

  // Use the TicketPanelContext for ticket panel state
  const { isOpen: isTicketPanelOpen, openTicketPanel, closeTicketPanel } = useTicketPanel();

  // Get staff from Redux for TicketPanel
  const staffFromRedux = useAppSelector(selectAllStaff);
  const staffMembers: StaffMember[] = staffFromRedux.map(s => ({
    id: s.id,
    name: s.name,
    available: s.status === 'ready',
    specialty: s.specialty,
  }));

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

  // Listen for navigation events from child components (e.g., FrontDesk -> Checkout)
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const targetModule = event.detail;
      if (targetModule) {
        setActiveModule(targetModule);
      }
    };
    window.addEventListener('navigate-to-module', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate-to-module', handleNavigate as EventListener);
    };
  }, []);


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

        // 3. Check if we need to seed data (first run or force reseed)
        const staffCount = await db.staff.count();
        const clientCount = await db.clients.count();
        const forceReseed = localStorage.getItem('force-reseed-db');
        if (staffCount === 0 || clientCount === 0 || forceReseed === 'true') {
          console.log('🌱 Seeding database...', { staffCount, clientCount, forceReseed });
          // Clear existing data before reseeding
          if (forceReseed === 'true' || staffCount > 0) {
            console.log('🗑️ Clearing existing data for reseed...');
            await db.staff.clear();
            await db.clients.clear();
            await db.services.clear();
            await db.appointments.clear();
            localStorage.removeItem('force-reseed-db');
          }
          await seedDatabase();
          console.log('✅ Database seeded');
        } else {
          console.log(`✅ Database already seeded (${staffCount} staff, ${clientCount} clients)`);
        }

        // 3b. Initialize catalog (migrate legacy services or seed if empty)
        try {
          const catalogResult = await initializeCatalog(salonId, true);
          console.log(`✅ Catalog initialized: ${catalogResult.action}`, catalogResult.details);
        } catch (error) {
          console.error('⚠️ Failed to initialize catalog:', error);
        }

        // 4. Sync store auth state to Redux FIRST (required for dataService storeId)
        const authState = storeAuthManager.getState();
        if (authState.store) {
          dispatch(setStoreSession({
            storeId: authState.store.storeId,
            storeName: authState.store.storeName,
            storeLoginId: authState.store.storeLoginId,
            tenantId: authState.store.tenantId,
            tier: authState.store.tier,
          }));
          dispatch(setAuthStatus(authState.status as AuthStatus));
          console.log('✅ Store auth synced to Redux:', authState.store.storeName);
        }

        // 4a. Load staff into Redux (legacy staffSlice for backwards compatibility)
        await dispatch(fetchAllStaff(salonId));
        console.log('✅ Staff loaded into Redux (staffSlice)');

        // 4a2. Seed team members if needed (required for uiStaffSlice)
        const storeId = authState.store?.storeId || 'default-store';
        console.log('[AppShell] Checking team data for storeId:', storeId);

        // Check current team member count
        const currentMembers = await teamDB.getAllMembers(storeId);
        console.log('[AppShell] Current team members in IndexedDB:', currentMembers.length);

        // Force reseed if no data exists
        if (currentMembers.length === 0) {
          console.log('🌱 Seeding team members (force)...');
          console.log('[AppShell] mockTeamMembers count:', mockTeamMembers.length);
          console.log('[AppShell] mockTeamMembers storeId:', mockTeamMembers[0]?.storeId);

          // Clear any partial data first
          await teamDB.clearAll();

          // Directly add members using bulkCreateMembers to bypass hasData check
          const ids = await teamDB.bulkCreateMembers(mockTeamMembers, 'system', 'seed');
          console.log('✅ Team members seeded:', ids.length, 'members');

          // Verify seeding worked
          const afterSeed = await teamDB.getAllMembers(storeId);
          console.log('[AppShell] After seed team members:', afterSeed.length);
        } else {
          console.log('✅ Team data already exists:', currentMembers.length, 'members');
        }

        // 4a3. Load UI staff from teamMembers (uiStaffSlice - used by Book, Team, FrontDesk)
        await dispatch(loadUIStaff(storeId));
        console.log('✅ UI Staff loaded into Redux (uiStaffSlice)');

        // 4b. Load clients into Redux from Supabase (via dataService)
        // Note: Only fetches if store is logged in (storeId available)
        if (authState.store) {
          await dispatch(fetchClientsFromSupabase());
          console.log('✅ Clients loaded into Redux from Supabase');
        } else {
          console.log('⚠️ No store logged in - skipping Supabase client fetch');
        }

        // 4c. Load tickets into Redux from IndexedDB
        await dispatch(loadTickets(salonId));
        console.log('✅ Tickets loaded into Redux');

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

  // Loading fallback for lazy-loaded modules
  const ModuleLoader = () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );

  const renderModule = () => {
    switch (activeModule) {
      // Core modules - now lazy loaded with Suspense
      case 'book':
        return <Suspense fallback={<ModuleLoader />}><Book /></Suspense>;
      case 'frontdesk':
        return <Suspense fallback={<ModuleLoader />}><FrontDesk showFrontDeskSettings={showFrontDeskSettings} setShowFrontDeskSettings={setShowFrontDeskSettings} /></Suspense>;
      case 'tickets':
        return <Suspense fallback={<ModuleLoader />}><Tickets /></Suspense>;
      case 'team':
        return <Suspense fallback={<ModuleLoader />}><Team /></Suspense>;
      case 'pending':
        return <Suspense fallback={<ModuleLoader />}><Pending /></Suspense>;
      case 'closed':
        return <Suspense fallback={<ModuleLoader />}><ClosedTickets /></Suspense>;
      case 'more':
        return <Suspense fallback={<ModuleLoader />}><More onNavigate={setActiveModule} /></Suspense>;

      // Lazy-loaded modules - wrapped in Suspense
      case 'transaction-records':
        return <Suspense fallback={<ModuleLoader />}><TransactionRecords onBack={() => setActiveModule('more')} /></Suspense>;
      case 'todays-sales':
        return <Suspense fallback={<ModuleLoader />}><TodaysSales onBack={() => setActiveModule('more')} /></Suspense>;
      case 'schedule':
        return <Suspense fallback={<ModuleLoader />}><Schedule /></Suspense>;
      case 'category':
        return <Suspense fallback={<ModuleLoader />}><MenuSettings onBack={() => setActiveModule('more')} /></Suspense>;
      case 'clients':
        return <Suspense fallback={<ModuleLoader />}><ClientSettings onBack={() => setActiveModule('more')} /></Suspense>;
      case 'license':
        return <Suspense fallback={<ModuleLoader />}><LicenseSettings /></Suspense>;
      case 'header-preview':
        return <Suspense fallback={<ModuleLoader />}><HeaderColorPreview /></Suspense>;
      case 'ticket-preview':
        return <Suspense fallback={<ModuleLoader />}><TicketColorPreview /></Suspense>;
      case 'team-settings':
        return <Suspense fallback={<ModuleLoader />}><TeamSettings onBack={() => setActiveModule('more')} /></Suspense>;
      case 'role-settings':
        return <Suspense fallback={<ModuleLoader />}><RoleSettings onBack={() => setActiveModule('more')} /></Suspense>;
      case 'store-settings':
        return <Suspense fallback={<ModuleLoader />}><StoreSettings onBack={() => setActiveModule('more')} /></Suspense>;
      case 'settings':
        return <Suspense fallback={<ModuleLoader />}><SettingsPage onBack={() => setActiveModule('more')} /></Suspense>;
      case 'activity-log':
        return <Suspense fallback={<ModuleLoader />}><StoreAuditViewer onBack={() => setActiveModule('more')} /></Suspense>;
      case 'frontdesk-settings':
        return <Suspense fallback={<ModuleLoader />}><FrontDesk showFrontDeskSettings={true} setShowFrontDeskSettings={(show) => {
          if (!show) setActiveModule('more');
        }} /></Suspense>;
      // 'devices' case removed - local-first architecture, no device settings needed
      default:
        return <Suspense fallback={<ModuleLoader />}><FrontDesk /></Suspense>;
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

      {/* System Announcements Banner */}
      <AnnouncementBanner />

      {/* Network Status Indicator */}
      <NetworkStatus />

      {/* Top Header - Always visible, but navigation hidden on mobile/tablet */}
      <TopHeaderBar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        hideNavigation={showBottomNav}
        onOpenTicketPanel={openTicketPanel}
      />

      {/* Main Content Area - responsive padding for header height (h-12 mobile, h-16 desktop) */}
      <main className={`relative flex-1 flex flex-col min-h-0 pt-12 md:pt-16 bg-white ${showBottomNav ? 'pb-[68px] sm:pb-[72px]' : ''}`}>
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

      {/* Global Ticket Panel - TicketPanel handles its own backdrop and positioning */}
      <Suspense fallback={null}>
        <TicketPanel
          isOpen={isTicketPanelOpen}
          onClose={closeTicketPanel}
          staffMembers={staffMembers}
        />
      </Suspense>
    </div>
  );
}
