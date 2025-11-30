import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDeviceDetection } from '../hooks/frontdesk';
import { StaffSidebar } from './StaffSidebar';
import { ServiceSection } from './ServiceSection';
import { WaitListSection } from './WaitListSection';
import { ComingAppointments } from './ComingAppointments';
import { CreateTicketButton } from './CreateTicketButton';
import { TurnTrackerFab } from './TurnTracker/TurnTrackerFab';
import { CreateTicketModal } from './CreateTicketModal';
import { FloatingActionButton } from './FloatingActionButton';
import { useTickets } from '../hooks/useTicketsCompat';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FileText, Users, LayoutGrid, ChevronDown, Check, ChevronUp, MoreVertical, List, Grid, Eye, EyeOff, Clock, ListFilter } from 'lucide-react';
import { useSwipeGestures } from '../hooks/useGestures';
import { haptics } from '../utils/haptics';
import { MobileTabBar, tabColors, type MobileTab } from './frontdesk/MobileTabBar';
import { MobileTeamSection } from './frontdesk/MobileTeamSection';
import { FrontDeskSettings, FrontDeskSettingsData, defaultFrontDeskSettings } from './frontdesk-settings/FrontDeskSettings';
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
  updateSetting,
  updateSettings,
  saveSettings
} from '../store/slices/frontDeskSettingsSlice';

interface FrontDeskComponentProps {
  showFrontDeskSettings?: boolean;
  setShowFrontDeskSettings?: (show: boolean) => void;
}

