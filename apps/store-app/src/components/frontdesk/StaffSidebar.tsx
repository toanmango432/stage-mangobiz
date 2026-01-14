import { useEffect, useState, useRef, useCallback } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Search, Filter, Users, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { StaffCardVertical } from '@/components/StaffCard';
import { TeamSettingsPanel, TeamSettings, defaultTeamSettings } from '@/components/TeamSettingsPanel';
import { TurnTracker } from '@/components/TurnTracker/TurnTracker';
import { AddStaffNoteModal } from '@/components/frontdesk/AddStaffNoteModal';
import { StaffDetailsPanel } from '@/components/frontdesk/StaffDetailsPanel';
import { useTickets } from '@/hooks/useTicketsCompat';
import { FrontDeskSettingsData } from '@/components/frontdesk-settings/types';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectFrontDeskSettings } from '@/store/slices/frontDeskSettingsSlice';
import { selectServiceTickets, selectCompletedTickets, type UITicket } from '@/store/slices/uiTicketsSlice';
import { selectAllAppointments } from '@/store/slices/appointmentsSlice';
import type { LocalAppointment } from '@/types/appointment';
import { setSelectedMember } from '@/store/slices/teamSlice';
import { clockIn, clockOut } from '@/store/slices/timesheetSlice';
import { useTicketPanel } from '@/contexts/TicketPanelContext';

