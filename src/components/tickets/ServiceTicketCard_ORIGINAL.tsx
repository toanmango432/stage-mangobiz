import { useState, useEffect } from 'react';
import { Clock, MoreVertical, Check, Pause, Trash2, StickyNote, ChevronRight, User, Calendar, Tag } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { TicketDetailsModal } from './TicketDetailsModal';

interface ServiceTicketCardProps {
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
    technician?: string;
    techColor?: string;
    assignedTo?: {
      id: string;
      name: string;
      color: string;
    };
    // Multi-staff support
    assignedStaff?: Array<{
      id: string;
      name: string;
      color: string;
    }>;
    createdAt?: Date;
  };
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onComplete?: (ticketId: string) => void;
  onPause?: (ticketId: string) => void;
  onDelete?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
}

export function ServiceTicketCard({
  ticket,
  viewMode = 'compact',
  onComplete,
  onPause,
  onDelete,
  onClick
}: ServiceTicketCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Calculate elapsed time and progress
  useEffect(() => {
    if (!ticket.createdAt) return;

    const updateProgress = () => {
      const now = new Date().getTime();
      const start = new Date(ticket.createdAt!).getTime();
      const elapsed = Math.floor((now - start) / 1000 / 60); // minutes
      const durationMinutes = parseInt(ticket.duration) || 30;
      const progressPercent = Math.min((elapsed / durationMinutes) * 100, 100);

      setElapsedTime(elapsed);
      setProgress(progressPercent);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [ticket.createdAt, ticket.duration]);

  // Get staff info - support multiple staff
  const staffList = ticket.assignedStaff || (ticket.assignedTo ? [ticket.assignedTo] : []);
  const hasMultipleStaff = staffList.length > 1;
  const staffName = ticket.technician || staffList[0]?.name || 'Unassigned';
  const staffColor = ticket.techColor || staffList[0]?.color || '#6B7280';

  // Calculate time remaining
  const durationMinutes = parseInt(ticket.duration) || 30;
  const timeRemaining = Math.max(0, durationMinutes - elapsedTime);
  
  // Format start time
  const startTime = ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }) : ticket.time;

  // REFINED CLIENT TYPE BADGES (matching WaitList)
  const clientTypeBadge = {
    VIP: { bg: '#FFF9E6', text: '#8B6914', border: '#E5D4A0', icon: '⭐', accent: '#F59E0B' },
    Priority: { bg: '#FFF1F0', text: '#B91C1C', border: '#FCA5A5', icon: '🔥', accent: '#EF4444' },
    New: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: '✨', accent: '#6366F1' },
    Regular: { bg: '#F9FAFB', text: '#4B5563', border: '#E5E7EB', icon: '👤', accent: '#6B7280' }
  };

  const badge = clientTypeBadge[ticket.clientType as keyof typeof clientTypeBadge] || clientTypeBadge.Regular;

  // TACTILE PAPER AESTHETIC - IN SERVICE (warm ivory with soft depth)
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

  // Hover state - tactile lift with rotation
  const paperHoverStyle = {
    boxShadow: `
      0 2px 4px rgba(0,0,0,0.1),
      0 4px 8px rgba(0,0,0,0.08)
    `,
  };

  // PAPER CARD AESTHETIC (Card versions: grid-normal, grid-compact)
  const paperCardStyle = {
    background: '#FFF8E8', // Warmer beige paper from reference
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
    borderRadius: '8px', // Match reference
    border: '2px solid #e8dcc8', // Warm border like reference
    boxShadow: `
      0 1px 3px rgba(0,0,0,0.08),
      0 1px 2px rgba(0,0,0,0.04)
    `,
  };

  // Format time
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // COMPACT VIEW - Very small for high volume (40-50 tickets)
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => onClick?.(ticket.id)}
          className="relative cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
          role="button"
          tabIndex={0}
          aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
          style={{
            ...paperStyle,
            borderRadius: '6px',
            padding: '4px 8px',
            paddingBottom: '5px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = paperHoverStyle.boxShadow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = paperStyle.boxShadow;
          }}
        >
        
        {/* Compact LINE VIEW - 2 tight rows */}
        <div>
          {/* Row 1: # + Name + Staff + Actions */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {/* Number */}
              <span 
                className="font-bold flex-shrink-0"
                style={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontSize: '11px',
                  lineHeight: 1,
                  letterSpacing: '0.3px',
                  color: '#222222',
                  textShadow: '0 0.4px 0 rgba(0,0,0,0.2)',
                  WebkitFontSmoothing: 'antialiased',
                }}
              >
                #{ticket.number}
              </span>
              <span className="text-gray-400" style={{ fontSize: '10px' }}>›</span>
              {/* Client Name */}
              <div className="font-semibold truncate" style={{ color: '#222222', fontSize: '11px', letterSpacing: '0.3px', fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.clientName}>
                {ticket.clientName}
              </div>
            </div>
            
            {/* Staff + Actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Staff Badge */}
              {staffList.length > 0 ? (
                <>
                  {staffList.slice(0, 1).map((staff) => (
                    <div 
                      key={staff.id} 
                      className="px-1 py-0.5 rounded font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      style={{ 
                        backgroundColor: staff.color,
                        fontSize: '7.2px',
                        letterSpacing: '0.3px',
                        textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)',
                        border: `1px solid ${staff.color}`,
                      }}
                      title={staff.name}
                    >
                      {staff.name.split(' ')[0].toUpperCase()}
                    </div>
                  ))}
                  {staffList.length > 1 && (
                    <span className="font-bold px-0.5 py-0.5 rounded bg-gray-100" style={{ color: '#6B7280', fontSize: '8px' }} title={staffList.slice(1).map(s => s.name).join(', ')}>
                      +{staffList.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <div 
                  className="px-1 py-0.5 rounded font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  style={{ 
                    backgroundColor: staffColor,
                    fontSize: '7.2px',
                    letterSpacing: '0.3px',
                    textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)'
                  }}
                  title={staffName}
                >
                  {staffName.split(' ')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                className="p-0.5 rounded-md bg-white hover:bg-green-50 hover:scale-105 active:scale-95 transition-all"
                style={{
                  boxShadow: '0 1px 2px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.9)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
                title="Complete"
              >
                <Check size={12} className="text-green-600" strokeWidth={3} />
              </button>
              <div className="relative">
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
                    <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-1.5">
                      <Pause size={10} /> Pause
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-red-50 flex items-center gap-1.5 text-red-600">
                      <Trash2 size={10} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Service + Time/Progress */}
          <div className="flex items-center justify-between gap-1">
            <div className="truncate" style={{ color: '#555555', fontSize: '10px', fontWeight: 500, fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.service}>
              {ticket.service}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0 text-[9px] font-semibold">
              <span className="flex items-center gap-0.5" style={{ color: '#6B7280' }} title="Elapsed time">
                <Clock size={9} className="text-gray-500" />
                {formatTime(elapsedTime)}
              </span>
              <span style={{ color: '#2563EB' }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-1" style={{ height: '2px', background: 'rgba(37,99,235,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                background: progress > 80 ? 'rgba(34,197,94,0.5)' : progress > 50 ? 'rgba(139,92,246,0.5)' : 'rgba(37,99,235,0.5)',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 500ms ease-out, background 500ms ease-out',
                borderRadius: '1px'
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticket={{
          ...ticket,
          status: 'in-service' as const,
          priority: ticket.priority || 'normal'
        }}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
    );
  }

  // NORMAL VIEW - Responsive across devices
  if (viewMode === 'normal') {
    return (
      <>
      <div
        onClick={() => onClick?.(ticket.id)}
        className="relative cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        role="button"
        tabIndex={0}
        aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          ...paperStyle,
          borderRadius: '6px',
          padding: '5px 7px',
          paddingBottom: '6px',
        }}
        data-responsive="true"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-0.5px) rotate(0.1deg)';
          e.currentTarget.style.boxShadow = paperHoverStyle.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
          e.currentTarget.style.boxShadow = paperStyle.boxShadow;
        }}
      >
        
        {/* NEW LAYOUT - RESPONSIVE */}
        <div>
          {/* Row 1: Number | Client + Badge + Note | Staff | Actions */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {/* Number */}
              <span className="font-bold flex-shrink-0 text-base sm:text-lg" style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#222222', letterSpacing: '0.3px', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
                #{ticket.number}
              </span>

              {/* Client Name + Badge + Note */}
              <div className="flex items-center gap-1 sm:gap-1 min-w-0 flex-1">
                <Tippy 
                  content={
                    <div className="text-xs">
                      <div className="font-semibold">{ticket.service}</div>
                      <div className="text-gray-300">{ticket.duration} • {ticket.time}</div>
                    </div>
                  }
                  delay={[500, 0]}
                  placement="right"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                    title="View details"
                  >
                    <ChevronRight size={11} className="text-gray-400" />
                  </button>
                </Tippy>
                <div className="font-bold truncate text-sm sm:text-base" style={{ color: '#222222', letterSpacing: '0.3px', fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased', fontWeight: 600 }} title={ticket.clientName}>
                  {ticket.clientName}
                </div>
                {ticket.clientType !== 'Regular' && (
                  <span 
                    className="px-1.5 py-0.5 sm:px-1.5 sm:py-0.5 rounded flex-shrink-0 text-xs sm:text-sm cursor-help" 
                    style={{ backgroundColor: badge.bg, color: badge.text, fontWeight: 700, border: `1px solid ${badge.border}` }}
                    title={`${ticket.clientType} client`}
                  >
                    {badge.icon}
                  </span>
                )}
                {ticket.notes && (
                  <div title={ticket.notes} className="flex-shrink-0">
                    <StickyNote className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: '#F59E0B' }} strokeWidth={2} />
                  </div>
                )}
              </div>
            </div>

            {/* Staff + Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Staff Badges */}
              <div className="flex items-center gap-1 sm:gap-1">
                {staffList.length > 0 ? (
                  <>
                    {staffList.slice(0, 1).map((staff) => (
                      <div 
                        key={staff.id} 
                        className="px-2 py-0.5 sm:px-2 sm:py-1 rounded-md font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                        style={{ 
                          backgroundColor: staff.color,
                          letterSpacing: '0.5px',
                          fontSize: '9.9px',
                        }}
                        title={staff.name}
                      >
                        {staff.name.split(' ')[0].toUpperCase()}
                      </div>
                    ))}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {staffList.length > 1 && staffList.slice(1, 2).map((staff) => (
                        <div 
                          key={staff.id} 
                          className="px-2 py-1 rounded-md font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                          style={{ 
                            backgroundColor: staff.color,
                            letterSpacing: '0.5px',
                            fontSize: '9.9px',
                          }}
                          title={staff.name}
                        >
                          {staff.name.split(' ')[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    {staffList.length > 1 && (
                      <span className="font-bold px-1.5 py-0.5 rounded bg-gray-100 text-xs" style={{ color: '#6B7280' }} title={staffList.slice(1).map(s => s.name).join(', ')}>
                        <span className="sm:hidden">+{staffList.length - 1}</span>
                        <span className="hidden sm:inline">{staffList.length > 2 ? `+${staffList.length - 2}` : ''}</span>
                      </span>
                    )}
                  </>
                ) : (
                  <div 
                    className="px-2 py-0.5 sm:px-2 sm:py-1 rounded-md font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: staffColor,
                      letterSpacing: '0.5px',
                      fontSize: '9.9px',
                    }}
                    title={staffName}
                  >
                    {staffName.split(' ')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <button
                onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                className="p-1.5 sm:p-1.5 rounded-lg bg-white hover:bg-green-50 hover:scale-105 active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
                aria-label={`Complete service for ${ticket.clientName}`}
                style={{
                  boxShadow: '0 3px 6px rgba(34, 197, 94, 0.25), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
                  border: '1.5px solid rgba(34, 197, 94, 0.3)',
                }}
                title="Complete"
              >
                <Check className="w-5 h-5 sm:w-5 sm:h-5 text-green-600" strokeWidth={3.5} />
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 sm:p-1.5 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 transition-all focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
                  aria-label="More options"
                  aria-expanded={showMenu}
                  aria-haspopup="menu"
                  style={{
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                  title="More"
                >
                  <MoreVertical className="w-4 h-4 sm:w-4 sm:h-4 text-gray-600" strokeWidth={2} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                    <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2">
                      <Pause size={12} /> Pause
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                      <Trash2 size={12} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Service | Time + Progress */}
          <div className="mt-0.5 sm:mt-1 flex items-center justify-between gap-1.5 sm:gap-2.5" style={{ paddingTop: '3px', borderTop: '1px solid rgba(59,130,246,0.08)' }}>
            <div className="truncate text-xs sm:text-sm" style={{ color: '#555555', fontWeight: 500, maxWidth: '50%', fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }}>
              {ticket.service}
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 text-xs sm:text-sm">
              <div className="flex items-center gap-0.5 sm:gap-0.5">
                <Clock size={10} className="text-gray-500 sm:w-3 sm:h-3" />
                <span style={{ color: '#6B7280', fontWeight: 500 }}>{formatTime(elapsedTime)}</span>
              </div>
              <span style={{ color: '#D1D5DB' }}>•</span>
              <span className="font-bold" style={{ color: '#2563EB' }}>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-1.5" style={{ height: '2.5px', background: 'rgba(37,99,235,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                background: progress > 80 ? 'rgba(34,197,94,0.5)' : progress > 50 ? 'rgba(139,92,246,0.5)' : 'rgba(37,99,235,0.5)',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 500ms ease-out, background 500ms ease-out',
                borderRadius: '1px'
              }} 
            />
          </div>
        </div>
      </div>
      
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticket={{
          ...ticket,
          status: 'in-service' as const,
          priority: ticket.priority || 'normal'
        }}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
    );
  }

  // Grid Normal view (NORMAL GRID - larger cards)
  if (viewMode === 'grid-normal') {
  // ULTRA-REALISTIC PAPER AESTHETIC with all enhancements
  const paperCardStyle = {
    background: '#FFF8E8', // Warmer beige paper matching Wait List exactly
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
    border: '2px solid #e8dcc8',
    borderTop: '2px solid rgba(255,255,255,0.4)', // Top edge highlight
    borderBottom: '2px solid rgba(0,0,0,0.08)', // Bottom edge shadow
    borderRadius: '8px 8px 7px 8px', // Slight bottom-right curl
    boxShadow: `
      inset 0 0.5px 0 rgba(255,255,255,0.70),
      inset 0 -0.8px 1px rgba(0,0,0,0.05),
      0.5px 0.5px 0 rgba(255,255,255,0.80),
      2px 3px 4px rgba(0,0,0,0.04),
      4px 8px 12px rgba(0,0,0,0.08),
      1px 1px 2px rgba(0,0,0,0.06)
    `, // Enhanced with paper curl shadow
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
      aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
      style={{
        ...paperCardStyle,
        padding: '16px 18px',
        transform: 'rotate(0.15deg)', // Slight imperfect alignment
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
      {/* Perforation dots - top (irregular for realism) */}
      <div className="absolute top-0 left-0 w-full h-[6px] overflow-hidden flex items-center">
        <div className="w-full flex justify-between px-4">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="bg-amber-200 rounded-full"
              style={{
                width: `${3.5 + (i % 3) * 0.5}px`,
                height: `${3.5 + (i % 3) * 0.5}px`,
                opacity: 0.6 + (i % 4) * 0.1,
              }}
            ></div>
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
                  textShadow: '0 0.5px 0.5px rgba(0,0,0,0.15), 0 0.4px 0 rgba(0,0,0,0.20)', // Ink absorption effect
                  WebkitFontSmoothing: 'antialiased',
                  filter: 'drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.05))', // Micro-shadow
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
            
            {/* Reward Badge */}
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
                🎁 REWARD
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
              <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2">
                <Pause size={14} /> Pause
              </button>
              <div className="h-px bg-gray-200 my-1" />
              <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                <Trash2 size={14} /> Cancel
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
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-md"
          style={{
            background: 'rgba(255,255,255,0.4)',
            boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)', // Micro-shadow
          }}
        >
          <Tag size={14} className="text-amber-700 flex-shrink-0" />
          <div 
            className="truncate"
            style={{
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: '#222222',
              lineHeight: '1.4',
              letterSpacing: '0.2px',
              textShadow: '0 0.5px 0.5px rgba(0,0,0,0.15), 0 0.4px 0 rgba(0,0,0,0.20)', // Ink effect
              WebkitFontSmoothing: 'antialiased',
            }}
            title={ticket.service}
          >
            {ticket.service}
          </div>
        </div>

        {/* Meta Row: time left + start time (with box shadows) */}
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{
              background: 'rgba(255,255,255,0.3)',
              boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <Clock size={12} style={{ color: '#767676' }} strokeWidth={2} />
            <span style={{ 
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: timeRemaining <= 15 ? '#F2785C' : '#555555',
              textShadow: '0 0.5px 0.5px rgba(0,0,0,0.15)',
            }}>
              {formatTime(timeRemaining)} left
            </span>
          </div>
          <span style={{ color: '#d0d0d0', fontSize: '12px' }}>•</span>
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{
              background: 'rgba(255,255,255,0.3)',
              boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <Calendar size={12} className="text-amber-700" />
            <span style={{ 
              fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#555555',
              textShadow: '0 0.5px 0.5px rgba(0,0,0,0.15)',
            }}>
              {startTime}
            </span>
          </div>
        </div>
        
        {/* Progress Bar - matte, rounded */}
        <div style={{ height: '1.5px', background: 'rgba(59,196,155,0.20)', borderRadius: '1px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'rgba(59,196,155,0.45)',
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 500ms ease-out',
              borderRadius: '1px'
            }} 
          />
        </div>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Footer Row: Tech chips + Action */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {staffList.length > 0 ? (
              <>
                {staffList.slice(0, 3).map((staff) => (
                  <div 
                    key={staff.id} 
                    className="px-2 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                    style={{ 
                      border: `1px solid ${staff.color}`,
                      background: `color-mix(in srgb, ${staff.color} 8%, transparent)`,
                      color: '#333333',
                      fontSize: '12px',
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase',
                      fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
                      boxShadow: 'inset 0 0.5px 1px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.06)', // Micro-shadow
                      textShadow: '0 0.5px 0.5px rgba(0,0,0,0.12)', // Ink effect
                    }}
                    title={staff.name}
                  >
                    {staff.name.split(' ')[0]}
                  </div>
                ))}
                {staffList.length > 3 && (
                  <span 
                    className="px-2 py-1 rounded-full"
                    style={{ 
                      border: '1px solid #999',
                      background: 'rgba(153,153,153,0.08)',
                      color: '#333',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                    title={staffList.slice(3).map(s => s.name).join(', ')}
                  >
                    +{staffList.length - 3}
                  </span>
                )}
              </>
            ) : (
              <div 
                className="px-2 py-1 rounded-full cursor-pointer"
                style={{ 
                  border: `1px solid ${staffColor}`,
                  background: `color-mix(in srgb, ${staffColor} 8%, transparent)`,
                  color: '#333',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase'
                }}
                title={staffName}
              >
                {staffName.split(' ')[0]}
              </div>
            )}
          </div>
          
          {/* Action chip - checkmark */}
          <button
            onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
            className="rounded-lg p-1.5 transition-all flex-shrink-0"
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: progress >= 100 ? '#47B881' : '#fffefb',
              boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.08)',
              color: progress >= 100 ? '#ffffff' : '#555555',
            }}
            onMouseEnter={(e) => {
              if (progress < 100) {
                e.currentTarget.style.background = 'rgba(71,184,129,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (progress < 100) {
                e.currentTarget.style.background = '#fffefb';
              }
            }}
            title="Complete"
          >
            <Check size={16} strokeWidth={2.5} />
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
      
    </div>
    
    {/* Ticket Details Modal */}
    <TicketDetailsModal
      ticket={{
        ...ticket,
        status: 'in-service' as const,
        priority: ticket.priority || 'normal'
      }}
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
      className="relative cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
      role="button"
      tabIndex={0}
      aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
      style={{
        ...paperStyle,
        borderRadius: '6px',
        padding: '7px 14px',
        paddingBottom: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = paperHoverStyle.boxShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = paperStyle.boxShadow;
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
              className="p-0.5 rounded bg-white hover:bg-gray-50 active:bg-gray-100 transition-all focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
              aria-label="More options"
              aria-expanded={showMenu}
              aria-haspopup="menu"
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
                <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-green-50 flex items-center gap-1.5 text-green-600">
                  <Check size={11} /> Complete
                </button>
                <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-1.5">
                  <Pause size={11} /> Pause
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-red-50 flex items-center gap-1.5 text-red-600">
                  <Trash2 size={11} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Service */}
        <div className="mb-1">
          <div className="truncate" style={{ color: '#555555', fontSize: '9px', fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.service}>
            {ticket.service}
          </div>
        </div>

        {/* Row 3: Staff + Complete Button */}
        <div className="flex items-center gap-0.5 mb-1">
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            {staffList.length > 0 ? (
              <>
                {staffList.slice(0, 1).map((staff) => (
                  <div 
                    key={staff.id} 
                    className="px-1 py-0.5 rounded font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: staff.color,
                      fontSize: '7px',
                      letterSpacing: '0.2px',
                      textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
                      border: `1px solid ${staff.color}`,
                    }}
                    title={staff.name}
                  >
                    {staff.name.split(' ')[0].toUpperCase()}
                  </div>
                ))}
                {staffList.length > 1 && (
                  <span className="font-bold px-0.5 py-0.5 rounded bg-gray-100" style={{ color: '#6B7280', fontSize: '7.5px' }} title={staffList.slice(1).map(s => s.name).join(', ')}>
                    +{staffList.length - 1}
                  </span>
                )}
              </>
            ) : (
              <div 
                className="px-1 py-0.5 rounded font-bold text-white shadow-sm cursor-pointer transition-transform hover:scale-110 active:scale-95"
                style={{ 
                  backgroundColor: staffColor,
                  fontSize: '7px',
                  letterSpacing: '0.2px',
                  textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)'
                }}
                title={staffName}
              >
                {staffName.split(' ')[0].toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Complete Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
            className="p-0.5 rounded bg-white hover:bg-green-50 active:bg-green-100 transition-all flex-shrink-0"
            style={{
              boxShadow: '0 1px 3px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.9)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
            title="Complete"
          >
            <Check size={11} className="text-green-600" strokeWidth={3} />
          </button>
        </div>

        {/* Spacer to push metrics to bottom */}
        <div className="flex-grow" />

        {/* Time + Progress - FIXED AT BOTTOM */}
        <div className="flex items-center justify-between text-[9px] mt-auto" style={{ opacity: 0.7 }}>
          <div className="flex items-center gap-0.5">
            <Clock size={9} className="text-gray-400" />
            <span className="text-gray-500 font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <span className="font-bold" style={{ color: progress > 80 ? '#10B981' : progress > 50 ? '#8B5CF6' : '#2563EB' }}>{Math.round(progress)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-1" style={{ height: '2px', background: 'rgba(37,99,235,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: progress > 80 ? 'rgba(16,185,129,0.5)' : progress > 50 ? 'rgba(139,92,246,0.5)' : 'rgba(37,99,235,0.5)',
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 500ms ease-out, background 500ms ease-out',
              borderRadius: '1px'
            }} 
          />
        </div>
      </div>
    </div>
    
    {/* Ticket Details Modal */}
    <TicketDetailsModal
      ticket={{
        ...ticket,
        status: 'in-service' as const,
        priority: ticket.priority || 'normal'
      }}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
    />
  </>
  );
}

  return null;
}
