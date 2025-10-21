import React, { useEffect, useState, useRef, Component } from 'react';
import { SalonHeader } from './SalonHeader';
import { StaffSidebar } from './StaffSidebar';
import { ServiceSection } from './ServiceSection';
import { WaitListSection } from './WaitListSection';
import { PendingTickets } from './PendingTickets';
import { ComingAppointments } from './ComingAppointments';
import { CreateTicketButton } from './CreateTicketButton';
import { CreateTicketModal } from './CreateTicketModal';
import { ClosedTickets } from './ClosedTickets';
import { useTickets } from '../context/TicketContext';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FileText, Users, Columns, LayoutGrid, LayoutDashboard, ChevronDown, Check, ChevronUp, MoreVertical, List, Grid, Settings, ArrowDownAZ, ArrowDownZA, Eye, EyeOff, Clock, ListFilter, Receipt, Archive, ChevronRight, ChevronLeft, Maximize2 } from 'lucide-react';
import { SalonCenterSettings, SalonCenterSettingsData, defaultSalonCenterSettings } from './SalonCenterSettings';
export function SalonCenter() {
  const [activeTab, setActiveTab] = useState('salonCenter');
  const [showSidebar, setShowSidebar] = useState(false);
  const [minimizedSections, setMinimizedSections] = useState({
    waitList: false,
    service: false,
    pendingTickets: true,
    comingAppointments: false
  });
  // Enhanced device detection with orientation
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isPortrait: false,
    isDesktop: false
  });
  // New state for combined view
  const [isCombinedView, setIsCombinedView] = useState(() => {
    // Default to column view on desktop, tabs on mobile/tablet
    const savedView = localStorage.getItem('salonCenterViewMode');
    // If we have a saved preference and we're on desktop, use it
    if (savedView && window.matchMedia('(min-width: 1024px)').matches) {
      return savedView === 'combined';
    }
    // Default to column view (not combined) for desktop
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
  // Add state for Closed Tickets
  const [showClosedTickets, setShowClosedTickets] = useState(false);
  // Add state for the salon center settings
  const [showSalonCenterSettings, setShowSalonCenterSettings] = useState(false);
  const [salonCenterSettings, setSalonCenterSettings] = useState<SalonCenterSettingsData>(() => {
    // Initialize with default settings or from localStorage if available
    return defaultSalonCenterSettings;
  });
  // Get ticket context functions
  const {
    createTicket
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
    const saved = localStorage.getItem('showUpcomingAppointments');
    return saved !== 'false'; // Default to true
  });
  const ticketSettingsRef = useRef<HTMLDivElement>(null);
  // Toggle Wait List tab dropdown - fixed to not expect event parameter
  const toggleWaitListTabDropdown = () => {
    setWaitListTabDropdownOpen(!waitListTabDropdownOpen);
  };
  // Save active mobile section to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeMobileSection', activeMobileSection);
  }, [activeMobileSection]);
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
  // Enhanced device detection with orientation
  useEffect(() => {
    const checkDeviceInfo = () => {
      const mobileQuery = window.matchMedia('(max-width: 767px)');
      const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
      const desktopQuery = window.matchMedia('(min-width: 1024px)');
      const portraitQuery = window.matchMedia('(orientation: portrait)');
      const isMobile = mobileQuery.matches;
      const isTablet = tabletQuery.matches;
      const isPortrait = portraitQuery.matches;
      const isDesktop = desktopQuery.matches;
      setDeviceInfo({
        isMobile,
        isTablet,
        isPortrait,
        isDesktop
      });
      // Automatically set view mode based on device
      if (isMobile || isTablet) {
        // Force Tabs view on mobile/tablet
        setIsCombinedView(true);
      } else if (isDesktop) {
        // On desktop, restore user preference or default to Column view
        const savedView = localStorage.getItem('salonCenterViewMode');
        if (savedView) {
          setIsCombinedView(savedView === 'combined');
        } else {
          // Default to Column view (not combined) for desktop
          setIsCombinedView(false);
        }
      }
    };
    // Initial check
    checkDeviceInfo();
    // Add event listeners for window resize and orientation change
    window.addEventListener('resize', checkDeviceInfo);
    window.addEventListener('orientationchange', checkDeviceInfo);
    // Clean up
    return () => {
      window.removeEventListener('resize', checkDeviceInfo);
      window.removeEventListener('orientationchange', checkDeviceInfo);
    };
  }, []);
  // Auto-minimize sections on mobile and tablet for better UX
  useEffect(() => {
    if (deviceInfo.isMobile || deviceInfo.isTablet) {
      setMinimizedSections(prev => ({
        ...prev,
        waitList: activeMobileSection !== 'waitList',
        service: activeMobileSection !== 'service',
        comingAppointments: activeMobileSection !== 'comingAppointments',
        pendingTickets: true // Always keep pending tickets minimized on mobile/tablet
      }));
    }
  }, [deviceInfo.isMobile, deviceInfo.isTablet, activeMobileSection]);
  const toggleSectionMinimize = (section: 'waitList' | 'service' | 'pendingTickets' | 'comingAppointments') => {
    // Keep Coming Appointments behavior unchanged
    if (section === 'comingAppointments') {
      setMinimizedSections(prev => ({
        ...prev,
        comingAppointments: !prev.comingAppointments
      }));
      return;
    }
    // On mobile or tablet, minimize other sections when opening one
    if ((deviceInfo.isMobile || deviceInfo.isTablet) && !minimizedSections[section]) {
      if (section === 'pendingTickets') {
        // Only toggle pendingTickets without affecting other sections on mobile/tablet
        setMinimizedSections(prev => ({
          ...prev,
          pendingTickets: !prev.pendingTickets
        }));
      } else {
        setMinimizedSections(prev => ({
          ...prev,
          waitList: section !== 'waitList',
          service: section !== 'service',
          comingAppointments: prev.comingAppointments,
          // Keep pendingTickets minimized on mobile/tablet
          pendingTickets: prev.pendingTickets
        }));
        // Also update the active mobile section to match
        setActiveMobileSection(section);
      }
    } else {
      // For desktop, just toggle the specific section
      setMinimizedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
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
    label: 'Wait List',
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
  // Combined view tabs - reordered to match workflow: Wait List → In Service → Appointments
  const combinedTabs = [{
    id: 'waitList',
    label: 'Wait List',
    icon: <Users size={16} className="mr-1" />,
    count: 0
  }, {
    id: 'service',
    label: 'In Service',
    icon: <FileText size={16} className="mr-1" />,
    count: 0
  }];
  // Handle settings change
  const handleSalonCenterSettingsChange = (newSettings: Partial<SalonCenterSettingsData>) => {
    setSalonCenterSettings(prev => ({
      ...prev,
      ...newSettings
    }));
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
    return <div className="absolute top-1 right-1 z-10">
        {/* Settings icon in the top-right */}
        <div className="relative" ref={ticketSettingsRef}>
          <Tippy content="Salon Center Settings">
            <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowSalonCenterSettings(true)}>
              <Settings size={16} />
            </button>
          </Tippy>
          {/* Remove the old ticket settings dropdown */}
        </div>
        {/* Mobile/tablet controls - keep these but remove the background bar */}
        {(deviceInfo.isMobile || deviceInfo.isTablet) && <div className="flex items-center space-x-1 mt-2">
            <Tippy content="Sort tickets">
              <button className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" onClick={() => {
            setTicketSortOrder(ticketSortOrder === 'queue' ? 'time' : 'queue');
            handleSalonCenterSettingsChange({
              sortBy: ticketSortOrder === 'queue' ? 'time' : 'queue'
            });
          }}>
                {ticketSortOrder === 'queue' ? <ListFilter size={16} /> : <Clock size={16} />}
              </button>
            </Tippy>
            <Tippy content={showUpcomingAppointments ? 'Hide upcoming' : 'Show upcoming'}>
              <button className="p-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" onClick={() => {
            setShowUpcomingAppointments(!showUpcomingAppointments);
            handleSalonCenterSettingsChange({
              showComingAppointments: !showUpcomingAppointments
            });
          }}>
                {showUpcomingAppointments ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </Tippy>
          </div>}
      </div>;
  };
  // Color tokens for section styling
  const colorTokens = {
    waitList: {
      primary: '#FECF4D',
      bg: 'bg-[#FFF8E6]',
      text: 'text-[#B07D00]',
      border: 'ring-[#FECF4D]/30',
      iconBg: 'bg-[#FECF4D]',
      hoverBg: 'hover:bg-[#FFF8E6]/50',
      hoverText: 'hover:text-[#B07D00]',
      dropdownHover: 'hover:bg-[#FFF8E6]',
      checkColor: 'text-[#FECF4D]'
    },
    service: {
      primary: '#4DA6FF',
      bg: 'bg-[#EBF5FF]',
      text: 'text-[#0070E0]',
      border: 'ring-[#4DA6FF]/30',
      iconBg: 'bg-[#4DA6FF]',
      hoverBg: 'hover:bg-[#EBF5FF]/50',
      hoverText: 'hover:text-[#0070E0]',
      dropdownHover: 'hover:bg-[#EBF5FF]',
      checkColor: 'text-[#4DA6FF]'
    },
    comingAppointments: {
      primary: '#00C49A',
      bg: 'bg-[#E6FFF9]',
      text: 'text-[#007A5E]',
      border: 'ring-[#00C49A]/30',
      iconBg: 'bg-[#00C49A]',
      hoverBg: 'hover:bg-[#E6FFF9]/50',
      hoverText: 'hover:text-[#00C49A]',
      dropdownHover: 'hover:bg-[#E6FFF9]',
      checkColor: 'text-[#00C49A]'
    },
    pendingTickets: {
      primary: '#FF6B6B',
      bg: 'bg-[#FFF0F0]',
      text: 'text-[#CC3333]',
      border: 'ring-[#FF6B6B]/30',
      iconBg: 'bg-[#FF6B6B]',
      hoverBg: 'hover:bg-[#FFF0F0]/50',
      hoverText: 'hover:text-[#CC3333]',
      dropdownHover: 'hover:bg-[#FFF0F0]',
      checkColor: 'text-[#FF6B6B]'
    },
    closedTickets: {
      primary: '#94A3B8',
      bg: 'bg-[#F1F5F9]',
      text: 'text-[#475569]',
      border: 'ring-[#94A3B8]/30',
      iconBg: 'bg-[#94A3B8]',
      hoverBg: 'hover:bg-[#F1F5F9]/50',
      hoverText: 'hover:text-[#475569]',
      dropdownHover: 'hover:bg-[#F1F5F9]',
      checkColor: 'text-[#94A3B8]'
    }
  };
  return <div className="flex flex-col h-screen bg-gray-50">
      <SalonHeader activeTab={activeTab} setActiveTab={setActiveTab} showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with improved mobile handling */}
        <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 h-[calc(100vh-60px)] transition-transform duration-300 ease-in-out`}>
          <StaffSidebar />
        </div>
        {/* Overlay for mobile sidebar */}
        {showSidebar && <div className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>}
        {/* Enhanced visual separator between tech and service sections */}
        <div className="hidden md:block w-px bg-gray-200 relative"></div>
        {/* Main content area with flex layout for optimal space usage */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
          {/* Mobile/Tablet section tabs - show on mobile and tablet when not in combined view */}
          {(deviceInfo.isMobile || deviceInfo.isTablet) && !isCombinedView && <div className="flex overflow-x-auto no-scrollbar bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 h-14 whitespace-nowrap">
              {mobileSectionTabs.map(tab => <button key={tab.id} className={`inline-flex items-center h-14 min-w-[100px] px-3 text-[15px] font-medium whitespace-nowrap transition-colors ${activeMobileSection === tab.id ? 'text-[#00D0E0] border-b-2 border-[#00D0E0]' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveMobileSection(tab.id)}>
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                  <span className={`ml-1.5 ${activeMobileSection === tab.id ? 'bg-[#00D0E0]/10 text-[#00D0E0]' : 'bg-gray-100 text-gray-600'} text-xs px-1.5 py-0.5 rounded-full`}>
                    {tab.count}
                  </span>
                </button>)}
              {/* Toggle combined view button for mobile */}
              <Tippy content="Combine sections">
                <button className="inline-flex items-center justify-center h-14 w-10 text-sm font-medium whitespace-nowrap text-gray-500 hover:text-[#00D0E0] hover:bg-gray-50 ml-3 opacity-80 hover:opacity-100" onClick={toggleCombinedView} aria-label="Combine sections">
                  <LayoutGrid size={20} />
                </button>
              </Tippy>
            </div>}
          {/* Combined view tabs - styled to match the design */}
          {isCombinedView && <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10 h-14 md:h-14">
              <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap px-3 py-2">
                {/* IMPORTANT NOTE: This tab order (In Service → Wait List → Appointments) is FINAL and should NEVER be changed without explicit approval */}
                {/* In Service Tab - Blue #4DA6FF theme */}
                <button key="service" className={`inline-flex items-center h-10 min-w-[120px] px-4 text-[15px] font-medium whitespace-nowrap transition-all duration-200 relative rounded-xl ${activeCombinedTab === 'service' ? `${colorTokens.service.bg} ${colorTokens.service.text} shadow-sm ${colorTokens.service.border} ring-1 font-medium` : `text-gray-600 ${colorTokens.service.hoverText} ${colorTokens.service.hoverBg}`}`} onClick={() => setActiveCombinedTab('service')} role="tab" aria-selected={activeCombinedTab === 'service'} aria-controls="service-panel" id="service-tab">
                  <div className={`mr-2 p-1.5 rounded-full ${activeCombinedTab === 'service' ? colorTokens.service.iconBg : 'bg-gray-400'} shadow-sm`}>
                    <FileText size={14} className="text-white" />
                  </div>
                  <span className={`truncate ${activeCombinedTab === 'service' ? 'tracking-wide' : ''}`}>
                    In Service
                  </span>
                  <div className={`ml-2 ${activeCombinedTab === 'service' ? colorTokens.service.iconBg : 'bg-gray-400'} text-white text-xs px-2 py-0.5 rounded-full shadow-sm`}>
                    0
                  </div>
                </button>
                {/* Wait List Tab with dropdown for Walk-In and Appt - Yellow #FECF4D theme */}
                <div className="flex items-center relative wait-list-tab-dropdown-container ml-2">
                  {/* Wait List Tab */}
                  <button key="waitList" className={`inline-flex items-center h-10 min-w-[120px] px-4 text-[15px] font-medium whitespace-nowrap transition-all duration-200 relative rounded-xl ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? `${colorTokens.waitList.bg} ${colorTokens.waitList.text} shadow-sm ${colorTokens.waitList.border} ring-1 font-medium` : `text-gray-600 ${colorTokens.waitList.hoverText} ${colorTokens.waitList.hoverBg}`}`} onClick={() => setActiveCombinedTab('waitList')} role="tab" aria-selected={['waitList', 'walkIn', 'appt'].includes(activeCombinedTab)} aria-controls="waitlist-panel" id="waitlist-tab">
                    <div className={`mr-2 p-1.5 rounded-full ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? colorTokens.waitList.iconBg : 'bg-gray-400'} shadow-sm`}>
                      <Users size={14} className="text-white" />
                    </div>
                    <span className={`truncate ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? 'tracking-wide' : ''}`}>
                      {activeCombinedTab === 'waitList' ? 'Wait List' : activeCombinedTab === 'walkIn' ? 'Walk-In' : activeCombinedTab === 'appt' ? 'Appt' : 'Wait List'}
                    </span>
                    <div className={`ml-2 ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? colorTokens.waitList.iconBg : 'bg-gray-400'} text-white text-xs px-2 py-0.5 rounded-full shadow-sm`}>
                      0
                    </div>
                  </button>
                  {/* Dropdown toggle button - completely separate from main button */}
                  <button className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ml-1 ${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? `${colorTokens.waitList.text} ${colorTokens.waitList.hoverBg} ${colorTokens.waitList.border} ring-1` : 'text-gray-400 hover:bg-gray-100'} transition-colors`} onClick={e => {
                e.stopPropagation();
                toggleWaitListTabDropdown();
              }} aria-label="Show more options" aria-expanded={waitListTabDropdownOpen} aria-haspopup="true">
                    <ChevronDown size={16} className={`${['waitList', 'walkIn', 'appt'].includes(activeCombinedTab) ? colorTokens.waitList.text : 'text-gray-600'}`} />
                  </button>
                </div>
                {/* Coming Appointments Tab - Removed as it should always be on the right side */}
                {/* No longer needed as a tab */}
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
          <div className="flex-1 flex flex-col p-2.5 sm:p-3 relative h-full bg-gray-50">
            {/* Position the TicketsHeader absolutely in the top right */}
            <TicketsHeader />
            {/* Main content container */}
            <div className="flex flex-col h-full">
              {/* Combined view */}
              {isCombinedView ? <div className="flex h-full overflow-hidden">
                  {/* Main content area - takes remaining width */}
                  <div className="flex-1 overflow-auto bg-gray-50" role="tabpanel" id={activeCombinedTab === 'waitList' ? 'waitlist-panel' : 'service-panel'}>
                    {/* Wait List Section - Show when active in combined view */}
                    {activeCombinedTab === 'waitList' && <div className="h-full flex flex-col">
                        <div className="flex-grow mb-3">
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
                        {/* Pending Tickets - always below Wait List in combined view */}
                        <div className={`${minimizedSections.pendingTickets ? 'h-[46px]' : 'h-[220px]'} transition-all duration-300 ease-in-out overflow-hidden`}>
                          <PendingTickets isMinimized={minimizedSections.pendingTickets} onToggleMinimize={() => toggleSectionMinimize('pendingTickets')} headerStyles={{
                      bg: 'bg-[#F9FAFB]',
                      accentColor: '#EF4444',
                      iconColor: 'text-[#9CA3AF]',
                      activeIconColor: '#EF4444',
                      titleColor: 'text-[#111827]',
                      borderColor: 'border-[#E5E7EB]',
                      counterBg: 'bg-[#E5E7EB]',
                      counterText: 'text-[#6B7280]'
                    }} />
                        </div>
                        {/* Closed Tickets Button */}
                        <div className="mt-3 mb-3 flex justify-start">
                          <button onClick={() => setShowClosedTickets(true)} className="flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] text-[#111827] rounded-xl border border-[#E5E7EB] shadow-sm transition-all hover:shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 w-[200px]" aria-label="View closed tickets">
                            <div className="flex items-center">
                              <Archive size={18} className="text-[#9CA3AF] mr-2.5" />
                              <span className="text-[15px] font-medium text-[#111827]">
                                Closed Tickets
                              </span>
                            </div>
                            <div className="bg-[#E5E7EB] text-[#6B7280] text-xs px-2 py-0.5 rounded-full">
                              0
                            </div>
                          </button>
                        </div>
                      </div>}
                    {/* Service Section - Show when active in combined view */}
                    {activeCombinedTab === 'service' && <div className="h-full flex flex-col">
                        <div className="flex-grow mb-3">
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
                        {/* Pending Tickets - always below Service in combined view */}
                        <div className={`${minimizedSections.pendingTickets ? 'h-[46px]' : 'h-[220px]'} transition-all duration-300 ease-in-out overflow-hidden`}>
                          <PendingTickets isMinimized={minimizedSections.pendingTickets} onToggleMinimize={() => toggleSectionMinimize('pendingTickets')} headerStyles={{
                      bg: 'bg-[#F9FAFB]',
                      accentColor: '#EF4444',
                      iconColor: 'text-[#9CA3AF]',
                      activeIconColor: '#EF4444',
                      titleColor: 'text-[#111827]',
                      borderColor: 'border-[#E5E7EB]',
                      counterBg: 'bg-[#E5E7EB]',
                      counterText: 'text-[#6B7280]'
                    }} />
                        </div>
                        {/* Closed Tickets Button */}
                        <div className="mt-3 mb-3 flex justify-start">
                          <button onClick={() => setShowClosedTickets(true)} className="flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] text-[#111827] rounded-xl border border-[#E5E7EB] shadow-sm transition-all hover:shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 w-[200px]" aria-label="View closed tickets">
                            <div className="flex items-center">
                              <Archive size={18} className="text-[#9CA3AF] mr-2.5" />
                              <span className="text-[15px] font-medium text-[#111827]">
                                Closed Tickets
                              </span>
                            </div>
                            <div className="bg-[#E5E7EB] text-[#6B7280] text-xs px-2 py-0.5 rounded-full">
                              0
                            </div>
                          </button>
                        </div>
                      </div>}
                  </div>
                  {/* Coming Appointments Section - Always shown on right side when enabled */}
                  {showUpcomingAppointments && <div className={`transition-all duration-300 ease-in-out h-full ${minimizedSections.comingAppointments ? 'w-[60px] flex-shrink-0' : 'w-[280px]'} ml-3`}>
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
                  <div className={`${deviceInfo.isMobile || deviceInfo.isTablet ? 'overflow-auto flex-1' : 'flex flex-1 overflow-hidden'} bg-gray-50 h-full`}>
                    {/* For tablet and mobile: Show sections based on active tab */}
                    {deviceInfo.isMobile || deviceInfo.isTablet ? <>
                        {/* Wait List Section - Show when active on mobile/tablet */}
                        {activeMobileSection === 'waitList' && <div className="h-full flex flex-col">
                            <div className="flex-grow mb-3">
                              <WaitListSection isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('waitList')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} headerStyles={{
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
                            {/* Pending Tickets - always below Wait List on mobile */}
                            <div className={`fixed bottom-0 left-0 right-0 z-20 ${minimizedSections.pendingTickets ? 'max-h-[46px]' : 'max-h-[40vh]'} px-2 pb-2 transition-all duration-300 ease-in-out overflow-hidden`}>
                              <PendingTickets isMinimized={minimizedSections.pendingTickets} onToggleMinimize={() => toggleSectionMinimize('pendingTickets')} headerStyles={{
                        bg: 'bg-[#F9FAFB]',
                        accentColor: '#EF4444',
                        iconColor: 'text-[#9CA3AF]',
                        activeIconColor: '#EF4444',
                        titleColor: 'text-[#111827]',
                        borderColor: 'border-[#E5E7EB]',
                        counterBg: 'bg-[#E5E7EB]',
                        counterText: 'text-[#6B7280]'
                      }} />
                            </div>
                            {/* Add padding at bottom to prevent content from being hidden behind fixed Pending Tickets */}
                            <div className="h-[46px]"></div>
                          </div>}
                        {/* Service Section - Show when active on mobile/tablet */}
                        {activeMobileSection === 'service' && <div className="h-full flex flex-col">
                            <div className="flex-grow mb-3">
                              <ServiceSection isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('service')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} headerStyles={{
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
                            {/* Pending Tickets - always below Service on mobile */}
                            <div className={`fixed bottom-0 left-0 right-0 z-20 ${minimizedSections.pendingTickets ? 'max-h-[46px]' : 'max-h-[40vh]'} px-2 pb-2 transition-all duration-300 ease-in-out overflow-hidden`}>
                              <PendingTickets isMinimized={minimizedSections.pendingTickets} onToggleMinimize={() => toggleSectionMinimize('pendingTickets')} headerStyles={{
                        bg: 'bg-[#F9FAFB]',
                        accentColor: '#EF4444',
                        iconColor: 'text-[#9CA3AF]',
                        activeIconColor: '#EF4444',
                        titleColor: 'text-[#111827]',
                        borderColor: 'border-[#E5E7EB]',
                        counterBg: 'bg-[#E5E7EB]',
                        counterText: 'text-[#6B7280]'
                      }} />
                            </div>
                            {/* Add padding at bottom to prevent content from being hidden behind fixed Pending Tickets */}
                            <div className="h-[46px]"></div>
                          </div>}
                        {/* Coming Appointments Section - Show when active on mobile/tablet */}
                        {activeMobileSection === 'comingAppointments' && <div className="h-full pr-0">
                            <ComingAppointments isMinimized={false} onToggleMinimize={() => toggleSectionMinimize('comingAppointments')} isMobile={deviceInfo.isMobile || deviceInfo.isTablet} headerStyles={{
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
                      </> : <>
                        {/* Desktop layout with horizontal expansion/collapse - UPDATED FOR PROPER ALIGNMENT */}
                        <div className="flex h-full w-full">
                          {/* Left side: Main content area with Service, Wait List, Pending Tickets and Closed Tickets */}
                          <div className="flex flex-col flex-1 overflow-hidden mr-3">
                            {/* Top row with In Service and Wait List side by side */}
                            <div className="flex flex-1 mb-3">
                              {/* Left Column - In Service (collapses sideways) */}
                              <div className={`transition-all duration-300 ease-in-out h-full ${minimizedSections.service ? 'w-[60px] flex-shrink-0' : minimizedSections.waitList ? 'flex-1' : 'w-1/2'}`}>
                                <ServiceSection isMinimized={minimizedSections.service} onToggleMinimize={() => toggleSectionMinimize('service')} isMobile={false} headerStyles={{
                            bg: 'bg-[#E8F2FF]',
                            accentColor: '#3B82F6',
                            iconColor: 'text-[#9CA3AF]',
                            activeIconColor: 'text-[#3B82F6]',
                            titleColor: 'text-[#111827]',
                            borderColor: 'border-[#E8F2FF]/50',
                            counterBg: 'bg-[#E5E7EB]',
                            counterText: 'text-[#6B7280]'
                          }} />
                              </div>
                              {/* Right Column - Wait List (collapses sideways) */}
                              <div className={`transition-all duration-300 ease-in-out h-full ml-3 ${minimizedSections.waitList ? 'w-[60px] flex-shrink-0' : minimizedSections.service ? 'flex-1' : 'w-1/2'}`}>
                                <WaitListSection isMinimized={minimizedSections.waitList} onToggleMinimize={() => toggleSectionMinimize('waitList')} isMobile={false} headerStyles={{
                            bg: 'bg-[#E8F2FF]',
                            accentColor: '#F59E0B',
                            iconColor: 'text-[#9CA3AF]',
                            activeIconColor: 'text-[#F59E0B]',
                            titleColor: 'text-[#111827]',
                            borderColor: 'border-[#E8F2FF]/50',
                            counterBg: 'bg-[#E5E7EB]',
                            counterText: 'text-[#6B7280]'
                          }} />
                              </div>
                            </div>
                            {/* Bottom section for Pending Tickets - width matches combined width of Service and Wait List */}
                            <div className="flex flex-col">
                              {/* Pending Tickets with vertical expansion */}
                              <div className={`${minimizedSections.pendingTickets ? 'h-[46px]' : 'h-[220px]'} transition-all duration-300 ease-in-out overflow-hidden w-full`} style={{
                          boxShadow: !minimizedSections.pendingTickets ? '0 6px 24px rgba(0,0,0,.08)' : 'none'
                        }}>
                                <PendingTickets isMinimized={minimizedSections.pendingTickets} onToggleMinimize={() => toggleSectionMinimize('pendingTickets')} headerStyles={{
                            bg: 'bg-[#F9FAFB]',
                            accentColor: '#EF4444',
                            iconColor: 'text-[#9CA3AF]',
                            activeIconColor: '#EF4444',
                            titleColor: 'text-[#111827]',
                            borderColor: 'border-[#E5E7EB]',
                            counterBg: 'bg-[#E5E7EB]',
                            counterText: 'text-[#6B7280]'
                          }} />
                              </div>
                              {/* Closed Tickets Button - ensure it stays within the Pending lane */}
                              <div className="mt-3 flex justify-start">
                                <button onClick={() => setShowClosedTickets(true)} className="flex items-center px-4 py-2.5 bg-[#F9FAFB] text-[#111827] rounded-xl border border-[#E5E7EB] shadow-sm transition-all hover:shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300" aria-label="View closed tickets">
                                  <Archive size={16} className="text-[#9CA3AF] mr-2" />
                                  <span className="text-[14px] font-medium">
                                    Closed Tickets
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Right Column - Coming Appointments (full height, independent) */}
                          {showUpcomingAppointments && <div className={`transition-all duration-300 ease-in-out h-full ${minimizedSections.comingAppointments ? 'w-[60px] flex-shrink-0' : 'w-[280px]'}`}>
                              <ComingAppointments isMinimized={minimizedSections.comingAppointments} onToggleMinimize={() => toggleSectionMinimize('comingAppointments')} isMobile={false} headerStyles={{
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
                        </div>
                      </>}
                  </div>
                </>}
              {/* Closed Tickets Overlay */}
              <ClosedTickets isOpen={showClosedTickets} onClose={() => setShowClosedTickets(false)} headerStyles={{
              bg: 'bg-[#F9FAFB]',
              accentColor: '#6B7280',
              iconColor: 'text-[#9CA3AF]',
              activeIconColor: 'text-[#6B7280]',
              titleColor: 'text-[#111827]',
              borderColor: 'border-[#E5E7EB]',
              counterBg: 'bg-[#E5E7EB]',
              counterText: 'text-[#6B7280]'
            }} />
            </div>
          </div>
        </div>
      </div>
      {/* Create Ticket Button */}
      <CreateTicketButton onClick={() => setShowCreateTicketModal(true)} />
      {/* Create Ticket Modal */}
      <CreateTicketModal isOpen={showCreateTicketModal} onClose={() => setShowCreateTicketModal(false)} onSubmit={createTicket} />
      {/* Add the new SalonCenterSettings component */}
      <SalonCenterSettings isOpen={showSalonCenterSettings} onClose={() => setShowSalonCenterSettings(false)} currentSettings={salonCenterSettings} onSettingsChange={handleSalonCenterSettingsChange} />
    </div>;
}