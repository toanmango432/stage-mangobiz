import { useEffect, useState, useRef } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FileText, Minimize2, Maximize2, MoreVertical, List, Grid, Check, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Tag, User, Clock, Calendar, Trash2, Edit2, Info, CheckCircle, CreditCard, Star, MessageSquare, AlertCircle, Scissors, Percent, Users, Settings, PlusCircle, SplitSquareVertical, Banknote, Activity } from 'lucide-react';
import { AssignTicketModal } from './AssignTicketModal';
import { EditTicketModal } from './EditTicketModal';
import { TicketDetailsModal } from './TicketDetailsModal';
import { ServiceTicketCard } from './tickets';
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
}
export function ServiceSection({
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
  headerStyles
}: ServiceSectionProps) {
  // Get service tickets from context with fallback to empty array
  const {
    serviceTickets = [],
    completeTicket,
    pauseTicket,
    resumeTicket
  } = useTickets();
  // Updated color tokens for section styling
  const colorTokens = {
    primary: '#2F80ED',
    bg: 'bg-[#E8F2FF]',
    text: 'text-[#2F80ED]',
    border: 'ring-[#2F80ED]/30',
    iconBg: 'bg-[#2F80ED]',
    hoverBg: 'hover:bg-[#E8F2FF]/50',
    hoverText: 'hover:text-[#2F80ED]',
    dropdownHover: 'hover:bg-[#E8F2FF]',
    focusRing: 'focus:ring-[#2F80ED]'
  };
  // Get view mode from localStorage, default to 'list'
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('serviceViewMode');
    return saved === 'grid' || saved === 'list' ? saved as 'grid' | 'list' : 'grid';
  });
  const [internalCardViewMode, setInternalCardViewMode] = useState<'normal' | 'compact'>(() => {
    const saved = localStorage.getItem('serviceCardViewMode');
    return saved === 'normal' || saved === 'compact' ? saved as 'normal' | 'compact' : 'normal';
  });
  const [internalMinimizedLineView, setInternalMinimizedLineView] = useState<boolean>(() => {
    const saved = localStorage.getItem('serviceMinimizedLineView');
    return saved === 'true' ? true : false;
  });
  const [cardScale, setCardScale] = useState<number>(() => {
    const saved = localStorage.getItem('serviceCardScale');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [showCardSizeSlider, setShowCardSizeSlider] = useState(false);
  // Use either external or internal state based on isCombinedView
  const viewMode = isCombinedView && externalViewMode ? externalViewMode : internalViewMode;
  const setViewMode = (newMode: 'grid' | 'list') => {
    if (isCombinedView && externalSetViewMode) {
      externalSetViewMode(newMode);
    } else {
      setInternalViewMode(newMode);
      localStorage.setItem('serviceViewMode', newMode);
    }
  };
  const cardViewMode = isCombinedView && externalCardViewMode ? externalCardViewMode : internalCardViewMode;
  const setCardViewMode = (newMode: 'normal' | 'compact') => {
    if (isCombinedView && externalSetCardViewMode) {
      externalSetCardViewMode(newMode);
    } else {
      setInternalCardViewMode(newMode);
      localStorage.setItem('serviceCardViewMode', newMode);
    }
  };
  const minimizedLineView = isCombinedView && externalMinimizedLineView !== undefined ? externalMinimizedLineView : internalMinimizedLineView;
  const setMinimizedLineView = (newValue: boolean) => {
    if (isCombinedView && externalSetMinimizedLineView) {
      externalSetMinimizedLineView(newValue);
    } else {
      setInternalMinimizedLineView(newValue);
      localStorage.setItem('serviceMinimizedLineView', newValue.toString());
    }
  };
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
  // Toggle between normal and compact card view
  const toggleCardViewMode = () => {
    const newMode = cardViewMode === 'normal' ? 'compact' : 'normal';
    setCardViewMode(newMode);
  };
  // Toggle minimized line view
  const toggleMinimizedLineView = () => {
    const newValue = !minimizedLineView;
    setMinimizedLineView(newValue);
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
  // Render service list item for list view
  const ServiceListItem = ({
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
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs - more subtle */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-60"></div>
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
                  <Clock size={12} className="text-blue-500 mr-1" />
                  <span>{ticket.startTime}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={12} className="text-blue-500 mr-1" />
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
            <div className="flex-grow sm:flex-grow-0 flex items-center bg-blue-50/40 px-2 py-1 rounded-md border border-blue-100 text-xs text-gray-700 truncate max-w-[160px]" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <Tag size={12} className="text-blue-500 mr-1.5 flex-shrink-0" />
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
                <button className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" onClick={e => handleCompleteTicket(ticket.id, e)} aria-label="Complete service">
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
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)} role="menuitem">
                    <Edit2 size={14} className="mr-2 text-blue-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)} role="menuitem">
                    <Info size={14} className="mr-2 text-blue-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center" onClick={e => handleCompleteTicket(ticket.id, e)} role="menuitem">
                    <CheckCircle size={14} className="mr-2 text-blue-500" />
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
                    <span>Price: ${ticket.price || '85.00'}</span>
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
                      <p className="text-xs text-gray-500">Senior Technician</p>
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
                    <span className="text-gray-900">11:45 AM</span>
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
              <button className="flex items-center py-1.5 px-3 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors" onClick={e => {
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
          <div className={`${isPaused ? 'text-amber-500' : 'text-blue-500'} font-bold text-2xl tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(59,130,246,0.2)',
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
  const MinimizedServiceListItem = ({
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
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs - more subtle */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-60"></div>
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
          <div className={`${isPaused ? 'text-amber-500' : 'text-blue-500'} font-bold text-lg tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(59,130,246,0.2)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont'
        }}>
            {isPaused ? 'PAUSED' : 'IN SERVICE'}
          </div>
        </div>
      </div>;
  };
  // Render grid view item (ticket card)
  const ServiceCard = ({
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
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-60"></div>
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
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)} role="menuitem">
                    <Edit2 size={14} className="mr-2 text-blue-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)} role="menuitem">
                    <Info size={14} className="mr-2 text-blue-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center" onClick={e => handleCompleteTicket(ticket.id, e)} role="menuitem">
                    <CheckCircle size={14} className="mr-2 text-blue-500" />
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
            <div className="bg-blue-50 p-2 rounded-full mr-3 border border-blue-100" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <User size={14} className="text-blue-500" />
            </div>
            <div className="font-semibold text-gray-800 truncate">
              {ticket.clientName}
            </div>
          </div>
          {/* Time and duration */}
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <div className="flex items-center bg-blue-50/40 px-2 py-1 rounded-md border border-blue-100 mr-2" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <Clock size={12} className="text-blue-500 mr-1" />
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
                <span className="text-gray-900">11:45 AM</span>
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
          <button className="py-1.5 px-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-xs" onClick={e => {
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
          <div className={`${isPaused ? 'text-amber-500' : 'text-blue-500'} font-bold text-2xl tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(59,130,246,0.2)',
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
  const CompactServiceCard = ({
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
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-40">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-60"></div>
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
            <button className="flex-1 py-1 px-1 text-center bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-[10px]" onClick={e => {
            e.stopPropagation();
            handleCompleteTicket(ticket.id, e);
          }}>
              Complete
            </button>
          </div>
        </div>
        {/* Status stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.06] pointer-events-none">
          <div className={`${isPaused ? 'text-amber-500' : 'text-blue-500'} font-bold text-lg tracking-wider uppercase`} style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(59,130,246,0.2)',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont'
        }}>
            {isPaused ? 'PAUSED' : 'IN SERVICE'}
          </div>
        </div>
      </div>;
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
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2F80ED] opacity-80"></div>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden h-full transform-gpu transition-all duration-300 ease-in-out" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)' }}>
      {/* Section header - hide when in combined view and hideHeader is true */}
      {!hideHeader && <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-white to-gray-50/30 sticky top-0 z-10 backdrop-blur-sm" style={{ 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="p-1.5 rounded-lg" style={{ 
              background: 'linear-gradient(135deg, #9CC2EA 0%, #7DB3E3 100%)',
              boxShadow: '0 2px 4px rgba(156, 194, 234, 0.3)'
            }}>
              <Activity size={16} className="text-white" strokeWidth={2.5} />
            </div>
            
            {/* Title */}
            <h2 className="text-base font-bold" style={{ 
              color: '#1a1a1a',
              letterSpacing: '-0.4px',
              lineHeight: 1
            }}>In Service</h2>
            
            {/* Count Badge */}
            <div className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ 
              background: 'linear-gradient(135deg, #9CC2EA 0%, #7DB3E3 100%)',
              color: 'white',
              boxShadow: '0 2px 4px rgba(156, 194, 234, 0.3)',
              minWidth: '28px',
              textAlign: 'center'
            }}>
              {serviceTickets.length}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {!isMobile && viewMode === 'list' && <Tippy content={minimizedLineView ? 'Expand line view' : 'Minimize line view'}>
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95" onClick={toggleMinimizedLineView} aria-label={minimizedLineView ? 'Expand line view' : 'Minimize line view'} aria-expanded={!minimizedLineView}>
                  {minimizedLineView ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </Tippy>}
            {!isMobile && viewMode === 'grid' && <Tippy content={cardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'}>
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95" onClick={toggleCardViewMode} aria-label={cardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'} aria-expanded={cardViewMode !== 'compact'}>
                  {cardViewMode === 'compact' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </Tippy>}
            <div className="relative" ref={dropdownRef}>
              <Tippy content="View options">
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95" onClick={() => setShowDropdown(!showDropdown)} aria-haspopup="true" aria-expanded={showDropdown}>
                  <MoreVertical size={16} />
                </button>
              </Tippy>
              {showDropdown && <div className="absolute right-0 mt-1 w-52 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1">
                  {/* View Mode Section */}
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      View Mode
                    </h3>
                  </div>
                  <button className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${colorTokens.dropdownHover} flex items-center`} onClick={() => setViewMode('list')} role="menuitem">
                    <List size={14} className={`mr-2 ${colorTokens.text}`} />
                    Line View
                    {viewMode === 'list' && <Check size={14} className={`ml-auto ${colorTokens.text}`} />}
                  </button>
                  <button className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${colorTokens.dropdownHover} flex items-center`} onClick={() => setViewMode('grid')} role="menuitem">
                    <Grid size={14} className={`mr-2 ${colorTokens.text}`} />
                    Grid View
                    {viewMode === 'grid' && <Check size={14} className={`ml-auto ${colorTokens.text}`} />}
                  </button>
                  
                  {/* Card Size Section */}
                  <div className="border-t border-gray-100 mt-1">
                    <button 
                      className={`w-full text-left px-3 py-2.5 text-sm text-gray-700 ${colorTokens.dropdownHover} flex items-center justify-between`} 
                      onClick={() => setShowCardSizeSlider(!showCardSizeSlider)} 
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <Settings size={14} className={`mr-2 ${colorTokens.text}`} />
                        Adjust Card Size
                      </div>
                      <ChevronRight size={14} className={showCardSizeSlider ? 'rotate-90 transition-transform' : 'transition-transform'} />
                    </button>
                    {showCardSizeSlider && (
                      <div className="px-3 py-3 bg-gray-50 border-t border-gray-100">
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
                          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          style={{
                            background: `linear-gradient(to right, #9CC2EA 0%, #9CC2EA ${((cardScale - 0.7) / 0.6) * 100}%, #E5E7EB ${((cardScale - 0.7) / 0.6) * 100}%, #E5E7EB 100%)`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>}
            </div>
            <Tippy content="Minimize section">
              <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation" onClick={onToggleMinimize} aria-expanded="true" aria-controls="service-content">
                
              </button>
            </Tippy>
          </div>
        </div>}
      <div id="service-content" className="flex-1 overflow-auto p-3 scroll-smooth">
        {/* Show content based on whether there are tickets */}
        {serviceTickets.length > 0 ? viewMode === 'grid' ? <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 360px))',
            transform: `scale(${cardScale})`,
            transformOrigin: 'top left',
            width: `${100 / cardScale}%`,
            justifyContent: 'start'
          }}
        >
              {serviceTickets.map(ticket => (
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
                    notes: ticket.notes,
                    technician: ticket.technician,
                    techColor: ticket.techColor,
                    assignedTo: ticket.assignedTo,
                    assignedStaff: ticket.assignedStaff, // Pass multi-staff array
                    createdAt: ticket.createdAt,
                  }}
                  viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                  onComplete={(id) => completeTicket?.(id, {})}
                  onPause={(id) => pauseTicket?.(id)}
                  onClick={(id) => {
                    // Handle click to show details
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
              {serviceTickets.map(ticket => (
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
                    notes: ticket.notes,
                    technician: ticket.technician,
                    techColor: ticket.techColor,
                    assignedTo: ticket.assignedTo,
                    assignedStaff: ticket.assignedStaff, // Pass multi-staff array
                    createdAt: ticket.createdAt,
                  }}
                  viewMode={minimizedLineView ? 'compact' : 'normal'}
                  onComplete={(id) => completeTicket?.(id, {})}
                  onPause={(id) => pauseTicket?.(id)}
                  onClick={(id) => {
                    // Handle click to show details
                  }}
                />
              ))}
            </div> : <div className="flex flex-col items-center mt-24 py-8">
            <div className={`${colorTokens.bg} p-3 rounded-full mb-3`}>
              <FileText size={28} className={colorTokens.text} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No clients in service
            </h3>
            <p className="text-[13px] text-gray-500 text-center max-w-md">
              Assigned clients will appear here. Assign a client from the Wait
              List to begin service.
            </p>
          </div>}
      </div>
      {/* Modals */}
      <EditTicketModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} ticketId={ticketToEdit} />
      <TicketDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} ticketId={ticketToView} onEdit={id => {
      setShowDetailsModal(false);
      setTicketToEdit(id);
      setShowEditModal(true);
    }} onDelete={() => {}} // Not needed for service tickets
    />
    </div>;
}