import { useState, useEffect, lazy, Suspense } from 'react';
import { TopHeaderBar } from './TopHeaderBar';
import { BottomNavBar } from './BottomNavBar';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import { useAuditContext } from '../../services/audit/auditLogger';
import type { StaffMember } from '../checkout/ServiceList';
import { ConnectSDKProvider } from '../../providers/ConnectSDKProvider';
import { AIAssistantPanel } from '../integrations/AIAssistantPanel';

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
const MessagesPage = lazy(() => import('../../pages/MessagesPage'));
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
const GiftCardsPage = lazy(() => import('../giftcards/GiftCardsPage'));
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectPendingTickets, loadTickets } from '../../store/slices/uiTicketsSlice';
// fetchAllStaff removed - staffSlice.selectAllStaff now derives from teamSlice
import { loadStaff as loadUIStaff } from '../../store/slices/uiStaffSlice';
import { fetchTeamMembers } from '../../store/slices/teamSlice';
import { fetchClientsFromSupabase } from '../../store/slices/clientsSlice';
import { addLocalAppointment } from '../../store/slices/appointmentsSlice';
import { setOnlineStatus } from '../../store/slices/syncSlice';
import { setStoreSession, setAuthStatus, AuthStatus } from '../../store/slices/authSlice';
import {
  loadFrontDeskSettings,
  setSettings,
  subscribeToSettingsChanges,
} from '../../store/slices/frontDeskSettingsSlice';
import { setActiveCategory } from '../../store/slices/settingsSlice';
import { storeAuthManager } from '../../services/storeAuthManager';
import { initializeDatabase, db } from '../../db/schema';
import { seedDatabase, getTestSalonId } from '../../db/seed';
import { initializeCatalog, migrateCatalogToStore } from '../../db/catalogSeed';
import { teamDB } from '../../db/teamOperations';
import { mockTeamMembers } from '../team-settings/constants';
import { NetworkStatus } from '../NetworkStatus';
import { LicenseBanner } from '../licensing/LicenseBanner';
import { AnnouncementBanner } from '../AnnouncementBanner';
import { HelpRequestNotification } from '../common/HelpRequestNotification';
import { OfflineGraceBanner } from '../auth/OfflineGraceBanner';
import { defaultsPopulator } from '../../services/defaultsPopulator';
import { useBreakpoint } from '../../hooks/useMobileModal';

