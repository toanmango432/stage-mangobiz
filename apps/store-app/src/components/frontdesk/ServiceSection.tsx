import { useEffect, useState, useRef, memo, useMemo } from 'react';
import { useTickets } from '@/hooks/useTicketsCompat';
import { useTicketSection } from '@/hooks/frontdesk';
import { FrontDeskHeader, HeaderActionButton } from './FrontDeskHeader';
import { serviceHeaderTheme } from './headerTokens';
import { FrontDeskEmptyState } from './FrontDeskEmptyState';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FileText, MoreVertical, List, Grid, Check, ChevronDown, ChevronUp, ChevronRight, Clock, Activity, Trash2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { useTicketPanel, TicketData } from '@/contexts/TicketPanelContext';
import { EditTicketModal } from '@/components/tickets/EditTicketModal';
import { TicketDetailsModal } from '@/components/tickets/TicketDetailsModal';
import { ServiceTicketCard } from '@/components/tickets';
import { FrontDeskSettingsData } from '@/components/frontdesk-settings/types';
import { SearchBar } from './SearchBar';
import { FrontDeskSubTabs, SubTab } from './FrontDeskSubTabs';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSortBy, updateSetting, saveFrontDeskSettings } from '@/store/slices/frontDeskSettingsSlice';

interface ServiceSectionProps {
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
export const ServiceSection = memo(function ServiceSection({
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
  headerStyles: _headerStyles,
  settings
}: ServiceSectionProps) {
  // Check if section should be hidden based on settings
  if (settings && (!settings.inServiceActive || !settings.showInService)) {
    return null;
  }

  // Redux hooks for sort setting
  const dispatch = useAppDispatch();
  const sortBy = useAppSelector(selectSortBy);

  // BUG-009 FIX: Derive cardViewMode from settings.viewStyle when not in combined view
  // This ensures settings.viewStyle affects individual sections in non-combined (three-column) view
  const settingsCardViewMode = settings?.viewStyle === 'compact' ? 'compact' : 'normal';
  const effectiveExternalCardViewMode = externalCardViewMode ?? (isCombinedView ? undefined : settingsCardViewMode);

  // Get service tickets from context with fallback to empty array
  const {
    serviceTickets = [],
    completeTicket,
    pauseTicket,
    resumeTicket,
    deleteTicket
  } = useTickets();

  // Get ticket panel context for opening tickets
  const { openTicketWithData } = useTicketPanel();

  // Handler to open a ticket in the Ticket Control Center
  const handleOpenTicket = (ticket: any, e: React.MouseEvent) => {
    e.stopPropagation();
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
        status: ticket.serviceStatus || 'in_progress',
        staffId: ticket.techId,
        staffName: ticket.technician,
      }] : []),
      technician: ticket.technician,
      techId: ticket.techId,
      duration: ticket.duration,
      subtotal: ticket.price || ticket.subtotal,
      notes: ticket.notes,
      time: ticket.time,
      status: 'in_service',
    };
    openTicketWithData(ticketData);
    setOpenDropdownId(null);
  };

  // Updated color tokens for section styling - teal theme
  const colorTokens = {
    primary: '#14B8A6',
    bg: 'bg-brand-50',
    text: 'text-brand-600',
    border: 'ring-brand-600/30',
    iconBg: 'bg-brand-600',
    hoverBg: 'hover:bg-brand-50/50',
    hoverText: 'hover:text-brand-600',
    dropdownHover: 'hover:bg-brand-50',
    focusRing: 'focus:ring-brand-600'
  };

  // Use shared hook for view mode management (replaces 45+ lines of duplicate code)
  const {
    viewMode,
    setViewMode,
    cardViewMode,
    toggleCardViewMode,
    minimizedLineView,
    toggleMinimizedLineView
  } = useTicketSection({
    sectionKey: 'service',
    defaultViewMode: 'grid',
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

  // Calculate average duration in minutes
  const avgDuration = serviceTickets.length > 0
    ? Math.round(serviceTickets.reduce((sum, ticket) => {
        const durationStr = ticket.duration || '0min';
        const minutes = parseInt(durationStr.replace(/\D/g, '')) || 0;
        return sum + minutes;
      }, 0) / serviceTickets.length)
    : 0;

  // PERFORMANCE FIX: Use static initial value, defer localStorage read to useEffect
  const [cardScale, setCardScale] = useState<number>(1.0);

  // PERFORMANCE FIX: Load saved cardScale after initial paint (non-blocking)
  useEffect(() => {
    const saved = localStorage.getItem('serviceCardScale');
    if (saved) {
      setCardScale(parseFloat(saved));
    }
  }, []);
  // State for dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ticketDropdownRef = useRef<HTMLDivElement>(null);
  // State for edit and details modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ticketToView, setTicketToView] = useState<number | null>(null);
  // State for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  // Search state for filtering tickets
  const [searchQuery, setSearchQuery] = useState('');
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Extract unique service categories from tickets (using first word of service name)
  const categoryTabs = useMemo((): SubTab[] => {
    const categoryMap = new Map<string, number>();
    serviceTickets.forEach(ticket => {
      if (ticket.service) {
        // Use first word of service as category (e.g., "Manicure", "Pedicure", "Haircut")
        const category = ticket.service.split(/\s+/)[0] || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    });
    const tabs: SubTab[] = [{ id: 'all', label: 'All', count: serviceTickets.length }];
    // Sort categories alphabetically
    Array.from(categoryMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([category, count]) => {
        tabs.push({ id: category.toLowerCase(), label: category, count });
      });
    return tabs;
  }, [serviceTickets]);

  // Filter and sort service tickets based on search query, category, and sortBy setting
  const filteredServiceTickets = useMemo(() => {
    let filtered = serviceTickets;

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
        ticket.technician?.toLowerCase().includes(query) ||
        ticket.notes?.toLowerCase().includes(query)
      );
    }

    // Sort based on sortBy setting
    // 'queue' = sort by ticket number (turn tracker order)
    // 'time' = sort by createdAt (chronological order)
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'time') {
        // Sort by createdAt (oldest first = service started first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      } else {
        // Default: sort by ticket number (queue order)
        return (a.number || 0) - (b.number || 0);
      }
    });

    return filtered;
  }, [serviceTickets, searchQuery, selectedCategory, sortBy]);

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

  // Handle open delete confirmation modal
  const openDeleteConfirmation = (id: string) => {
    setTicketToDelete(id);
    setShowDeleteModal(true);
  };
  // Handle ticket deletion
  const handleDeleteTicket = () => {
    if (ticketToDelete && deleteReason.trim() !== '' && deleteTicket) {
      // Use 'other' as reason type with the text as the note for backward compatibility
      deleteTicket(ticketToDelete, 'other', deleteReason);
      setShowDeleteModal(false);
      setTicketToDelete(null);
      setDeleteReason('');
    }
  };
  // Render minimized sidebar with vertical text, count badge, and status icon
  if (isMinimized) {
    return <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:shadow-md" onClick={onToggleMinimize}>
        {/* Minimized vertical sidebar with improved layout */}
        <div className="h-full flex flex-col items-center py-4 bg-white relative">
          {/* Top section with icon */}
          <div className={`${colorTokens.text} p-2 rounded-full`}>
            <FileText size={18} />
          </div>
          {/* Middle section with vertical text and count badge */}
          <div className="flex-1 flex flex-col items-center justify-center my-4">
            {/* Vertical text */}
            <div className={`transform -rotate-90 origin-center whitespace-nowrap font-medium ${colorTokens.text} tracking-wide`} style={{
            fontSize: '14px',
            letterSpacing: '0.05em'
          }}>
              IN SERVICE
            </div>
            {/* Count badge */}
            <div className={`mt-8 ${colorTokens.iconBg} text-white text-xs px-2 py-0.5 rounded-full shadow-sm`}>
              {serviceTickets.length}
            </div>
          </div>
          {/* Bottom section with expand button */}
          <Tippy content="Expand section">
            <button className="mt-auto p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200" onClick={e => {
            e.stopPropagation();
            onToggleMinimize && onToggleMinimize();
          }} aria-expanded="false" aria-controls="service-content">
              <ChevronRight size={18} />
            </button>
          </Tippy>
          {/* Left border with status indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600 opacity-80"></div>
        </div>
      </div>;
  }
  return <div className="h-full flex-1 flex flex-col overflow-hidden bg-white">
      {!hideHeader && (
        <FrontDeskHeader
          title="In Service"
          count={serviceTickets.length}
          icon={<Activity size={20} strokeWidth={2.5} />}
          customTheme={serviceHeaderTheme}
          subtitle={avgDuration > 0 ? `Avg ${avgDuration}m` : undefined}
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
                            ? 'bg-emerald-50 text-emerald-600'
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
                            ? 'bg-emerald-50 text-emerald-600'
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

                    {/* Sort By Section */}
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Sort By
                      </h3>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          dispatch(updateSetting({ key: 'sortBy', value: 'queue' }));
                          dispatch(saveFrontDeskSettings());
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                          sortBy === 'queue'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <ArrowUpDown size={14} className="mr-2" />
                          <span>Queue Order</span>
                        </div>
                        {sortBy === 'queue' && <Check size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          dispatch(updateSetting({ key: 'sortBy', value: 'time' }));
                          dispatch(saveFrontDeskSettings());
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                          sortBy === 'time'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <Clock size={14} className="mr-2" />
                          <span>Time (Chronological)</span>
                        </div>
                        {sortBy === 'time' && <Check size={14} />}
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
                          localStorage.setItem('serviceCardScale', newScale.toString());
                        }}
                        className="w-full h-2 bg-brand-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        style={{
                          background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${((cardScale - 0.7) / 0.6) * 100}%, #E5E7EB ${((cardScale - 0.7) / 0.6) * 100}%, #E5E7EB 100%)`
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
      <div id="service-content" className={`flex-1 overflow-auto p-3 scroll-smooth bg-white ${isMobile ? 'pb-3' : 'pb-16'}`}>
        {/* Search bar for filtering tickets */}
        {serviceTickets.length > 0 && (
          <div className="mb-3 space-y-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by client, service, or technician..."
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
            {(searchQuery || selectedCategory !== 'all') && filteredServiceTickets.length !== serviceTickets.length && (
              <p className="text-xs text-gray-500">
                Showing {filteredServiceTickets.length} of {serviceTickets.length} tickets
                {selectedCategory !== 'all' && !searchQuery && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-2 text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Clear filter
                  </button>
                )}
              </p>
            )}
          </div>
        )}
        {/* Show content based on whether there are tickets */}
        {filteredServiceTickets.length > 0 ? viewMode === 'grid' ? <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: cardViewMode === 'compact' ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
            transform: `scale(${cardScale})`,
            transformOrigin: 'top left',
            width: `${100 / cardScale}%`,
            justifyContent: 'start'
          }}
        >
              {filteredServiceTickets.map(ticket => (
                <ServiceTicketCard
                  key={ticket.id}
                  ticket={{
                    id: ticket.id,
                    number: ticket.number,
                    clientName: ticket.clientName,
                    clientType: ticket.clientType || 'Regular',
                    service: ticket.service,
                    duration: ticket.duration || '30min',
                    time: ticket.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    status: (ticket.status as 'waiting' | 'in-service' | 'completed') || 'waiting',
                    notes: ticket.notes,
                    technician: ticket.technician,
                    techColor: ticket.techColor,
                    assignedTo: ticket.assignedTo,
                    assignedStaff: ticket.assignedStaff, // Pass multi-staff array
                    createdAt: ticket.createdAt,
                    lastVisitDate: ticket.lastVisitDate,
                    serviceStatus: ticket.serviceStatus, // Pass service status for pause/resume
                    checkoutServices: ticket.checkoutServices, // Pass actual services from auto-save
                  }}
                  viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                  onComplete={(id: string) => completeTicket?.(id, {})}
                  onPause={(id: string) => pauseTicket?.(id)}
                  onResume={(id: string) => resumeTicket?.(id)}
                  onDelete={(id: string) => openDeleteConfirmation(id)}
                  onEdit={(id: string) => {
                    setTicketToEdit(parseInt(id));
                    setShowEditModal(true);
                  }}
                  onClick={(id: string) => {
                    // Open ticket in checkout panel
                    const clickedTicket = filteredServiceTickets.find(t => t.id === id);
                    if (clickedTicket) {
                      handleOpenTicket(clickedTicket, { stopPropagation: () => {} } as React.MouseEvent);
                    }
                  }}
                />
              ))}
            </div> : <div
              className="space-y-2"
              style={{
                transform: `scale(${cardScale})`,
                transformOrigin: 'top left',
                width: `${100 / cardScale}%`
              }}
            >
              {filteredServiceTickets.map(ticket => (
                <ServiceTicketCard
                  key={ticket.id}
                  ticket={{
                    id: ticket.id,
                    number: ticket.number,
                    clientName: ticket.clientName,
                    clientType: ticket.clientType || 'Regular',
                    service: ticket.service,
                    duration: ticket.duration || '30min',
                    time: ticket.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    status: ticket.status as 'waiting' | 'in-service' | 'completed', // Bug #7 fix: Remove fallback, trust data
                    notes: ticket.notes,
                    technician: ticket.technician,
                    techColor: ticket.techColor,
                    assignedTo: ticket.assignedTo,
                    assignedStaff: ticket.assignedStaff, // Pass multi-staff array
                    createdAt: ticket.createdAt,
                    serviceStatus: ticket.serviceStatus, // Pass service status for pause/resume
                    checkoutServices: ticket.checkoutServices, // Pass actual services from auto-save
                  }}
                  viewMode={minimizedLineView ? 'compact' : 'normal'}
                  onComplete={(id: string) => completeTicket?.(id, {})}
                  onPause={(id: string) => pauseTicket?.(id)}
                  onResume={(id: string) => resumeTicket?.(id)}
                  onDelete={(id: string) => openDeleteConfirmation(id)}
                  onEdit={(id: string) => {
                    setTicketToEdit(parseInt(id));
                    setShowEditModal(true);
                  }}
                  onClick={(id: string) => {
                    // Open ticket in checkout panel
                    const clickedTicket = filteredServiceTickets.find(t => t.id === id);
                    if (clickedTicket) {
                      handleOpenTicket(clickedTicket, { stopPropagation: () => {} } as React.MouseEvent);
                    }
                  }}
                />
              ))}
            </div> : (
              // Show different empty state based on whether search is active
              serviceTickets.length > 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <AlertCircle size={40} className="mb-3 text-gray-400" />
                  <p className="text-sm font-medium">No matching tickets</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <FrontDeskEmptyState section="service" />
              )
            )}
      </div>
      {/* Modals */}
      <EditTicketModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} ticketId={ticketToEdit} />
      <TicketDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} ticketId={ticketToView} onEdit={id => {
      setShowDetailsModal(false);
      setTicketToEdit(id);
      setShowEditModal(true);
    }} onDelete={(id) => {
      setShowDetailsModal(false);
      openDeleteConfirmation(id.toString());
    }}
    />
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-11/12 max-w-md overflow-hidden border border-gray-200">
            <div className="bg-red-50 p-4 border-b border-red-100">
              <div className="flex items-center">
                <div className="bg-red-500 p-2 rounded-full text-white mr-3">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Delete In-Service Ticket</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this in-service ticket? This action cannot be undone.
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <select
                  id="deleteReason"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="client_left">Client Left</option>
                  <option value="client_cancelled">Client Cancelled</option>
                  <option value="service_issue">Service Issue</option>
                  <option value="tech_unavailable">Technician Unavailable</option>
                  <option value="duplicate_entry">Duplicate Entry</option>
                  <option value="scheduling_error">Scheduling Error</option>
                  <option value="other">Other</option>
                </select>
                {deleteReason === '' && (
                  <p className="text-sm text-red-500 mt-1">Please select a reason for deletion</p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTicketToDelete(null);
                    setDeleteReason('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${deleteReason === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleDeleteTicket}
                  disabled={deleteReason === ''}
                >
                  Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>;
});