function FrontDeskComponent({ showFrontDeskSettings: externalShowSettings, setShowFrontDeskSettings: externalSetShowSettings }: FrontDeskComponentProps = {}) {
  // Redux
  const dispatch = useDispatch();
  const frontDeskSettings = useSelector(selectFrontDeskSettings);
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

  // State for resizable columns
  const [serviceWidth, setServiceWidth] = useState(() => {
    const saved = localStorage.getItem('serviceColumnWidth');
    return saved ? parseInt(saved) : 50; // Default 50%
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // New state for combined view
  const [isCombinedView, setIsCombinedView] = useState(() => {
    // Force Three-Column View to show Coming + Waiting stacked layout
    localStorage.removeItem('salonCenterViewMode');
    localStorage.setItem('viewLayout', 'columns');
    // Always return false to force three-column view
    return false;
  });
  // New state for mobile/tablet section tabs
  const [activeMobileSection, setActiveMobileSection] = useState(() => {
    const saved = localStorage.getItem('activeMobileSection');
    return saved || 'waitList'; // Default to waitList for tablet
  });
  // New state for active tab in combined view - changed default to 'waitList' to match workflow
  const [activeCombinedTab, setActiveCombinedTab] = useState(() => {
    const saved = localStorage.getItem('activeCombinedTab');
    return saved || 'waitList';
  });
  // New states for shared view settings when combined
  const [combinedViewMode, setCombinedViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('combinedViewMode');
    return saved === 'grid' || saved === 'list' ? saved as 'grid' | 'list' : 'list';
  });
  const [combinedCardViewMode, setCombinedCardViewMode] = useState<'normal' | 'compact'>(() => {
    const saved = localStorage.getItem('combinedCardMode');
    return saved === 'normal' || saved === 'compact' ? saved as 'normal' | 'compact' : 'normal';
  });
  const [combinedMinimizedLineView, setCombinedMinimizedLineView] = useState<boolean>(() => {
    const saved = localStorage.getItem('combinedMinimizedLineView');
    return saved === 'true' ? true : false;
  });
  // Add state for create ticket modal
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  // Add state for the salon center settings (use external state if provided)
  const [internalShowSettings, internalSetShowSettings] = useState(false);
  const showFrontDeskSettings = externalShowSettings !== undefined ? externalShowSettings : internalShowSettings;
  const setShowFrontDeskSettings = externalSetShowSettings || internalSetShowSettings;

  // Get ticket context functions and data
  const {
    createTicket,
    waitlist = [],
    serviceTickets = [],
    staff = [],
  } = useTickets();

  // State for dropdown menus
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showWaitListDropdown, setShowWaitListDropdown] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const waitListDropdownRef = useRef<HTMLDivElement>(null);
  // Add state for Wait List tab dropdown
  const [waitListTabDropdownOpen, setWaitListTabDropdownOpen] = useState(false);
  // New state for ticket config settings
  const [showTicketSettings, setShowTicketSettings] = useState(false);
  const [ticketSortOrder, setTicketSortOrder] = useState<'queue' | 'time'>(() => {
    const saved = localStorage.getItem('ticketSortOrder');
    return saved === 'queue' || saved === 'time' ? saved as 'queue' | 'time' : 'queue';
  });
  const [showUpcomingAppointments, setShowUpcomingAppointments] = useState(() => {
    // Force Coming section to be visible - reset any previous hide state
    localStorage.setItem('showUpcomingAppointments', 'true');
    return true;
  });
  const ticketSettingsRef = useRef<HTMLDivElement>(null);

  // Calculate metrics for mobile tabs - must be after showUpcomingAppointments is defined
  const mobileTabsData = useMemo((): MobileTab[] => {
    // Service metrics
    const pausedCount = serviceTickets.filter(t => t.status === 'paused').length;
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

    // Coming appointments metrics (placeholder - would come from appointments data)
    const comingCount = 0; // TODO: Get from appointments

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
  }, [serviceTickets, waitlist, staff, showUpcomingAppointments]);
  // Toggle Wait List tab dropdown - fixed to not expect event parameter
  const toggleWaitListTabDropdown = () => {
    setWaitListTabDropdownOpen(!waitListTabDropdownOpen);
  };

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
  const { handlers: swipeHandlers, isSwiping } = useSwipeGestures(
    {
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
    },
    {
      threshold: 50,
      velocity: 0.3,
      preventScroll: false,
    }
  );

  // Save active mobile section to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeMobileSection', activeMobileSection);
  }, [activeMobileSection]);

  // Save minimized sections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('minimizedSections', JSON.stringify(minimizedSections));
  }, [minimizedSections]);
  // Save active combined tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeCombinedTab', activeCombinedTab);
  }, [activeCombinedTab]);
  // Save ticket settings to localStorage
  useEffect(() => {
    localStorage.setItem('ticketSortOrder', ticketSortOrder);
    localStorage.setItem('showUpcomingAppointments', showUpcomingAppointments.toString());
  }, [ticketSortOrder, showUpcomingAppointments]);
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
      // Close Wait List tab dropdown when clicking outside
      if (waitListTabDropdownOpen && !(event.target as Element).closest('.wait-list-tab-dropdown-container')) {
        setWaitListTabDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [waitListTabDropdownOpen, showServiceDropdown, showWaitListDropdown, showTicketSettings]);
  // Toggle card view mode with persistence
  const toggleCombinedCardViewMode = () => {
    const newMode = combinedCardViewMode === 'normal' ? 'compact' : 'normal';
    setCombinedCardViewMode(newMode);
    localStorage.setItem('combinedCardViewMode', newMode);
    // Also update section-specific settings for consistency
    if (activeCombinedTab === 'service') {
      localStorage.setItem('serviceCardViewMode', newMode);
    } else if (['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)) {
      localStorage.setItem('waitListCardViewMode', newMode);
    }
  };
  // Toggle minimized line view with persistence
  const toggleCombinedMinimizedLineView = () => {
    const newValue = !combinedMinimizedLineView;
    setCombinedMinimizedLineView(newValue);
    localStorage.setItem('combinedMinimizedLineView', newValue.toString());
    // Also update section-specific settings for consistency
    if (activeCombinedTab === 'service') {
      localStorage.setItem('serviceMinimizedLineView', newValue.toString());
    } else if (['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)) {
      localStorage.setItem('waitListMinimizedLineView', newValue.toString());
    }
  };
  // Save combined view settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('combinedViewMode', combinedViewMode);
    // Also update section-specific settings for consistency
    if (activeCombinedTab === 'service') {
      localStorage.setItem('serviceViewMode', combinedViewMode);
    } else if (['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)) {
      localStorage.setItem('waitListViewMode', combinedViewMode);
    }
  }, [combinedViewMode, activeCombinedTab]);
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
  const toggleCombinedView = () => {
    const newValue = !isCombinedView;
    setIsCombinedView(newValue);
    // Only save preference on desktop
    if (deviceInfo.isDesktop) {
      localStorage.setItem('salonCenterViewMode', newValue ? 'combined' : 'column');
    }
    // When switching to combined view, sync the view settings for the active tab
    if (newValue) {
      // Load the appropriate section's view settings for the active tab
      if (activeCombinedTab === 'service') {
        // Use service section settings
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
        // Use waitlist section settings
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
  };
  // Mobile/tablet section tabs configuration - reordered to match workflow
  const mobileSectionTabs = [{
    id: 'waitList',
    label: 'Waiting Queue',
    icon: <Users size={16} className="mr-1" />,
    count: 0
  }, {
    id: 'service',
    label: 'In Service',
    icon: <FileText size={16} className="mr-1" />,
    count: 0
  }, ...(showUpcomingAppointments ? [{
    id: 'comingAppointments',
    label: 'Appointments',
    icon: <Clock size={16} className="mr-1" />,
    count: 0
  }] : [])];
  // Handle settings change
  const handleFrontDeskSettingsChange = (newSettings: Partial<FrontDeskSettingsData>) => {
    // Update Redux store
    dispatch(updateSettings(newSettings));
    dispatch(saveSettings());

    // Apply settings to the appropriate state variables
    if (newSettings.displayMode) {
      setIsCombinedView(newSettings.displayMode === 'tab');
      localStorage.setItem('salonCenterViewMode', newSettings.displayMode === 'tab' ? 'combined' : 'column');
    }
    if (newSettings.viewStyle) {
      setCombinedCardViewMode(newSettings.viewStyle === 'compact' ? 'compact' : 'normal');
      localStorage.setItem('combinedCardMode', newSettings.viewStyle === 'compact' ? 'compact' : 'normal');
    }
    if (newSettings.sortBy) {
      setTicketSortOrder(newSettings.sortBy);
      localStorage.setItem('ticketSortOrder', newSettings.sortBy);
    }
    if (newSettings.showComingAppointments !== undefined) {
      setShowUpcomingAppointments(newSettings.showComingAppointments);
      localStorage.setItem('showUpcomingAppointments', newSettings.showComingAppointments.toString());
    }
    if (newSettings.combineSections !== undefined) {
      setIsCombinedView(newSettings.combineSections);
      localStorage.setItem('salonCenterViewMode', newSettings.combineSections ? 'combined' : 'column');
    }
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
              setShowUpcomingAppointments(!showUpcomingAppointments);
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
            <StaffSidebar />
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
          {/* Simplified, subordinate styling to not compete with main header */}
          {isCombinedView && !deviceInfo.isMobile && !deviceInfo.isTablet && <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 sticky top-0 z-10 h-11">
            <div className="flex items-center gap-1 px-2">
              {/* Simplified tabs - subordinate to main header */}
              {/* In Service Tab */}
              <button
                key="service"
                onClick={() => setActiveCombinedTab('service')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  text-sm font-medium transition-all duration-150 min-h-[36px]
                  ${activeCombinedTab === 'service'
                    ? 'text-gray-900 bg-white shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
                role="tab"
                aria-selected={activeCombinedTab === 'service'}
              >
                <FileText size={16} className={activeCombinedTab === 'service' ? 'text-gray-700' : 'text-gray-400'} />
                <span>In Service</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${activeCombinedTab === 'service' ? 'bg-gray-200 text-gray-700' : 'bg-gray-200/70 text-gray-500'}`}>
                  {serviceTickets.length}
                </span>
              </button>

              {/* Waiting Queue Tab */}
              <button
                key="waitList"
                onClick={() => setActiveCombinedTab('waitList')}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  text-sm font-medium transition-all duration-150 min-h-[36px]
                  ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)
                    ? 'text-gray-900 bg-white shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
                role="tab"
                aria-selected={['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)}
              >
                <Users size={16} className={['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? 'text-gray-700' : 'text-gray-400'} />
                <span>Waiting</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? 'bg-gray-200 text-gray-700' : 'bg-gray-200/70 text-gray-500'}`}>
                  {waitlist.length}
                </span>
              </button>
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
                <div className="flex-1 overflow-hidden bg-gray-50 min-h-0" role="tabpanel" id={activeCombinedTab === 'waitList' ? 'waitlist-panel' : 'service-panel'}>
                  {/* Wait List Section - Show when active in combined view */}
                  {activeCombinedTab === 'waitList' && <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <WaitListSection isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('waitList')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} viewMode={combinedViewMode} setViewMode={setCombinedViewMode} cardViewMode={combinedCardViewMode} setCardViewMode={setCombinedCardViewMode} minimizedLineView={combinedMinimizedLineView} setMinimizedLineView={setCombinedMinimizedLineView} isCombinedView={true} hideHeader={true} headerStyles={{
                        bg: 'bg-[#F9FAFB]',
                        accentColor: '#F59E0B',
                        iconColor: 'text-[#9CA3AF]',
                        activeIconColor: 'text-[#F59E0B]',
                        titleColor: 'text-[#111827]',
                        borderColor: 'border-[#E5E7EB]',
                        counterBg: 'bg-[#E5E7EB]',
                        counterText: 'text-[#6B7280]'
                      }} />
                    </div>
                  </div>}
                  {/* Service Section - Show when active in combined view */}
                  {activeCombinedTab === 'service' && <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <ServiceSection isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('service')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} viewMode={combinedViewMode} setViewMode={setCombinedViewMode} cardViewMode={combinedCardViewMode} setCardViewMode={setCombinedCardViewMode} minimizedLineView={combinedMinimizedLineView} setMinimizedLineView={setCombinedMinimizedLineView} isCombinedView={true} hideHeader={true} headerStyles={{
                        bg: 'bg-[#F9FAFB]',
                        accentColor: '#3B82F6',
                        iconColor: 'text-[#9CA3AF]',
                        activeIconColor: 'text-[#3B82F6]',
                        titleColor: 'text-[#111827]',
                        borderColor: 'border-[#E5E7EB]',
                        counterBg: 'bg-[#E5E7EB]',
                        counterText: 'text-[#6B7280]'
                      }} />
                    </div>
                  </div>}
                </div>
                {/* Coming Appointments Section - Always shown on right side when enabled */}
                {showUpcomingAppointments && <div className={`transition-all duration-300 ease-in-out h-full ${minimizedSections.comingAppointments ? 'w-[60px] flex-shrink-0' : 'w-[280px]'}`}>
                  <ComingAppointments isMinimized={minimizedSections.comingAppointments} onToggleMinimize={() => toggleSectionMinimize('comingAppointments')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} headerStyles={{
                    bg: 'bg-[#F9FAFB]',
                    accentColor: '#10B981',
                    iconColor: 'text-[#9CA3AF]',
                    activeIconColor: 'text-[#10B981]',
                    titleColor: 'text-[#111827]',
                    borderColor: 'border-[#E5E7EB]',
                    counterBg: 'bg-[#E5E7EB]',
                    counterText: 'text-[#6B7280]'
                  }} />
                </div>}
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
                          headerStyles={{
                            bg: 'bg-gradient-to-br from-sky-50/80 via-blue-50/60 to-cyan-50/40',
                            accentColor: '#0EA5E9',
                            iconColor: 'text-[#9CA3AF]',
                            activeIconColor: 'text-[#0EA5E9]',
                            titleColor: 'text-[#111827]',
                            borderColor: 'border-sky-200/30',
                            counterBg: 'bg-sky-100',
                            counterText: 'text-sky-700'
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
                              <ServiceSection isMinimized={minimizedSections.service} onToggleMinimize={() => toggleSectionMinimize('service')} isMobile={false} headerStyles={{
                                bg: colorTokens.service.bg,
                                accentColor: '#22C55E', // service-500
                                iconColor: 'text-gray-400',
                                activeIconColor: colorTokens.service.text,
                                titleColor: 'text-gray-900',
                                borderColor: colorTokens.service.border.replace('ring', 'border'),
                                counterBg: 'bg-service-100',
                                counterText: 'text-service-700'
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
                                  setServiceWidth(newWidth);
                                  localStorage.setItem('serviceColumnWidth', newWidth.toString());
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
                                  headerStyles={{
                                    bg: colorTokens.comingAppointments.bg,
                                    accentColor: '#0EA5E9', // comingAppointments-500
                                    iconColor: 'text-gray-400',
                                    activeIconColor: colorTokens.comingAppointments.text,
                                    titleColor: 'text-gray-900',
                                    borderColor: colorTokens.comingAppointments.border.replace('ring', 'border'),
                                    counterBg: 'bg-comingAppointments-100',
                                    counterText: 'text-comingAppointments-700'
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
                                  headerStyles={{
                                    bg: colorTokens.waitList.bg,
                                    accentColor: '#A855F7', // waitList-500
                                    iconColor: 'text-gray-400',
                                    activeIconColor: colorTokens.waitList.text,
                                    titleColor: 'text-gray-900',
                                    borderColor: colorTokens.waitList.border.replace('ring', 'border'),
                                    counterBg: 'bg-waitList-100',
                                    counterText: 'text-waitList-700'
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
      {/* Create Ticket Button */}
      <CreateTicketButton onClick={() => setShowCreateTicketModal(true)} />
      {/* Floating Action Button */}
      <FloatingActionButton onCreateTicket={() => setShowCreateTicketModal(true)} />
      {/* Create Ticket Modal */}
      <CreateTicketModal isOpen={showCreateTicketModal} onClose={() => setShowCreateTicketModal(false)} onSubmit={createTicket} />
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