import { useState, useEffect, memo } from 'react';
import { MoreVertical, UserPlus, Edit2, Trash2, StickyNote, ExternalLink } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { TicketDetailsModal } from './TicketDetailsModal';
import './paper';

// Checkout service type for displaying actual services
interface CheckoutService {
  id: string;
  serviceName: string;
  price: number;
  duration?: number;
  staffId?: string;
  staffName?: string;
}

interface WaitListTicketCardProps {
  ticket: {
    id: string;
    number: number;
    clientName: string;
    clientType: string;
    service: string;
    duration: string;
    time: string;
    status?: 'waiting' | 'in-service' | 'completed';
    notes?: string;
    priority?: 'normal' | 'high';
    createdAt?: Date;
    lastVisitDate?: Date;
    // Actual services from checkout panel (auto-saved)
    checkoutServices?: CheckoutService[];
    // Client visit data for first visit detection
    isFirstVisit?: boolean;
    // Technician assignment
    technician?: string;
    techColor?: string;
    techId?: string;
    assignedTo?: {
      id: string;
      name: string;
      color: string;
      photo?: string;
    };
    // Multi-staff support
    assignedStaff?: Array<{
      id: string;
      name: string;
      color: string;
      photo?: string;
    }>;
  };
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onAssign?: (ticketId: string) => void;
  onEdit?: (ticketId: string) => void;
  onDelete?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
  onOpenTicket?: (ticketId: string) => void;
}

