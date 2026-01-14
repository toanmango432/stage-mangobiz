import { useEffect, useState, useRef, memo, useMemo } from 'react';
import { useTickets } from '@/hooks/useTicketsCompat';
import { useTicketSection } from '@/hooks/frontdesk';
import { FrontDeskHeader, HeaderActionButton } from './FrontDeskHeader';
import { serviceHeaderTheme } from './headerTokens';
import { FrontDeskEmptyState } from './FrontDeskEmptyState';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FileText, MoreVertical, List, Grid, Check, ChevronDown, ChevronUp, ChevronRight, Tag, User, Clock, Calendar, Edit2, Info, CheckCircle, Star, MessageSquare, PlusCircle, Activity, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { useTicketPanel, TicketData } from '@/contexts/TicketPanelContext';
import { EditTicketModal } from '@/components/tickets/EditTicketModal';
import { TicketDetailsModal } from '@/components/tickets/TicketDetailsModal';
import { ServiceTicketCard, ServiceTicketCardRefactored } from '@/components/tickets';
import { FrontDeskSettingsData } from '@/components/frontdesk-settings/types';
import { SearchBar } from './SearchBar';
import { FrontDeskSubTabs, SubTab } from './FrontDeskSubTabs';
// Shared time utilities
import { formatTime, parseDuration, getEstimatedEndTime } from './shared';

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

  // Filter service tickets based on search query and category
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

    return filtered;
  }, [serviceTickets, searchQuery, selectedCategory]);

  // Track expanded tickets
  const [expandedTickets, setExpandedTickets] = useState<Record<number, boolean>>({});
  // Toggle ticket expansion
  const toggleTicketExpansion = (ticketId: number) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };
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
  // Handle complete ticket
  const handleCompleteTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (completeTicket) {
      completeTicket(id, {}); // Pass empty completion details for now
    }
  };
  // Handle pause/resume ticket
  const handlePauseResumeTicket = (id: string, isPaused: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused && resumeTicket) {
      resumeTicket(id);
    } else if (!isPaused && pauseTicket) {
      pauseTicket(id);
    }
  };
  // Handle open delete confirmation modal
  const openDeleteConfirmation = (id: string) => {
    setTicketToDelete(id);
    setShowDeleteModal(true);
  };
  // Handle ticket deletion
  const handleDeleteTicket = () => {
    if (ticketToDelete && deleteReason.trim() !== '' && deleteTicket) {
      deleteTicket(ticketToDelete, deleteReason);
      setShowDeleteModal(false);
      setTicketToDelete(null);
      setDeleteReason('');
    }
  };
  // Paper textures for tickets - more subtle as requested
  const paperTextures = ["url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')", "url('https://www.transparenttextures.com/patterns/white-paperboard.png')", "url('https://www.transparenttextures.com/patterns/whisper.png')", "url('https://www.transparenttextures.com/patterns/soft-wallpaper.png')", "url('https://www.transparenttextures.com/patterns/cream-paper.png')"];
  // Paper background colors - lighter, more subtle
  const paperVariations = ['#FFFFFE', '#FAFCFF', '#F8FAFF', '#F5F8FF', '#F2F6FF'];
  // Component for the Play icon
  const Play = ({
    size = 24,
    ...props
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>;
  // Component for the Pause icon
  const Pause = ({
    size = 24,
    ...props
  }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>;
  // Unused legacy components (kept for reference but not rendered)
  const _ServiceListItem = ({
    ticket
  }: {
    ticket: any;
  }) => {
    const isExpanded = expandedTickets[ticket.id] || false;
    const isPaused = ticket.status === 'paused';
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className={`rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 mb-3 relative overflow-hidden ${isExpanded ? 'shadow-md' : ''} ${isPaused ? 'opacity-80' : ''}`} style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.4)',
      transform: isExpanded ? 'scale(1.01)' : 'scale(1)',
      zIndex: isExpanded ? 10 : 'auto'
    }} onClick={(e) => handleOpenTicket(ticket, e)}>
        {/* Ticket stub edge with semicircle cut-outs - more subtle */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-60"></div>
        {/* Collapsed view */}
        <div className="flex flex-wrap sm:flex-nowrap items-center p-3 pl-4">
          {/* Left section - Number & Client */}
          <div className="flex items-center min-w-0 flex-grow">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm mr-3 border border-gray-800" style={{
            textShadow: '0px 1px 1px rgba(0,0,0,0.1)'
          }}>
              {ticket.number}
            </div>
            <div className="flex flex-col min-w-0 pr-2">
              <div className="font-semibold text-gray-800 flex items-center flex-wrap">
                <span className="truncate mr-2 text-sm sm:text-base max-w-[120px] sm:max-w-full">
                  {ticket.clientName}
                </span>
                {ticket.isVIP && <Tippy content="VIP Client">
                    <span>
                      <Star size={14} className="text-amber-400 inline-block" />
                    </span>
                  </Tippy>}
              </div>
              <div className="flex items-center mt-0.5 sm:mt-1 text-xs text-gray-600">
                <div className="flex items-center mr-2 sm:mr-3">
                  <Clock size={12} className="text-brand-500 mr-1" />
                  <span>{ticket.startTime}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={12} className="text-brand-500 mr-1" />
                  <span>{ticket.duration}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Middle section - Tech & Service */}
          <div className="flex items-center space-x-2 sm:space-x-3 mt-2 sm:mt-0 w-full sm:w-auto">
            {/* Tech badge */}
            <div className="flex items-center py-1 px-2 rounded-full text-xs" style={{
            backgroundColor: `${ticket.techColor}20`,
            color: ticket.techColor,
            border: `1px solid ${ticket.techColor}40`
          }}>
              <User size={12} className="mr-1" />
              <span>{ticket.techName}</span>
            </div>
            {/* Service tag */}
            <div className="flex-grow sm:flex-grow-0 flex items-center bg-brand-50/40 px-2 py-1 rounded-md border border-brand-100 text-xs text-gray-700 truncate max-w-[160px]" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <Tag size={12} className="text-brand-500 mr-1.5 flex-shrink-0" />
              <span className="truncate">{ticket.service}</span>
            </div>
          </div>
          {/* Perforation line - vertical for list view */}
          <div className="hidden sm:block w-px h-14 border-l border-dashed border-gray-300 mx-3 opacity-50"></div>
          {/* Actions */}
          <div className="flex items-center flex-shrink-0 ml-auto space-x-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
            {/* Status indicator */}
            <div className={`flex items-center text-xs rounded-full px-2 py-0.5 ${isPaused ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
              {isPaused ? 'Paused' : 'Active'}
            </div>
            {/* Action buttons */}
            <div className="flex space-x-1">
              {/* Pause/Resume button */}
              <Tippy content={isPaused ? 'Resume service' : 'Pause service'}>
                <button className={`p-1.5 rounded-full ${isPaused ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'} transition-colors`} onClick={e => handlePauseResumeTicket(ticket.id, isPaused, e)} aria-label={isPaused ? 'Resume service' : 'Pause service'}>
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
              </Tippy>
              {/* Complete button */}
              <Tippy content="Complete service">
                <button className="p-1.5 text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" onClick={e => handleCompleteTicket(ticket.id, e)} aria-label="Complete service">
                  <CheckCircle size={14} />
                </button>
              </Tippy>
              {/* More options */}
              <Tippy content="More options">
                <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)} aria-label="More options" aria-haspopup="true" aria-expanded={openDropdownId === ticket.id}>
                  <MoreVertical size={14} />
                </button>
              </Tippy>
              {/* Dropdown menu */}
              {openDropdownId === ticket.id && <div ref={ticketDropdownRef} className="absolute right-0 mt-8 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1" onClick={e => e.stopPropagation()} role="menu">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center font-medium" onClick={e => handleOpenTicket(ticket, e)} role="menuitem">
                    <ExternalLink size={14} className="mr-2 text-purple-500" />
                    Open Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)} role="menuitem">
                    <Edit2 size={14} className="mr-2 text-brand-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)} role="menuitem">
                    <Info size={14} className="mr-2 text-brand-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 flex items-center" onClick={e => handleCompleteTicket(ticket.id, e)} role="menuitem">
                    <CheckCircle size={14} className="mr-2 text-brand-500" />
                    Complete Service
                  </button>
                </div>}
            </div>
          </div>
          {/* Expansion indicator */}
          <div className="absolute bottom-2 right-2 text-gray-300">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {/* Expanded view */}
        {isExpanded && <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
            {/* Perforation divider */}
            <div className="border-t border-dashed border-gray-300 my-2 opacity-50"></div>
            {/* Service details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left column */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Tag size={14} className="text-blue-500 mr-2" />
                  Service Details
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-blue-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <p className="text-gray-700">{ticket.service}</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Est. Duration: {ticket.duration}</span>
                    <span>Price: {(ticket as any).price ? `$${(ticket as any).price.toFixed(2)}` : 'See menu'}</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2 flex items-center">
                  <MessageSquare size={14} className="text-blue-500 mr-2" />
                  Client Notes
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-blue-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <p className="text-gray-600 italic">
                    {ticket.notes || 'No notes for this client.'}
                  </p>
                </div>
              </div>
              {/* Right column */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <User size={14} className="text-blue-500 mr-2" />
                  Technician
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-blue-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center text-white font-medium" style={{
                  backgroundColor: ticket.techColor
                }}>
                      {ticket.techName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {ticket.techName}
                      </p>
                      <p className="text-xs text-gray-500">Technician</p>
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2 flex items-center">
                  <Clock size={14} className="text-blue-500 mr-2" />
                  Service Time
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-blue-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Start Time:</span>
                    <span className="text-gray-700 font-medium">
                      {ticket.startTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-700 font-medium">
                      {ticket.duration}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 my-1"></div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-700">Est. End Time:</span>
                    <span className="text-gray-900">{formatTime(getEstimatedEndTime(ticket.createdAt, ticket.duration))}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button className={`flex items-center py-1.5 px-3 rounded-md ${isPaused ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'} text-xs font-medium transition-colors`} onClick={e => {
            e.stopPropagation();
            handlePauseResumeTicket(ticket.id, isPaused, e);
          }}>
                {isPaused ? <>
                    <Play size={14} className="mr-1.5" />
                    Resume Service
                  </> : <>
                    <Pause size={14} className="mr-1.5" />
                    Pause Service
                  </>}
              </button>
              <button className="flex items-center py-1.5 px-3 rounded-md bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors" onClick={e => {
            e.stopPropagation();
            handleCompleteTicket(ticket.id, e);
          }}>
                <CheckCircle size={14} className="mr-1.5" />
                Complete Service
              </button>
              <button className="flex items-center py-1.5 px-3 rounded-md bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
                <MessageSquare size={14} className="mr-1.5 text-gray-500" />
                Add Note
              </button>
              <button className="flex items-center py-1.5 px-3 rounded-md bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
                <PlusCircle size={14} className="mr-1.5 text-gray-500" />
                Add Service
              </button>
            </div>
          </div>}
        {/* Status stamp overlay - more subtle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none">
          <div className={`${isPaused ? 'text-amber-500' : 'text-brand-500'} font-bold text-2xl tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(20,184,166,0.2)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont'
        }}>
            {isPaused ? 'PAUSED' : 'IN SERVICE'}
          </div>
        </div>
        {/* Random crease effect - very subtle */}
        {ticket.id % 3 === 0 && <div className="absolute top-0 right-[20%] w-px h-full bg-gray-200 opacity-10 transform rotate-[2deg]"></div>}
      </div>;
  };
  // Render minimized list view item
  const _MinimizedServiceListItem = ({
    ticket
  }: {
    ticket: any;
  }) => {
    const isPaused = ticket.status === 'paused';
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className={`rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 mb-2 relative overflow-hidden ${isPaused ? 'opacity-75' : ''}`} style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.4)'
    }} onClick={(e) => handleOpenTicket(ticket, e)}>
        {/* Ticket stub edge with semicircle cut-outs - more subtle */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-60"></div>
        <div className="flex items-center p-2 pl-3">
          {/* Number & Client */}
          <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm mr-2 border border-gray-800" style={{
          textShadow: '0px 1px 1px rgba(0,0,0,0.1)'
        }}>
            {ticket.number}
          </div>
          <div className="flex flex-col min-w-0 flex-grow">
            <div className="flex items-center">
              <span className="truncate text-xs font-semibold text-gray-800 mr-1.5 max-w-[100px]">
                {ticket.clientName}
              </span>
              {ticket.isVIP && <Star size={10} className="text-amber-400" />}
            </div>
            <div className="flex items-center mt-0.5">
              <Tag size={9} className="text-blue-500 mr-1 flex-shrink-0" />
              <span className="text-[9px] text-gray-600 truncate max-w-[120px]">
                {ticket.service}
              </span>
            </div>
          </div>
          {/* Tech badge */}
          <div className="ml-1 px-1.5 py-0.5 rounded-sm text-[9px] font-medium flex items-center" style={{
          backgroundColor: `${ticket.techColor}20`,
          color: ticket.techColor,
          border: `1px solid ${ticket.techColor}40`
        }}>
            <span className="truncate max-w-[60px]">{ticket.techName}</span>
          </div>
          {/* Status indicator */}
          <div className={`ml-1 w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
        </div>
        {/* Subtle status stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none">
          <div className={`${isPaused ? 'text-amber-500' : 'text-brand-500'} font-bold text-lg tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(20,184,166,0.2)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont'
        }}>
            {isPaused ? 'PAUSED' : 'IN SERVICE'}
          </div>
        </div>
      </div>;
  };
  // Render grid view item (ticket card)
  const _ServiceCard = ({
    ticket
  }: {
    ticket: any;
  }) => {
    const isExpanded = expandedTickets[ticket.id] || false;
    const isPaused = ticket.status === 'paused';
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className={`rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group relative h-full ${isExpanded ? 'shadow-md' : ''} ${isPaused ? 'opacity-80' : ''}`} style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.4)',
      transform: isExpanded ? 'scale(1.01)' : 'scale(1)',
      zIndex: isExpanded ? 10 : 'auto'
    }} onClick={(e) => handleOpenTicket(ticket, e)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-60"></div>
        {/* Card header with number and status */}
        <div className="flex justify-between p-3 border-b border-dashed border-gray-300 pl-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm mr-2 border border-gray-800" style={{
            textShadow: '0px 1px 1px rgba(0,0,0,0.1)'
          }}>
              {ticket.number}
            </div>
            <div className={`ml-1 text-xs px-2 py-0.5 rounded-full ${isPaused ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
              {isPaused ? 'Paused' : 'Active'}
            </div>
          </div>
          {/* Quick action icons */}
          <div className="flex space-x-1">
            {/* VIP indicator */}
            {ticket.isVIP && <Tippy content="VIP Client">
                <div className="p-1 text-amber-400">
                  <Star size={14} />
                </div>
              </Tippy>}
            {/* Pause/Resume button */}
            <Tippy content={isPaused ? 'Resume service' : 'Pause service'}>
              <button className={`p-1 rounded-full ${isPaused ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'} transition-colors`} onClick={e => {
              e.stopPropagation();
              handlePauseResumeTicket(ticket.id, isPaused, e);
            }} aria-label={isPaused ? 'Resume service' : 'Pause service'}>
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            </Tippy>
            {/* More options dropdown */}
            <div className="relative">
              <Tippy content="More options">
                <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)} aria-label="More options" aria-haspopup="true" aria-expanded={openDropdownId === ticket.id}>
                  <MoreVertical size={14} />
                </button>
              </Tippy>
              {openDropdownId === ticket.id && <div ref={ticketDropdownRef} className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1" onClick={e => e.stopPropagation()} role="menu">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center font-medium" onClick={e => handleOpenTicket(ticket, e)} role="menuitem">
                    <ExternalLink size={14} className="mr-2 text-purple-500" />
                    Open Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)} role="menuitem">
                    <Edit2 size={14} className="mr-2 text-brand-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)} role="menuitem">
                    <Info size={14} className="mr-2 text-brand-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 flex items-center" onClick={e => handleCompleteTicket(ticket.id, e)} role="menuitem">
                    <CheckCircle size={14} className="mr-2 text-brand-500" />
                    Complete Service
                  </button>
                </div>}
            </div>
          </div>
        </div>
        {/* Card content */}
        <div className="p-3">
          {/* Client information */}
          <div className="flex items-center mb-3">
            <div className="bg-brand-50 p-2 rounded-full mr-3 border border-brand-100" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <User size={14} className="text-brand-500" />
            </div>
            <div className="font-semibold text-gray-800 truncate">
              {ticket.clientName}
            </div>
          </div>
          {/* Time and duration */}
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <div className="flex items-center bg-brand-50/40 px-2 py-1 rounded-md border border-brand-100 mr-2" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <Clock size={12} className="text-brand-500 mr-1" />
              <span className="font-medium">{ticket.startTime}</span>
              <span className="mx-1 text-gray-400">•</span>
              <span className="font-medium">{ticket.duration}</span>
            </div>
          </div>
          {/* Tech information */}
          {(ticket.techName || ticket.technician) && <div className="mb-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium mr-2" style={{
              backgroundColor: ticket.techColor || ticket.assignedTo?.color || '#6B7280'
            }}>
                {(ticket.techName || ticket.technician || ticket.assignedTo?.name || 'U').charAt(0)}
              </div>
              <div className="text-xs py-0.5 px-2 rounded-md" style={{
              backgroundColor: `${ticket.techColor || ticket.assignedTo?.color || '#6B7280'}20`,
              color: ticket.techColor || ticket.assignedTo?.color || '#6B7280',
              border: `1px solid ${ticket.techColor || ticket.assignedTo?.color || '#6B7280'}40`
            }}>
                {ticket.techName || ticket.technician || ticket.assignedTo?.name || 'Unassigned'}
              </div>
            </div>
          </div>}
          {/* Service information */}
          {ticket.service && <div className="mt-3 font-medium text-sm text-gray-700 p-3 rounded-md border border-gray-200" style={{
          backgroundColor: 'rgba(240,249,255,0.5)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
              <div className="flex items-start">
                <Tag size={14} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{ticket.service}</span>
              </div>
            </div>}
        </div>
        {/* Expanded view */}
        {isExpanded && <div className="px-3 pb-3" onClick={e => e.stopPropagation()}>
            {/* Perforation divider */}
            <div className="border-t border-dashed border-gray-300 my-2 opacity-50"></div>
            {/* Client notes */}
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <MessageSquare size={14} className="text-blue-500 mr-2" />
              Client Notes
            </h4>
            <div className="bg-white bg-opacity-50 p-3 rounded-md border border-blue-100 text-sm mb-3" style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
              <p className="text-gray-600 italic">
                {ticket.notes || 'No notes for this client.'}
              </p>
            </div>
            {/* Service time */}
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Clock size={14} className="text-blue-500 mr-2" />
              Service Time
            </h4>
            <div className="bg-white bg-opacity-50 p-3 rounded-md border border-blue-100 text-sm" style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Start Time:</span>
                <span className="text-gray-700 font-medium">
                  {ticket.startTime}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-700 font-medium">
                  {ticket.duration}
                </span>
              </div>
              <div className="border-t border-dashed border-gray-200 my-1"></div>
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-700">Est. End Time:</span>
                <span className="text-gray-900">{formatTime(getEstimatedEndTime(ticket.createdAt, ticket.duration))}</span>
              </div>
            </div>
          </div>}
        {/* Perforation line */}
        <div className="border-t border-dashed border-gray-300 mx-3 opacity-50"></div>
        {/* Card footer with action buttons */}
        <div className="flex items-center justify-between p-3 mt-auto" style={{
        backgroundColor: 'rgba(240,249,255,0.3)'
      }}>
          <button className={`py-1.5 px-3 rounded-md ${isPaused ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'} text-xs font-medium transition-colors`} onClick={e => {
          e.stopPropagation();
          handlePauseResumeTicket(ticket.id, isPaused, e);
        }}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button className="py-1.5 px-3 bg-brand-600 text-white font-medium rounded-md hover:bg-brand-700 transition-colors text-xs" onClick={e => {
          e.stopPropagation();
          handleCompleteTicket(ticket.id, e);
        }}>
            Complete
          </button>
          {/* Expansion indicator */}
          <div className="text-gray-300">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {/* Status stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none">
          <div className={`${isPaused ? 'text-amber-500' : 'text-brand-500'} font-bold text-2xl tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(20,184,166,0.2)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont'
        }}>
            {isPaused ? 'PAUSED' : 'IN SERVICE'}
          </div>
        </div>
        {/* Random crease effect - very subtle */}
        {ticket.id % 4 === 0 && <div className="absolute top-0 left-[30%] w-px h-full bg-gray-200 opacity-10 transform rotate-[1deg]"></div>}
      </div>;
  };
  // Compact card view for grid layout
  const _CompactServiceCard = ({
    ticket
  }: {
    ticket: any;
  }) => {
    const isPaused = ticket.status === 'paused';
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className={`rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 group relative overflow-hidden ${isPaused ? 'opacity-80' : ''}`} style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02), inset 0 0 0 1px rgba(255,255,255,0.4)'
    }} onClick={(e) => handleOpenTicket(ticket, e)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-60"></div>
        <div className="flex items-center justify-between p-2 border-b border-dashed border-gray-300 pl-3">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm mr-2 border border-gray-800" style={{
            textShadow: '0px 1px 1px rgba(0,0,0,0.1)'
          }}>
              {ticket.number}
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">
                  {ticket.clientName}
                </span>
                {ticket.isVIP && <Star size={10} className="ml-1 text-amber-400" />}
              </div>
              <div className="mt-0.5 text-[10px] px-1.5 py-0.5 rounded-sm inline-block" style={{
              backgroundColor: `${ticket.techColor}20`,
              color: ticket.techColor,
              border: `1px solid ${ticket.techColor}40`
            }}>
                {ticket.techName}
              </div>
            </div>
          </div>
          {/* Status indicator */}
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
        </div>
        <div className="p-2 flex flex-col">
          <div className="flex items-center text-[10px] text-gray-600 mb-2">
            <Clock size={10} className="text-blue-500 mr-0.5" />
            <span>{ticket.startTime}</span>
            <span className="mx-1 text-gray-400">•</span>
            <span>{ticket.duration}</span>
          </div>
          <div className="flex space-x-1">
            <button className={`flex-1 py-1 px-1 text-center rounded-md ${isPaused ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'} text-[10px] font-medium transition-colors`} onClick={e => {
            e.stopPropagation();
            handlePauseResumeTicket(ticket.id, isPaused, e);
          }}>
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button className="flex-1 py-1 px-1 text-center bg-brand-600 text-white font-medium rounded-md hover:bg-brand-700 transition-colors text-[10px]" onClick={e => {
            e.stopPropagation();
            handleCompleteTicket(ticket.id, e);
          }}>
              Complete
            </button>
          </div>
        </div>
        {/* Status stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none">
          <div className={`${isPaused ? 'text-amber-500' : 'text-brand-500'} font-bold text-lg tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(20,184,166,0.2)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont'
        }}>
            {isPaused ? 'PAUSED' : 'IN SERVICE'}
          </div>
        </div>
      </div>;
  };
  // Suppress unused warnings for legacy components
  void [_ServiceListItem, _MinimizedServiceListItem, _ServiceCard, _CompactServiceCard];
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
                <ServiceTicketCardRefactored
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