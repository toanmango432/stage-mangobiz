import { useEffect, useState, useRef, memo, useMemo, useCallback } from 'react';
import { useTickets } from '@/hooks/useTicketsCompat';
import { useTicketSection } from '@/hooks/frontdesk';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Users, MoreVertical, List, Grid, Check, ChevronDown, ChevronUp, Trash2, AlertCircle, ChevronRight, Hourglass, Maximize2 } from 'lucide-react';
import { useTicketPanel, TicketData } from '@/contexts/TicketPanelContext';
import { AssignTicketModal } from '@/components/tickets/AssignTicketModal';
import { EditTicketModal } from '@/components/tickets/EditTicketModal';
import { TicketDetailsModal } from '@/components/tickets/TicketDetailsModal';
import { WaitListTicketCard, WaitListTicketCardRefactored } from '@/components/tickets';
import { headerContentSpacer, waitingHeaderTheme } from './headerTokens';
import { FrontDeskHeader, HeaderActionButton } from './FrontDeskHeader';
import { FrontDeskEmptyState } from './FrontDeskEmptyState';
import { FrontDeskSettingsData } from '@/components/frontdesk-settings/types';
import { SearchBar } from './SearchBar';
import { FrontDeskSubTabs, SubTab } from './FrontDeskSubTabs';
// Module components - US-023
import { SortableListItem, SortableGridItem } from './WaitListSection/components';
// Drag and drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useAppDispatch } from '@/store/hooks';
import { setWaitlistOrder } from '@/store/slices/uiTicketsSlice';

// No-op function for drag overlay callbacks (intentionally does nothing)
const noop = () => { /* intentionally empty for drag overlay */ };

