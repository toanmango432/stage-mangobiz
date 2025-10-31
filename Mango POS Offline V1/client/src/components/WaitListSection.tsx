import { useEffect, useState, useRef } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Users, Minimize2, Maximize2, MoreVertical, List, Grid, Check, ChevronDown, ChevronUp, Tag, User, Clock, Calendar, Trash2, Edit2, Info, AlertCircle, Settings, MessageSquare, Star, PlusCircle, Bell, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { AssignTicketModal } from './AssignTicketModal';
import { EditTicketModal } from './EditTicketModal';
import { TicketDetailsModal } from './TicketDetailsModal';
import { WaitListTicketCard } from './tickets';
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
}
export function WaitListSection({
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
}: WaitListSectionProps) {
  // Get waitlist from context
  const {
    waitlist,
    assignTicket,
    deleteTicket
  } = useTickets();
  // Get view mode from localStorage, default to 'list'
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('waitListViewMode');
    return saved === 'grid' || saved === 'list' ? saved as 'grid' | 'list' : 'list';
  });
  // Add card view mode state (normal or compact)
  const [internalCardViewMode, setInternalCardViewMode] = useState<'normal' | 'compact'>(() => {
    const saved = localStorage.getItem('waitListCardViewMode');
    return saved === 'normal' || saved === 'compact' ? saved as 'normal' | 'compact' : 'normal';
  });
  // Add minimized line view state
  const [internalMinimizedLineView, setInternalMinimizedLineView] = useState<boolean>(() => {
    const saved = localStorage.getItem('waitListMinimizedLineView');
    return saved === 'true' ? true : false;
  });
  // Use either external or internal state based on isCombinedView
  const viewMode = isCombinedView && externalViewMode ? externalViewMode : internalViewMode;
  const setViewMode = (newMode: 'grid' | 'list') => {
    if (isCombinedView && externalSetViewMode) {
      externalSetViewMode(newMode);
    } else {
      setInternalViewMode(newMode);
      localStorage.setItem('waitListViewMode', newMode);
    }
  };
  const cardViewMode = isCombinedView && externalCardViewMode ? externalCardViewMode : internalCardViewMode;
  const setCardViewMode = (newMode: 'normal' | 'compact') => {
    if (isCombinedView && externalSetCardViewMode) {
      externalSetCardViewMode(newMode);
    } else {
      setInternalCardViewMode(newMode);
      localStorage.setItem('waitListCardViewMode', newMode);
    }
  };
  const minimizedLineView = isCombinedView && externalMinimizedLineView !== undefined ? externalMinimizedLineView : internalMinimizedLineView;
  const setMinimizedLineView = (newValue: boolean) => {
    if (isCombinedView && externalSetMinimizedLineView) {
      externalSetMinimizedLineView(newValue);
    } else {
      setInternalMinimizedLineView(newValue);
      localStorage.setItem('waitListMinimizedLineView', newValue.toString());
    }
  };
  // State for dropdown menu
  const [showDropdown, setShowDropdown] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ticketDropdownRef = useRef<HTMLDivElement>(null);
  // State for assign ticket modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  // New states for edit and delete functionality
  const [showEditModal, setShowEditModal] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [ticketToView, setTicketToView] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
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
  // Open assign ticket modal
  const handleAssignTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setShowAssignModal(true);
  };
  // Handle assign ticket submission
  const handleAssignSubmit = (techId: number, techName: string, techColor: string) => {
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
  const openDeleteConfirmation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToDelete(id);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };
  // Handle ticket deletion
  const handleDeleteTicket = () => {
    if (ticketToDelete !== null && deleteReason.trim() !== '') {
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
  const handleDeleteFromDetails = (id: number) => {
    setShowDetailsModal(false);
    setTicketToDelete(id);
    setShowDeleteModal(true);
  };
  // Paper textures for tickets
  const paperTextures = ["url('https://www.transparenttextures.com/patterns/paper.png')", "url('https://www.transparenttextures.com/patterns/paper-fibers.png')", "url('https://www.transparenttextures.com/patterns/rice-paper.png')", "url('https://www.transparenttextures.com/patterns/soft-paper.png')", "url('https://www.transparenttextures.com/patterns/handmade-paper.png')"];
  // Paper background colors
  const paperVariations = ['#FFFDF7', '#FFFEF9', '#FFFCF5', '#FFFDF8', '#FFFEFA'];
  // Delete confirmation modal component
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;
    const ticket = waitlist.find(t => t.id === ticketToDelete);
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
              backgroundColor: paperVariations[ticket.id % paperVariations.length],
              backgroundImage: paperTextures[ticket.id % paperTextures.length],
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
  // Render wait list item for list view
  const WaitListItem = ({
    ticket
  }: {
    ticket: any;
  }) => {
    const isExpanded = expandedTickets[ticket.id] || false;
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className={`rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 mb-3 relative overflow-hidden ${isExpanded ? 'shadow-md' : ''}`} style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)',
      transform: isExpanded ? 'scale(1.01)' : 'scale(1)',
      zIndex: isExpanded ? 10 : 'auto'
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-2 flex flex-col justify-between items-center pointer-events-none opacity-60">
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-70"></div>
        {/* Collapsed view */}
        <div className="flex flex-wrap sm:flex-nowrap items-center p-3 pl-4">
          {/* Left section - Number & Client */}
          <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md mr-3 border border-gray-800" style={{
          textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
        }}>
            {ticket.number}
          </div>
          <div className="flex flex-col min-w-0 flex-grow pr-2">
            <div className="font-semibold text-gray-800 flex items-center flex-wrap">
              <span className="truncate mr-2 text-sm sm:text-base max-w-[120px] sm:max-w-full">
                {ticket.clientName}
              </span>
              <span className="text-[10px] sm:text-xs bg-amber-50 text-amber-800 font-medium px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-200 mt-0.5 sm:mt-0">
                {ticket.clientType}
              </span>
            </div>
            <div className="flex items-center mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-600">
              <div className="flex items-center mr-2 sm:mr-3">
                <Calendar size={10} className="text-amber-500 mr-1" />
                <span>{ticket.time}</span>
              </div>
              <div className="flex items-center">
                <Clock size={10} className="text-amber-500 mr-1" />
                <span>{ticket.duration}</span>
              </div>
            </div>
          </div>
          {/* Middle section - Service */}
          <div className="hidden sm:flex flex-grow items-center mx-3 max-w-[30%] bg-amber-50/40 px-3 py-1.5 rounded-md border border-amber-100" style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
            <Tag size={14} className="text-amber-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate">
              {ticket.service}
            </span>
          </div>
          {/* Service for small screens */}
          <div className="sm:hidden text-[10px] text-gray-700 bg-amber-50/40 px-2 py-1 rounded-md mt-1 mb-1 w-full truncate border border-amber-100" style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
            <Tag size={10} className="text-amber-500 mr-1 inline-block" />
            <span>{ticket.service}</span>
          </div>
          {/* Perforation line - vertical for list view */}
          <div className="hidden sm:block w-px h-14 border-l border-dashed border-gray-300 mx-2 opacity-70"></div>
          {/* Actions */}
          <div className="flex items-center flex-shrink-0 ml-auto space-x-2">
            {/* Assign button */}
            <Tippy content="Assign to technician">
              <button className="py-1.5 px-3 rounded-full border border-amber-500 text-amber-600 text-xs font-medium hover:bg-amber-50 transition-colors" onClick={e => {
              e.stopPropagation();
              handleAssignTicket(ticket.id);
            }}>
                Assign
              </button>
            </Tippy>
            {/* Quick action icons */}
            <div className="flex space-x-1">
              <Tippy content="Notes">
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full" onClick={e => e.stopPropagation()}>
                  <MessageSquare size={14} />
                </button>
              </Tippy>
              <Tippy content="VIP Member">
                <button className="p-1 text-amber-400 hover:text-amber-500 hover:bg-amber-50 rounded-full" onClick={e => e.stopPropagation()}>
                  <Star size={14} />
                </button>
              </Tippy>
              <Tippy content="More options">
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)}>
                  <MoreVertical size={14} />
                </button>
              </Tippy>
              {openDropdownId === ticket.id && <div ref={ticketDropdownRef} className="absolute right-0 mt-6 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1" onClick={e => e.stopPropagation()}>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)}>
                    <Edit2 size={14} className="mr-2 text-blue-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)}>
                    <Info size={14} className="mr-2 text-amber-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 flex items-center" onClick={e => openDeleteConfirmation(ticket.id, e)}>
                    <Trash2 size={14} className="mr-2 text-red-500" />
                    Delete Ticket
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
            <div className="border-t border-dashed border-gray-300 my-2 opacity-70"></div>
            {/* Service details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left column */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Tag size={14} className="text-amber-500 mr-2" />
                  Service Details
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <p className="text-gray-700">{ticket.service}</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Est. Duration: {ticket.duration}</span>
                    <span>Price: $85.00</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2 flex items-center">
                  <MessageSquare size={14} className="text-amber-500 mr-2" />
                  Client Notes
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
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
                  <Star size={14} className="text-amber-500 mr-2" />
                  Membership & Promotions
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-gray-700">Premium Member</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-gray-700">
                      Birthday discount available
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2 flex items-center">
                  <AlertCircle size={14} className="text-amber-500 mr-2" />
                  Waiting Time
                </h4>
                <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
            }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Check-in Time:</span>
                    <span className="text-gray-700 font-medium">10:15 AM</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Current Wait:</span>
                    <span className="text-amber-600 font-medium">
                      25 minutes
                    </span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 my-1"></div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-gray-700">Est. Start Time:</span>
                    <span className="text-gray-900">10:40 AM</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button className="flex items-center py-1.5 px-3 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors" onClick={e => {
            e.stopPropagation();
            handleAssignTicket(ticket.id);
          }}>
                <Users size={14} className="mr-1.5" />
                Assign to Technician
              </button>
              <button className="flex items-center py-1.5 px-3 rounded-md bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
                <Bell size={14} className="mr-1.5 text-gray-500" />
                Send Notification
              </button>
              <button className="flex items-center py-1.5 px-3 rounded-md bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
                <PlusCircle size={14} className="mr-1.5 text-gray-500" />
                Add Service
              </button>
              <button className="flex items-center py-1.5 px-3 rounded-md bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
                <MessageSquare size={14} className="mr-1.5 text-gray-500" />
                Add Note
              </button>
            </div>
          </div>}
        {/* WAITING stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.12] pointer-events-none">
          <div className="text-amber-600 font-bold text-2xl tracking-wider uppercase" style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(217,119,6,0.2)',
          fontFamily: 'monospace'
        }}>
            WAITING
          </div>
        </div>
        {/* Random crease effect - very subtle */}
        {ticket.id % 3 === 0 && <div className="absolute top-0 right-[20%] w-px h-full bg-gray-200 opacity-20 transform rotate-[2deg]"></div>}
      </div>;
  };
  // Render minimized list view item
  const MinimizedWaitListItem = ({
    ticket
  }: {
    ticket: any;
  }) => {
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className="rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 mb-2 relative overflow-hidden" style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-60">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-70"></div>
        <div className="flex items-center p-2 pl-3">
          {/* Number & Client */}
          <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm mr-2 border border-gray-800" style={{
          textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
        }}>
            {ticket.number}
          </div>
          <div className="flex flex-col min-w-0 flex-grow">
            <div className="flex items-center">
              <span className="truncate text-xs font-semibold text-gray-800 mr-1.5 max-w-[100px]">
                {ticket.clientName}
              </span>
              <span className="text-[9px] bg-amber-50 text-amber-800 px-1 py-0.5 rounded-sm border border-amber-200 font-medium">
                {ticket.clientType}
              </span>
            </div>
            <div className="flex items-center mt-0.5">
              <Tag size={9} className="text-amber-500 mr-1 flex-shrink-0" />
              <span className="text-[9px] text-gray-600 truncate max-w-[120px]">
                {ticket.service}
              </span>
            </div>
          </div>
          {/* Perforation line - vertical for minimized view */}
          <div className="w-px h-8 border-l border-dashed border-gray-300 mx-1 opacity-70"></div>
          {/* Assign button */}
          <div className="flex items-center space-x-1">
            <Tippy content="Assign to technician">
              <button className="py-1 px-2 rounded-full border border-amber-500 text-amber-600 text-[10px] font-medium hover:bg-amber-50 transition-colors" onClick={e => {
              e.stopPropagation();
              handleAssignTicket(ticket.id);
            }}>
                Assign
              </button>
            </Tippy>
            {/* More options dropdown */}
            <div className="relative">
              <Tippy content="More options">
                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)}>
                  <MoreVertical size={12} />
                </button>
              </Tippy>
              {openDropdownId === ticket.id && <div ref={ticketDropdownRef} className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1" onClick={e => e.stopPropagation()}>
                  <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)}>
                    <Edit2 size={14} className="mr-2 text-blue-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)}>
                    <Info size={14} className="mr-2 text-amber-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-red-50 flex items-center" onClick={e => openDeleteConfirmation(ticket.id, e)}>
                    <Trash2 size={14} className="mr-2 text-red-500" />
                    Delete Ticket
                  </button>
                </div>}
            </div>
          </div>
        </div>
        {/* Subtle WAITING stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.08] pointer-events-none">
          <div className="text-amber-600 font-bold text-lg tracking-wider uppercase" style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(217,119,6,0.2)',
          fontFamily: 'monospace'
        }}>
            WAITING
          </div>
        </div>
      </div>;
  };
  // Render grid view item (ticket card)
  const WaitListCard = ({
    ticket
  }: {
    ticket: any;
  }) => {
    const isExpanded = expandedTickets[ticket.id] || false;
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className={`rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group relative h-full ${isExpanded ? 'shadow-lg' : ''}`} style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)',
      transform: isExpanded ? 'scale(1.01)' : 'scale(1)',
      zIndex: isExpanded ? 10 : 'auto'
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-2 flex flex-col justify-between items-center pointer-events-none opacity-60">
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 opacity-70"></div>
        {/* Card header with number and client type */}
        <div className="flex justify-between p-4 border-b border-dashed border-gray-300 pl-4">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md mr-3 border border-gray-800" style={{
            textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
          }}>
              {ticket.number}
            </div>
            <div className="ml-1 text-xs bg-amber-50 text-amber-800 font-medium px-2 py-1 rounded-md border border-amber-200">
              {ticket.clientType}
            </div>
          </div>
          {/* Quick action icons */}
          <div className="flex space-x-1">
            <Tippy content="Notes">
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full" onClick={e => e.stopPropagation()}>
                <MessageSquare size={14} />
              </button>
            </Tippy>
            <Tippy content="VIP Member">
              <button className="p-1 text-amber-400 hover:text-amber-500 hover:bg-amber-50 rounded-full" onClick={e => e.stopPropagation()}>
                <Star size={14} />
              </button>
            </Tippy>
            {/* More options dropdown */}
            <div className="relative">
              <Tippy content="More options">
                <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)}>
                  <MoreVertical size={16} />
                </button>
              </Tippy>
              {openDropdownId === ticket.id && <div ref={ticketDropdownRef} className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1" onClick={e => e.stopPropagation()}>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)}>
                    <Edit2 size={14} className="mr-2 text-blue-500" />
                    Edit Ticket
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)}>
                    <Info size={14} className="mr-2 text-amber-500" />
                    View Details
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 flex items-center" onClick={e => openDeleteConfirmation(ticket.id, e)}>
                    <Trash2 size={14} className="mr-2 text-red-500" />
                    Delete Ticket
                  </button>
                </div>}
            </div>
          </div>
        </div>
        {/* Card content - collapsed view */}
        <div className="p-4">
          {/* Client information */}
          <div className="flex items-center mb-4">
            <div className="bg-amber-50 p-2 rounded-full mr-3 border border-amber-200" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <User size={16} className="text-amber-500" />
            </div>
            <div className="font-semibold text-gray-800 truncate text-base">
              {ticket.clientName}
            </div>
          </div>
          {/* Time and duration */}
          <div className="flex items-center text-xs text-gray-600 mb-4">
            <div className="flex items-center bg-amber-50/40 px-2 py-1 rounded-md border border-amber-100 mr-2" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
              <Calendar size={12} className="text-amber-500 mr-1" />
              <span className="font-medium">{ticket.time}</span>
              <span className="mx-1 text-gray-400">•</span>
              <span className="font-medium">{ticket.duration}</span>
            </div>
          </div>
          {/* Service information */}
          {ticket.service && <div className="mt-3 font-medium text-sm text-gray-700 p-3 rounded-md border border-gray-200" style={{
          backgroundColor: 'rgba(254,252,247,0.5)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
              <div className="flex items-start">
                <Tag size={14} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{ticket.service}</span>
              </div>
            </div>}
        </div>
        {/* Expanded view */}
        {isExpanded && <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
            {/* Perforation divider */}
            <div className="border-t border-dashed border-gray-300 my-2 opacity-70"></div>
            {/* Service details */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <MessageSquare size={14} className="text-amber-500 mr-2" />
                Client Notes
              </h4>
              <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
                <p className="text-gray-600 italic">
                  {ticket.notes || 'No notes for this client.'}
                </p>
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Star size={14} className="text-amber-500 mr-2" />
                Membership & Promotions
              </h4>
              <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-700">Premium Member</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-gray-700">
                    Birthday discount available
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <AlertCircle size={14} className="text-amber-500 mr-2" />
                Waiting Time
              </h4>
              <div className="bg-white bg-opacity-50 p-3 rounded-md border border-amber-100 text-sm" style={{
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
          }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Check-in Time:</span>
                  <span className="text-gray-700 font-medium">10:15 AM</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Current Wait:</span>
                  <span className="text-amber-600 font-medium">25 minutes</span>
                </div>
                <div className="border-t border-dashed border-gray-200 my-1"></div>
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-gray-700">Est. Start Time:</span>
                  <span className="text-gray-900">10:40 AM</span>
                </div>
              </div>
            </div>
          </div>}
        {/* Perforation line */}
        <div className="border-t border-dashed border-gray-300 mx-3 opacity-70"></div>
        {/* Card footer with assign button */}
        <div className="flex items-center justify-between p-4 mt-auto" style={{
        backgroundColor: 'rgba(254,252,247,0.5)'
      }}>
          <div className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded-md border border-amber-200 shadow-sm">
            Waiting
          </div>
          <button className="py-2 px-4 border border-amber-500 text-amber-600 font-medium rounded-full hover:bg-amber-50 transition-colors transform hover:scale-[1.02] active:scale-[0.98]" onClick={e => {
          e.stopPropagation();
          handleAssignTicket(ticket.id);
        }}>
            Assign
          </button>
          {/* Expansion indicator */}
          <div className="text-gray-300">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
        {/* WAITING stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.08] pointer-events-none">
          <div className="text-amber-600 font-bold text-2xl tracking-wider uppercase" style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(217,119,6,0.2)',
          fontFamily: 'monospace'
        }}>
            WAITING
          </div>
        </div>
        {/* Random crease effect - very subtle */}
        {ticket.id % 4 === 0 && <div className="absolute top-0 left-[30%] w-px h-full bg-gray-200 opacity-20 transform rotate-[1deg]"></div>}
      </div>;
  };
  // Compact card view for grid layout
  const CompactWaitListCard = ({
    ticket
  }: {
    ticket: any;
  }) => {
    // Generate unique paper style for this ticket
    const paperColor = paperVariations[ticket.id % paperVariations.length];
    const texturePattern = paperTextures[ticket.id % paperTextures.length];
    return <div className="rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden" style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
    }} onClick={() => toggleTicketExpansion(ticket.id)}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none opacity-60">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-70"></div>
        <div className="flex items-center justify-between p-2 border-b border-dashed border-gray-300 pl-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm mr-2 border border-gray-800" style={{
            textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
          }}>
              {ticket.number}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">
                {ticket.clientName}
              </span>
              <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-800 px-1 py-0.5 rounded-sm border border-amber-200 font-medium">
                {ticket.clientType}
              </span>
            </div>
          </div>
          {/* More options dropdown */}
          <div className="relative">
            <Tippy content="More options">
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors" onClick={e => toggleDropdown(ticket.id, e)}>
                <MoreVertical size={12} />
              </button>
            </Tippy>
            {openDropdownId === ticket.id && <div ref={ticketDropdownRef} className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1" onClick={e => e.stopPropagation()}>
                <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openEditModal(ticket.id, e)}>
                  <Edit2 size={14} className="mr-2 text-blue-500" />
                  Edit Ticket
                </button>
                <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={e => openDetailsModal(ticket.id, e)}>
                  <Info size={14} className="mr-2 text-amber-500" />
                  View Details
                </button>
                <button className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-red-50 flex items-center" onClick={e => openDeleteConfirmation(ticket.id, e)}>
                  <Trash2 size={14} className="mr-2 text-red-500" />
                  Delete Ticket
                </button>
              </div>}
          </div>
        </div>
        <div className="p-2 flex flex-col">
          <div className="flex items-center text-[10px] text-gray-600 mb-2">
            <Clock size={10} className="text-amber-500 mr-0.5" />
            <span>{ticket.time}</span>
            <span className="mx-1 text-gray-400">•</span>
            <span>{ticket.duration}</span>
          </div>
          <button className="w-full py-1 px-2 border border-amber-500 text-amber-600 text-xs font-medium rounded-full hover:bg-amber-50 transition-colors" onClick={e => {
          e.stopPropagation();
          handleAssignTicket(ticket.id);
        }}>
            Assign
          </button>
        </div>
        {/* WAITING stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.08] pointer-events-none">
          <div className="text-amber-600 font-bold text-xl tracking-wider uppercase" style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(217,119,6,0.2)',
          fontFamily: 'monospace'
        }}>
            WAITING
          </div>
        </div>
      </div>;
  };
  if (isMinimized) {
    return <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
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
  return <div className="bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden h-full" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)' }}>
      {/* Section header - hide when in combined view and hideHeader is true */}
      {!hideHeader && <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100 sticky top-0 z-10 h-[40px]">
          <div className="flex items-center">
            <div className="mr-3 text-amber-500">
              <Users size={16} />
            </div>
            <h2 className="text-base font-medium text-gray-800">Waiting Queue</h2>
            <div className="ml-2 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">
              {waitlist.length}
            </div>
          </div>
          <div className="flex space-x-1">
            {/* Add New Ticket button */}
            <Tippy content="Add new ticket">
              <button className="p-1.5 rounded-md bg-[#27AE60]/10 text-[#27AE60] hover:bg-[#27AE60]/20 transition-all duration-200 transform hover:scale-105 active:scale-95 mr-1" onClick={() => {
            // This will need to be connected to the createTicket functionality
            const createTicketButton = document.querySelector('[aria-label="Create new ticket"]') as HTMLButtonElement;
            if (createTicketButton) createTicketButton.click();
          }}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </Tippy>
            {!isMobile && viewMode === 'list' && <Tippy content={minimizedLineView ? 'Expand line view' : 'Minimize line view'}>
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95" onClick={toggleMinimizedLineView}>
                  {minimizedLineView ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </Tippy>}
            {!isMobile && viewMode === 'grid' && <Tippy content={cardViewMode === 'compact' ? 'Expand card view' : 'Minimize card view'}>
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95" onClick={toggleCardViewMode}>
                  {cardViewMode === 'compact' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </Tippy>}
            <div className="relative" ref={dropdownRef}>
              <Tippy content="View options">
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95" onClick={() => setShowDropdown(!showDropdown)}>
                  <MoreVertical size={16} />
                </button>
              </Tippy>
              {showDropdown && <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1">
                  <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700">
                      View Options
                    </h3>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={() => setViewMode('list')}>
                    <List size={14} className="mr-2 text-gray-500" />
                    Line View
                    {viewMode === 'list' && <Check size={14} className="ml-auto text-amber-500" />}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center" onClick={() => setViewMode('grid')}>
                    <Grid size={14} className="mr-2 text-gray-500" />
                    Grid View
                    {viewMode === 'grid' && <Check size={14} className="ml-auto text-amber-500" />}
                  </button>
                </div>}
            </div>
            <Tippy content="Minimize section"></Tippy>
          </div>
        </div>}
      <div className="flex-1 overflow-auto p-3 scroll-smooth">
        {/* Show content based on whether there are tickets */}
        {waitlist.length > 0 ? viewMode === 'grid' ? <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'} gap-1.5`}>
              {waitlist.map(ticket => (
                <WaitListTicketCard
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
                  }}
                  viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
                  onAssign={(id) => {
                    setSelectedTicketId(parseInt(id));
                    setShowAssignModal(true);
                  }}
                  onEdit={(id) => {
                    setTicketToEdit(parseInt(id));
                    setShowEditModal(true);
                  }}
                  onDelete={(id) => {
                    setTicketToDelete(parseInt(id));
                    setShowDeleteModal(true);
                  }}
                  onClick={(id) => {
                    setTicketToView(parseInt(id));
                    setShowDetailsModal(true);
                  }}
                />
              ))}
            </div> : <div className="space-y-2">
              {waitlist.map(ticket => (
                <WaitListTicketCard
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
                  }}
                  viewMode={minimizedLineView ? 'compact' : 'normal'}
                  onAssign={(id) => {
                    setSelectedTicketId(parseInt(id));
                    setShowAssignModal(true);
                  }}
                  onEdit={(id) => {
                    setTicketToEdit(parseInt(id));
                    setShowEditModal(true);
                  }}
                  onDelete={(id) => {
                    setTicketToDelete(parseInt(id));
                    setShowDeleteModal(true);
                  }}
                  onClick={(id) => {
                    setTicketToView(parseInt(id));
                    setShowDetailsModal(true);
                  }}
                />
              ))}
            </div> : <div className="flex flex-col items-center justify-center h-full py-10">
            <div className="bg-amber-50 p-3 rounded-full mb-3">
              <Users size={24} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No clients in wait list
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Checked In clients will be here or add client by clicking the "+"
              button in the bottom right corner.
            </p>
          </div>}
      </div>
      {/* Modals */}
      <AssignTicketModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} onAssign={handleAssignSubmit} ticketId={selectedTicketId} />
      <EditTicketModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} ticketId={ticketToEdit} />
      <TicketDetailsModal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} ticketId={ticketToView} onEdit={handleEditFromDetails} onDelete={handleDeleteFromDetails} />
      <DeleteConfirmationModal />
    </div>;
}