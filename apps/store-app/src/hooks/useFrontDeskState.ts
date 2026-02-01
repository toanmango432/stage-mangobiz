/**
 * useFrontDeskState Hook
 *
 * Centralizes all state management for the FrontDesk component.
 * Extracted from FrontDesk.tsx to reduce component complexity.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { useDeviceDetection } from './frontdesk';
import { useTickets } from './useTicketsCompat';
import { useSwipeGestures } from './useGestures';
import { haptics } from '../utils/haptics';
import { tabColors, type MobileTab } from '../components/frontdesk/MobileTabBar';
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
import type { FrontDeskSettingsData } from '../components/frontdesk-settings/types';

export interface UseFrontDeskStateReturn {
  // Redux state
  frontDeskSettings: FrontDeskSettingsData;
  ticketSortOrder: 'queue' | 'time';
  showUpcomingAppointments: boolean;
  isCombinedView: boolean;
  combinedCardViewMode: 'normal' | 'compact';

  // View state (from Redux)
  activeMobileSection: string;
  setActiveMobileSection: (section: string) => void;
  activeCombinedTab: string;
  setActiveCombinedTab: (tab: string) => void;
  combinedViewMode: 'grid' | 'list';
  setCombinedViewMode: (mode: 'grid' | 'list') => void;
  combinedMinimizedLineView: boolean;
  setCombinedMinimizedLineView: (value: boolean) => void;
  serviceWidth: number;
  setServiceWidth: (width: number) => void;

  // Local UI state
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  minimizedSections: {
    waitList: boolean;
    service: boolean;
    comingAppointments: boolean;
  };
  toggleSectionMinimize: (section: 'waitList' | 'service' | 'comingAppointments') => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;

  // Dropdown states
  showServiceDropdown: boolean;
  setShowServiceDropdown: (show: boolean) => void;
  showWaitListDropdown: boolean;
  setShowWaitListDropdown: (show: boolean) => void;
  showTicketSettings: boolean;
  setShowTicketSettings: (show: boolean) => void;
  waitListTabDropdownOpen: boolean;
  setWaitListTabDropdownOpen: (open: boolean) => void;

  // Modal states
  showCreateTicketModal: boolean;
  setShowCreateTicketModal: (show: boolean) => void;

  // Refs
  resizeRef: React.RefObject<HTMLDivElement | null>;
  serviceDropdownRef: React.RefObject<HTMLDivElement | null>;
  waitListDropdownRef: React.RefObject<HTMLDivElement | null>;
  ticketSettingsRef: React.RefObject<HTMLDivElement | null>;

  // Device info
  deviceInfo: ReturnType<typeof useDeviceDetection>;

  // Ticket data
  waitlist: any[];
  serviceTickets: any[];
  staff: any[];
  createTicket: any;

  // Mobile tabs data
  mobileTabsData: MobileTab[];

  // Swipe handlers
  swipeHandlers: ReturnType<typeof useSwipeGestures>['handlers'];
  isSwiping: boolean;

  // Helper functions
  setIsCombinedView: (value: boolean) => void;
  setCombinedCardViewMode: (mode: 'normal' | 'compact') => void;
  setTicketSortOrder: (order: 'queue' | 'time') => void;
  toggleCombinedCardViewMode: () => void;
  toggleCombinedMinimizedLineView: () => void;
  handleFrontDeskSettingsChange: (newSettings: Partial<FrontDeskSettingsData>) => void;
}

export function useFrontDeskState(): UseFrontDeskStateReturn {
  const dispatch = useAppDispatch();

  // Redux selectors
  const frontDeskSettings = useSelector(selectFrontDeskSettings);
  const ticketSortOrder = useSelector(selectSortBy);
  const showUpcomingAppointments = useSelector(selectShowComingAppointments);
  const isCombinedView = useSelector(selectIsCombinedView);
  const combinedCardViewMode = useSelector(selectCardViewMode);

  // View state from Redux
  const activeMobileSection = useSelector(selectActiveMobileSection);
  const activeCombinedTab = useSelector(selectActiveCombinedTab);
  const combinedViewMode = useSelector(selectCombinedViewMode);
  const combinedMinimizedLineView = useSelector(selectCombinedMinimizedLineView);
  const serviceWidth = useSelector(selectServiceColumnWidth);

  // View state setters
  const setActiveMobileSection = useCallback((section: string) => {
    dispatch(setActiveMobileSectionAction(section));
  }, [dispatch]);

  const setActiveCombinedTab = useCallback((tab: string) => {
    dispatch(setActiveCombinedTabAction(tab));
  }, [dispatch]);

  const setCombinedViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch(setCombinedViewModeAction(mode));
  }, [dispatch]);

  const setCombinedMinimizedLineView = useCallback((value: boolean) => {
    dispatch(setCombinedMinimizedLineViewAction(value));
  }, [dispatch]);

  const setServiceWidth = useCallback((width: number) => {
    dispatch(setServiceColumnWidthAction(width));
  }, [dispatch]);

  // Local UI state
  const [showSidebar, setShowSidebar] = useState(false);
  const [minimizedSections, setMinimizedSections] = useState(() => {
    localStorage.removeItem('minimizedSections');
    return {
      waitList: false,
      service: false,
      comingAppointments: true,
    };
  });
  const [isResizing, setIsResizing] = useState(false);

  // Dropdown states
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showWaitListDropdown, setShowWaitListDropdown] = useState(false);
  const [showTicketSettings, setShowTicketSettings] = useState(false);
  const [waitListTabDropdownOpen, setWaitListTabDropdownOpen] = useState(false);

  // Modal states
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

  // Refs
  const resizeRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const waitListDropdownRef = useRef<HTMLDivElement>(null);
  const ticketSettingsRef = useRef<HTMLDivElement>(null);

  // Device detection
  const deviceInfo = useDeviceDetection();

  // Ticket data
  const {
    createTicket,
    waitlist = [],
    serviceTickets = [],
    staff = [],
  } = useTickets();

  // Helper callbacks
  const setIsCombinedView = useCallback((value: boolean) => {
    dispatch(updateSettings({
      displayMode: value ? 'tab' : 'column',
      combineSections: value,
    }));
  }, [dispatch]);

  const setCombinedCardViewMode = useCallback((mode: 'normal' | 'compact') => {
    dispatch(updateSettings({
      viewStyle: mode === 'compact' ? 'compact' : 'expanded',
    }));
  }, [dispatch]);

  const setTicketSortOrder = useCallback((order: 'queue' | 'time') => {
    dispatch(updateSettings({ sortBy: order }));
  }, [dispatch]);

  const toggleSectionMinimize = useCallback((section: 'waitList' | 'service' | 'comingAppointments') => {
    setMinimizedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const toggleCombinedCardViewMode = useCallback(() => {
    const newMode = combinedCardViewMode === 'normal' ? 'compact' : 'normal';
    setCombinedCardViewMode(newMode);
  }, [combinedCardViewMode, setCombinedCardViewMode]);

  const toggleCombinedMinimizedLineView = useCallback(() => {
    setCombinedMinimizedLineView(!combinedMinimizedLineView);
  }, [combinedMinimizedLineView, setCombinedMinimizedLineView]);

  const handleFrontDeskSettingsChange = useCallback((newSettings: Partial<FrontDeskSettingsData>) => {
    dispatch(updateSettings(newSettings));
    dispatch(saveSettings());
  }, [dispatch]);

  // Calculate mobile tabs data
  const mobileTabsData = useMemo((): MobileTab[] => {
    const pausedCount = serviceTickets.filter((t: any) => t.status === 'paused').length;
    const serviceSecondary = pausedCount > 0 ? `${pausedCount} paused` : undefined;

    const waitingCount = waitlist.length;
    const avgWaitTime = waitlist.length > 0
      ? Math.round(waitlist.reduce((sum: number, t: any) => {
          const waitMs = Date.now() - new Date(t.createdAt).getTime();
          return sum + waitMs / 60000;
        }, 0) / waitlist.length)
      : 0;
    const waitSecondary = avgWaitTime > 0 ? `${avgWaitTime}m avg` : undefined;
    const hasLongWait = waitlist.some((t: any) => {
      const waitMs = Date.now() - new Date(t.createdAt).getTime();
      return waitMs > 20 * 60 * 1000;
    });

    const comingCount = 0;

    const teamCount = staff.length;
    const readyCount = staff.filter((s: any) => s.status === 'ready').length;
    const teamSecondary = readyCount > 0 ? `${readyCount} ready` : undefined;

    return [
      {
        id: 'team',
        label: 'Team',
        shortLabel: 'Team',
        icon: 'team' as const,
        metrics: { count: teamCount, secondary: teamSecondary },
        color: tabColors.team,
      },
      {
        id: 'service',
        label: 'In Service',
        shortLabel: 'Service',
        icon: 'service',
        metrics: { count: serviceTickets.length, secondary: serviceSecondary },
        color: tabColors.service,
      },
      {
        id: 'waitList',
        label: 'Waiting',
        shortLabel: 'Waiting',
        icon: 'waiting',
        metrics: { count: waitingCount, secondary: waitSecondary, urgent: hasLongWait },
        color: tabColors.waiting,
      },
      ...(showUpcomingAppointments ? [{
        id: 'comingAppointments',
        label: 'Appointments',
        shortLabel: 'Appts',
        icon: 'appointments' as const,
        metrics: { count: comingCount },
        color: tabColors.appointments,
      }] : []),
    ];
  }, [serviceTickets, waitlist, staff, showUpcomingAppointments]);

  // Swipe handlers
  const handleSwipeLeft = useCallback(() => {
    if (isCombinedView) {
      if (activeCombinedTab === 'service') {
        haptics.selection();
        setActiveCombinedTab('waitList');
      }
    } else {
      const tabs = ['team', 'service', 'waitList', ...(showUpcomingAppointments ? ['comingAppointments'] : [])];
      const currentIndex = tabs.indexOf(activeMobileSection);
      if (currentIndex < tabs.length - 1) {
        haptics.selection();
        setActiveMobileSection(tabs[currentIndex + 1]);
      }
    }
  }, [isCombinedView, activeCombinedTab, activeMobileSection, showUpcomingAppointments, setActiveCombinedTab, setActiveMobileSection]);

  const handleSwipeRight = useCallback(() => {
    if (isCombinedView) {
      if (['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)) {
        haptics.selection();
        setActiveCombinedTab('service');
      }
    } else {
      const tabs = ['team', 'service', 'waitList', ...(showUpcomingAppointments ? ['comingAppointments'] : [])];
      const currentIndex = tabs.indexOf(activeMobileSection);
      if (currentIndex > 0) {
        haptics.selection();
        setActiveMobileSection(tabs[currentIndex - 1]);
      }
    }
  }, [isCombinedView, activeCombinedTab, activeMobileSection, showUpcomingAppointments, setActiveCombinedTab, setActiveMobileSection]);

  const { handlers: swipeHandlers, isSwiping } = useSwipeGestures(
    { onSwipeLeft: handleSwipeLeft, onSwipeRight: handleSwipeRight },
    { threshold: 50, velocity: 0.5, preventScroll: false, edgeSwipeOnly: true, edgeThreshold: 30 }
  );

  // Save minimized sections to localStorage
  useEffect(() => {
    localStorage.setItem('minimizedSections', JSON.stringify(minimizedSections));
  }, [minimizedSections]);

  // Auto-set view mode based on device
  useEffect(() => {
    const isActuallyDesktop = window.innerWidth >= 1024;
    if (isActuallyDesktop) {
      localStorage.removeItem('salonCenterViewMode');
      setIsCombinedView(false);
    } else {
      setIsCombinedView(true);
    }
  }, [deviceInfo.isMobile, deviceInfo.isTablet, deviceInfo.isDesktop, setIsCombinedView]);

  // Auto-minimize sections on mobile/tablet
  useEffect(() => {
    if (deviceInfo.isMobile || deviceInfo.isTablet) {
      setMinimizedSections(prev => ({
        ...prev,
        waitList: activeMobileSection !== 'waitList',
        service: activeMobileSection !== 'service',
        comingAppointments: activeMobileSection !== 'comingAppointments',
      }));
    }
  }, [deviceInfo.isMobile, deviceInfo.isTablet, activeMobileSection]);

  // Close dropdowns on click outside
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
      if (waitListTabDropdownOpen && !(event.target as Element).closest('.wait-list-tab-dropdown-container')) {
        setWaitListTabDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [waitListTabDropdownOpen]);

  return {
    // Redux state
    frontDeskSettings,
    ticketSortOrder,
    showUpcomingAppointments,
    isCombinedView,
    combinedCardViewMode,

    // View state
    activeMobileSection,
    setActiveMobileSection,
    activeCombinedTab,
    setActiveCombinedTab,
    combinedViewMode,
    setCombinedViewMode,
    combinedMinimizedLineView,
    setCombinedMinimizedLineView,
    serviceWidth,
    setServiceWidth,

    // Local UI state
    showSidebar,
    setShowSidebar,
    minimizedSections,
    toggleSectionMinimize,
    isResizing,
    setIsResizing,

    // Dropdown states
    showServiceDropdown,
    setShowServiceDropdown,
    showWaitListDropdown,
    setShowWaitListDropdown,
    showTicketSettings,
    setShowTicketSettings,
    waitListTabDropdownOpen,
    setWaitListTabDropdownOpen,

    // Modal states
    showCreateTicketModal,
    setShowCreateTicketModal,

    // Refs
    resizeRef,
    serviceDropdownRef,
    waitListDropdownRef,
    ticketSettingsRef,

    // Device info
    deviceInfo,

    // Ticket data
    waitlist,
    serviceTickets,
    staff,
    createTicket,

    // Mobile tabs data
    mobileTabsData,

    // Swipe handlers
    swipeHandlers,
    isSwiping,

    // Helper functions
    setIsCombinedView,
    setCombinedCardViewMode,
    setTicketSortOrder,
    toggleCombinedCardViewMode,
    toggleCombinedMinimizedLineView,
    handleFrontDeskSettingsChange,
  };
}

export default useFrontDeskState;