interface StaffSidebarProps {
  settings?: FrontDeskSettingsData;
}
// Function to get staff image - uses actual staff image from backend data,
// or generates an avatar using ui-avatars.com based on staff name
const getStaffImage = (staffMember: { image?: string; name?: string }): string => {
  // If staff has an image from backend, use it
  if (staffMember.image) {
    return staffMember.image;
  }
  // Otherwise generate an initials-based avatar
  const name = staffMember.name || 'Staff';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
};
// Utility function to determine staff status based on active tickets
export const determineStaffStatus = (staff: any, inServiceTickets: any[]) => {
  // Keep 'off' status unchanged
  if (staff.status === 'off') return staff;
  // Check if this staff member has any tickets in service
  const hasActiveTickets = inServiceTickets.some((ticket: any) => ticket.assignedTo?.id === staff.id);
  // Update status based on active tickets
  return {
    ...staff,
    status: hasActiveTickets ? 'busy' : 'ready'
  };
};
export function StaffSidebar({ settings: propSettings }: StaffSidebarProps = { settings: undefined }) {
  // ⚙️ FEATURE FLAG - Set to false to revert to original styling
  const USE_NEW_TEAM_STYLING = true;

  // Check if Turn Tracker feature is enabled for this license tier
  const { isEnabled: isTurnTrackerEnabled } = useFeatureFlag('turn-tracker');

  // Get FrontDeskSettings from Redux (US-001: Connect to Redux settings)
  const reduxSettings = useAppSelector(selectFrontDeskSettings);
  // Use Redux settings as primary, prop settings as fallback
  const settings = reduxSettings || propSettings;

  // US-008: Get in-service tickets from Redux for real ticket data on staff cards
  const inServiceTickets = useAppSelector(selectServiceTickets);

  // US-009: Get appointments from Redux for next appointment times
  const allAppointments = useAppSelector(selectAllAppointments);

  // US-009: Get completed tickets from Redux for last service times
  const completedTickets = useAppSelector(selectCompletedTickets);

  // Get context data including resetStaffStatus function
  const {
    resetStaffStatus,
    staff,
    serviceTickets, // US-006: Get in-service tickets for Quick Checkout
  } = useTickets();

  // US-003: Get ticket panel context for Add Ticket action
  const { openTicketWithData } = useTicketPanel();

  // US-005: Get dispatch for Edit Team Member action
  const dispatch = useAppDispatch();

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

  // Use settings from FrontDeskSettings if provided, otherwise use local teamSettings
  const effectiveOrganizeBy = settings?.organizeBy || teamSettings.organizeBy;

  // BUG-002 FIX: Sync viewWidth from FrontDeskSettings to StaffSidebar
  useEffect(() => {
    if (settings?.viewWidth) {
      // Map FrontDeskSettings viewWidth to StaffSidebar width settings
      const viewWidthMap: Record<string, string> = {
        'ultraCompact': 'ultraCompact',
        'compact': 'compact',
        'wide': 'wide',
        'fullScreen': 'fullScreen',
        'custom': 'custom'
      };
      const mappedWidth = viewWidthMap[settings.viewWidth] || 'compact';
      applyWidthSettings(mappedWidth, settings.customWidthPercentage || 40);
    }
  }, [settings?.viewWidth, settings?.customWidthPercentage]);
  // New state for Turn Tracker modal
  const [showTurnTracker, setShowTurnTracker] = useState(false);

  // US-004: State for Add Staff Note modal
  const [showStaffNoteModal, setShowStaffNoteModal] = useState(false);
  const [selectedStaffForNote, setSelectedStaffForNote] = useState<{ id: number; name: string } | null>(null);

  // US-010: State for Staff Details Panel
  const [showStaffDetails, setShowStaffDetails] = useState(false);
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<any>(null);
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
        setWidthPercentage(40);
        setSidebarWidth(Math.round(windowWidth * 0.4));
        localStorage.setItem('staffSidebarWidthType', 'percentage');
        localStorage.setItem('staffSidebarWidthPercentage', '40');
        localStorage.setItem('staffSidebarWidth', Math.round(windowWidth * 0.4).toString());
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
  // Initialize CSS custom property on mount for PendingSectionFooter positioning
  useEffect(() => {
    document.documentElement.style.setProperty('--staff-sidebar-width', `${sidebarWidth}px`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Save sidebar width settings to localStorage when they change
  useEffect(() => {
    // Only save to localStorage if not in preview mode
    if (!isPreviewMode) {
      localStorage.setItem('staffSidebarWidth', sidebarWidth.toString());
      localStorage.setItem('staffSidebarWidthType', widthType);
      localStorage.setItem('staffSidebarWidthPercentage', widthPercentage.toString());

      // Update CSS custom property for PendingSectionFooter positioning
      document.documentElement.style.setProperty('--staff-sidebar-width', `${sidebarWidth}px`);

      // Dispatch event so PendingSectionFooter can update its position
      window.dispatchEvent(new Event('staffSidebarWidthChanged'));
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
  const customWidthPopupRef = useRef<HTMLDivElement>(null);
  // Save the original width before previewing
  const _saveOriginalWidth = () => {
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
  const _handleResetClick = () => {
    setShowResetConfirmation(true);
  };
  const handleConfirmReset = () => {
    resetStaffStatus();
    setShowResetConfirmation(false);
  };

  // US-003: Handle Add Ticket action from staff card
  // Opens the ticket panel with the selected staff pre-selected
  const handleAddTicket = useCallback((staffId: number) => {
    // Find the staff member by ID
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (staffMember) {
      // Open ticket panel with staff pre-selected
      openTicketWithData({
        id: '', // New ticket
        clientName: '', // Will be filled by user
        techId: String(staffId),
        technician: staffMember.name,
      });
    }
  }, [staff, openTicketWithData]);

  // US-004: Handle Add Note action from staff card
  // Opens the staff note modal for the selected staff member
  const handleAddNote = useCallback((staffId: number) => {
    // Find the staff member by ID
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (staffMember) {
      setSelectedStaffForNote({ id: staffId, name: staffMember.name });
      setShowStaffNoteModal(true);
    }
  }, [staff]);

  // US-004: Handle saving staff note
  const handleSaveStaffNote = useCallback((staffId: number, note: string) => {
    // TODO: Integrate with staff notes storage/API
    // For now, log to console as placeholder
    console.log(`Staff note saved for ${staffId}:`, note);
    // In production, this would dispatch to Redux or call an API
  }, []);

  // US-005: Handle Edit Team Member action from staff card
  // Pre-selects the staff member in teamSlice and navigates to team-settings module
  const handleEditTeam = useCallback((staffId: number) => {
    // Find the staff member by ID to get their team member UUID
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (staffMember) {
      // Pre-select the staff member in Redux teamSlice
      // UIStaff.id is already the team member ID (UUID string from TeamMemberSettings)
      dispatch(setSelectedMember(staffMember.id));

      // Navigate to team-settings module via custom event
      // AppShell listens for 'navigate-to-module' events
      window.dispatchEvent(new CustomEvent('navigate-to-module', {
        detail: 'team-settings'
      }));
    }
  }, [staff, dispatch]);

  // US-010: Handle staff card click to open details panel
  // Opens the StaffDetailsPanel with staff info, tickets, appointments, and stats
  const handleStaffClick = useCallback((staffMember: any) => {
    setSelectedStaffForDetails(staffMember);
    setShowStaffDetails(true);
  }, []);

  // US-006: Handle Quick Checkout action from staff card
  // Opens the checkout panel for the staff's current in-service ticket
  const handleQuickCheckout = useCallback((staffId: number, ticketId?: number) => {
    // Find the staff member by ID
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (!staffMember) {
      console.warn('[StaffSidebar] Staff member not found for Quick Checkout:', staffId);
      return;
    }

    // Find the staff's in-service ticket from serviceTickets
    // Match by staffId (UUID) or by the ticket's assignedTo.id
    const staffInServiceTicket = serviceTickets.find((ticket: any) => {
      // Check if ticket has this staff assigned
      const ticketStaffId = ticket.techId || ticket.staffId || ticket.assignedTo?.id;
      return ticketStaffId === staffMember.id || ticketStaffId === String(staffId);
    });

    if (!staffInServiceTicket) {
      console.warn('[StaffSidebar] No in-service ticket found for staff:', staffMember.name);
      return;
    }

    // Convert the UITicket to TicketData format for openTicketWithData
    // UITicket uses: number (not ticketNumber), service (singular), checkoutServices (for detailed services)
    const ticketData = {
      id: staffInServiceTicket.id,
      number: staffInServiceTicket.number,
      clientId: staffInServiceTicket.clientId,
      clientName: staffInServiceTicket.clientName,
      clientType: staffInServiceTicket.clientType,
      service: staffInServiceTicket.service,
      // Use checkoutServices if available, otherwise create from service string
      services: staffInServiceTicket.checkoutServices || (staffInServiceTicket.service ? [{
        serviceName: staffInServiceTicket.service,
        name: staffInServiceTicket.service,
        duration: parseInt(String(staffInServiceTicket.duration)) || 30,
        status: staffInServiceTicket.serviceStatus || 'in_progress',
        staffId: staffInServiceTicket.techId,
        staffName: staffInServiceTicket.technician,
      }] : []),
      technician: staffInServiceTicket.technician,
      techId: staffInServiceTicket.techId,
      duration: staffInServiceTicket.duration,
      status: staffInServiceTicket.status,
      notes: staffInServiceTicket.notes,
    };

    // Open the ticket panel with the checkout data
    openTicketWithData(ticketData);
  }, [staff, serviceTickets, openTicketWithData]);

  // US-012: Handle Clock In action from staff card
  // Clocks in a staff member via timesheetSlice
  const handleClockIn = useCallback((staffId: number) => {
    // Find the staff member by ID to get their UUID
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (!staffMember) {
      console.warn('[StaffSidebar] Staff member not found for Clock In:', staffId);
      return;
    }

    // Dispatch clock in action with staff UUID
    dispatch(clockIn({
      params: {
        staffId: staffMember.id, // UUID string
      }
    }));
  }, [staff, dispatch]);

  // US-012: Handle Clock Out action from staff card
  // Shows confirmation if staff has active tickets, then clocks out
  const handleClockOut = useCallback((staffId: number) => {
    // Find the staff member by ID to get their UUID
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (!staffMember) {
      console.warn('[StaffSidebar] Staff member not found for Clock Out:', staffId);
      return;
    }

    // Check if staff has active tickets
    const hasActiveTickets = serviceTickets.some((ticket: any) => {
      const ticketStaffId = ticket.techId || ticket.staffId || ticket.assignedTo?.id;
      return ticketStaffId === staffMember.id || ticketStaffId === String(staffId);
    });

    if (hasActiveTickets) {
      // Show confirmation dialog before clocking out
      const confirmed = window.confirm(
        `${staffMember.name} has active tickets. Are you sure you want to clock them out?`
      );
      if (!confirmed) return;
    }

    // Dispatch clock out action with staff UUID
    dispatch(clockOut({
      params: {
        staffId: staffMember.id, // UUID string
      }
    }));
  }, [staff, serviceTickets, dispatch]);

  // Determine responsive grid class based on sidebar width and view mode
  const getGridColumns = () => {
    // Special case for ultra compact width
    if (sidebarWidth <= 100) {
      return 'grid-cols-1';
    }

    // Use CSS Grid auto-fit for true responsive behavior
    // This eliminates the need for dynamic class generation
    if ((viewMode as any) === 'ultra-compact') {
      // Ultra-compact cards: Maximum density (6-8 columns for wide screens)
      if (sidebarWidth < 200) {
        return 'grid-cols-[repeat(auto-fit,minmax(90px,1fr))]'; // 90px min
      } else if (sidebarWidth < 400) {
        return 'grid-cols-[repeat(auto-fit,minmax(90px,1fr))]';
      } else if (sidebarWidth < 600) {
        return 'grid-cols-[repeat(auto-fit,minmax(90px,1fr))]';
      } else {
        return 'grid-cols-[repeat(auto-fit,minmax(90px,1fr))]'; // Allow 6-8 columns
      }
    } else if (viewMode === 'compact') {
      // Compact cards: Aggressive density (4-5 columns preference)
      if (sidebarWidth < 200) {
        return 'grid-cols-[repeat(auto-fit,minmax(110px,1fr))]'; // 110px min
      } else if (sidebarWidth < 450) {
        return 'grid-cols-[repeat(auto-fit,minmax(110px,1fr))]'; // Keep 110px min to force more columns
      } else if (sidebarWidth < 700) {
        return 'grid-cols-[repeat(auto-fit,minmax(120px,1fr))]'; // 120px min
      } else {
        return 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]'; // 130px min
      }
    } else {
      // Normal cards: Optimized for density (3 columns preference)
      if (sidebarWidth < 200) {
        return 'grid-cols-auto-fit-card-xs'; // 120px min
      } else if (sidebarWidth < 550) {
        // Force 3 columns for ~400px width (approx 130px per card)
        return 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]';
      } else if (sidebarWidth < 800) {
        return 'grid-cols-auto-fit-card-md'; // 200px min
      } else {
        return 'grid-cols-auto-fit-card-lg'; // 240px min
      }
    }
  };
  // Get the gap and padding based on view mode
  const getGapAndPadding = () => {
    if (viewMode === 'compact') {
      if (sidebarWidth <= 100) {
        return 'gap-0.5 p-0.5';
      } else if (sidebarWidth <= 300) {
        return 'gap-1 p-1.5';
      } else {
        return 'gap-2 p-2';
      }
    } else {
      // For normal view, use responsive gaps based on sidebar width
      if (sidebarWidth <= 300) {
        return 'gap-1.5 p-2';
      } else {
        return 'gap-2 p-3';
      }
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

    // Calculate effective column width to auto-downgrade view mode if too tight
    const minWidth = viewMode === 'compact' ? 160 : 210;
    const cols = Math.max(1, Math.floor((sidebarWidth - 32) / minWidth));
    const effectiveWidth = (sidebarWidth - 32) / cols;

    if (effectiveWidth < 140) return 'ultra-compact';
    if (effectiveWidth < 180) return 'compact';

    return viewMode;
  };
  // Calculate display priority tiers based on available width
  const _getDisplayPriorityTiers = () => {
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
    if (effectiveOrganizeBy === 'busyStatus') {
      // When using Busy/Ready organization - ONLY show clocked-in staff (exclude 'off')
      const isClockedIn = staffMember.status === 'ready' || staffMember.status === 'busy';
      if (!isClockedIn) return false; // Always exclude off staff in busyStatus mode
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
    const staffToCount = effectiveOrganizeBy === 'busyStatus' ? staff.filter(s => s.status !== 'off') // Exclude clocked out staff for busy/ready view
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
    const statusPills = effectiveOrganizeBy === 'busyStatus' ? staffStatus.filter(status => status.type === 'busyStatus').map(status => {
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
      const bgColor = isActive ? activeColors[status.id as keyof typeof activeColors] : inactiveColors[status.id as keyof typeof inactiveColors];
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
        const bgColor = isActive ? activeColors[status.id as keyof typeof activeColors] : inactiveColors[status.id as keyof typeof inactiveColors];
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
              <Users size={12} strokeWidth={2.5} />
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
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
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
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          </div>
        </div>}
      </div>;
    }
  };
  // Suppress unused variable warnings
  void _saveOriginalWidth;
  void _handleResetClick;
  void _getDisplayPriorityTiers;

  // US-008: Helper to find staff's in-service ticket and calculate progress
  const getStaffTicketInfo = useCallback((staffId: string | number): {
    activeTickets: Array<{ id: number; clientName: string; serviceName: string; status: string }>;
    currentTicketInfo: { ticketId: string; clientName: string; serviceName: string; startTime: string; progress: number } | null;
  } | null => {
    // Match tickets by staffId (could be UUID string) or by assignedTo.id
    const staffInServiceTickets = inServiceTickets.filter((ticket: UITicket) => {
      const ticketStaffId = ticket.techId || ticket.assignedTo?.id;
      // Handle both string and number IDs
      return ticketStaffId === String(staffId) || ticketStaffId === staffId;
    });

    if (staffInServiceTickets.length === 0) {
      return null;
    }

    // Get the first (primary) ticket for current ticket info
    const primaryTicket = staffInServiceTickets[0];

    // Calculate progress based on start time and duration
    const calculateProgress = (ticket: UITicket): number => {
      const durationStr = ticket.duration || '30min';
      const durationMinutes = parseInt(durationStr.replace(/\D/g, '')) || 30;

      // Use createdAt as the start time (when service started)
      const startTime = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime();
      const elapsedMinutes = elapsedMs / (1000 * 60);

      // Progress is elapsed time / total duration, capped between 0 and 1
      // Allow up to 100% - over 100% indicates overtime
      const progress = Math.min(1, Math.max(0, elapsedMinutes / durationMinutes));
      return progress;
    };

    // Format time for display (e.g., "10:15AM")
    const formatStartTime = (ticket: UITicket): string => {
      const startTime = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
      return startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase().replace(' ', '');
    };

    // Build active tickets array for StaffCard
    const activeTickets = staffInServiceTickets.map((ticket, idx) => ({
      id: idx + 1, // Use sequential IDs for display
      clientName: ticket.clientName || 'Walk-in',
      serviceName: ticket.service || 'Service',
      status: 'in-service' as const,
    }));

    // Build current ticket info for display
    const currentTicketInfo = {
      ticketId: primaryTicket.id,
      clientName: primaryTicket.clientName || 'Walk-in',
      serviceName: primaryTicket.service || 'Service',
      startTime: formatStartTime(primaryTicket),
      progress: calculateProgress(primaryTicket),
    };

    return { activeTickets, currentTicketInfo };
  }, [inServiceTickets]);

  // US-009: Helper to find staff's next upcoming appointment
  const getStaffNextAppointment = useCallback((staffId: string | number): string | undefined => {
    const now = new Date();

    // Filter appointments for this staff that are:
    // 1. In the future (or within next few hours)
    // 2. Status is 'scheduled' or 'confirmed' (not cancelled, completed, etc.)
    const upcomingAppointments = allAppointments.filter((apt: LocalAppointment) => {
      // Match by staffId
      if (apt.staffId !== String(staffId) && apt.staffId !== staffId) {
        return false;
      }

      // Check status - only include scheduled/confirmed appointments
      const validStatuses = ['scheduled', 'confirmed', 'pending'];
      if (!validStatuses.includes(apt.status)) {
        return false;
      }

      // Check if appointment is in the future
      // LocalAppointment.scheduledStartTime is always a string (ISO format)
      const aptTime = new Date(apt.scheduledStartTime);
      return aptTime > now;
    });

    if (upcomingAppointments.length === 0) {
      return undefined;
    }

    // Sort by start time and get the earliest one
    // LocalAppointment.scheduledStartTime is always a string (ISO format)
    const sortedAppointments = upcomingAppointments.sort((a, b) => {
      const timeA = new Date(a.scheduledStartTime).getTime();
      const timeB = new Date(b.scheduledStartTime).getTime();
      return timeA - timeB;
    });

    const nextApt = sortedAppointments[0];
    const aptTime = new Date(nextApt.scheduledStartTime);

    // Format as "10:30 AM" style
    return aptTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, [allAppointments]);

  // US-009: Helper to find staff's last completed service time
  const getStaffLastServiceTime = useCallback((staffId: string | number): string | undefined => {
    // Filter completed tickets for this staff
    const staffCompletedTickets = completedTickets.filter((ticket: UITicket) => {
      const ticketStaffId = ticket.techId || ticket.assignedTo?.id;
      return ticketStaffId === String(staffId) || ticketStaffId === staffId;
    });

    if (staffCompletedTickets.length === 0) {
      return undefined;
    }

    // Sort by updated time (most recent first) to get the latest completed ticket
    // Use time field which contains the ticket time, or createdAt/updatedAt
    const sortedTickets = staffCompletedTickets.sort((a, b) => {
      // Try to get a timestamp from the ticket
      const getTimestamp = (t: UITicket): number => {
        // updatedAt is when the ticket was marked as paid/completed
        if (t.updatedAt) {
          const time = typeof t.updatedAt === 'string' ? new Date(t.updatedAt) : t.updatedAt;
          return time.getTime();
        }
        if (t.createdAt) {
          const time = typeof t.createdAt === 'string' ? new Date(t.createdAt) : t.createdAt;
          return time.getTime();
        }
        return 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });

    const lastTicket = sortedTickets[0];

    // Get the completion/update time
    let lastTime: Date | undefined;
    if (lastTicket.updatedAt) {
      lastTime = typeof lastTicket.updatedAt === 'string'
        ? new Date(lastTicket.updatedAt)
        : lastTicket.updatedAt;
    } else if (lastTicket.createdAt) {
      lastTime = typeof lastTicket.createdAt === 'string'
        ? new Date(lastTicket.createdAt)
        : lastTicket.createdAt;
    }

    if (!lastTime) {
      return undefined;
    }

    // Format as "10:30 AM" style
    return lastTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, [completedTickets]);

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
      {filteredStaff.length > 0 ? <div className={`staff-card-grid grid ${getGridColumns()} ${getGapAndPadding()}`}>
        {filteredStaff.map((staffMember, index) => {
          // Convert string ID to number for compatibility
          const staffIdNumber = typeof staffMember.id === 'string'
            ? parseInt(staffMember.id.replace(/\\D/g, '')) || index + 1
            : staffMember.id;

          const modifiedStaffMember = {
            ...staffMember,
            id: staffIdNumber,
            image: staffMember.name === 'Jane' ? '' : getStaffImage(staffMember), // Force empty image for Jane to test Add Photo UI
            time: (typeof staffMember.clockInTime === 'string' ? new Date(staffMember.clockInTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '10:30a'), // Add time field for metrics display
            revenue: staffMember.revenue ?? null, // Ensure revenue is explicitly set
            count: staffMember.turnCount ?? 0, // Add count property for StaffCard
          };

          // Use vertical card layout
          const CardComponent = StaffCardVertical;

          // US-008: Get real ticket data for this staff member
          // Use the staff member's original ID (UUID string) to match with tickets
          const ticketInfo = getStaffTicketInfo(staffMember.id);

          if (ticketInfo) {
            // Staff has active in-service tickets - use real data
            (modifiedStaffMember as any).activeTickets = ticketInfo.activeTickets;
            // Convert null to undefined for type compatibility
            modifiedStaffMember.currentTicketInfo = ticketInfo.currentTicketInfo ?? undefined;
          }

          // US-009: Get real appointment and completed ticket data for this staff member
          // Use the staff member's original ID (UUID string) to match with appointments/tickets
          const nextAppointment = getStaffNextAppointment(staffMember.id);
          const lastService = getStaffLastServiceTime(staffMember.id);

          // Set real nextAppointmentTime from appointments data
          modifiedStaffMember.nextAppointmentTime = nextAppointment;

          // Set real lastServiceTime from completed tickets data
          modifiedStaffMember.lastServiceTime = lastService;

          const getTooltipContent = () => (
            <div className="p-2 max-w-xs">
              <p className="font-bold text-sm mb-1">{modifiedStaffMember.name}</p>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Status:</span> {modifiedStaffMember.status}</p>
                {modifiedStaffMember.turnCount !== undefined && (
                  <p><span className="font-medium">Turns:</span> {modifiedStaffMember.turnCount}</p>
                )}
                {modifiedStaffMember.clockInTime && (
                  <p><span className="font-medium">Clocked in:</span> {typeof modifiedStaffMember.clockInTime === 'string' ? new Date(modifiedStaffMember.clockInTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : String(modifiedStaffMember.clockInTime)}</p>
                )}
                {modifiedStaffMember.currentTicketInfo && (
                  <>
                    <p><span className="font-medium">Current service:</span> {modifiedStaffMember.currentTicketInfo.serviceName}</p>
                    <p><span className="font-medium">Client:</span> {modifiedStaffMember.currentTicketInfo.clientName}</p>
                    <p><span className="font-medium">Started:</span> {modifiedStaffMember.currentTicketInfo.startTime}</p>
                    <p><span className="font-medium">Progress:</span> {Math.round((modifiedStaffMember.currentTicketInfo.progress ?? 0) * 100)}%</p>
                  </>
                )}
                {modifiedStaffMember.nextAppointmentTime && (
                  <p><span className="font-medium">Next Appt:</span> {modifiedStaffMember.nextAppointmentTime}</p>
                )}
                {modifiedStaffMember.lastServiceTime && (
                  <p><span className="font-medium">Last Done:</span> {modifiedStaffMember.lastServiceTime}</p>
                )}
              </div>
            </div>
          );

          return (
            <div key={modifiedStaffMember.id} className="w-full min-w-[80px]">
              <Tippy
                content={getTooltipContent()}
                placement="right"
                duration={[200, 0]}
                delay={[300, 0]}
                animation="shift-away"
                interactive={true}
                appendTo={() => document.body}
              >
                <div>
                  <CardComponent
                    staff={modifiedStaffMember as any}
                    viewMode={getCardViewMode()}
                    displayConfig={{
                      showName: true,
                      showQueueNumber: true,
                      showAvatar: true,
                      // US-001: Connect to FrontDeskSettings from Redux
                      showTurnCount: settings?.showTurnCount ?? true,
                      showStatus: true,
                      showClockedInTime: true,
                      showNextAppointment: settings?.showNextAppointment ?? true,
                      showSalesAmount: settings?.showServicedAmount ?? true,
                      showTickets: settings?.showTicketCount ?? true,
                      showLastService: settings?.showLastDone ?? true,
                      // US-002/US-003: More Options menu action settings
                      showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                      showAddTicketAction: settings?.showAddTicketAction ?? true,
                      showAddNoteAction: settings?.showAddNoteAction ?? true,
                      showEditTeamAction: settings?.showEditTeamAction ?? true,
                      showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                      // US-012: Clock In/Out action
                      showClockInOutAction: settings?.showClockInOutAction ?? true,
                    }}
                    // US-010: Handle staff card click to open details panel
                    onClick={() => handleStaffClick(modifiedStaffMember)}
                    // US-003: Handle Add Ticket action
                    onAddTicket={handleAddTicket}
                    // US-004: Handle Add Note action
                    onAddNote={handleAddNote}
                    // US-005: Handle Edit Team Member action
                    onEditTeam={handleEditTeam}
                    // US-006: Handle Quick Checkout action
                    onQuickCheckout={handleQuickCheckout}
                    // US-012: Handle Clock In/Out actions
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
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
    {/* Turn Tracker Modal - Only show if feature is enabled for license tier */}
    {isTurnTrackerEnabled && (
      <TurnTracker isOpen={showTurnTracker} onClose={() => setShowTurnTracker(false)} />
    )}
    {/* US-004: Add Staff Note Modal */}
    {selectedStaffForNote && (
      <AddStaffNoteModal
        isOpen={showStaffNoteModal}
        onClose={() => {
          setShowStaffNoteModal(false);
          setSelectedStaffForNote(null);
        }}
        staffId={selectedStaffForNote.id}
        staffName={selectedStaffForNote.name}
        onSave={handleSaveStaffNote}
      />
    )}
    {/* US-010: Staff Details Panel */}
    {showStaffDetails && selectedStaffForDetails && (
      <StaffDetailsPanel
        staff={selectedStaffForDetails}
        onClose={() => {
          setShowStaffDetails(false);
          setSelectedStaffForDetails(null);
        }}
        onAddTicket={handleAddTicket}
        onAddNote={handleAddNote}
        onEditTeam={handleEditTeam}
        onQuickCheckout={handleQuickCheckout}
      />
    )}
  </div>;
}