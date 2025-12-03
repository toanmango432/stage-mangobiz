import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { useDeviceDetection } from '../hooks/frontdesk';
import { StaffSidebar } from './StaffSidebar';
import { ServiceSection } from './ServiceSection';
import { WaitListSection } from './WaitListSection';
import { ComingAppointments } from './ComingAppointments';
import { CreateTicketButton } from './CreateTicketButton';
import { TurnTrackerFab } from './TurnTracker/TurnTrackerFab';
// CreateTicketModal removed - now navigating to Checkout page instead
import { FloatingActionButton } from './FloatingActionButton';
import { useTickets } from '../hooks/useTicketsCompat';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { ChevronDown, Check, ChevronUp, MoreVertical, List, Grid, Eye, EyeOff, Clock, ListFilter, Activity, Hourglass } from 'lucide-react';
import { useSwipeGestures } from '../hooks/useGestures';
import { haptics } from '../utils/haptics';
import { MobileTabBar, tabColors, type MobileTab } from './frontdesk/MobileTabBar';
import { MobileTeamSection } from './frontdesk/MobileTeamSection';
import { FrontDeskSettings, FrontDeskSettingsData } from './frontdesk-settings/FrontDeskSettings';
import { sectionHeaderStyles, subordinateTabTheme } from './frontdesk/headerTokens';
import { ErrorBoundary } from './frontdesk/ErrorBoundary';
import {
  TeamSectionErrorBoundary,
  WaitListErrorBoundary,
  ServiceSectionErrorBoundary,
  ComingAppointmentsErrorBoundary,
  SettingsErrorBoundary
} from './frontdesk/SectionErrorBoundary';
import { PendingSectionFooter } from './frontdesk/PendingSectionFooter';
import {
  selectFrontDeskSettings,
  selectSortBy,
  selectShowComingAppointments,
  selectIsCombinedView,
  selectCardViewMode,
  selectActiveMobileSection,
  selectActiveCombinedTab,
  selectCombinedViewMode,
  selectCombinedMinimizedLineView,
  selectServiceColumnWidth,
  updateSettings,
  saveSettings,
  setActiveMobileSection as setActiveMobileSectionAction,
  setActiveCombinedTab as setActiveCombinedTabAction,
  setCombinedViewMode as setCombinedViewModeAction,
  setCombinedMinimizedLineView as setCombinedMinimizedLineViewAction,
  setServiceColumnWidth as setServiceColumnWidthAction,
} from '../store/slices/frontDeskSettingsSlice';

interface FrontDeskComponentProps {
  showFrontDeskSettings?: boolean;
  setShowFrontDeskSettings?: (show: boolean) => void;
}

