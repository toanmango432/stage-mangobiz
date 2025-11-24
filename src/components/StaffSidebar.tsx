import { useEffect, useState, useRef } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Search, Filter, ChevronUp, ChevronDown, Settings, Users } from 'lucide-react';
import { StaffCard as VerticalCard } from './StaffCardVertical';
import { TeamSettingsPanel, TeamSettings, defaultTeamSettings } from './TeamSettingsPanel';
import { TurnTracker } from './TurnTracker/TurnTracker';
import { useTickets } from '../hooks/useTicketsCompat';
// Function to get salon staff images based on specialty and ID
const getSalonStaffImage = (id: number, specialty?: string) => {
  // Map staff IDs to specific profile images from the provided screenshot
  const staffImages = {
    1: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=400&auto=format&fit=crop',
    2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    3: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
    4: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
    5: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    6: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    7: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop',
    8: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?q=80&w=400&auto=format&fit=crop',
    9: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    10: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=400&auto=format&fit=crop',
    11: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
    12: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=400&auto=format&fit=crop',
    13: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop' // Mike - young man with earring
  };
  // Convert ID to number if it's a string
  const idNum = typeof id === 'string' ? parseInt(id.replace(/\D/g, '')) || 1 : id;
  // Use modulo to cycle through images if ID is larger than available images
  const imageIndex = idNum <= 13 ? idNum : (idNum % 13) + 1;
  // Return the image for the specific staff ID or a default image if ID not found
  return staffImages[imageIndex as keyof typeof staffImages] || 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?q=80&w=400&auto=format&fit=crop';
};
// Utility function to determine staff status based on active tickets
export const determineStaffStatus = (staff, inServiceTickets) => {
  // Keep 'off' status unchanged
  if (staff.status === 'off') return staff;
  // Check if this staff member has any tickets in service
  const hasActiveTickets = inServiceTickets.some(ticket => ticket.assignedTo?.id === staff.id);
  // Update status based on active tickets
  return {
    ...staff,
    status: hasActiveTickets ? 'busy' : 'ready'
  };
};
export function StaffSidebar() {
  // ⚙️ FEATURE FLAG - Set to false to revert to original styling
  const USE_NEW_TEAM_STYLING = true;

  // Get context data including resetStaffStatus function and inService tickets
  const {
    resetStaffStatus,
    inService,
    staff
  } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  // Updated to support both status types
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  // Initialize view mode from localStorage, default to 'normal'
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>(() => {
    const saved = localStorage.getItem('staffSidebarViewMode');
    return saved === 'normal' || saved === 'compact' ? saved as 'normal' | 'compact' : 'normal';
  });
  // New state for reset confirmation modal
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  // New state for team settings panel
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [teamSettings, setTeamSettings] = useState<TeamSettings>(() => {
    const savedSettings = localStorage.getItem('teamSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultTeamSettings;
  });
  // New state for Turn Tracker modal
  const [showTurnTracker, setShowTurnTracker] = useState(false);
  // Listen for global FAB event to open Turn Tracker
  useEffect(() => {
    const onOpen = () => setShowTurnTracker(true);
    (window as any).addEventListener('open-turn-tracker', onOpen);
    return () => {
      (window as any).removeEventListener('open-turn-tracker', onOpen);
    };
  }, []);
  // Initialize sidebar width from localStorage to ensure persistence
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('staffSidebarWidth');
    return savedWidth ? parseInt(savedWidth) : 256; // Default width in pixels
  });
  // Initialize width type from localStorage
  const [widthType, setWidthType] = useState(() => {
    const savedWidthType = localStorage.getItem('staffSidebarWidthType');
    return savedWidthType || 'fixed'; // Default to 'fixed'
  });
  // Initialize width percentage from localStorage
  const [widthPercentage, setWidthPercentage] = useState(() => {
    const savedPercentage = localStorage.getItem('staffSidebarWidthPercentage');
    return savedPercentage ? parseInt(savedPercentage) : 0;
  });
  // Add states for custom width popup and temporary width preview
  const [showCustomWidthPopup, setShowCustomWidthPopup] = useState(false);
  const [customWidthInput, setCustomWidthInput] = useState('');
  // Add states to store the original width values before preview
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalWidthType, setOriginalWidthType] = useState('');
  const [originalWidthPercentage, setOriginalWidthPercentage] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  // Handle team settings changes
  const handleTeamSettingsChange = (newSettings: Partial<TeamSettings>) => {
    const updatedSettings = {
      ...teamSettings,
      ...newSettings
    };
    setTeamSettings(updatedSettings);
    localStorage.setItem('teamSettings', JSON.stringify(updatedSettings));
    // Apply width settings if they've changed
    if (newSettings.viewWidth) {
      applyWidthSettings(newSettings.viewWidth, updatedSettings.customWidthPercentage);
    } else if (newSettings.customWidthPercentage && updatedSettings.viewWidth === 'custom') {
      applyWidthSettings('custom', newSettings.customWidthPercentage);
    }
    // Apply search visibility if it's changed
    if (newSettings.showSearch !== undefined) {
      setShowSearch(newSettings.showSearch);
    }
    // Apply view mode changes if minimize/expand setting changed
    if (newSettings.showMinimizeExpandIcon !== undefined && !newSettings.showMinimizeExpandIcon) {
      // If hiding the minimize/expand icon, ensure we're in normal mode
      setViewMode('normal');
      localStorage.setItem('staffSidebarViewMode', 'normal');
    }
    // Reset filter when changing organization structure
    if (newSettings.organizeBy !== undefined && newSettings.organizeBy !== teamSettings.organizeBy) {
      setStatusFilter(null);
    }
  };
  // Apply width settings based on the selected view width
  const applyWidthSettings = (viewWidth: string, customPercentage: number) => {
    const windowWidth = window.innerWidth;
    switch (viewWidth) {
      case 'ultraCompact':
        setWidthType('fixed');
        setSidebarWidth(100);
        setWidthPercentage(0);
        localStorage.setItem('staffSidebarWidthType', 'fixed');
        localStorage.setItem('staffSidebarWidth', '100');
        localStorage.setItem('staffSidebarWidthPercentage', '0');
        break;
      case 'compact':
        setWidthType('fixed');
        setSidebarWidth(300);
        setWidthPercentage(0);
        localStorage.setItem('staffSidebarWidthType', 'fixed');
        localStorage.setItem('staffSidebarWidth', '300');
        localStorage.setItem('staffSidebarWidthPercentage', '0');
        break;
      case 'wide':
        setWidthType('percentage');
        setWidthPercentage(30);
        setSidebarWidth(Math.round(windowWidth * 0.3));
        localStorage.setItem('staffSidebarWidthType', 'percentage');
        localStorage.setItem('staffSidebarWidthPercentage', '30');
        localStorage.setItem('staffSidebarWidth', Math.round(windowWidth * 0.3).toString());
        break;
      case 'fullScreen':
        setWidthType('percentage');
        setWidthPercentage(100);
        setSidebarWidth(windowWidth);
        localStorage.setItem('staffSidebarWidthType', 'percentage');
        localStorage.setItem('staffSidebarWidthPercentage', '100');
        localStorage.setItem('staffSidebarWidth', windowWidth.toString());
        break;
      case 'custom':
        if (customPercentage >= 10 && customPercentage <= 80) {
          setWidthType('customPercentage');
          setWidthPercentage(customPercentage);
          setSidebarWidth(Math.round(windowWidth * customPercentage / 100));
          localStorage.setItem('staffSidebarWidthType', 'customPercentage');
          localStorage.setItem('staffSidebarWidthPercentage', customPercentage.toString());
          localStorage.setItem('staffSidebarWidth', Math.round(windowWidth * customPercentage / 100).toString());
        }
        break;
    }
  };
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customWidthPopupRef.current && !customWidthPopupRef.current.contains(event.target as Node) && showCustomWidthPopup) {
        // Restore original width if clicking outside while in preview mode
        if (isPreviewMode) {
          restoreOriginalWidth();
        }
        setShowCustomWidthPopup(false);
        setIsPreviewMode(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomWidthPopup, isPreviewMode]);
  // Update width when window is resized (for percentage-based widths)
  useEffect(() => {
    const handleResize = () => {
      if (widthType === 'percentage' || widthType === 'customPercentage') {
        const windowWidth = window.innerWidth;
        const newWidth = Math.round(windowWidth * widthPercentage / 100);
        setSidebarWidth(newWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial width
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [widthType, widthPercentage]);
  // Save sidebar width settings to localStorage when they change
  useEffect(() => {
    // Only save to localStorage if not in preview mode
    if (!isPreviewMode) {
      localStorage.setItem('staffSidebarWidth', sidebarWidth.toString());
      localStorage.setItem('staffSidebarWidthType', widthType);
      localStorage.setItem('staffSidebarWidthPercentage', widthPercentage.toString());
    }
  }, [sidebarWidth, widthType, widthPercentage, isPreviewMode]);
  // Add keyboard shortcut handler for the settings panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close settings panel on ESC
      if (e.key === 'Escape' && showTeamSettings) {
        setShowTeamSettings(false);
      }
      // Save settings on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && showTeamSettings) {
        e.preventDefault(); // Prevent browser save dialog
        setShowTeamSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTeamSettings]);
  // Add this CSS class to hide scrollbars for narrow widths
  useEffect(() => {
    // Add custom scrollbar-hiding CSS
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // Determine if sidebar is in expanded view (40%, 50% or 100% width)
  const isExpandedView = widthType === 'percentage' && (widthPercentage === 40 || widthPercentage === 50 || widthPercentage === 100);
  const customWidthPopupRef = useRef<HTMLDivElement>(null);
  // Save the original width before previewing
  const saveOriginalWidth = () => {
    setOriginalWidth(sidebarWidth);
    setOriginalWidthType(widthType);
    setOriginalWidthPercentage(widthPercentage);
  };
  // Restore the original width when cancelling
  const restoreOriginalWidth = () => {
    setSidebarWidth(originalWidth);
    setWidthType(originalWidthType);
    setWidthPercentage(originalWidthPercentage);
  };
  // Toggle between view modes (normal, compact)
  const toggleViewMode = () => {
    if (teamSettings.showMinimizeExpandIcon) {
      const newViewMode = viewMode === 'normal' ? 'compact' : 'normal';
      setViewMode(newViewMode);
      // Save the selection to localStorage
      localStorage.setItem('staffSidebarViewMode', newViewMode);
    }
  };
  // Handle reset staff status
  const handleResetClick = () => {
    setShowResetConfirmation(true);
  };
  const handleConfirmReset = () => {
    resetStaffStatus();
    setShowResetConfirmation(false);
  };


  // --- SMART GRID ORCHESTRATION ---
  // Viewability-First: Maintain optimal card size, allow natural scrolling
  const getGridColumns = () => {
    const width = sidebarWidth - 32; // Available width (minus padding)
    const staffCount = filteredStaff.length;

    // If no staff, default to 1 column
    if (staffCount === 0) {
      return 'grid-cols-1';
    }

    // SPECIFIC OVERRIDE: 30% width (Wide view) + Normal view mode = 3 columns
    if (widthPercentage === 30 && viewMode === 'normal') {
      return 'grid-cols-3';
    }

    // VIEWABILITY-FIRST APPROACH:
    // Set minimum card width for readability (never go below this)
    const MIN_VIEWABLE_CARD_WIDTH = viewMode === 'compact' ? 180 : 200;

    // Calculate maximum columns that maintain viewability
    let cols = Math.floor(width / MIN_VIEWABLE_CARD_WIDTH);

    // Ensure at least 1 column
    cols = Math.max(1, cols);

    // For very wide screens in full-screen mode, cap at a reasonable maximum
    // to prevent cards from becoming too small
    if (widthPercentage === 100 && cols > 12) {
      cols = 12;
    }

    // Explicit lookup to ensure Tailwind generates these classes
    const colsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    };
    return colsMap[cols] || 'grid-cols-1';
  };
  // Get the gap and padding based on view mode and screen width
  const getGapAndPadding = () => {
    const width = sidebarWidth;

    if (viewMode === 'compact') {
      if (width <= 100) return 'gap-0.5 p-0.5';
      if (width <= 300) return 'gap-1 p-1.5';
      if (width <= 800) return 'gap-2 p-2';
      return 'gap-3 p-3'; // Increased for wide compact view
    } else {
      // Normal view with generous spacing for full screen
      if (width <= 300) return 'gap-1.5 p-2';
      if (width <= 800) return 'gap-2 p-3';
      if (width <= 1400) return 'gap-3 p-4'; // Medium-wide
      return 'gap-4 p-5'; // Full screen: 16px gap, 20px padding
    }
  };
  // Get the appropriate view mode icon
  const getViewModeIcon = () => {
    if (viewMode === 'normal') {
      return <ChevronUp size={16} />;
    } else {
      return <ChevronDown size={16} />;
    }
  };
  // Get the appropriate view mode label
  const getViewModeLabel = () => {
    if (viewMode === 'normal') {
      return 'Switch to compact view';
    } else {
      return 'Switch to normal view';
    }
  };
  // Get the appropriate card view mode based on sidebar width and user preference
  const getCardViewMode = (): 'ultra-compact' | 'compact' | 'normal' => {
    if (sidebarWidth <= 100) {
      return 'ultra-compact';
    }

    // For vertical cards at desktop widths (40%+), don't auto-downgrade
    // Keep user's selected mode (normal/compact) to maintain card dimensions
    if (teamSettings.cardLayout === 'vertical' && sidebarWidth >= 300) {
      return viewMode;
    }

    // Calculate effective column width to auto-downgrade view mode if too tight
    const minWidth = viewMode === 'compact' ? 160 : 210;
    const cols = Math.max(1, Math.floor((sidebarWidth - 32) / minWidth));
    const effectiveWidth = (sidebarWidth - 32) / cols;

    if (effectiveWidth < 140) return 'ultra-compact';
    if (effectiveWidth < 180) return 'compact';

    return viewMode;
  };
  // Calculate display priority tiers based on available width
  const getDisplayPriorityTiers = () => {
    // Base tier settings - now using team settings
    const tier1 = true; // Always show: Staff Name, Queue Order, Avatar
    let tier2 = teamSettings.showTurnCount; // Turn Count
    let tier3 = true; // Status is always shown
    let tier4 = false; // Clocked In Time
    let tier5 = teamSettings.showNextAppointment; // Next Appointment
    let tier6 = teamSettings.showServicedAmount; // Service Amount
    let tier7 = teamSettings.showTicketCount; // Tickets
    let tier8 = teamSettings.showLastDone; // Last Done Time
    // Determine which tiers to display based on width and view mode
    const cardMode = getCardViewMode();
    if (cardMode === 'ultra-compact') {
      // Ultra compact shows only tier 1 and selected options
      return {
        tier1,
        tier2,
        tier3,
        tier4: false,
        tier5: false,
        tier6: false,
        tier7: false,
        tier8: false
      };
    }
    if (cardMode === 'compact') {
      if (sidebarWidth >= 260) {
        tier4 = true; // Show Clocked In Time
      }
      // Adjust based on width, but respect user settings
      if (sidebarWidth < 220) tier7 = false; // Hide Tickets if narrow
      if (sidebarWidth < 240) tier8 = false; // Hide Last Done if narrow
      if (sidebarWidth < 200) tier5 = false; // Hide Next Appointment if very narrow
    } else {
      // Normal mode
      tier4 = true; // Always show Clocked In Time in normal mode
      // Adjust based on width, but respect user settings
      if (sidebarWidth < 180) {
        tier7 = false; // Hide Tickets if narrow
        tier8 = false; // Hide Last Done if narrow
      }
      if (sidebarWidth < 220) tier8 = false; // Hide Last Done if somewhat narrow
    }
    return {
      tier1,
      tier2,
      tier3,
      tier4,
      tier5,
      tier6,
      tier7,
      tier8
    };
  };
  // Updated staff status to include both organization structures
  const staffStatus = [
    // For Busy/Ready organization
    {
      id: 'ready',
      label: 'Ready',
      shortLabel: 'R',
      type: 'busyStatus'
    }, {
      id: 'busy',
      label: 'Busy',
      shortLabel: 'B',
      type: 'busyStatus'
    },
    // For Clocked In/Out organization
    {
      id: 'clockedIn',
      label: 'Clocked In',
      shortLabel: 'CI',
      type: 'clockedStatus'
    }, {
      id: 'clockedOut',
      label: 'Clocked Out',
      shortLabel: 'CO',
      type: 'clockedStatus'
    }];
  // Filter staff based on selected filter and search query
  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = staffMember.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Handle filtering based on organization structure
    if (teamSettings.organizeBy === 'busyStatus') {
      // When using Busy/Ready organization
      return matchesSearch && (statusFilter === null || staffMember.status === statusFilter);
    } else {
      // When using Clocked In/Out organization
      if (statusFilter === null) {
        return matchesSearch; // All staff
      } else if (statusFilter === 'clockedIn') {
        return matchesSearch && (staffMember.status === 'ready' || staffMember.status === 'busy');
      } else if (statusFilter === 'clockedOut') {
        return matchesSearch && staffMember.status === 'off';
      }
      return false;
    }
  });
  // Calculate the staff counts for each status
  const calculateStaffCounts = () => {
    // Get the filtered staff list based on organization method
    const staffToCount = teamSettings.organizeBy === 'busyStatus' ? staff.filter(s => s.status !== 'off') // Exclude clocked out staff for busy/ready view
      : staff; // Include all staff for clocked in/out view
    const clockedInCount = staffToCount.filter(s => s.status === 'ready' || s.status === 'busy').length;
    const clockedOutCount = staffToCount.filter(s => s.status === 'off').length;
    const readyCount = staffToCount.filter(s => s.status === 'ready').length;
    const busyCount = staffToCount.filter(s => s.status === 'busy').length;
    const totalCount = staffToCount.length;
    return {
      clockedIn: clockedInCount,
      clockedOut: clockedOutCount,
      ready: readyCount,
      busy: busyCount,
      total: totalCount
    };
  };
  const staffCounts = calculateStaffCounts();
  // Helper function to render status pills with responsive labels
  const renderStatusPills = (isUltraCompact = false, isCompact = false) => {
    // Common classes for all pills
    const pillBaseClasses = 'flex items-center transition-all duration-200 transform';
    const pillSpacing = isUltraCompact ? 'space-x-1' : isCompact ? 'space-x-1.5' : 'space-x-2';
    const pillPadding = isUltraCompact ? 'px-1.5 py-0.5' : isCompact ? 'px-3 py-1.5' : 'px-4 py-1.5';
    const badgeClasses = 'rounded-full font-semibold';
    const badgePadding = isUltraCompact ? 'px-1 py-0.5' : isCompact ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
    const textSize = isUltraCompact ? 'text-[9px]' : isCompact ? 'text-xs' : 'text-sm';
    const badgeTextSize = isUltraCompact ? 'text-[7px]' : isCompact ? 'text-[10px]' : 'text-xs';
    // Determine if we should use shortened labels based on width or ultra compact mode
    const useShortLabels = sidebarWidth < 360 || isUltraCompact;
    // All pill (always visible) - GRAY
    const allPill = <button onClick={() => setStatusFilter(null)} className={`${pillBaseClasses} ${pillPadding} rounded-full flex-shrink-0
          ${statusFilter === null ?
        'bg-gray-500 text-white font-bold shadow-md scale-105 ring-2 ring-gray-400/30' :
        'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`} aria-label={`All, ${staffCounts.total}`}>
      <span className={`${textSize} ${statusFilter === null ? 'font-bold' : 'font-normal'}`}>
        {isUltraCompact ? 'A' : 'All'}
      </span>
      <span className={`${badgeClasses} ${badgeTextSize} ${badgePadding}
          ${statusFilter === null ?
          'bg-white text-gray-700 shadow-sm font-bold' :
          'bg-gray-100 text-gray-600'}`}>
        {staffCounts.total}
      </span>
    </button>;
    // Generate status pills based on organization mode
    const statusPills = teamSettings.organizeBy === 'busyStatus' ? staffStatus.filter(status => status.type === 'busyStatus').map(status => {
      const isActive = statusFilter === status.id;
      // Ready = GREEN, Busy = RED
      const activeColors = {
        ready: 'bg-green-600 text-white font-bold shadow-md scale-105 ring-2 ring-green-400/30',
        busy: 'bg-red-600 text-white font-bold shadow-md scale-105 ring-2 ring-red-400/30'
      };
      const inactiveColors = {
        ready: 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200',
        busy: 'bg-white text-gray-700 hover:bg-red-50 border border-gray-200'
      };
      const bgColor = isActive ? activeColors[status.id] : inactiveColors[status.id];
      const badgeBg = isActive ?
        (status.id === 'ready' ? 'bg-white text-green-700 shadow-sm font-bold' : 'bg-white text-red-700 shadow-sm font-bold') :
        'bg-gray-100 text-gray-600';
      // Use ultra-compact labels when in ultra-compact mode
      const label = isUltraCompact ? status.id === 'ready' ? 'R' : 'B' : status.label;
      return <button key={status.id} onClick={() => setStatusFilter(status.id)} className={`${pillBaseClasses} ${pillPadding} rounded-full flex-shrink-0 ${bgColor}`} aria-label={`${status.label}, ${status.id === 'ready' ? staffCounts.ready : staffCounts.busy}`}>
        <span className={`${textSize} ${isActive ? 'font-bold' : 'font-normal'}`}>
          {label}
        </span>
        <span className={`${badgeClasses} ${badgeTextSize} ${badgePadding} ${badgeBg}`}>
          {status.id === 'ready' ? staffCounts.ready : staffCounts.busy}
        </span>
      </button>;
    }) :
      // Clocked In/Out pills with responsive labels
      staffStatus.filter(status => status.type === 'clockedStatus').map(status => {
        const isActive = statusFilter === status.id;
        const activeColors = {
          clockedIn: 'bg-green-600 text-white font-bold shadow-md scale-105 ring-2 ring-green-200',
          clockedOut: 'bg-gray-500 text-white font-bold shadow-md scale-105 ring-2 ring-gray-200'
        };
        const inactiveColors = isUltraCompact || isCompact ? {
          clockedIn: 'bg-gray-50 text-gray-500 hover:bg-green-50/50 border border-gray-200/80',
          clockedOut: 'bg-gray-50 text-gray-500 hover:bg-gray-100/50 border border-gray-200/80'
        } : {
          clockedIn: 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200',
          clockedOut: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        };
        const bgColor = isActive ? activeColors[status.id] : inactiveColors[status.id];
        const badgeBg = isActive ? status.id === 'clockedIn' ? 'bg-white text-green-700 shadow-sm' : 'bg-white text-gray-700 shadow-sm' : isUltraCompact || isCompact ? 'bg-gray-200/70 text-gray-500' : 'bg-gray-100 text-gray-600';
        // Use ultra-compact labels for ultra-compact mode
        const label = isUltraCompact ? status.id === 'clockedIn' ? 'I' : 'O' : useShortLabels ? status.id === 'clockedIn' ? 'In' : 'Out' : status.label;
        return <button key={status.id} onClick={() => setStatusFilter(status.id)} className={`${pillBaseClasses} ${pillPadding} rounded-full flex-shrink-0 ${bgColor}`} aria-label={`${status.label}, ${status.id === 'clockedIn' ? staffCounts.clockedIn : staffCounts.clockedOut}`}>
          <span className={`${textSize} ${isActive ? 'font-bold' : 'font-normal'}`}>
            {label}
          </span>
          <span className={`${badgeClasses} ${badgeTextSize} ${badgePadding} ${badgeBg}`}>
            {status.id === 'clockedIn' ? staffCounts.clockedIn : staffCounts.clockedOut}
          </span>
        </button>;
      });
    // Container with horizontal scrolling for narrow widths
    const scrollableContainer = sidebarWidth < 300 ? 'overflow-x-auto snap-x scrollbar-hide' : 'overflow-visible';
    return <div className={`flex items-center ${pillSpacing} ${scrollableContainer}`} style={sidebarWidth < 300 ? {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
      scrollSnapType: 'x mandatory'
    } : {}}>
      {allPill}
      {statusPills}
    </div>;
  };
  // Render header based on view mode and width
  const renderHeader = () => {
    // Ultra compact header for narrow width - Modern single row design
    if (sidebarWidth <= 100) {
      const headerBg = USE_NEW_TEAM_STYLING
        ? "border-b border-teal-300/40 bg-gradient-to-r from-teal-50/90 to-teal-100/85 -mt-0"
        : "border-b border-gray-200/60 bg-white/95 backdrop-blur-sm";
      return <div className={headerBg}>
        <div className="flex flex-col p-1.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className={USE_NEW_TEAM_STYLING ? "text-teal-600 p-1 rounded-lg flex items-center justify-center" : "bg-gradient-to-br from-[#3BB09A] to-[#2D9B85] text-white p-1 rounded-lg flex items-center justify-center shadow-md"}>
              <Users size={12} className="stroke-[2.5px]" />
            </div>
            <Tippy content="Team Settings">
              <button className={USE_NEW_TEAM_STYLING ? "p-1 rounded-lg bg-teal-100/50 hover:bg-teal-100 text-teal-700 transition-all duration-200" : "p-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-[#3BB09A] border border-gray-200/50 shadow-sm transition-all duration-200"} onClick={() => setShowTeamSettings(true)} aria-label="Open team settings">
                <Settings size={12} />
              </button>
            </Tippy>
          </div>
          <div className="w-full pt-0.5">
            {renderStatusPills(true, false)}
          </div>
        </div>
      </div>;
    } else if (viewMode === 'compact') {
      const headerBg = USE_NEW_TEAM_STYLING
        ? "sticky top-0 z-10 border-b border-teal-300/40 bg-gradient-to-r from-teal-50/90 to-teal-100/85"
        : "sticky top-0 z-10 border-b border-gray-200/60 bg-white/95 backdrop-blur-sm";
      return <div className={headerBg}>
        <div className="px-3 py-2.5">
          {/* Row 1: Team title + Action icons (always together) */}
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* Team title */}
            <div className={USE_NEW_TEAM_STYLING ? "text-teal-600 p-1.5 rounded-xl flex-shrink-0" : "bg-gradient-to-br from-[#3BB09A] to-[#2D9B85] p-1.5 rounded-xl shadow-lg text-white flex-shrink-0"}>
              <Users size={16} />
            </div>
            <h2 className={`text-base font-bold tracking-tight ${USE_NEW_TEAM_STYLING ? 'text-teal-700' : 'text-gray-900'}`}>Team</h2>
            {/* Action icons - Always on row 1 */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {teamSettings.showSearch && <Tippy content="Search">
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"} onClick={() => setShowSearch(!showSearch)}>
                  <Search size={15} />
                </button>
              </Tippy>}
              <Tippy content="Filter">
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"}>
                  <Filter size={15} />
                </button>
              </Tippy>
              {teamSettings.showMinimizeExpandIcon && <Tippy content={getViewModeLabel()}>
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"} onClick={toggleViewMode}>
                  {getViewModeIcon()}
                </button>
              </Tippy>}
              <Tippy content="Team Settings">
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"} onClick={() => setShowTeamSettings(true)}>
                  <Settings size={15} />
                </button>
              </Tippy>
            </div>
          </div>

          {/* Row 2: Status pills (always on separate row) */}
          <div className="flex items-center gap-1.5">
            {renderStatusPills(false, false)}
          </div>
        </div>
        {showSearch && <div className="px-3 pb-2.5">
          <div className="relative">
            <input type="text" placeholder="Search technicians..." className="w-full py-2 pl-9 pr-3 rounded-lg text-gray-800 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3BB09A]/50 focus:border-[#3BB09A] shadow-sm bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>}
      </div>;
    } else {
      // Normal view - Responsive design
      const headerBg = USE_NEW_TEAM_STYLING
        ? "sticky top-0 z-10 border-b border-teal-300/40 bg-gradient-to-r from-teal-50/90 to-teal-100/85"
        : "sticky top-0 z-10 border-b border-gray-200/60 bg-white/95 backdrop-blur-sm";
      return <div className={headerBg}>
        <div className="px-3 py-2.5">
          {/* Row 1: Team title + Action icons (always together) */}
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* Team title */}
            <div className={USE_NEW_TEAM_STYLING ? "text-teal-600 p-1.5 rounded-xl flex-shrink-0" : "bg-gradient-to-br from-[#3BB09A] to-[#2D9B85] p-1.5 rounded-xl shadow-lg text-white flex-shrink-0"}>
              <Users size={16} />
            </div>
            <h2 className={`text-base font-bold tracking-tight ${USE_NEW_TEAM_STYLING ? 'text-teal-700' : 'text-gray-900'}`}>Team</h2>
            {/* Action icons - Always on row 1 */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {teamSettings.showSearch && <Tippy content="Search">
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"} onClick={() => setShowSearch(!showSearch)}>
                  <Search size={15} />
                </button>
              </Tippy>}
              <Tippy content="Filter">
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"}>
                  <Filter size={15} />
                </button>
              </Tippy>
              {teamSettings.showMinimizeExpandIcon && <Tippy content={getViewModeLabel()}>
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"} onClick={toggleViewMode}>
                  {getViewModeIcon()}
                </button>
              </Tippy>}
              <Tippy content="Team Settings">
                <button className={USE_NEW_TEAM_STYLING ? "p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200" : "p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200"} onClick={() => setShowTeamSettings(true)}>
                  <Settings size={15} />
                </button>
              </Tippy>
            </div>
          </div>

          {/* Row 2: Status pills (always on separate row) */}
          <div className="flex items-center gap-1.5">
            {renderStatusPills(false, false)}
          </div>
        </div>
        {showSearch && <div className="px-3 pb-2.5">
          <div className="relative">
            <input type="text" placeholder="Search technicians..." className="w-full py-2 pl-9 pr-3 rounded-lg text-gray-800 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3BB09A]/50 focus:border-[#3BB09A] shadow-sm bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>}
      </div>;
    }
  };
  // Get the priority tiers based on current width and view mode
  const priorityTiers = getDisplayPriorityTiers();
  // 🎨 TEAM STYLING - Strong distinction from ticket sections
  const teamSidebarClasses = USE_NEW_TEAM_STYLING
    ? "relative h-full border-r-[3px] border-teal-300/60 bg-gradient-to-b from-teal-50/95 via-teal-50/95 to-teal-100/90 flex flex-col overflow-hidden transition-all duration-300"
    : "relative h-full border-r border-[#E2D9DC] bg-[#FBF8F9] flex flex-col overflow-hidden shadow-xl transition-all duration-300";

  const teamSidebarStyle = USE_NEW_TEAM_STYLING
    ? {
      width: `${sidebarWidth}px`,
      boxShadow: '6px 0 16px -4px rgba(20, 184, 166, 0.25), 2px 0 8px -2px rgba(0, 0, 0, 0.08)'
    }
    : {
      width: `${sidebarWidth}px`,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
    };

  return <div className={teamSidebarClasses} style={teamSidebarStyle}>
    {renderHeader()}
    <div className="flex-1 overflow-auto bg-gradient-to-b from-[#FBF8F9] to-[#F7F2F4] relative min-h-0">
      {filteredStaff.length > 0 ? <div
        className={`grid ${getGridColumns()} ${getGapAndPadding()}`}
      >
        {filteredStaff.map((staffMember, index) => {
          // Convert string ID to number for compatibility
          const staffIdNumber = typeof staffMember.id === 'string'
            ? parseInt(staffMember.id.replace(/\\D/g, '')) || index + 1
            : staffMember.id;

          const modifiedStaffMember = {
            ...staffMember,
            id: staffIdNumber,
            image: getSalonStaffImage(staffIdNumber, staffMember.specialty),
          };

          // Always use VerticalCard
          const CardComponent = VerticalCard;

          // For testing, add dummy ticket info for busy staff
          if (staffMember.status === 'busy') {
            modifiedStaffMember.activeTickets = [{
              id: 1000 + staffIdNumber,
              ticketNumber: 100 + staffIdNumber,
              clientName: 'Test Client',
              serviceName: 'Test Service',
              status: 'in-service',
            }];
            modifiedStaffMember.currentTicketInfo = {
              timeLeft: 10,
              totalTime: 45,
              progress: 0.67,
              startTime: '10:15AM',
            };
          }

          // Add mock data for Last Service and Next Appointment
          // In a real app, this would come from the backend
          modifiedStaffMember.lastServiceTime = '10:30 AM';
          modifiedStaffMember.nextAppointmentTime = '2:00 PM';

          const getTooltipContent = () => (
            <div className="p-2 max-w-xs">
              <p className="font-bold text-sm mb-1">{modifiedStaffMember.name}</p>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Status:</span> {modifiedStaffMember.status}</p>
                {modifiedStaffMember.turnCount !== undefined && (
                  <p><span className="font-medium">Turns:</span> {modifiedStaffMember.turnCount}</p>
                )}
                {modifiedStaffMember.clockedInTime && (
                  <p><span className="font-medium">Clocked in:</span> {modifiedStaffMember.clockedInTime}</p>
                )}
                {modifiedStaffMember.status === 'busy' && modifiedStaffMember.currentTicketInfo && (
                  <>
                    <p><span className="font-medium">Current service:</span> {modifiedStaffMember.currentTicketInfo.serviceName || 'Test Service'}</p>
                    <p><span className="font-medium">Client:</span> {modifiedStaffMember.currentTicketInfo.clientName || 'Test Client'}</p>
                    <p><span className="font-medium">Started:</span> {modifiedStaffMember.currentTicketInfo.startTime}</p>
                    <p><span className="font-medium">Progress:</span> {Math.round(modifiedStaffMember.currentTicketInfo.progress * 100)}%</p>
                  </>
                )}
              </div>
            </div>
          );

          return (
            <div key={modifiedStaffMember.id} className="w-full min-w-[80px]" style={{
              // In full screen mode, fill the grid cell height
              height: widthPercentage === 100 ? '100%' : 'auto'
            }}>
              <Tippy
                content={getTooltipContent()}
                placement="right"
                duration={[200, 0]}
                delay={[300, 0]}
                animation="shift-away"
                theme="translucent"
                interactive={true}
                appendTo={document.body}
              >
                <div className="transition-all duration-300 hover:scale-[1.03] hover:shadow-lg rounded-[14px] cursor-pointer" style={{
                  // In full screen mode, make card fill the container
                  height: widthPercentage === 100 ? '100%' : 'auto'
                }}>
                  <CardComponent
                    staff={modifiedStaffMember}
                    viewMode={getCardViewMode()}
                    fillHeight={widthPercentage === 100}
                    isDraggable={true}
                    displayConfig={{
                      showName: true,
                      showQueueNumber: true,
                      showAvatar: true,
                      showTurnCount: true,
                      showStatus: true,
                      showClockedInTime: true,
                      showNextAppointment: true,
                      showSalesAmount: true,
                      showTickets: true,
                      showLastService: true,
                    }}
                  />
                </div>
              </Tippy>
            </div>
          );
        })}
      </div> : <div className={`p-${sidebarWidth <= 100 ? '2' : viewMode === 'compact' ? '3' : '5'} text-center text-gray-500 ${sidebarWidth <= 100 ? 'text-[9px]' : viewMode === 'compact' ? 'text-xs' : 'text-sm'}`}>
        <div className="bg-white bg-opacity-70 rounded-lg shadow-md p-4 backdrop-blur-sm">
          <p>No technicians match your filters</p>
        </div>
      </div>}
    </div>
    {/* Team Settings Panel */}
    <TeamSettingsPanel isOpen={showTeamSettings} onClose={() => setShowTeamSettings(false)} currentSettings={teamSettings} onSettingsChange={handleTeamSettingsChange} />
    {/* Reset Confirmation Modal */}
    {showResetConfirmation && <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-xl max-w-md">
        <h3 className="text-lg font-bold mb-2">Reset All Staff Status?</h3>
        <p className="mb-4">
          This will set all clocked-in staff to "Ready" status and move all
          tickets back to the waiting list.
        </p>
        <div className="flex justify-end space-x-2">
          <button className="px-3 py-1.5 bg-gray-200 rounded-md" onClick={() => setShowResetConfirmation(false)}>
            Cancel
          </button>
          <button className="px-3 py-1.5 bg-red-500 text-white rounded-md" onClick={handleConfirmReset}>
            Reset
          </button>
        </div>
      </div>
    </div>}
    {/* Turn Tracker Modal */}
    <TurnTracker isOpen={showTurnTracker} onClose={() => setShowTurnTracker(false)} />
  </div>;
}