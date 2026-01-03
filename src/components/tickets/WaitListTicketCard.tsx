import { useState, useEffect } from 'react';
import { Clock, MoreVertical, UserPlus, Edit2, Trash2, StickyNote, ChevronRight, User, Calendar, Tag, ExternalLink } from 'lucide-react';
import { TicketDetailsModal } from './TicketDetailsModal';

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
    notes?: string;
    priority?: 'normal' | 'high';
    // Actual services from checkout panel (auto-saved)
    checkoutServices?: CheckoutService[];
  };
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onAssign?: (ticketId: string) => void;
  onEdit?: (ticketId: string) => void;
  onDelete?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
  onOpenTicket?: (ticketId: string) => void;
}

export function WaitListTicketCard({
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
  const [waitProgress, setWaitProgress] = useState(0);

  // Parse time string in various formats (HH:MM, H:MM AM/PM, ISO date, etc.)
  const parseTimeString = (timeStr: string): Date | null => {
    if (!timeStr) return null;

    const now = new Date();

    // Try ISO date format first
    const isoDate = new Date(timeStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try "H:MM AM/PM" or "HH:MM AM/PM" format
    const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const period = ampmMatch[3]?.toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const result = new Date(now);
      result.setHours(hours, minutes, 0, 0);
      return result;
    }

    // Fallback: treat as current time
    return now;
  };

  // Calculate wait time progress (assume tickets are created now, show wait time)
  useEffect(() => {
    const startTime = parseTimeString(ticket.time) || new Date();

    const updateWaitTime = () => {
      const now = new Date();
      const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60)); // minutes
      const expectedWait = 30; // Assume 30 min average wait
      const progress = Math.min((elapsed / expectedWait) * 100, 100);

      setWaitTime(elapsed);
      setWaitProgress(progress);
    };

    updateWaitTime();
    const interval = setInterval(updateWaitTime, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [ticket.time]);

  const formatWaitTime = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Long wait visual indicators
  const isLongWait = waitTime >= 10;
  const isVeryLongWait = waitTime >= 20;

  // Dynamic border color based on wait time
  const getWaitBorderColor = () => {
    if (isVeryLongWait) return 'rgba(239, 68, 68, 0.7)'; // red-500
    if (isLongWait) return 'rgba(249, 115, 22, 0.6)'; // orange-500
    return 'rgba(139, 92, 246, 0.18)'; // purple (default)
  };

  // Dynamic wait time text color
  const getWaitTimeColor = () => {
    if (isVeryLongWait) return '#DC2626'; // red-600
    if (isLongWait) return '#EA580C'; // orange-600
    return '#6b5d52'; // default brown
  };

  // Helper variables for display
  const isFirstVisit = ticket.clientType === 'New';
  const hasNote = !!ticket.notes;

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

  const getLastVisitText = () => {
    if (ticket.clientType === 'New') {
      return 'First Visit';
    }
    return 'Returning client';
  };

  // REFINED CLIENT TYPE BADGES (Apple-style subtle colors)
  const clientTypeBadge = {
    VIP: { bg: '#FFF9E6', text: '#8B6914', border: '#E5D4A0', icon: '⭐', accent: '#F59E0B' },
    Priority: { bg: '#FFF1F0', text: '#B91C1C', border: '#FCA5A5', icon: '🔥', accent: '#EF4444' },
    New: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: '✨', accent: '#6366F1' },
    Regular: { bg: '#F9FAFB', text: '#4B5563', border: '#E5E7EB', icon: '👤', accent: '#6B7280' }
  };

  clientTypeBadge[ticket.clientType as keyof typeof clientTypeBadge] || clientTypeBadge.Regular;

  // TACTILE PAPER AESTHETIC - WAITING (warm ivory with soft depth)
  const paperStyle = {
    background: '#FFF8E8', // Warmer beige paper from reference
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
    borderRadius: '6px',
    border: '2px solid #e8dcc8',
    boxShadow: `
      0 1px 3px rgba(0,0,0,0.08),
      0 1px 2px rgba(0,0,0,0.04)
    `,
  };

  // LIST COMPACT VIEW - Thermal Receipt Design
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => onClick?.(ticket.id)}
          className={`relative overflow-visible transition-all duration-200 ease-out hover:-translate-y-0.5 cursor-pointer ${isVeryLongWait ? 'animate-pulse-subtle' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
          style={{
            background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
            border: '1px dashed #D8D8D8',
            borderLeft: `3px solid ${getWaitBorderColor()}`,
            borderRadius: '10px',
            boxShadow: 'inset 0 12px 12px -10px rgba(0,0,0,0.09), inset -2px 0 4px rgba(255,255,255,0.95), inset 2px 0 4px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.05)'
          }}
        >
          {/* Dog-ear corner */}
          <div className="absolute top-0 right-0 w-[5px] h-[5px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          {/* Perforation dots - barely visible */}
          <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
            {[...Array(15)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
          </div>

          {/* Compact ticket number badge */}
          <div className="absolute left-0 top-[6px] w-6 h-5 text-[#1a1614] flex items-center justify-center font-black text-2xs z-20"
               style={{
                 background: 'rgba(139, 92, 246, 0.06)',
                 borderTopRightRadius: '6px',
                 borderBottomRightRadius: '6px',
                 borderTop: '2px solid rgba(139, 92, 246, 0.28)',
                 borderRight: '2px solid rgba(139, 92, 246, 0.28)',
                 borderBottom: '2px solid rgba(139, 92, 246, 0.28)',
                 boxShadow: '2px 0 4px rgba(139, 92, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                 letterSpacing: '-0.02em',
                 transform: 'translateX(-2px)'
               }}>
            {ticket.number}
          </div>

          {/* Compact content area */}
          <div className="py-0.5 pr-12 pl-7 relative">
            {/* Single compact row */}
            <div className="flex items-center justify-between gap-1">
              {/* Left: Client + Service */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs text-[#1a1614] truncate leading-tight">{ticket.clientName}</span>
                  {isFirstVisit && <span className="text-2xs">⭐</span>}
                  {hasNote && <span className="text-2xs">📋</span>}
                </div>
                <div className="text-2xs text-[#6b5d52] leading-tight flex items-center gap-1">
                  <span className="truncate">{serviceDisplay}</span>
                  {hasCheckoutServices && serviceCount > 1 && (
                    <span className="flex-shrink-0 text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">
                      ${serviceTotal.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Wait time */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-2xs whitespace-nowrap flex items-center gap-0.5" style={{ color: getWaitTimeColor() }}>
                  {isLongWait && <span className="inline-block w-1 h-1 rounded-full bg-current animate-pulse" />}
                  {formatWaitTime(waitTime)}
                </span>
              </div>
            </div>

            {/* Compact Assign button - Responsive: 44px mobile (accessibility), 28px desktop (space) */}
            <button
              onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-7 sm:h-7 min-w-[44px] sm:min-w-[28px] min-h-[44px] sm:min-h-[28px] flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
              title="Assign Staff"
            >
              <UserPlus size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </div>
      
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticketId={ticket.number}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
    );
  }

  // LIST NORMAL VIEW - Thermal Receipt Design
  if (viewMode === 'normal') {
    return (
      <>
      <div
        onClick={() => onClick?.(ticket.id)}
        className={`relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer ${isVeryLongWait ? 'animate-pulse-subtle' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
          border: '1px dashed #D8D8D8',
          borderLeft: `3px solid ${getWaitBorderColor()}`,
          borderRadius: '10px',
          boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)'
        }}
      >
        {/* Dog-ear corner */}
        <div className="absolute top-0 right-0 w-[6px] h-[6px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

        {/* Perforation dots - barely visible */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
          {[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Wrap-around ticket number badge at Row 1 height */}
        <div className="absolute left-0 top-[2px] w-9 h-8 text-[#1a1614] flex items-center justify-center font-black text-sm z-20"
             style={{
               background: 'rgba(139, 92, 246, 0.06)',
               borderTopRightRadius: '8px',
               borderBottomRightRadius: '8px',
               borderTop: '2px solid rgba(139, 92, 246, 0.28)',
               borderRight: '2px solid rgba(139, 92, 246, 0.28)',
               borderBottom: '2px solid rgba(139, 92, 246, 0.28)',
               boxShadow: '2px 0 4px rgba(139, 92, 246, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
               letterSpacing: '-0.02em',
               transform: 'translateX(-3px)'
             }}>
          {ticket.number}
        </div>

        {/* Content area */}
        <div className="py-0.5 pr-2.5 pl-11">
          {/* Row 1: Client name + Wait time */}
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1a1614] truncate text-base leading-tight">{ticket.clientName}</span>
                {isFirstVisit && <span className="text-sm flex-shrink-0">⭐</span>}
                {hasNote && <StickyNote size={14} className="text-amber-500 flex-shrink-0" />}
              </div>
              <div className="text-2xs text-[#6b5d52] font-medium tracking-wide leading-tight">{getLastVisitText()}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs whitespace-nowrap flex items-center gap-1" style={{ color: getWaitTimeColor() }}>
                {isLongWait && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                Waited {formatWaitTime(waitTime)}
              </span>
              <span className="text-xs text-[#6b5d52]">•</span>
              <span className="text-xs text-[#6b5d52] whitespace-nowrap">{ticket.time}</span>
            </div>
          </div>

          {/* Divider - spans full content width */}
          <div className="border-t border-[#e8dcc8]/50" />

          {/* Row 2: Service + Assign button */}
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <div className="text-sm text-[#1a1614] font-semibold leading-snug flex-1 min-w-0 flex items-center gap-1.5">
              <span className="truncate">{serviceDisplay}</span>
              {hasCheckoutServices && serviceCount > 1 && (
                <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                  ${serviceTotal.toFixed(0)}
                </span>
              )}
            </div>

            {/* Assign button */}
            <div className="flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] sm:min-w-[40px] min-h-[44px] sm:min-h-[40px] flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                title="Assign Staff"
              >
                <UserPlus size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
      </div>
      
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticketId={ticket.number}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
    );
  }

  // Grid Normal view (NORMAL GRID - larger cards)
  if (viewMode === 'grid-normal') {
  // Paper-like aesthetic with warmer color and external texture
  const paperCardStyle = {
    background: '#FFF8E8', // Warmer beige paper from reference
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
    border: '2px solid #e8dcc8', // Warm border
    borderRadius: '8px', // Match reference
    boxShadow: `
      inset 0 0.5px 0 rgba(255,255,255,0.70),
      inset 0 -0.8px 1px rgba(0,0,0,0.05),
      0.5px 0.5px 0 rgba(255,255,255,0.80),
      2px 3px 4px rgba(0,0,0,0.04),
      4px 8px 12px rgba(0,0,0,0.08)
    `,
    minWidth: '320px',
    maxWidth: '360px',
  };

  const paperCardHoverStyle = {
    boxShadow: `
      inset 0 0.5px 0 rgba(255,255,255,0.85),
      1px 2px 3px rgba(0,0,0,0.05),
      5px 10px 14px rgba(0,0,0,0.10)
    `,
  };

  const paperCardActiveStyle = {
    boxShadow: `
      0 1px 2px rgba(0,0,0,0.05),
      inset 0 1px 2px rgba(0,0,0,0.06)
    `,
  };

  return (
    <>
    <div
      onClick={() => onClick?.(ticket.id)}
      className="relative cursor-pointer transition-all duration-250 ease-out overflow-hidden flex flex-col"
      role="button"
      tabIndex={0}
      aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
      style={{
        ...paperCardStyle,
        padding: '16px 18px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px) rotate(0.2deg)';
        e.currentTarget.style.boxShadow = paperCardHoverStyle.boxShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
        e.currentTarget.style.boxShadow = paperCardStyle.boxShadow;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.985)';
        e.currentTarget.style.boxShadow = paperCardActiveStyle.boxShadow;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = paperCardHoverStyle.boxShadow;
      }}
    >
      {/* Perforation dots - top */}
      <div className="absolute top-0 left-0 w-full h-[6px] overflow-hidden flex items-center">
        <div className="w-full flex justify-between px-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 h-1 bg-amber-200 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Left ticket notch */}
      <div className="absolute -left-2 top-1/3 w-4 h-4 bg-gray-50 rounded-full border-r-2 border-amber-200"></div>

      {/* Right ticket notch */}
      <div className="absolute -right-2 top-1/3 w-4 h-4 bg-gray-50 rounded-full border-l-2 border-amber-200"></div>

      {/* Thick paper left edge shadow effect */}
      <div 
        className="absolute top-0 left-0 w-2 h-full"
        style={{
          boxShadow: `
            inset 3px 0 4px rgba(0,0,0,0.20),
            inset 6px 0 8px rgba(0,0,0,0.12)
          `
        }}
      ></div>

      {/* Paper Ticket Grid View */}
      <div className="flex flex-col h-full" style={{ gap: '10px' }}>
        {/* Header Row: Ticket # + Client Name + Badges + More */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Ticket # pill - dark circle angled like reference */}
            <div 
              className="flex-shrink-0 transform -rotate-3"
              style={{
                background: '#1F2937',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                border: '2px solid rgba(255,255,255,0.1)',
                fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.3px',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              {ticket.number}
            </div>
            
            {/* Client Name with icon */}
            <div className="flex items-center gap-1.5 min-w-0">
              <User size={14} className="text-amber-700 flex-shrink-0" />
              <span 
                className="font-semibold truncate" 
                style={{ 
                  fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#222222',
                  letterSpacing: '0.3px',
                  textShadow: '0 0.4px 0 rgba(0,0,0,0.20)',
                  WebkitFontSmoothing: 'antialiased',
                }} 
                title={ticket.clientName}
              >
                {ticket.clientName}
              </span>
            </div>
            
            {/* VIP Badge - stamped style */}
            {ticket.clientType === 'VIP' && (
              <span 
                className="flex-shrink-0"
                style={{
                  background: '#fff9d9',
                  color: '#c4a13a',
                  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.05)',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                }}
              >
                ⭐ VIP
              </span>
            )}
            
            {/* Priority Badge */}
            {ticket.clientType === 'Priority' && (
              <span 
                className="flex-shrink-0"
                style={{
                  background: '#fff9d9',
                  color: '#c4a13a',
                  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.05)',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                }}
              >
                🔥 PRIORITY
              </span>
            )}
          </div>
          
          {/* More Menu */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-lg hover:bg-black hover:bg-opacity-5 active:bg-opacity-10 transition-colors relative flex-shrink-0"
            style={{ color: '#767676' }}
            title="More"
          >
            <MoreVertical size={16} strokeWidth={2} />
          </button>
          
          {showMenu && (
            <div className="absolute right-2 top-14 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]">
              <button onClick={(e) => { e.stopPropagation(); onOpenTicket?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-purple-50 flex items-center gap-2 font-medium">
                <ExternalLink size={14} className="text-purple-500" /> Open Ticket
              </button>
              <button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2">
                <Edit2 size={14} /> Edit
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
        
        {/* Subline: visit info */}
        {ticket.clientType === 'New' && (
          <div className="flex items-center gap-1">
            <span style={{ 
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#555555',
              textShadow: '0 0.4px 0 rgba(0,0,0,0.20)',
            }}>
              First visit
            </span>
            <ChevronRight size={12} style={{ color: '#767676' }} strokeWidth={2} />
          </div>
        )}

        {/* Service Title with icon */}
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-amber-700 flex-shrink-0" />
          <div
            className="truncate flex items-center gap-2"
            style={{
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: '#222222',
              lineHeight: '1.4',
              letterSpacing: '0.2px',
              textShadow: '0 0.4px 0 rgba(0,0,0,0.20)',
              WebkitFontSmoothing: 'antialiased',
            }}
            title={ticket.service}
          >
            <span className="truncate">{serviceDisplay}</span>
            {hasCheckoutServices && serviceCount > 1 && (
              <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                ${serviceTotal.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Meta Row: wait time + scheduled time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: '#767676' }} strokeWidth={2} />
            <span style={{ 
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: waitTime > 30 ? '#F2785C' : '#555555',
              textShadow: '0 0.4px 0 rgba(0,0,0,0.20)',
            }}>
              {formatWaitTime(waitTime)} wait
            </span>
          </div>
          <span style={{ color: '#d0d0d0', fontSize: '12px' }}>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-amber-700" />
            <span style={{ 
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#555555',
              textShadow: '0 0.4px 0 rgba(0,0,0,0.20)',
            }}>
              {ticket.time}
            </span>
          </div>
        </div>
        
        {/* Progress Bar - matte, rounded (amber for waiting) */}
        <div style={{ height: '1.5px', background: 'rgba(245,158,11,0.20)', borderRadius: '1px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'rgba(245,158,11,0.45)',
              width: `${waitProgress}%`,
              transition: 'width 500ms ease-out',
              borderRadius: '1px'
            }} 
          />
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow" />

        {/* Footer Row: Action chip (assign) */}
        <div className="flex items-center justify-end gap-2">
          {/* Action chip - assign */}
          <button
            onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
            className="rounded-lg p-1.5 transition-all flex-shrink-0"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fffefb',
              boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.08)',
              color: '#3B82F6',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fffefb';
            }}
            title="Assign Staff"
          >
            <UserPlus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Paper texture overlay - cardboard at 10% opacity */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard.png")'
        }}
      ></div>
      
      {/* Perforation at Bottom Edge - ENHANCED */}
      <div className="absolute bottom-0 left-0 right-0 h-[10px] opacity-30 rounded-b-lg overflow-hidden"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #8B5C2E 0px, #8B5C2E 6px, transparent 6px, transparent 12px)',
        }}
      />
    </div>
    
    {/* Ticket Details Modal */}
    <TicketDetailsModal
      ticketId={ticket.number}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
    />
  </>
  );
}

  // Grid Compact view (4-row compact structure)
  if (viewMode === 'grid-compact') {
  return (
    <>
    <div
      onClick={() => onClick?.(ticket.id)}
      className="relative cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden"
      style={{
        ...paperStyle,
        borderRadius: '6px',
        padding: '7px 14px',
        paddingBottom: '10px',
      }}
    >
      {/* Compact GRID VIEW - flex column layout */}
      <div className="flex flex-col h-full">
        {/* Top Row: Number + Client Name + More Menu */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span 
              className="font-bold flex-shrink-0"
              style={{ 
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: '12px',
                lineHeight: 1,
                letterSpacing: '0.3px',
                color: '#222222',
                textShadow: '0 0.4px 0 rgba(0,0,0,0.2)',
                WebkitFontSmoothing: 'antialiased',
                fontWeight: 600
              }}
            >
              #{ticket.number}
            </span>
            <div className="font-semibold truncate" style={{ color: '#222222', fontSize: '11px', letterSpacing: '0.3px', fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased', fontWeight: 600 }} title={ticket.clientName}>
              {ticket.clientName}
            </div>
          </div>
          
          {/* More Menu - Top Right */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-0.5 rounded bg-white hover:bg-gray-50 active:bg-gray-100 transition-all"
              style={{
                boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
              title="More"
            >
              <MoreVertical size={10} className="text-gray-600" strokeWidth={2} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[110px]">
                <button onClick={(e) => { e.stopPropagation(); onOpenTicket?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-purple-50 flex items-center gap-1.5 font-medium">
                  <ExternalLink size={11} className="text-purple-500" /> Open Ticket
                </button>
                <button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-1.5">
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-red-50 flex items-center gap-1.5 text-red-600">
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Service */}
        <div className="mb-1">
          <div className="flex items-center gap-1" style={{ color: '#555555', fontSize: '9px', fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.service}>
            <span className="truncate">{serviceDisplay}</span>
            {hasCheckoutServices && serviceCount > 1 && (
              <span className="flex-shrink-0 text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">
                ${serviceTotal.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Assign Button */}
        <div className="flex items-center gap-0.5 mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
            className="p-0.5 rounded bg-white hover:bg-blue-50 active:bg-blue-100 transition-all flex-shrink-0"
            style={{
              boxShadow: '0 1px 3px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.85)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
            title="Assign Staff"
          >
            <UserPlus size={11} className="text-blue-600" strokeWidth={2.5} />
          </button>
        </div>

        {/* Spacer to push metrics to bottom */}
        <div className="flex-grow" />

        {/* Time + Duration + Wait % - FIXED AT BOTTOM */}
        <div className="flex items-center justify-between text-2xs mt-auto" style={{ opacity: 0.7 }}>
          <div className="flex items-center gap-0.5">
            <Clock size={9} className="text-gray-400" />
            <span className="text-gray-500 font-medium">{formatWaitTime(waitTime)}</span>
          </div>
          <span className="font-bold" style={{ color: '#F59E0B' }}>{Math.round(waitProgress)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-1" style={{ height: '2px', background: 'rgba(245,158,11,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'rgba(245,158,11,0.5)', 
              width: `${waitProgress}%`,
              transition: 'width 500ms ease-out',
              borderRadius: '1px'
            }} 
          />
        </div>
      </div>
      
      {/* Perforation at Bottom Edge */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30 rounded-b-md overflow-hidden" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5C2E 0px, #8B5C2E 4px, transparent 4px, transparent 8px)' }} />
    </div>
    
    {/* Ticket Details Modal */}
    <TicketDetailsModal
      ticketId={ticket.number}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
    />
  </>
  );
}

  return null;
}