function FrontDeskComponent({ showFrontDeskSettings: externalShowSettings, setShowFrontDeskSettings: externalSetShowSettings }: FrontDeskComponentProps = {}) {
  // Redux - use useAppDispatch for async thunk support
  const dispatch = useAppDispatch();
  const frontDeskSettings = useSelector(selectFrontDeskSettings);

  // ISSUE-002: Use memoized selectors instead of duplicate local state
  // These replace useState + useLayoutEffect sync pattern
  const ticketSortOrder = useSelector(selectSortBy);
  const showUpcomingAppointments = useSelector(selectShowComingAppointments);
  const isCombinedView = useSelector(selectIsCombinedView);
  const combinedCardViewMode = useSelector(selectCardViewMode);
  const [showSidebar, setShowSidebar] = useState(false);
  const [minimizedSections, setMinimizedSections] = useState(() => {
    // Force Coming section to be minimized by default - clear any old localStorage
    localStorage.removeItem('minimizedSections');
    return {
      waitList: false,
      service: false,
      comingAppointments: true  // Minimized by default - only show header with metrics
    };
  });

  // Use shared device detection hook (replaces 40+ lines of duplicate code)
  const deviceInfo = useDeviceDetection();

  // ISSUE-002: serviceWidth now comes from Redux viewState
  const serviceWidth = useSelector(selectServiceColumnWidth);
  const setServiceWidth = useCallback((width: number) => {
    dispatch(setServiceColumnWidthAction(width));
  }, [dispatch]);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // ISSUE-002: isCombinedView now comes from Redux selector (selectIsCombinedView)
  // ISSUE-002: activeMobileSection now comes from Redux viewState
  const activeMobileSection = useSelector(selectActiveMobileSection);
  const setActiveMobileSection = useCallback((section: string) => {
    dispatch(setActiveMobileSectionAction(section));
  }, [dispatch]);
  // ISSUE-002: activeCombinedTab now comes from Redux viewState
  const activeCombinedTab = useSelector(selectActiveCombinedTab);
  const setActiveCombinedTab = useCallback((tab: string) => {
    dispatch(setActiveCombinedTabAction(tab));
  }, [dispatch]);
  // ISSUE-002: combinedViewMode now comes from Redux viewState
  const combinedViewMode = useSelector(selectCombinedViewMode);
  const setCombinedViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch(setCombinedViewModeAction(mode));
  }, [dispatch]);
  // ISSUE-002: combinedCardViewMode now comes from Redux selector (selectCardViewMode)
  // ISSUE-002: combinedMinimizedLineView now comes from Redux viewState
  const combinedMinimizedLineView = useSelector(selectCombinedMinimizedLineView);
  const setCombinedMinimizedLineView = useCallback((value: boolean) => {
    dispatch(setCombinedMinimizedLineViewAction(value));
  }, [dispatch]);
  // Navigate to checkout for creating new ticket
  const navigateToCheckout = useCallback(() => {
    // Set flag for Checkout to auto-open the panel for new ticket
    localStorage.setItem('checkout-auto-open', 'new');
    // Clear any stored pending ticket to start fresh
    localStorage.removeItem('checkout-pending-ticket');
    // Dispatch event for AppShell to navigate
    window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'checkout' }));
  }, []);
  // Add state for the salon center settings (use external state if provided)
  const [internalShowSettings, internalSetShowSettings] = useState(false);
  const showFrontDeskSettings = externalShowSettings !== undefined ? externalShowSettings : internalShowSettings;
  const setShowFrontDeskSettings = externalSetShowSettings || internalSetShowSettings;

  // Get ticket context functions and data
  const {
    waitlist = [],
    serviceTickets = [],
    staff = [],
    comingAppointments = [],
  } = useTickets();

  // State for dropdown menus
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showWaitListDropdown, setShowWaitListDropdown] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const waitListDropdownRef = useRef<HTMLDivElement>(null);
  // New state for ticket config settings
  const [showTicketSettings, setShowTicketSettings] = useState(false);

  // ISSUE-002: Removed duplicate useState for ticketSortOrder, showUpcomingAppointments,
  // isCombinedView, and combinedCardViewMode. These now come from Redux selectors.
  // Helper callbacks to update Redux settings when user changes view modes:
  const setIsCombinedView = useCallback((value: boolean) => {
    dispatch(updateSettings({
      displayMode: value ? 'tab' : 'column',
      combineSections: value
    }));
  }, [dispatch]);

  const setCombinedCardViewMode = useCallback((mode: 'normal' | 'compact') => {
    dispatch(updateSettings({
      viewStyle: mode === 'compact' ? 'compact' : 'expanded'
    }));
  }, [dispatch]);

  const setTicketSortOrder = useCallback((order: 'queue' | 'time') => {
    dispatch(updateSettings({ sortBy: order }));
  }, [dispatch]);

  // FEAT-014: Keyboard shortcut to open settings (Cmd+, or Ctrl+,)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+, (Mac) or Ctrl+, (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowFrontDeskSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowFrontDeskSettings]);

  const ticketSettingsRef = useRef<HTMLDivElement>(null);

  // Calculate metrics for mobile tabs - must be after showUpcomingAppointments is defined
  const mobileTabsData = useMemo((): MobileTab[] => {
    // Service metrics (paused status not in UITicket type)
    const pausedCount = 0; // serviceTickets.filter(t => t.status === 'paused').length;
    const serviceSecondary = pausedCount > 0 ? `${pausedCount} paused` : undefined;

    // Wait list metrics
    const waitingCount = waitlist.length;
    const avgWaitTime = waitlist.length > 0
      ? Math.round(waitlist.reduce((sum, t) => {
          const waitMs = Date.now() - new Date(t.createdAt).getTime();
          return sum + waitMs / 60000; // Convert to minutes
        }, 0) / waitlist.length)
      : 0;
    const waitSecondary = avgWaitTime > 0 ? `${avgWaitTime}m avg` : undefined;
    const hasLongWait = waitlist.some(t => {
      const waitMs = Date.now() - new Date(t.createdAt).getTime();
      return waitMs > 20 * 60 * 1000; // > 20 min
    });

    // Coming appointments metrics - from real appointments data
    const comingCount = comingAppointments.length;

    // Team metrics
    const teamCount = staff.length;
    const readyCount = staff.filter((s: any) => s.status === 'ready').length;
    const teamSecondary = readyCount > 0 ? `${readyCount} ready` : undefined;

    return [
      {
        id: 'team',
        label: 'Team',
        shortLabel: 'Team',
        icon: 'team' as const,
        metrics: {
          count: teamCount,
          secondary: teamSecondary,
        },
        color: tabColors.team,
      },
      {
        id: 'service',
        label: 'In Service',
        shortLabel: 'Service',
        icon: 'service',
        metrics: {
          count: serviceTickets.length,
          secondary: serviceSecondary,
        },
        color: tabColors.service,
      },
      {
        id: 'waitList',
        label: 'Waiting',
        shortLabel: 'Waiting',
        icon: 'waiting',
        metrics: {
          count: waitingCount,
          secondary: waitSecondary,
          urgent: hasLongWait,
        },
        color: tabColors.waiting,
      },
      ...(showUpcomingAppointments ? [{
        id: 'comingAppointments',
        label: 'Appointments',
        shortLabel: 'Appts',
        icon: 'appointments' as const,
        metrics: {
          count: comingCount,
        },
        color: tabColors.appointments,
      }] : []),
    ];
  }, [serviceTickets, waitlist, staff, showUpcomingAppointments, comingAppointments]);

  // Swipe gesture handlers for tab navigation on mobile/tablet
  const handleSwipeLeft = useCallback(() => {
    if (isCombinedView) {
      // Combined view: service <-> waitList
      if (activeCombinedTab === 'service') {
        haptics.selection();
        setActiveCombinedTab('waitList');
      }
    } else {
      // Non-combined view: team -> service -> waitList -> comingAppointments
      const tabs = ['team', 'service', 'waitList', ...(showUpcomingAppointments ? ['comingAppointments'] : [])];
      const currentIndex = tabs.indexOf(activeMobileSection);
      if (currentIndex < tabs.length - 1) {
        haptics.selection();
        setActiveMobileSection(tabs[currentIndex + 1]);
      }
    }
  }, [isCombinedView, activeCombinedTab, activeMobileSection, showUpcomingAppointments]);

  const handleSwipeRight = useCallback(() => {
    if (isCombinedView) {
      // Combined view: waitList -> service
      if (['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)) {
        haptics.selection();
        setActiveCombinedTab('service');
      }
    } else {
      // Non-combined view: comingAppointments -> waitList -> service -> team
      const tabs = ['team', 'service', 'waitList', ...(showUpcomingAppointments ? ['comingAppointments'] : [])];
      const currentIndex = tabs.indexOf(activeMobileSection);
      if (currentIndex > 0) {
        haptics.selection();
        setActiveMobileSection(tabs[currentIndex - 1]);
      }
    }
  }, [isCombinedView, activeCombinedTab, activeMobileSection, showUpcomingAppointments]);

  // Use swipe gestures hook - only on mobile/tablet
  // Edge swipe only prevents accidental tab switches while scrolling
  const { handlers: swipeHandlers, isSwiping } = useSwipeGestures(
    {
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
    },
    {
      threshold: 50,
      velocity: 0.5, // Increased for better scroll detection
      preventScroll: false,
      edgeSwipeOnly: true, // Only trigger from screen edges
      edgeThreshold: 30, // 30px from edge
    }
  );

  // ISSUE-002: Removed redundant localStorage sync effects - Redux viewState handles persistence
  // activeMobileSection, activeCombinedTab, combinedViewMode, combinedMinimizedLineView,
  // and serviceColumnWidth are now synced to localStorage via Redux reducers

  // Save minimized sections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('minimizedSections', JSON.stringify(minimizedSections));
  }, [minimizedSections]);

  // NOTE: ticketSortOrder and showUpcomingAppointments are now saved via Redux
  // (removed redundant localStorage saves - Redux saveSettings handles this)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
      }
      if (waitListDropdownRef.current && !waitListDropdownRef.current.contains(event.target as Node)) {
        setShowWaitListDropdown(false);
      }
      if (ticketSettingsRef.current && !ticketSettingsRef.current.contains(event.target as Node)) {
        setShowTicketSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showServiceDropdown, showWaitListDropdown, showTicketSettings]);
  // ISSUE-002: Toggle functions simplified - Redux handles localStorage sync
  const toggleCombinedCardViewMode = () => {
    const newMode = combinedCardViewMode === 'normal' ? 'compact' : 'normal';
    setCombinedCardViewMode(newMode);
  };

  const toggleCombinedMinimizedLineView = () => {
    setCombinedMinimizedLineView(!combinedMinimizedLineView);
  };
  // ISSUE-002: Removed redundant combinedViewMode localStorage sync - Redux handles this
  // Sync view mode settings when active combined tab changes
  useEffect(() => {
    if (isCombinedView) {
      if (activeCombinedTab === 'service') {
        // Load service-specific settings
        const viewMode = localStorage.getItem('serviceViewMode');
        const cardViewMode = localStorage.getItem('serviceCardViewMode');
        const minimizedLineView = localStorage.getItem('serviceMinimizedLineView');
        if (viewMode === 'grid' || viewMode === 'list') {
          setCombinedViewMode(viewMode);
        }
        if (cardViewMode === 'normal' || cardViewMode === 'compact') {
          setCombinedCardViewMode(cardViewMode as 'normal' | 'compact');
        }
        if (minimizedLineView === 'true' || minimizedLineView === 'false') {
          setCombinedMinimizedLineView(minimizedLineView === 'true');
        }
      } else if (['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)) {
        // Load waitlist-specific settings
        const viewMode = localStorage.getItem('waitListViewMode');
        const cardViewMode = localStorage.getItem('waitListCardViewMode');
        const minimizedLineView = localStorage.getItem('waitListMinimizedLineView');
        if (viewMode === 'grid' || viewMode === 'list') {
          setCombinedViewMode(viewMode);
        }
        if (cardViewMode === 'normal' || cardViewMode === 'compact') {
          setCombinedCardViewMode(cardViewMode as 'normal' | 'compact');
        }
        if (minimizedLineView === 'true' || minimizedLineView === 'false') {
          setCombinedMinimizedLineView(minimizedLineView === 'true');
        }
      }
    }
  }, [activeCombinedTab, isCombinedView]);

  // Automatically set view mode based on device (device detection handled by hook)
  useEffect(() => {
    // Use window width as the source of truth for desktop detection
    const isActuallyDesktop = window.innerWidth >= 1024;

    if (isActuallyDesktop) {
      // Force Column view (three-column layout) for desktop to show Coming + Waiting stacked
      localStorage.removeItem('salonCenterViewMode');
      setIsCombinedView(false);
    } else {
      // Force Tabs view on mobile/tablet
      setIsCombinedView(true);
    }
  }, [deviceInfo.isMobile, deviceInfo.isTablet, deviceInfo.isDesktop]);

  // Auto-minimize sections on mobile and tablet for better UX
  useEffect(() => {
    if (deviceInfo.isMobile || deviceInfo.isTablet) {
      setMinimizedSections((prev: typeof minimizedSections) => ({
        ...prev,
        waitList: activeMobileSection !== 'waitList',
        service: activeMobileSection !== 'service',
        comingAppointments: activeMobileSection !== 'comingAppointments'
      }));
    }
  }, [deviceInfo.isMobile, deviceInfo.isTablet, activeMobileSection]);
  const toggleSectionMinimize = (section: 'waitList' | 'service' | 'comingAppointments') => {
    setMinimizedSections((prev: typeof minimizedSections) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  // Toggle combined view - enhanced to save preference and preserve view settings
  // Handle settings change
  const handleFrontDeskSettingsChange = (newSettings: Partial<FrontDeskSettingsData>) => {
    // Update Redux store - this will trigger the useEffect that syncs local states
    dispatch(updateSettings(newSettings));
    dispatch(saveSettings());

    // NOTE: Removed redundant localStorage writes - Redux saveSettings handles persistence
    // NOTE: Removed manual state updates - useEffect syncs local states from Redux automatically
    // This prevents state desynchronization and duplicate data storage
  };
  // Simplified Ticket Settings Component
  const TicketsHeader = () => {
    return (
      <div className="absolute top-1 right-1 z-50 flex items-center gap-1">
        {/* Settings button removed - now in global header */}
        {/* Mobile/tablet controls - keep these but remove the background bar */}
        {(deviceInfo.isMobile || deviceInfo.isTablet) && <div className="flex items-center space-x-1 mt-2">
          <Tippy content="Sort tickets">
            <button className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" onClick={() => {
              setTicketSortOrder(ticketSortOrder === 'queue' ? 'time' : 'queue');
              handleFrontDeskSettingsChange({
                sortBy: ticketSortOrder === 'queue' ? 'time' : 'queue'
              });
            }}>
              {ticketSortOrder === 'queue' ? <ListFilter size={16} /> : <Clock size={16} />}
            </button>
          </Tippy>
          <Tippy content={showUpcomingAppointments ? 'Hide upcoming' : 'Show upcoming'}>
            <button className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" onClick={() => {
              // Toggle Coming Appointments visibility via Redux
              handleFrontDeskSettingsChange({
                showComingAppointments: !showUpcomingAppointments
              });
            }}>
              {showUpcomingAppointments ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </Tippy>
        </div>}
      </div>
    );
  };
  // Color tokens for section styling - now using Tailwind config colors
  const colorTokens = {
    waitList: {
      primary: 'waitList-400',
      bg: 'bg-waitList-50',
      text: 'text-waitList-700',
      border: 'ring-waitList-400/30',
      iconBg: 'bg-waitList-400',
      hoverBg: 'hover:bg-waitList-50/50',
      hoverText: 'hover:text-waitList-700',
      dropdownHover: 'hover:bg-waitList-50',
      checkColor: 'text-waitList-400'
    },
    service: {
      primary: 'service-400',
      bg: 'bg-service-50',
      text: 'text-service-600',
      border: 'ring-service-400/30',
      iconBg: 'bg-service-400',
      hoverBg: 'hover:bg-service-50/50',
      hoverText: 'hover:text-service-600',
      dropdownHover: 'hover:bg-service-50',
      checkColor: 'text-service-400'
    },
    comingAppointments: {
      primary: 'comingAppointments-500',
      bg: 'bg-comingAppointments-50',
      text: 'text-comingAppointments-700',
      border: 'ring-comingAppointments-500/30',
      iconBg: 'bg-comingAppointments-500',
      hoverBg: 'hover:bg-comingAppointments-50/50',
      hoverText: 'hover:text-comingAppointments-500',
      dropdownHover: 'hover:bg-comingAppointments-50',
      checkColor: 'text-comingAppointments-500'
    },
    pendingTickets: {
      primary: 'pendingTickets-400',
      bg: 'bg-pendingTickets-50',
      text: 'text-pendingTickets-600',
      border: 'ring-pendingTickets-400/30',
      iconBg: 'bg-pendingTickets-400',
      hoverBg: 'hover:bg-pendingTickets-50/50',
      hoverText: 'hover:text-pendingTickets-600',
      dropdownHover: 'hover:bg-pendingTickets-50',
      checkColor: 'text-pendingTickets-400'
    },
    closedTickets: {
      primary: 'closedTickets-400',
      bg: 'bg-closedTickets-100',
      text: 'text-closedTickets-600',
      border: 'ring-closedTickets-400/30',
      iconBg: 'bg-closedTickets-400',
      hoverBg: 'hover:bg-closedTickets-100/50',
      hoverText: 'hover:text-closedTickets-600',
      dropdownHover: 'hover:bg-closedTickets-100',
      checkColor: 'text-closedTickets-400'
    }
  };
  return (
    <div className="flex h-full pb-0 overflow-hidden">
      <div className="flex flex-1 pb-0 min-h-0 overflow-hidden">
        {/* Sidebar with improved mobile handling */}
        <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 h-full transition-transform duration-300 ease-in-out`}>
          <TeamSectionErrorBoundary>
            <StaffSidebar settings={frontDeskSettings} />
          </TeamSectionErrorBoundary>
        </div>
        {/* Overlay for mobile sidebar */}
        {showSidebar && <div className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>}
        {/* Enhanced visual separator between tech and service sections */}
        <div className="hidden md:block w-px bg-gray-200 relative"></div>
        {/* Main content area with flex layout for optimal space usage - Added pb-10 for pending footer */}
        <div className="flex-1 flex flex-col h-full min-h-0 pb-10 overflow-hidden">
          {/* Unified Mobile/Tablet Tab Bar - Clean and simple with metrics */}
          {(deviceInfo.isMobile || deviceInfo.isTablet) && (
            <MobileTabBar
              tabs={mobileTabsData}
              activeTab={activeMobileSection}
              onTabChange={setActiveMobileSection}
              className="sticky top-0 z-10 shadow-sm"
            />
          )}
          {/* Combined view tabs - Desktop only (mobile uses MobileTabBar above) */}
          {/* Clean, balanced tab design: Icon/Metric | Title | Count */}
          {isCombinedView && !deviceInfo.isMobile && !deviceInfo.isTablet && <div className={`flex items-center justify-between ${subordinateTabTheme.container} sticky top-0 z-10`}>
            <div className={subordinateTabTheme.tabWrapper} role="tablist">
              {/* In Service Tab */}
              <button
                onClick={() => setActiveCombinedTab('service')}
                className={`${subordinateTabTheme.tab.base} ${activeCombinedTab === 'service' ? subordinateTabTheme.tab.active : subordinateTabTheme.tab.inactive}`}
                role="tab"
                aria-selected={activeCombinedTab === 'service'}
              >
                {/* Left: Icon (vertically centered) */}
                <Activity size={18} strokeWidth={2} className={`${subordinateTabTheme.icon.base} ${activeCombinedTab === 'service' ? subordinateTabTheme.icon.service.active : subordinateTabTheme.icon.service.inactive}`} />
                {/* Center: Title + Metric stacked */}
                <div className={subordinateTabTheme.centerColumn}>
                  <span className={`${subordinateTabTheme.title.base} ${activeCombinedTab === 'service' ? subordinateTabTheme.title.service.active : subordinateTabTheme.title.service.inactive}`}>In Service</span>
                  <span className={`${subordinateTabTheme.metric.base} ${activeCombinedTab === 'service' ? subordinateTabTheme.metric.service.active : subordinateTabTheme.metric.service.inactive}`}>
                    {serviceTickets.length > 0 ? `${Math.round(serviceTickets.reduce((sum, t) => sum + (Date.now() - new Date(t.createdAt).getTime()) / 60000, 0) / serviceTickets.length)}m avg` : '—'}
                  </span>
                </div>
                {/* Right: Count */}
                <span className={`${subordinateTabTheme.count.base} ${activeCombinedTab === 'service' ? subordinateTabTheme.count.service.active : subordinateTabTheme.count.service.inactive}`}>{serviceTickets.length}</span>
                {activeCombinedTab === 'service' && <div className={`${subordinateTabTheme.indicator.base} ${subordinateTabTheme.indicator.service}`} />}
              </button>

              {/* Waiting Tab */}
              <button
                onClick={() => setActiveCombinedTab('waitList')}
                className={`${subordinateTabTheme.tab.base} ${activeCombinedTab === 'waitList' ? subordinateTabTheme.tab.active : subordinateTabTheme.tab.inactive}`}
                role="tab"
                aria-selected={activeCombinedTab === 'waitList'}
              >
                {/* Left: Icon (vertically centered) */}
                <Hourglass size={18} strokeWidth={2} className={`${subordinateTabTheme.icon.base} ${activeCombinedTab === 'waitList' ? subordinateTabTheme.icon.waitList.active : subordinateTabTheme.icon.waitList.inactive}`} />
                {/* Center: Title + Metric stacked */}
                <div className={subordinateTabTheme.centerColumn}>
                  <span className={`${subordinateTabTheme.title.base} ${activeCombinedTab === 'waitList' ? subordinateTabTheme.title.waitList.active : subordinateTabTheme.title.waitList.inactive}`}>Waiting</span>
                  <span className={`${subordinateTabTheme.metric.base} ${activeCombinedTab === 'waitList' ? subordinateTabTheme.metric.waitList.active : subordinateTabTheme.metric.waitList.inactive}`}>
                    {waitlist.length > 0 ? `${Math.round(waitlist.reduce((sum, t) => sum + (Date.now() - new Date(t.createdAt).getTime()) / 60000, 0) / waitlist.length)}m avg` : '—'}
                  </span>
                </div>
                {/* Right: Count */}
                <span className={`${subordinateTabTheme.count.base} ${activeCombinedTab === 'waitList' ? subordinateTabTheme.count.waitList.active : subordinateTabTheme.count.waitList.inactive}`}>{waitlist.length}</span>
                {activeCombinedTab === 'waitList' && <div className={`${subordinateTabTheme.indicator.base} ${subordinateTabTheme.indicator.waitList}`} />}
              </button>

              {/* Coming Tab */}
              {showUpcomingAppointments && (
                <button
                  onClick={() => setActiveCombinedTab('comingAppointments')}
                  className={`${subordinateTabTheme.tab.base} ${activeCombinedTab === 'comingAppointments' ? subordinateTabTheme.tab.active : subordinateTabTheme.tab.inactive}`}
                  role="tab"
                  aria-selected={activeCombinedTab === 'comingAppointments'}
                >
                  {/* Left: Icon (vertically centered) */}
                  <Clock size={18} strokeWidth={2} className={`${subordinateTabTheme.icon.base} ${activeCombinedTab === 'comingAppointments' ? subordinateTabTheme.icon.comingAppointments.active : subordinateTabTheme.icon.comingAppointments.inactive}`} />
                  {/* Center: Title + Metric stacked */}
                  <div className={subordinateTabTheme.centerColumn}>
                    <span className={`${subordinateTabTheme.title.base} ${activeCombinedTab === 'comingAppointments' ? subordinateTabTheme.title.comingAppointments.active : subordinateTabTheme.title.comingAppointments.inactive}`}>Coming</span>
                    <span className={`${subordinateTabTheme.metric.base} ${activeCombinedTab === 'comingAppointments' ? subordinateTabTheme.metric.comingAppointments.active : subordinateTabTheme.metric.comingAppointments.inactive}`}>
                      next 1hr
                    </span>
                  </div>
                  {/* Right: Count */}
                  <span className={`${subordinateTabTheme.count.base} ${activeCombinedTab === 'comingAppointments' ? subordinateTabTheme.count.comingAppointments.active : subordinateTabTheme.count.comingAppointments.inactive}`}>0</span>
                  {activeCombinedTab === 'comingAppointments' && <div className={`${subordinateTabTheme.indicator.base} ${subordinateTabTheme.indicator.comingAppointments}`} />}
                </button>
              )}
            </div>
            {/* View controls - moved to the same row as tabs */}
            <div className="flex items-center space-x-1 pr-3 md:pr-4">
              {/* Minimize toggle - conditional based on view mode */}
              {combinedViewMode === 'list' ? <Tippy content={combinedMinimizedLineView ? 'Expand line view' : 'Minimize line view'}>
                <button className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all" onClick={toggleCombinedMinimizedLineView} aria-label={combinedMinimizedLineView ? 'Expand line view' : 'Minimize line view'} aria-expanded={!combinedMinimizedLineView}>
                  {combinedMinimizedLineView ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </Tippy> : <Tippy content={combinedCardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'}>
                <button className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all" onClick={toggleCombinedCardViewMode} aria-label={combinedCardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'} aria-expanded={combinedCardViewMode !== 'compact'}>
                  {combinedCardViewMode === 'compact' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
              </Tippy>}
              {/* More options dropdown button - mobile-optimized */}
              <div className="relative md:hidden">
                <Tippy content="View options">
                  <button className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all" onClick={() => activeCombinedTab === 'service' ? setShowServiceDropdown(!showServiceDropdown) : setShowWaitListDropdown(!showWaitListDropdown)} aria-label="View options" aria-haspopup="true" aria-expanded={showServiceDropdown || showWaitListDropdown}>
                    <MoreVertical size={18} />
                  </button>
                </Tippy>
                {/* Combined dropdown for mobile */}
                {(showServiceDropdown || showWaitListDropdown) && <div className="absolute right-0 mt-1 w-40 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg z-10 border border-gray-200 py-1" ref={activeCombinedTab === 'service' ? serviceDropdownRef : waitListDropdownRef} role="menu">
                  <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center" onClick={() => {
                    setCombinedViewMode('list');
                    setShowServiceDropdown(false);
                    setShowWaitListDropdown(false);
                  }} role="menuitem">
                    <List size={14} className="mr-2 text-gray-500" />
                    Line View
                    {combinedViewMode === 'list' && <Check size={14} className="ml-auto text-gray-500" />}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center" onClick={() => {
                    setCombinedViewMode('grid');
                    setShowServiceDropdown(false);
                    setShowWaitListDropdown(false);
                  }} role="menuitem">
                    <Grid size={14} className="mr-2 text-gray-500" />
                    Grid View
                    {combinedViewMode === 'grid' && <Check size={14} className="ml-auto text-gray-500" />}
                  </button>
                </div>}
              </div>
              {/* More options for Service tab - tablet/desktop only */}
              {activeCombinedTab === 'service' && <div className="relative hidden md:block" ref={serviceDropdownRef}>
                <Tippy content="View options">
                  <button className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all" onClick={() => setShowServiceDropdown(!showServiceDropdown)} aria-expanded={showServiceDropdown} aria-haspopup="true">
                    <MoreVertical size={16} />
                  </button>
                </Tippy>
                {showServiceDropdown && <div className="absolute right-0 mt-1 w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg z-10 border border-gray-200 py-1" role="menu">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 rounded-t-xl">
                    <h3 className="text-xs font-medium text-gray-700">
                      View Options
                    </h3>
                  </div>
                  <button className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${colorTokens.service.dropdownHover} flex items-center`} onClick={() => setCombinedViewMode('list')} role="menuitem">
                    <List size={14} className={`mr-2 ${colorTokens.service.text}`} />
                    Line View
                    {combinedViewMode === 'list' && <Check size={14} className={`ml-auto ${colorTokens.service.text}`} />}
                  </button>
                  <button className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${colorTokens.service.dropdownHover} flex items-center`} onClick={() => setCombinedViewMode('grid')} role="menuitem">
                    <Grid size={14} className={`mr-2 ${colorTokens.service.text}`} />
                    Grid View
                    {combinedViewMode === 'grid' && <Check size={14} className={`ml-auto ${colorTokens.service.text}`} />}
                  </button>
                </div>}
              </div>}
              {/* More options for Wait List tab - tablet/desktop only */}
              {['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) && <div className="relative hidden md:block" ref={waitListDropdownRef}>
                <Tippy content="View options">
                  <button className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all" onClick={() => setShowWaitListDropdown(!showWaitListDropdown)} aria-expanded={showWaitListDropdown} aria-haspopup="true">
                    <MoreVertical size={16} />
                  </button>
                </Tippy>
                {showWaitListDropdown && <div className="absolute right-0 mt-1 w-48 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg z-10 border border-gray-200 py-1" role="menu">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 rounded-t-xl">
                    <h3 className="text-xs font-medium text-gray-700">
                      View Options
                    </h3>
                  </div>
                  <button className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${colorTokens.waitList.dropdownHover} flex items-center`} onClick={() => setCombinedViewMode('list')} role="menuitem">
                    <List size={14} className={`mr-2 ${colorTokens.waitList.text}`} />
                    Line View
                    {combinedViewMode === 'list' && <Check size={14} className={`ml-auto ${colorTokens.waitList.text}`} />}
                  </button>
                  <button className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${colorTokens.waitList.dropdownHover} flex items-center`} onClick={() => setCombinedViewMode('grid')} role="menuitem">
                    <Grid size={14} className={`mr-2 ${colorTokens.waitList.text}`} />
                    Grid View
                    {combinedViewMode === 'grid' && <Check size={14} className={`ml-auto ${colorTokens.waitList.text}`} />}
                  </button>
                </div>}
              </div>}
              {/* Toggle combined view button - only show on desktop */}
              {deviceInfo.isDesktop && <div className="flex items-center ml-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <Tippy content="Tab View"></Tippy>
                <Tippy content="Column View"></Tippy>
              </div>}
            </div>
          </div>}
          <div className="flex-1 flex flex-col relative h-full bg-white min-h-0 overflow-hidden">
            {/* Position the TicketsHeader absolutely in the top right */}
            <TicketsHeader />
            {/* Main content container */}
            <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
              {/* Combined view */}
              {isCombinedView ? <div
                className={`flex h-full overflow-hidden min-h-0 gap-2 ${isSwiping ? 'select-none' : ''}`}
                {...((deviceInfo.isMobile || deviceInfo.isTablet) ? swipeHandlers : {})}
              >
                {/* Main content area - takes remaining width */}
                <div className="flex-1 overflow-hidden bg-gray-50 min-h-0" role="tabpanel" id={`${activeCombinedTab}-panel`}>
                  {/* Wait List Section - Show when active in combined view */}
                  {activeCombinedTab === 'waitList' && <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <WaitListSection isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('waitList')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} viewMode={combinedViewMode} setViewMode={setCombinedViewMode} cardViewMode={combinedCardViewMode} setCardViewMode={setCombinedCardViewMode} minimizedLineView={combinedMinimizedLineView} setMinimizedLineView={setCombinedMinimizedLineView} isCombinedView={true} hideHeader={true} settings={frontDeskSettings} headerStyles={sectionHeaderStyles.waitList} />
                    </div>
                  </div>}
                  {/* Service Section - Show when active in combined view */}
                  {activeCombinedTab === 'service' && <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ServiceSection isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('service')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} viewMode={combinedViewMode} setViewMode={setCombinedViewMode} cardViewMode={combinedCardViewMode} setCardViewMode={setCombinedCardViewMode} minimizedLineView={combinedMinimizedLineView} setMinimizedLineView={setCombinedMinimizedLineView} isCombinedView={true} hideHeader={true} settings={frontDeskSettings} headerStyles={sectionHeaderStyles.service} />
                    </div>
                  </div>}
                  {/* Coming Appointments Section - Show when active in combined view */}
                  {activeCombinedTab === 'comingAppointments' && <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ComingAppointments isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('comingAppointments')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} hideHeader={true} settings={frontDeskSettings} headerStyles={sectionHeaderStyles.comingAppointments} />
                    </div>
                  </div>}
                </div>
              </div> : <>
                {/* Three-column layout for desktop - reordered to match workflow */}
                <div
                  className={`${deviceInfo.isMobile || deviceInfo.isTablet ? `overflow-auto flex-1 ${isSwiping ? 'select-none' : ''}` : 'flex flex-1 overflow-hidden'} h-full`}
                  {...((deviceInfo.isMobile || deviceInfo.isTablet) ? swipeHandlers : {})}
                >
                  {/* For tablet and mobile: Show sections based on active tab */}
                  {deviceInfo.isMobile || deviceInfo.isTablet ? <>
                    {/* Wait List Section - Show Coming + Waiting stacked on mobile/tablet */}
                    {activeMobileSection === 'waitList' && <div className="h-full flex flex-col overflow-hidden">
                      {/* Coming Appointments - Minimized at top */}
                      {showUpcomingAppointments && <div className="flex-shrink-0">
                        <ComingAppointments
                          isMinimized={true}
                          onToggleMinimize={() => toggleSectionMinimize('comingAppointments')}
                          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
                          settings={frontDeskSettings}
                          headerStyles={{
                            ...sectionHeaderStyles.comingAppointments,
                            bg: 'bg-gradient-to-br from-comingAppointments-50/80 via-blue-50/60 to-cyan-50/40',
                            borderColor: 'border-comingAppointments-200/30',
                            counterBg: 'bg-comingAppointments-100',
                            counterText: 'text-comingAppointments-700'
                          }}
                        />
                      </div>}

                      {/* Waiting Queue - Takes remaining space, hideHeader since MobileTabBar shows metrics */}
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <WaitListSection
                          isMinimized={false}
                          onToggleMinimize={() => toggleSectionMinimize('waitList')}
                          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
                          hideHeader={true}
                        />
                      </div>
                    </div>}
                    {/* Service Section - Show when active on mobile/tablet */}
                    {activeMobileSection === 'service' && <div className="h-full flex flex-col overflow-hidden">
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <ServiceSection
                          isMinimized={false}
                          onToggleMinimize={() => toggleSectionMinimize('service')}
                          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
                          hideHeader={true}
                          settings={frontDeskSettings}
                        />
                      </div>
                    </div>}
                    {/* Coming Appointments Section - Show when active on mobile/tablet */}
                    {activeMobileSection === 'comingAppointments' && <div className="h-full pr-0">
                      <ComingAppointments
                        isMinimized={false}
                        onToggleMinimize={() => toggleSectionMinimize('comingAppointments')}
                        isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
                        hideHeader={true}
                        settings={frontDeskSettings}
                      />
                    </div>}
                    {/* Team Section - Show when active on mobile/tablet */}
                    {activeMobileSection === 'team' && <div className="h-full flex flex-col min-h-0">
                      <MobileTeamSection className="flex-1 min-h-0" />
                    </div>}
                  </> : <>
                    {/* Desktop layout with horizontal expansion/collapse - UPDATED FOR PROPER ALIGNMENT */}
                    <div className="flex h-full w-full pb-0">
                      {/* Left side: Main content area with Service, Wait List, Pending Tickets and Closed Tickets */}
                      <div className="flex flex-col flex-1 overflow-hidden min-h-0 pb-0">
                        {/* Top row with In Service and Wait List side by side */}
                        <div className="flex flex-1 min-h-0 gap-0 relative pb-0">
                          {/* Left Column - In Service (resizable) */}
                          <div
                            className={`h-full min-h-0 pb-0 overflow-hidden ${minimizedSections.service ? 'w-[60px] flex-shrink-0' : minimizedSections.waitList ? 'flex-1' : ''}`}
                            style={!minimizedSections.service && !minimizedSections.waitList ? { width: `${serviceWidth}%` } : undefined}
                          >
                            <ServiceSectionErrorBoundary>
                              <ServiceSection isMinimized={minimizedSections.service} onToggleMinimize={() => toggleSectionMinimize('service')} isMobile={false} settings={frontDeskSettings} headerStyles={{
                                ...sectionHeaderStyles.service,
                                bg: colorTokens.service.bg,
                                activeIconColor: colorTokens.service.text,
                                borderColor: colorTokens.service.border.replace('ring', 'border'),
                              }} />
                            </ServiceSectionErrorBoundary>
                          </div>

                          {/* Draggable Divider */}
                          {!minimizedSections.service && !minimizedSections.waitList && (
                            <div
                              ref={resizeRef}
                              className={`w-[2px] bg-gray-200/60 hover:bg-blue-400/60 cursor-col-resize flex-shrink-0 relative group transition-colors ${isResizing ? 'bg-blue-400/60' : ''
                                }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizing(true);
                                const startX = e.clientX;
                                const startWidth = serviceWidth;
                                const containerWidth = resizeRef.current?.parentElement?.offsetWidth || 1;

                                const handleMouseMove = (e: MouseEvent) => {
                                  const deltaX = e.clientX - startX;
                                  const deltaPercent = (deltaX / containerWidth) * 100;
                                  const newWidth = Math.min(Math.max(startWidth + deltaPercent, 20), 80); // Min 20%, Max 80%
                                  setServiceWidth(newWidth); // Redux handles localStorage sync
                                };

                                const handleMouseUp = () => {
                                  setIsResizing(false);
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              {/* Visual indicator */}
                              <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-0.5 h-8 bg-blue-400/80 rounded-full shadow-sm"></div>
                              </div>
                            </div>
                          )}

                          {/* Right Column - Coming + Waiting stacked vertically */}
                          <div
                            className={`h-full min-h-0 pb-0 flex flex-col overflow-hidden ${minimizedSections.waitList && minimizedSections.comingAppointments ? 'w-[60px] flex-shrink-0' : minimizedSections.service ? 'flex-1' : ''}`}
                            style={!minimizedSections.service && !(minimizedSections.waitList && minimizedSections.comingAppointments) ? { width: `${100 - serviceWidth}%` } : undefined}
                          >
                            {/* Coming Appointments - Top */}
                            {showUpcomingAppointments && <div className="flex-shrink-0">
                              <ComingAppointmentsErrorBoundary>
                                <ComingAppointments
                                  isMinimized={minimizedSections.comingAppointments}
                                  onToggleMinimize={() => toggleSectionMinimize('comingAppointments')}
                                  isMobile={false}
                                  settings={frontDeskSettings}
                                  headerStyles={{
                                    ...sectionHeaderStyles.comingAppointments,
                                    bg: colorTokens.comingAppointments.bg,
                                    activeIconColor: colorTokens.comingAppointments.text,
                                    borderColor: colorTokens.comingAppointments.border.replace('ring', 'border'),
                                  }}
                                />
                              </ComingAppointmentsErrorBoundary>
                            </div>}

                            {/* Waiting Queue - Bottom */}
                            <div className={minimizedSections.waitList ? 'flex-shrink-0' : 'flex-1 min-h-0 overflow-hidden'}>
                              <WaitListErrorBoundary>
                                <WaitListSection
                                  isMinimized={minimizedSections.waitList}
                                  onToggleMinimize={() => toggleSectionMinimize('waitList')}
                                  isMobile={false}
                                  settings={frontDeskSettings}
                                  headerStyles={{
                                    ...sectionHeaderStyles.waitList,
                                    bg: colorTokens.waitList.bg,
                                    activeIconColor: colorTokens.waitList.text,
                                    borderColor: colorTokens.waitList.border.replace('ring', 'border'),
                                  }}
                                />
                              </WaitListErrorBoundary>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>}
                </div>
              </>}
            </div>
          </div>
        </div>
      </div>
      {/* Global Turn Tracker Floating Action Button */}
      <TurnTrackerFab onClick={() => {
        // Use a custom event so StaffSidebar can open its TurnTracker modal
        window.dispatchEvent(new Event('open-turn-tracker'));
      }} />
      {/* Create Ticket Button - navigates to Checkout */}
      <CreateTicketButton onClick={navigateToCheckout} />
      {/* Floating Action Button - navigates to Checkout */}
      <FloatingActionButton onCreateTicket={navigateToCheckout} />
      {/* Add the new FrontDeskSettings component */}
      <SettingsErrorBoundary>
        <FrontDeskSettings isOpen={showFrontDeskSettings} onClose={() => setShowFrontDeskSettings(false)} currentSettings={frontDeskSettings} onSettingsChange={handleFrontDeskSettingsChange} />
      </SettingsErrorBoundary>
      {/* Pending Section Footer */}
      <PendingSectionFooter />
    </div>
  );
}

// Export the component wrapped with error boundary for resilience
export function FrontDesk({ showFrontDeskSettings, setShowFrontDeskSettings }: FrontDeskComponentProps = {}) {
  return (
    <ErrorBoundary>
      <FrontDeskComponent showFrontDeskSettings={showFrontDeskSettings} setShowFrontDeskSettings={setShowFrontDeskSettings} />
    </ErrorBoundary>
  );
}