// Main AppShell wraps with TicketPanelProvider and ConnectSDKProvider
export function AppShell() {
  return (
    <TicketPanelProvider>
      <ConnectSDKProvider>
        <AppShellContent />
      </ConnectSDKProvider>
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

  // PERFORMANCE: Use direct Redux selector for pending count to avoid unnecessary re-renders
  const pendingTickets = useAppSelector(selectPendingTickets);
  const pendingCount = pendingTickets.length;

  const dispatch = useAppDispatch();

  // Listen for navigation events from child components (e.g., FrontDesk -> Checkout)
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail) {
        // Handle both string format ("settings") and object format ({ module: "settings", category: "devices" })
        if (typeof detail === 'string') {
          setActiveModule(detail);
        } else if (typeof detail === 'object' && detail.module) {
          setActiveModule(detail.module);
          // If navigating to settings with a category, set the active category
          if (detail.module === 'settings' && detail.category) {
            dispatch(setActiveCategory(detail.category));
          }
        }
      }
    };
    window.addEventListener('navigate-to-module', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate-to-module', handleNavigate as EventListener);
    };
  }, [dispatch]);
  const fallbackStoreId = getTestSalonId(); // Fallback for unauthenticated/development mode

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

        // 2. Get auth state FIRST to determine the correct storeId
        const authState = storeAuthManager.getState();
        const storeId = authState.store?.storeId || fallbackStoreId;
        console.log('🔑 Using storeId for initialization:', storeId);

        // 3. Apply defaults from license (first-time setup)
        try {
          await defaultsPopulator.applyDefaults(storeId);
        } catch (error) {
          console.error('⚠️ Failed to apply defaults:', error);
        }

        // 4. Check if we need to seed data (first run or force reseed)
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

        // 4b. Migrate catalog from default-salon to actual storeId if needed
        // This handles cases where catalog was seeded before user logged in
        if (storeId !== fallbackStoreId) {
          try {
            const migrationResult = await migrateCatalogToStore(fallbackStoreId, storeId);
            if (migrationResult.migrated) {
              console.log(`✅ Catalog migrated from "${fallbackStoreId}" to "${storeId}"`, migrationResult);
            }
          } catch (error) {
            console.error('⚠️ Failed to migrate catalog:', error);
          }
        }

        // 4c. Initialize catalog (migrate legacy services or seed if empty)
        try {
          const catalogResult = await initializeCatalog(storeId, true);
          console.log(`✅ Catalog initialized: ${catalogResult.action}`, catalogResult.details);
        } catch (error) {
          console.error('⚠️ Failed to initialize catalog:', error);
        }

        // 5. Sync store auth state to Redux (required for dataService storeId)
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

        // 6. Fetch team members from Supabase into teamSlice (single source of truth for staff)
        // NOTE: fetchAllStaff removed - staffSlice.selectAllStaff now derives from teamSlice
        await dispatch(fetchTeamMembers(storeId));
        console.log('✅ Team members fetched into Redux (teamSlice)');

        // 6b. Seed team members if needed (required for uiStaffSlice)
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

        // 6c. Load UI staff from teamMembers (uiStaffSlice - used by Book, Team, FrontDesk)
        await dispatch(loadUIStaff(storeId));
        console.log('✅ UI Staff loaded into Redux (uiStaffSlice)');

        // 7. Load clients into Redux from Supabase (via dataService)
        // Note: Only fetches if store is logged in (storeId available)
        if (authState.store) {
          await dispatch(fetchClientsFromSupabase());
          console.log('✅ Clients loaded into Redux from Supabase');
        } else {
          console.log('⚠️ No store logged in - skipping Supabase client fetch');
        }

        // 8. Load tickets into Redux from IndexedDB
        await dispatch(loadTickets(storeId));
        console.log('✅ Tickets loaded into Redux');

        // 9. Load appointments into Redux
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


        // 10. Load front desk settings from IndexedDB (per-user)
        await dispatch(loadFrontDeskSettings());
        console.log('✅ Front desk settings loaded');

        // 11. Set initial online status (sync handled by SupabaseSyncProvider)
        dispatch(setOnlineStatus(navigator.onLine));

        setIsInitialized(true);
        console.log('🎉 App initialization complete!');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    }

    initApp();
    // Note: Sync cleanup handled by SupabaseSyncProvider
  }, [dispatch, fallbackStoreId]);

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
    <div className="flex-1 flex items-center justify-center bg-white">
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
      case 'messages':
        return <Suspense fallback={<ModuleLoader />}><MessagesPage /></Suspense>;

      // Lazy-loaded modules - wrapped in Suspense
      case 'transaction-records':
        return <Suspense fallback={<ModuleLoader />}><TransactionRecords onBack={() => setActiveModule('more')} /></Suspense>;
      case 'todays-sales':
        return <Suspense fallback={<ModuleLoader />}><TodaysSales onBack={() => setActiveModule('more')} /></Suspense>;
      case 'schedule':
        return <Suspense fallback={<ModuleLoader />}><Schedule /></Suspense>;
      case 'catalog':
      case 'category': // Legacy alias for backward compatibility
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
      case 'gift-cards':
        return <Suspense fallback={<ModuleLoader />}><GiftCardsPage onBack={() => setActiveModule('more')} /></Suspense>;
      // 'devices' case removed - local-first architecture, no device settings needed
      default:
        return <Suspense fallback={<ModuleLoader />}><FrontDesk /></Suspense>;
    }
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
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
    <div className="h-dvh flex flex-col overflow-hidden bg-white">
      {/* Top Header - Always visible, but navigation hidden on mobile/tablet */}
      <TopHeaderBar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        hideNavigation={showBottomNav}
        onOpenTicketPanel={openTicketPanel}
      />

      {/* Main Content Area - responsive padding for header height (h-12 mobile, h-16 desktop) */}
      <main className={`relative flex-1 flex flex-col min-h-0 pt-12 md:pt-16 bg-white ${showBottomNav ? 'pb-[68px] sm:pb-[72px]' : ''}`}>
        {/* Banners - positioned below fixed header */}
        <div className="flex-shrink-0">
          <LicenseBanner />
          <AnnouncementBanner />
          <NetworkStatus />
          <OfflineGraceBanner />
        </div>

        {/* Module Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {renderModule()}
        </div>
      </main>

      {/* Modal Container - Sibling of main to escape overflow but stay within viewport */}
      <div id="pin-modal-root" className="fixed inset-0 pointer-events-none z-50">
        {/* Modals render here via React portals */}
      </div>

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

      {/* Help Request Notifications - Persistent until acknowledged */}
      <HelpRequestNotification />

      {/* AI Assistant Panel - Floating button/panel powered by Mango Connect SDK */}
      <AIAssistantPanel />
    </div>
  );
}