interface WaitListSectionProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isMobile?: boolean;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
  cardViewMode?: 'normal' | 'compact';
  setCardViewMode?: (mode: 'normal' | 'compact') => void;
  minimizedLineView?: boolean;
  setMinimizedLineView?: (minimized: boolean) => void;
  isCombinedView?: boolean;
  hideHeader?: boolean;
  headerStyles?: {
    bg: string;
    accentColor: string;
    iconColor: string;
    activeIconColor: string;
    titleColor: string;
    borderColor: string;
    counterBg: string;
    counterText: string;
  };
  settings?: FrontDeskSettingsData;
}
export const WaitListSection = memo(function WaitListSection({
  isMinimized = false,
  onToggleMinimize,
  isMobile = false,
  viewMode: externalViewMode,
  setViewMode: externalSetViewMode,
  cardViewMode: externalCardViewMode,
  setCardViewMode: externalSetCardViewMode,
  minimizedLineView: externalMinimizedLineView,
  setMinimizedLineView: externalSetMinimizedLineView,
  isCombinedView = false,
  hideHeader = false,
  // headerStyles - intentionally not used in this component (parent styling applies)
  settings
}: WaitListSectionProps) {
  // IMPORTANT: All hooks must be called before any conditional returns (React Rules of Hooks)

  // Get waitlist from context
  const {
    waitlist,
    assignTicket,
    deleteTicket
  } = useTickets();

  // Get ticket panel context for opening tickets
  const { openTicketWithData } = useTicketPanel();

  // BUG-009 FIX: Derive cardViewMode from settings.viewStyle when not in combined view
  // This ensures settings.viewStyle affects individual sections in non-combined (three-column) view
  const settingsCardViewMode = settings?.viewStyle === 'compact' ? 'compact' : 'normal';
  const effectiveExternalCardViewMode = externalCardViewMode ?? (isCombinedView ? undefined : settingsCardViewMode);

  // Handler to open a ticket in the Ticket Control Center
  const handleOpenTicket = (ticket: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const ticketData: TicketData = {
      id: ticket.id,
      number: ticket.number,
      clientName: ticket.clientName,
      clientType: ticket.clientType,
      service: ticket.service,
      // CRITICAL: Check checkoutServices first (set by auto-save), then services, then fallback
      checkoutServices: ticket.checkoutServices || ticket.services || (ticket.service ? [{
        id: `service-${Date.now()}`,
        serviceId: ticket.serviceId,
        serviceName: ticket.service,
        price: ticket.price || 0,
        duration: parseInt(ticket.duration) || 30,
        status: 'not_started',
        staffId: ticket.techId,
        staffName: ticket.technician,
      }] : []),
      technician: ticket.technician,
      techId: ticket.techId,
      duration: ticket.duration,
      subtotal: ticket.price || ticket.subtotal,
      notes: ticket.notes,
      time: ticket.time,
      status: 'waiting',
    };
    openTicketWithData(ticketData);
    setOpenDropdownId(null);
  };

  // Calculate average wait time from ticket.time (check-in time)
  // Handles various time formats: ISO date, "HH:MM", "H:MM AM/PM"
  const calculateWaitTime = (time: string | Date | undefined): number => {
    if (!time) return 0;

    try {
      const now = new Date();
      let startTime: Date;

      // If it's already a Date object
      if (time instanceof Date) {
        startTime = time;
      }
      // If it's a string
      else if (typeof time === 'string') {
        // Try ISO date format first
        const isoDate = new Date(time);
        if (!isNaN(isoDate.getTime())) {
          startTime = isoDate;
        }
        // Try "H:MM AM/PM" or "HH:MM AM/PM" format
        else {
          const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
          if (ampmMatch) {
            let hours = parseInt(ampmMatch[1], 10);
            const minutes = parseInt(ampmMatch[2], 10);
            const period = ampmMatch[3]?.toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            startTime = new Date(now);
            startTime.setHours(hours, minutes, 0, 0);
          } else {
            return 0;
          }
        }
      } else {
        return 0;
      }

      const waitTime = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
      return isNaN(waitTime) ? 0 : Math.max(0, waitTime);
    } catch {
      return 0;
    }
  };

  const avgWaitTime = waitlist.length > 0
    ? Math.round(waitlist.reduce((sum, ticket) => sum + calculateWaitTime(ticket.time), 0) / waitlist.length)
    : 0;

  // Use shared hook for view mode management (replaces 45+ lines of duplicate code)
  const {
    viewMode,
    setViewMode,
    cardViewMode,
    toggleCardViewMode,
    minimizedLineView,
    toggleMinimizedLineView
  } = useTicketSection({
    sectionKey: 'waitList',
    defaultViewMode: 'list',
    defaultCardViewMode: 'normal',
    isCombinedView,
    externalViewMode,
    externalSetViewMode,
    // BUG-009 FIX: Use effective cardViewMode that respects settings.viewStyle
    externalCardViewMode: effectiveExternalCardViewMode,
    externalSetCardViewMode,
    externalMinimizedLineView,
    externalSetMinimizedLineView,
  });

  const [cardScale, setCardScale] = useState<number>(() => {
    const saved = localStorage.getItem('waitListCardScale');
    return saved ? parseFloat(saved) : 1.0;
  });
  // State for dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ticketDropdownRef = useRef<HTMLDivElement>(null);
  // State for assign ticket modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  // New states for edit and delete functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ticketToView, setTicketToView] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  // Search state for filtering tickets
  const [searchQuery, setSearchQuery] = useState('');
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Drag and drop state
  const dispatch = useAppDispatch();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Check if drag and drop is enabled from settings
  const isDragEnabled = settings?.enableDragAndDrop ?? true;

  // Sensors for drag and drop (with delay to prevent accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end - update order in Redux
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // When filtering is active, we need to map indices from filtered list to full waitlist
    const isFiltered = searchQuery.trim() || selectedCategory !== 'all';

    if (isFiltered) {
      // Get the actual indices in the full waitlist
      const activeFullIndex = waitlist.findIndex(t => t.id === active.id);
      const overFullIndex = waitlist.findIndex(t => t.id === over.id);

      if (activeFullIndex !== -1 && overFullIndex !== -1) {
        const newOrder = arrayMove(waitlist, activeFullIndex, overFullIndex);
        dispatch(setWaitlistOrder(newOrder));
      }
    } else {
      // No filter - use direct indices
      const oldIndex = waitlist.findIndex(t => t.id === active.id);
      const newIndex = waitlist.findIndex(t => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(waitlist, oldIndex, newIndex);
        dispatch(setWaitlistOrder(newOrder));
      }
    }
  }, [dispatch, waitlist, searchQuery, selectedCategory]);

  // Get the ticket being dragged for the overlay
  const activeTicket = useMemo(() => {
    if (!activeId) return null;
    return waitlist.find(t => t.id === activeId) || null;
  }, [activeId, waitlist]);

  // Extract unique service categories from tickets (using first word of service name)
  const categoryTabs = useMemo((): SubTab[] => {
    const categoryMap = new Map<string, number>();
    waitlist.forEach(ticket => {
      if (ticket.service) {
        // Use first word of service as category (e.g., "Manicure", "Pedicure", "Haircut")
        const category = ticket.service.split(/\s+/)[0] || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });
    const tabs: SubTab[] = [{ id: 'all', label: 'All', count: waitlist.length }];
    // Sort categories alphabetically
    Array.from(categoryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([category, count]) => {
        tabs.push({ id: category.toLowerCase(), label: category, count });
      });
    return tabs;
  }, [waitlist]);

  // Filter waitlist based on search query and category
  const filteredWaitlist = useMemo(() => {
    let filtered = waitlist;

    // Filter by category first
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ticket => {
        const ticketCategory = ticket.service?.split(/\s+/)[0]?.toLowerCase() || '';
        return ticketCategory === selectedCategory;
      });
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(ticket =>
        ticket.clientName?.toLowerCase().includes(query) ||
        ticket.service?.toLowerCase().includes(query) ||
        ticket.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [waitlist, searchQuery, selectedCategory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (ticketDropdownRef.current && !ticketDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if section should be hidden based on settings (after all hooks)
  if (settings && (!settings.waitListActive || !settings.showWaitList)) {
    return null;
  }

  // Open assign ticket modal
  const handleAssignTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowAssignModal(true);
  };
  // Handle assign ticket submission
  const handleAssignSubmit = (techId: string, techName: string, techColor: string) => {
    if (selectedTicketId) {
      assignTicket(selectedTicketId, techId, techName, techColor);
      setShowAssignModal(false);
      setSelectedTicketId(null);
    }
  };
  // Toggle dropdown menu for a ticket
  const toggleDropdown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };
  // Open edit modal
  const openEditModal = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToEdit(id);
    setShowEditModal(true);
    setOpenDropdownId(null);
  };
  // Open details modal
  const openDetailsModal = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToView(id);
    setShowDetailsModal(true);
    setOpenDropdownId(null);
  };
  // Open delete confirmation modal
  const openDeleteConfirmation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToDelete(id);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };
  // Handle ticket deletion
  const handleDeleteTicket = () => {
    if (ticketToDelete && deleteReason.trim() !== '') {
      deleteTicket(ticketToDelete, deleteReason);
      setShowDeleteModal(false);
      setTicketToDelete(null);
      setDeleteReason('');
    }
  };
  // Handle edit from details modal
  const handleEditFromDetails = (id: number) => {
    setShowDetailsModal(false);
    setTicketToEdit(id);
    setShowEditModal(true);
  };
  // Handle delete from details modal
  const handleDeleteFromDetails = (ticketNumber: number) => {
    setShowDetailsModal(false);
    // Find the ticket id by its number
    const ticket = waitlist.find(t => t.number === ticketNumber);
    if (ticket) {
      setTicketToDelete(ticket.id);
      setShowDeleteModal(true);
    }
  };
  // Paper textures for tickets
  const paperTextures = ["url('https://www.transparenttextures.com/patterns/paper.png')", "url('https://www.transparenttextures.com/patterns/paper-fibers.png')", "url('https://www.transparenttextures.com/patterns/rice-paper.png')", "url('https://www.transparenttextures.com/patterns/soft-paper.png')", "url('https://www.transparenttextures.com/patterns/handmade-paper.png')"];
  // Paper background colors
  const paperVariations = ['#FFFDF7', '#FFFEF9', '#FFFCF5', '#FFFDF8', '#FFFEFA'];
  // Delete confirmation modal component
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;
    const ticket = ticketToDelete ? waitlist.find(t => t.id === ticketToDelete) : null;
    if (!ticket) return null;
    return <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-11/12 max-w-md overflow-hidden border border-gray-200">
          <div className="bg-red-50 p-4 border-b border-red-100">
            <div className="flex items-center">
              <div className="bg-red-500 p-2 rounded-full text-white mr-3">
                <Trash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Delete Ticket</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                You are about to delete the following ticket:
              </p>
              <div className="rounded-xl border border-gray-200 relative overflow-hidden p-3" style={{
              backgroundColor: paperVariations[ticket.number % paperVariations.length],
              backgroundImage: paperTextures[ticket.number % paperTextures.length],
              backgroundBlendMode: 'overlay',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
            }}>
                <div className="flex items-center mb-1">
                  <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm mr-2 border border-gray-800">
                    {ticket.number}
                  </div>
                  <span className="text-gray-700 font-medium">
                    {ticket.clientName}
                  </span>
                </div>
                <div className="text-sm text-gray-600 ml-8">
                  {ticket.service}
                </div>
                {/* Paper texture overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay" style={{
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/rice-paper.png")'
              }}></div>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for deletion <span className="text-red-500">*</span>
              </label>
              <select id="deleteReason" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500" value={deleteReason} onChange={e => setDeleteReason(e.target.value)} required>
                <option value="">Select a reason</option>
                <option value="client_no_show">Client No-Show</option>
                <option value="client_cancelled">Client Cancelled</option>
                <option value="duplicate_entry">Duplicate Entry</option>
                <option value="tech_unavailable">Technician Unavailable</option>
                <option value="scheduling_error">Scheduling Error</option>
                <option value="other">Other</option>
              </select>
              {deleteReason === '' && <p className="text-sm text-red-500 mt-1">
                  Please select a reason for deletion
                </p>}
            </div>
            {deleteReason === 'other' && <div className="mb-4">
                <label htmlFor="otherReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Please specify
                </label>
                <textarea id="otherReason" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500" rows={2} placeholder="Enter reason..."></textarea>
              </div>}
            <div className="flex justify-end space-x-2 mt-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${deleteReason === '' ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={handleDeleteTicket} disabled={deleteReason === ''}>
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      </>;
  };
  if (isMinimized) {
    return <div className="bg-white border-l border-l-gray-200 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out cursor-pointer" onClick={onToggleMinimize}>
        {/* Minimized vertical header for mobile/tablet */}
        {(isMobile || isCombinedView) && <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
            <div className="flex items-center">
              <div className="mr-3 text-amber-500">
                <Users size={16} />
              </div>
              <h2 className="text-base font-medium text-gray-800">Waiting Queue</h2>
              <div className="ml-2 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {waitlist.length}
              </div>
            </div>
            <div className="flex space-x-2">
              <Tippy content="Expand section">
                <button className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200" onClick={onToggleMinimize}>
                  <Maximize2 size={isMobile ? 18 : 16} />
                </button>
              </Tippy>
            </div>
          </div>}
        {/* Minimized vertical sidebar for desktop */}
        {!isMobile && !isCombinedView && <div className="h-full flex flex-col items-center py-4 bg-white">
            <div className="flex flex-col items-center justify-center">
              <div className="text-amber-500 mb-2">
                <Users size={20} />
              </div>
              <div className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full mb-2">
                {waitlist.length}
              </div>
              <div className="writing-mode-vertical text-xs font-medium text-gray-700 transform -rotate-90 whitespace-nowrap mt-4">
                Waiting Queue
              </div>
              <Tippy content="Expand section">
                <button className="mt-auto p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 mt-4" onClick={onToggleMinimize}>
                  <ChevronRight size={16} />
                </button>
              </Tippy>
            </div>
          </div>}
      </div>;
  }
  return <div className="h-full flex-1 bg-white border-l border-l-gray-200 flex flex-col overflow-hidden pb-0 transform-gpu transition-all duration-300 ease-in-out">
      {/* Section header - hide when in combined view and hideHeader is true */}
      {!hideHeader && (
        <FrontDeskHeader
          title="Waiting Queue"
          count={waitlist.length}
          icon={<Hourglass size={20} strokeWidth={2.5} />}
          customTheme={waitingHeaderTheme}
          subtitle={waitlist.length > 0 ? `Avg ${avgWaitTime}m` : undefined}
          rightActions={
            <>
              {viewMode === 'grid' ? (
                <Tippy content={cardViewMode === 'compact' ? 'Switch to Normal' : 'Switch to Compact'}>
                  <HeaderActionButton onClick={toggleCardViewMode}>
                    {cardViewMode === 'compact' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </HeaderActionButton>
                </Tippy>
              ) : (
                <Tippy content={minimizedLineView ? 'Expand line view' : 'Minimize line view'}>
                  <HeaderActionButton onClick={toggleMinimizedLineView}>
                    {minimizedLineView ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </HeaderActionButton>
                </Tippy>
              )}

              <div className="relative" ref={dropdownRef}>
                <Tippy content="More options">
                  <HeaderActionButton onClick={() => setShowDropdown(!showDropdown)}>
                    <MoreVertical size={16} />
                  </HeaderActionButton>
                </Tippy>
                {showDropdown && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1">
                    {/* View Mode Section */}
                    <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        View Mode
                      </h3>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setViewMode('grid');
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                          viewMode === 'grid'
                            ? 'bg-violet-50 text-violet-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <Grid size={14} className="mr-2" />
                          <span>Grid View</span>
                        </div>
                        {viewMode === 'grid' && <Check size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                          viewMode === 'list'
                            ? 'bg-violet-50 text-violet-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <List size={14} className="mr-2" />
                          <span>List View</span>
                        </div>
                        {viewMode === 'list' && <Check size={14} />}
                      </button>
                    </div>

                    {/* Card Size Section */}
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Card Size
                      </h3>
                    </div>
                    <div className="px-3 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Small</span>
                        <span className="text-xs font-semibold text-gray-700">{Math.round(cardScale * 100)}%</span>
                        <span className="text-xs text-gray-500">Large</span>
                      </div>
                      <input
                        type="range"
                        min="0.7"
                        max="1.3"
                        step="0.05"
                        value={cardScale}
                        onChange={(e) => {
                          const newScale = parseFloat(e.target.value);
                          setCardScale(newScale);
                          localStorage.setItem('waitListCardScale', newScale.toString());
                        }}
                        className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        style={{
                          background: `linear-gradient(to right, #F43F5E 0%, #F43F5E ${((cardScale - 0.7) / 0.6) * 100}%, #E5E7EB ${((cardScale - 0.7) / 0.6) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          }
        />
      )}
      <div className={`flex-1 overflow-auto px-4 bg-white ${isMobile ? 'pb-3' : 'pb-16'} ${headerContentSpacer} scroll-smooth`}>
        {/* Search bar for filtering tickets */}
        {waitlist.length > 0 && (
          <div className="mb-3 pt-1 space-y-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by client name, service, or notes..."
              size="sm"
            />
            {/* Category filter tabs - only show if there are multiple categories */}
            {categoryTabs.length > 2 && (
              <FrontDeskSubTabs
                tabs={categoryTabs}
                activeTab={selectedCategory}
                onTabChange={setSelectedCategory}
                className="rounded-lg -mx-1"
              />
            )}
            {/* Filter indicator */}
            {(searchQuery || selectedCategory !== 'all') && filteredWaitlist.length !== waitlist.length && (
              <p className="text-xs text-gray-500">
                Showing {filteredWaitlist.length} of {waitlist.length} tickets
                {selectedCategory !== 'all' && !searchQuery && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-2 text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Clear filter
                  </button>
                )}
              </p>
            )}
          </div>
        )}
        {/* Show content based on whether there are tickets */}
        {filteredWaitlist.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredWaitlist.map(t => t.id)}
              strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              {viewMode === 'grid' ? (
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: cardViewMode === 'compact' ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
                    transform: `scale(${cardScale})`,
                    transformOrigin: 'top left',
                    width: `${100 / cardScale}%`,
                    justifyContent: 'start'
                  }}
                >
                  {filteredWaitlist.map(ticket => (
                    <SortableGridItem
                      key={ticket.id}
                      ticket={ticket}
                      viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                      isDragDisabled={!isDragEnabled}
                      onAssign={(id) => {
                        setSelectedTicketId(id);
                        setShowAssignModal(true);
                      }}
                      onEdit={(id) => {
                        setTicketToEdit(Number(id));
                        setShowEditModal(true);
                      }}
                      onDelete={(id) => {
                        setTicketToDelete(id);
                        setShowDeleteModal(true);
                      }}
                      onClick={(id) => {
                        const ticketToOpen = filteredWaitlist.find(t => t.id === id);
                        if (ticketToOpen) {
                          handleOpenTicket(ticketToOpen);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="space-y-2 pt-2"
                  style={{
                    transform: `scale(${cardScale})`,
                    transformOrigin: 'top left',
                    width: `${100 / cardScale}%`
                  }}
                >
                  {filteredWaitlist.map(ticket => (
                    <SortableListItem
                      key={ticket.id}
                      ticket={ticket}
                      viewMode={minimizedLineView ? 'compact' : 'normal'}
                      isDragDisabled={!isDragEnabled}
                      onAssign={(id) => {
                        setSelectedTicketId(id);
                        setShowAssignModal(true);
                      }}
                      onEdit={(id) => {
                        setTicketToEdit(Number(id));
                        setShowEditModal(true);
                      }}
                      onDelete={(id) => {
                        setTicketToDelete(id);
                        setShowDeleteModal(true);
                      }}
                      onClick={(id) => {
                        const ticketToOpen = filteredWaitlist.find(t => t.id === id);
                        if (ticketToOpen) {
                          handleOpenTicket(ticketToOpen);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </SortableContext>

            {/* Drag overlay for visual feedback */}
            <DragOverlay>
              {activeTicket ? (
                <div className="opacity-90 shadow-2xl rotate-2 scale-105">
                  {viewMode === 'grid' ? (
                    <WaitListTicketCardRefactored
                      ticket={{
                        id: activeTicket.id,
                        number: activeTicket.number,
                        clientName: activeTicket.clientName,
                        clientType: activeTicket.clientType || 'Regular',
                        service: activeTicket.service,
                        duration: activeTicket.duration || '30min',
                        time: activeTicket.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                        status: 'waiting' as const,
                        notes: activeTicket.notes,
                        createdAt: activeTicket.createdAt,
                        lastVisitDate: activeTicket.lastVisitDate ?? undefined,
                        checkoutServices: activeTicket.checkoutServices,
                      }}
                      viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                      onAssign={noop}
                      onEdit={noop}
                      onDelete={noop}
                      onClick={noop}
                    />
                  ) : (
                    <WaitListTicketCard
                      ticket={{
                        id: activeTicket.id,
                        number: activeTicket.number,
                        clientName: activeTicket.clientName,
                        clientType: activeTicket.clientType || 'Regular',
                        service: activeTicket.service,
                        duration: activeTicket.duration || '30min',
                        time: activeTicket.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                        status: 'waiting',
                        notes: activeTicket.notes,
                        checkoutServices: activeTicket.checkoutServices,
                      }}
                      viewMode={minimizedLineView ? 'compact' : 'normal'}
                      onAssign={noop}
                      onEdit={noop}
                      onDelete={noop}
                      onClick={noop}
                    />
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
              // Show different empty state based on whether search is active
              waitlist.length > 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <AlertCircle size={40} className="mb-3 text-gray-400" />
                  <p className="text-sm font-medium">No matching tickets</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <FrontDeskEmptyState section="waitList" />
              )
            )}
      </div>
      {/* Modals */}
      <AssignTicketModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} onAssign={handleAssignSubmit} ticketId={selectedTicketId} />
      <EditTicketModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} ticketId={ticketToEdit} />
      <TicketDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} ticketId={ticketToView} onEdit={handleEditFromDetails} onDelete={handleDeleteFromDetails} />
      <DeleteConfirmationModal />
    </div>;
});