function WaitListTicketCardComponent({
  ticket,
  viewMode = 'compact',
  onAssign,
  onEdit,
  onDelete,
  onClick,
  onOpenTicket
}: WaitListTicketCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [waitTime, setWaitTime] = useState(0);

  // Calculate wait time based on createdAt timestamp
  useEffect(() => {
    const updateWaitTime = () => {
      const now = new Date();
      // Safely convert createdAt to Date (could be string from DB or Date object)
      let startTime: Date;
      if (ticket.createdAt instanceof Date) {
        startTime = ticket.createdAt;
      } else if (ticket.createdAt) {
        startTime = new Date(ticket.createdAt);
        if (isNaN(startTime.getTime())) {
          startTime = now; // Fallback to now if invalid
        }
      } else {
        startTime = now;
      }
      const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60)); // minutes
      setWaitTime(elapsed);
    };

    updateWaitTime();
    const interval = setInterval(updateWaitTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  const formatWaitTime = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Long wait visual indicators
  // 10-20 min = orange warning, >20 min = red alert
  const isLongWait = waitTime >= 10;
  const isVeryLongWait = waitTime >= 20;

  // Dynamic border color based on wait time
  const getWaitBorderColor = () => {
    if (isVeryLongWait) return 'rgba(239, 68, 68, 0.7)'; // red-500
    if (isLongWait) return 'rgba(249, 115, 22, 0.6)'; // orange-500
    return 'rgba(139, 92, 246, 0.28)'; // purple (default)
  };

  // Dynamic border width for emphasis
  const getWaitBorderWidth = () => {
    if (isVeryLongWait) return '4px';
    if (isLongWait) return '3px';
    return '3px';
  };

  // Dynamic wait time text color
  const getWaitTimeColor = () => {
    if (isVeryLongWait) return '#DC2626'; // red-600
    if (isLongWait) return '#EA580C'; // orange-600
    return '#6b5d52'; // default brown
  };

  // Get last visit text similar to service tickets
  const getLastVisitText = () => {
    // Use isFirstVisit prop if provided (from client lookup), fallback to clientType check
    if (ticket.isFirstVisit || ticket.clientType === 'New') return 'First visit';
    if (!ticket.lastVisitDate) return 'Returning client';

    const now = new Date();
    const lastVisit = new Date(ticket.lastVisitDate);
    const daysDiff = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return 'Visited today';
    if (daysDiff === 1) return 'Visited yesterday';
    if (daysDiff < 7) return `Visited ${daysDiff} days ago`;
    if (daysDiff < 30) {
      const weeks = Math.floor(daysDiff / 7);
      return `Visited ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    const months = Math.floor(daysDiff / 30);
    return `Visited ${months} ${months === 1 ? 'month' : 'months'} ago`;
  };

  // Check if ticket has notes
  const hasNote = ticket.notes && ticket.notes.length > 0;

  // Check if this is a first visit (star indicator)
  const isFirstVisit = ticket.isFirstVisit || ticket.clientType === 'New';

  // Compute actual service display from checkoutServices if available
  const hasCheckoutServices = ticket.checkoutServices && ticket.checkoutServices.length > 0;
  const serviceCount = hasCheckoutServices ? ticket.checkoutServices!.length : 1;
  const serviceTotal = hasCheckoutServices
    ? ticket.checkoutServices!.reduce((sum, s) => sum + (s.price || 0), 0)
    : 0;

  // Get service display text - show first service + count if multiple
  const getServiceDisplay = () => {
    if (!hasCheckoutServices) return ticket.service;
    const services = ticket.checkoutServices!;
    if (services.length === 1) return services[0].serviceName;
    return `${services[0].serviceName} +${services.length - 1} more`;
  };
  const serviceDisplay = getServiceDisplay();

  // Get staff info - support multiple staff (assignedStaff) or single (assignedTo)
  const staffList = ticket.assignedStaff || (ticket.assignedTo ? [ticket.assignedTo] : []);
  const hasAssignedStaff = staffList.length > 0;

  // Get staff color for avatar/badge
  const getStaffColor = (staff: { color?: string }) => staff.color || '#6B7280';

  // Get first name only for compact display
  const getFirstName = (fullName: string) => fullName.split(' ')[0].toUpperCase();

  // Render staff avatar with photo or initial
  const renderStaffAvatar = (staff: { name: string; color?: string; photo?: string }, size: 'sm' | 'md' = 'sm') => {
    const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';
    const textSize = size === 'sm' ? 'text-[9px]' : 'text-xs';

    if (staff.photo) {
      return (
        <img
          src={staff.photo}
          alt={staff.name}
          className={`${sizeClasses} rounded-full object-cover border border-white/50 flex-shrink-0`}
          style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)' }}
        />
      );
    }
    // Default avatar with initial
    return (
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center ${textSize} font-semibold text-white flex-shrink-0`}
        style={{ background: getStaffColor(staff), boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)' }}
      >
        {staff.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(ticket.id);
    }
  };

  // Render ticket content based on view mode
  const renderContent = () => {
    if (viewMode === 'compact') {
      return (
        <>
          {/* Dog-ear corner - compact size */}
          <div className="absolute top-0 right-0 w-[5px] h-[5px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          <div className="py-1.5 pr-2 pl-9 relative">
            {/* Row 1: Client name + Wait time */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#1a1614] truncate leading-tight" style={{ fontSize: 'clamp(13px, 1.7vw, 15px)' }}>
                    {ticket.clientName}
                  </span>
                  {isFirstVisit && <span className="text-[10px]">⭐</span>}
                  {hasNote && <StickyNote className="w-2.5 h-2.5 text-amber-500" />}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="font-medium whitespace-nowrap flex items-center gap-1" style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: getWaitTimeColor() }}>
                  {isLongWait && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  {formatWaitTime(waitTime)}
                </div>
              </div>
            </div>

            {/* Row 2: Service + Assign button */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[#2d2520] flex-1 leading-tight flex items-center gap-1.5" style={{ fontSize: 'clamp(12px, 1.6vw, 14px)' }}>
                <span className="truncate">{serviceDisplay}</span>
                {hasCheckoutServices && serviceCount > 1 && (
                  <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                    ${serviceTotal.toFixed(0)}
                  </span>
                )}
              </div>

              <div className="flex-shrink-0">
                {/* Staff badge or Assign button */}
                {hasAssignedStaff ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/80 border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                    style={{ height: '24px' }}
                    title="Click to reassign"
                  >
                    {staffList.slice(0, 2).map((staff, idx) => (
                      <div key={staff.id} className="flex items-center gap-1" style={{ marginLeft: idx > 0 ? '-4px' : 0 }}>
                        {renderStaffAvatar(staff, 'sm')}
                      </div>
                    ))}
                    <span className="text-[10px] font-medium text-gray-700 truncate max-w-[60px]">
                      {staffList.length === 1 ? getFirstName(staffList[0].name) : `${staffList.length} staff`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                    className="px-2 py-0.5 flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded shadow-sm hover:shadow font-medium"
                    style={{ height: '24px' }}
                    title="Assign"
                  >
                    <UserPlus style={{ width: '12px', height: '12px' }} strokeWidth={2.5} />
                    <span style={{ fontSize: '10px' }}>Assign</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </>
      );
    }

    // Normal view
    if (viewMode === 'normal') {
      return (
        <>
          {/* Dog-ear corner - normal size */}
          <div className="absolute top-0 right-0 w-[7px] h-[7px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          <div className="py-2.5 pr-3 pl-11">
            {/* Row 1: Client name + Wait time */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[#1a1614] truncate" style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}>{ticket.clientName}</span>
                  {isFirstVisit && <span className="text-xs flex-shrink-0">⭐</span>}
                  {hasNote && <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </div>
                <div className="text-[#6b5d52] font-medium tracking-wide text-xs">{getLastVisitText()}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 self-start mt-1">
                <span className="font-medium whitespace-nowrap text-xs flex items-center gap-1" style={{ color: getWaitTimeColor() }}>
                  {isLongWait && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                  Waited {formatWaitTime(waitTime)}
                </span>
                <span className="text-xs text-[#4a3d34] opacity-50">•</span>
                <span className="text-[#4a3d34] font-medium whitespace-nowrap text-xs">{ticket.time}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e8dcc8]/50 mb-1.5" />

            {/* Row 2: Service + Assign button */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#1a1614] font-semibold leading-snug flex-1 text-sm flex items-center gap-2">
                <span className="truncate">{serviceDisplay}</span>
                {hasCheckoutServices && serviceCount > 1 && (
                  <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                    ${serviceTotal.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Staff badge or Assign button */}
              <div className="flex-shrink-0">
                {hasAssignedStaff ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                    className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/80 border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                    style={{ height: '30px' }}
                    title="Click to reassign"
                  >
                    <div className="flex items-center -space-x-1">
                      {staffList.slice(0, 3).map((staff) => (
                        <div key={staff.id}>
                          {renderStaffAvatar(staff, 'sm')}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[80px]">
                      {staffList.length === 1 ? getFirstName(staffList[0].name) : `${staffList.length} staff`}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                    className="px-3 flex items-center justify-center gap-1.5 bg-white border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded-md shadow-sm hover:shadow-md font-semibold"
                    style={{ height: '30px' }}
                    title="Assign"
                  >
                    <UserPlus style={{ width: '14px', height: '14px' }} strokeWidth={2.5} />
                    <span style={{ fontSize: '11px' }}>Assign</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </>
      );
    }

    // GRID COMPACT VIEW - Same design language, more compact
    if (viewMode === 'grid-compact') {
      return (
        <div onClick={() => onClick?.(ticket.id)} className={`relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[5px] hover:shadow-2xl flex flex-col min-w-[220px] max-w-full cursor-pointer ${isVeryLongWait ? 'animate-pulse-subtle' : ''}`} role="button" tabIndex={0} aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={handleKeyDown} style={{ background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)', border: '1px dashed #D8D8D8', borderLeft: `${getWaitBorderWidth()} solid ${getWaitBorderColor()}`, borderRadius: '10px', boxShadow: 'inset 0 12px 12px -10px rgba(0,0,0,0.09), inset -2px 0 4px rgba(255,255,255,0.95), inset 2px 0 4px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.05)' }}>
          {/* Perforation dots - compact */}
          <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-2 z-10" style={{ opacity: 0.108 }}>{[...Array(10)].map((_, i) => (<div key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-[#c4b5a0]" />))}</div>

          {/* Dog-ear corner - compact size */}
          <div className="absolute top-0 right-0 w-5 h-5 z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          {/* Ticket number tab - smaller */}
          <div className="absolute left-0 top-1.5 w-7 text-[#1a1614] flex items-center justify-center font-black text-xs z-20" style={{ height: isFirstVisit ? 'clamp(1.4rem, 3vw, 1.6rem)' : 'clamp(1.3rem, 2.8vw, 1.5rem)', background: 'rgba(139, 92, 246, 0.06)', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', borderTop: '2px solid rgba(139, 92, 246, 0.28)', borderRight: '2px solid rgba(139, 92, 246, 0.28)', borderBottom: '2px solid rgba(139, 92, 246, 0.28)', boxShadow: '2px 0 4px rgba(139, 92, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)', letterSpacing: '-0.02em', transform: 'translateX(-2.5px)' }}>{ticket.number}</div>
          <div className="flex items-start justify-between px-2 sm:px-3 pt-2 sm:pt-3 pb-1 pl-9 sm:pl-10"><div className="flex-1 min-w-0"><div className="flex items-center gap-1 sm:gap-1.5"><span className="font-bold text-[#1a1614] truncate" style={{ fontSize: 'clamp(14px, 1.75vw, 16px)' }}>{ticket.clientName}</span>{isFirstVisit && <span className="text-xs sm:text-sm flex-shrink-0">⭐</span>}{hasNote && <StickyNote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />}</div></div>
            <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]"><button onClick={(e) => { e.stopPropagation(); onOpenTicket?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-purple-50 flex items-center gap-2 font-medium"><ExternalLink size={12} className="text-purple-500" /> Open Ticket</button><div className="h-px bg-gray-200 my-0.5" /><button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Edit2 size={12} /> Edit</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#6b5d52] hover:text-[#2d2520] p-2 min-w-[44px] min-h-[44px] rounded-md hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 flex items-center justify-center"><MoreVertical size={16} /></button></Tippy>
          </div>
          {/* Service - compact */}
          <div className="px-2 pb-1.5 text-[11px] text-[#1a1614] font-semibold flex items-center gap-1.5">
            <span className="line-clamp-1">{serviceDisplay}</span>
            {hasCheckoutServices && serviceCount > 1 && (
              <span className="flex-shrink-0 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">
                ${serviceTotal.toFixed(0)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="mx-2 mb-1.5 border-t border-[#e8dcc8]/50" />

          {/* Wait info - compact (simplified, removed redundant check-in time) */}
          <div className="px-2 pb-1">
            <div className="font-medium flex items-center gap-1" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: getWaitTimeColor() }}>
              {isLongWait && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              Waited {formatWaitTime(waitTime)}
            </div>
          </div>

          {/* Footer - compact */}
          <div className="mt-auto px-1 py-1 rounded-md" style={{ marginLeft: 'clamp(4px, 1vw, 16px)', marginRight: 'clamp(4px, 1vw, 16px)', marginBottom: 'clamp(4px, 1vw, 8px)', background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 184, 150, 0.15)' }}>
            {hasAssignedStaff ? (
              <button onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }} className="w-full flex items-center justify-center gap-2 bg-white/80 border border-gray-200 hover:border-blue-400 transition-colors rounded-md" style={{ height: 'clamp(32px, 4.5vw, 40px)' }} title="Click to reassign">
                <div className="flex items-center -space-x-1">
                  {staffList.slice(0, 2).map((staff) => (
                    <div key={staff.id}>{renderStaffAvatar(staff, 'sm')}</div>
                  ))}
                </div>
                <span style={{ fontSize: 'clamp(10px, 1.4vw, 12px)' }} className="font-semibold text-gray-700 truncate max-w-[80px]">
                  {staffList.length === 1 ? getFirstName(staffList[0].name) : `${staffList.length} staff`}
                </span>
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }} className="w-full flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded-md shadow-sm hover:shadow-md font-semibold" style={{ height: 'clamp(32px, 4.5vw, 40px)' }} title="Assign Staff">
                <UserPlus style={{ width: 'clamp(13px, 1.85vw, 16px)', height: 'clamp(13px, 1.85vw, 16px)' }} strokeWidth={2.5} />
                <span style={{ fontSize: 'clamp(10px, 1.4vw, 12px)' }}>Assign</span>
              </button>
            )}
          </div>

          {/* Paper texture - enhanced for more tangibility */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </div>
      );
    }

    // GRID NORMAL VIEW - Full Reference Design
    if (viewMode === 'grid-normal') {
      return (
        <div onClick={() => onClick?.(ticket.id)} className={`relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[6px] hover:shadow-2xl flex flex-col min-w-[240px] sm:min-w-[280px] max-w-full cursor-pointer ${isVeryLongWait ? 'animate-pulse-subtle' : ''}`} role="button" tabIndex={0} aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={handleKeyDown} style={{ background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)', border: '1px dashed #D8D8D8', borderLeft: `${getWaitBorderWidth()} solid ${getWaitBorderColor()}`, borderRadius: '10px', boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)' }}>
          <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-2 sm:px-3 md:px-4 z-10" style={{ opacity: 0.108 }}>{[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />))}</div>

          {/* Dog-ear corner */}
          <div className="absolute top-0 right-0 w-7 h-7 z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />
          <div className="absolute left-0 text-[#1a1614] flex items-center justify-center font-black z-20" style={{ top: 'clamp(12px, 2vw, 20px)', width: 'clamp(40px, 5.5vw, 56px)', fontSize: 'clamp(16px, 2.25vw, 24px)', height: isFirstVisit ? 'clamp(2rem, 4.5vw, 2.75rem)' : 'clamp(1.85rem, 4vw, 2.5rem)', background: 'rgba(139, 92, 246, 0.06)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', borderTop: '2px solid rgba(139, 92, 246, 0.28)', borderRight: '2px solid rgba(139, 92, 246, 0.28)', borderBottom: '2px solid rgba(139, 92, 246, 0.28)', boxShadow: `3px 0 6px rgba(139, 92, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)`, letterSpacing: '-0.02em', transform: 'translateX(-4px)' }}>{ticket.number}</div>
          <div className="flex items-start justify-between px-2 sm:px-3 md:px-4 pb-1" style={{ paddingTop: 'clamp(12px, 2vw, 20px)', paddingLeft: 'clamp(44px, calc(5.5vw + 4px), 60px)' }}><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1"><span className="font-bold text-[#1a1614] truncate tracking-tight" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>{ticket.clientName}</span>{isFirstVisit && <span className="text-xs sm:text-sm md:text-base flex-shrink-0">⭐</span>}{hasNote && <StickyNote className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-500 flex-shrink-0" />}</div><div className="text-[#6b5d52] font-medium tracking-wide" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{getLastVisitText()}</div></div>
            <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]"><button onClick={(e) => { e.stopPropagation(); onOpenTicket?.(ticket.id); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 font-medium"><ExternalLink size={14} className="text-purple-500" /> Open Ticket</button><div className="h-px bg-gray-200 my-0.5" /><button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Edit2 size={14} /> Edit</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#6b5d52] hover:text-[#2d2520] p-2 sm:p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 flex items-center justify-center"><MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" /></button></Tippy>
          </div>
          <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4 text-xs sm:text-sm md:text-base text-[#1a1614] font-semibold leading-snug tracking-tight flex items-center gap-2">
            <span className="line-clamp-2">{serviceDisplay}</span>
            {hasCheckoutServices && serviceCount > 1 && (
              <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                ${serviceTotal.toFixed(0)}
              </span>
            )}
          </div>
          <div className="mx-2 sm:mx-3 md:mx-4 mb-2 sm:mb-3 md:mb-4 border-t border-[#e8dcc8]/50" />
          <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 flex items-center justify-between"><div className="font-medium flex items-center gap-1" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: getWaitTimeColor() }}>{isLongWait && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}Waited {formatWaitTime(waitTime)}</div><div className="text-[#4a3d34] font-medium" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>In at {ticket.time}</div></div>

          {/* Footer with Staff badge or Assign button */}
          <div className="mt-auto px-2 py-1.5 rounded-md" style={{ marginLeft: 'clamp(8px, 1.5vw, 16px)', marginRight: 'clamp(8px, 1.5vw, 16px)', marginBottom: 'clamp(8px, 1.5vw, 16px)', background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 184, 150, 0.15)' }}>
            {hasAssignedStaff ? (
              <button onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }} className="w-full flex items-center justify-center gap-2 bg-white/80 border border-gray-200 hover:border-blue-400 transition-colors rounded-md" style={{ height: 'clamp(36px, 5vw, 44px)' }} title="Click to reassign">
                <div className="flex items-center -space-x-1.5">
                  {staffList.slice(0, 3).map((staff) => (
                    <div key={staff.id}>{renderStaffAvatar(staff, 'md')}</div>
                  ))}
                </div>
                <span style={{ fontSize: 'clamp(12px, 1.6vw, 15px)' }} className="font-bold text-gray-700 truncate max-w-[100px]">
                  {staffList.length === 1 ? getFirstName(staffList[0].name) : `${staffList.length} staff`}
                </span>
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }} className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded-md shadow-sm hover:shadow-md font-bold" style={{ height: 'clamp(36px, 5vw, 44px)', background: 'linear-gradient(to bottom, #ffffff 0%, #fefefe 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' }} title="Assign Staff"><UserPlus style={{ width: 'clamp(15px, 2.1vw, 18px)', height: 'clamp(15px, 2.1vw, 18px)' }} strokeWidth={2.5} /><span style={{ fontSize: 'clamp(12px, 1.6vw, 15px)' }}>Assign</span></button>
            )}
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </div>
      );
    }

    // Fallback
    return null;
  };

  // Grid modes are completely different - standalone cards without BasePaperTicket
  if (viewMode === 'grid-compact' || viewMode === 'grid-normal') {
    const content = renderContent();
    return (
      <>
        {content}
        {showDetailsModal && (
          <TicketDetailsModal
            ticketId={parseInt(ticket.id) || ticket.number}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </>
    );
  }

  // Line/List modes use thermal receipt design
  return (
    <>
      <div
        onClick={() => onClick?.(ticket.id)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`}
        className={`relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg ${isVeryLongWait ? 'animate-pulse-subtle' : ''}`}
        style={{
          background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
          border: '1px dashed #D8D8D8',
          borderLeft: `${getWaitBorderWidth()} solid ${getWaitBorderColor()}`,
          borderRadius: '10px',
          boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)'
        }}
      >
        {/* Perforation dots - barely visible */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
          {[...Array(viewMode === 'compact' ? 15 : 20)].map((_, i) => (
            <div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />
          ))}
        </div>

        {/* Ticket number badge */}
        <div
          className="absolute left-0 top-2 z-20 text-[#1a1614] flex items-center justify-center font-black"
          style={{
            width: viewMode === 'compact' ? '28px' : '36px',
            height: viewMode === 'compact' ? 'clamp(1.3rem, 2.8vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 1.85rem)',
            fontSize: viewMode === 'compact' ? '11px' : '14px',
            background: 'rgba(139, 92, 246, 0.06)',
            borderTopRightRadius: viewMode === 'compact' ? '6px' : '8px',
            borderBottomRightRadius: viewMode === 'compact' ? '6px' : '8px',
            borderTop: '2px solid rgba(139, 92, 246, 0.28)',
            borderRight: '2px solid rgba(139, 92, 246, 0.28)',
            borderBottom: '2px solid rgba(139, 92, 246, 0.28)',
            boxShadow: '2px 0 4px rgba(139, 92, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            letterSpacing: '-0.02em',
            transform: viewMode === 'compact' ? 'translateX(-2px)' : 'translateX(-3px)'
          }}
        >
          {ticket.number}
        </div>

        {/* Main content */}
        {renderContent()}
      </div>

      {showDetailsModal && (
        <TicketDetailsModal
          ticketId={parseInt(ticket.id) || ticket.number}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
}

export const WaitListTicketCard = memo(WaitListTicketCardComponent);