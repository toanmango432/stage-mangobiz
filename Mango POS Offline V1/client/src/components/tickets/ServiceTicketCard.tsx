import { useState, useEffect } from 'react';
import { Clock, MoreVertical, Check, Pause, Trash2, StickyNote, ChevronRight } from 'lucide-react';
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

  // REAL PAPER - IN SERVICE (warm with blue tint)
  const paperStyle = {
    // Warm cream paper with subtle blue tint
    background: `
      linear-gradient(180deg, #F0F7FB 0%, #E8F2F7 100%)
    `,
    // VISIBLE paper texture
    backgroundImage: `
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.02) 1px, rgba(59, 130, 246, 0.02) 2px)
    `,
    // Real shadows with blue undertone
    boxShadow: `
      0 2px 4px rgba(59, 130, 246, 0.15),
      0 4px 8px rgba(59, 130, 246, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(59, 130, 246, 0.05)
    `,
    border: '1px solid #B8D4E6',
  };

  // Hover state
  const paperHoverStyle = {
    boxShadow: `
      0 4px 8px rgba(59, 130, 246, 0.18),
      0 8px 16px rgba(59, 130, 246, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(59, 130, 246, 0.05)
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
                className="font-bold flex-shrink-0 text-blue-900"
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: 1,
                  letterSpacing: '-0.5px',
                }}
              >
                #{ticket.number}
              </span>
              <span className="text-gray-400" style={{ fontSize: '10px' }}>›</span>
              {/* Client Name */}
              <div className="font-semibold truncate" style={{ color: '#111827', fontSize: '11px', letterSpacing: '-0.2px' }} title={ticket.clientName}>
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
            <div className="truncate" style={{ color: '#6B7280', fontSize: '10px', fontWeight: 500 }} title={ticket.service}>
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
        </div>
        
        {/* Progress Bar at Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-100 rounded-b-md overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
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
          e.currentTarget.style.boxShadow = paperHoverStyle.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = paperStyle.boxShadow;
        }}
      >
        
        {/* NEW LAYOUT - RESPONSIVE */}
        <div>
          {/* Row 1: Number | Client + Badge + Note | Staff | Actions */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {/* Number */}
              <span className="font-bold flex-shrink-0 text-base sm:text-lg" style={{ fontFamily: 'monospace', color: '#1E40AF', letterSpacing: '-0.5px' }}>
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
                <div className="font-bold truncate text-sm sm:text-base" style={{ color: '#111827', letterSpacing: '-0.2px' }} title={ticket.clientName}>
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
            <div className="truncate text-xs sm:text-sm" style={{ color: '#6B7280', fontWeight: 500, maxWidth: '50%' }}>
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
        </div>
        
        {/* Progress Bar at Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-100 rounded-b-md overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
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
  return (
    <>
    <div
      onClick={() => onClick?.(ticket.id)}
      className="relative cursor-pointer hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 ease-out overflow-hidden flex flex-col focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
      role="button"
      tabIndex={0}
      aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
      style={{
        ...paperStyle,
        borderRadius: '8px',
        padding: '11px',
        paddingBottom: '9px',
        minHeight: '224px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = paperHoverStyle.boxShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = paperStyle.boxShadow;
      }}
    >
      {/* Normal GRID VIEW - larger cards */}
      <div className="flex flex-col h-full">
        {/* Top Row - Ticket # + Badge + Note + More */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-blue-900" style={{ 
              fontFamily: 'monospace', 
              letterSpacing: '-0.5px'
            }}>
              #{ticket.number}
            </span>
            {ticket.clientType !== 'Regular' && (
              <span 
                className="text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 cursor-help" 
                style={{ 
                  backgroundColor: badge.bg, 
                  color: badge.text,
                  border: `1px solid ${badge.border}`,
                }}
                title={`${ticket.clientType} client`}
              >
                {badge.icon}
              </span>
            )}
            {ticket.notes && (
              <div title={ticket.notes} className="flex-shrink-0">
                <StickyNote size={14} style={{ color: '#F59E0B' }} strokeWidth={2} />
              </div>
            )}
          </div>
          
          {/* More Menu - Moved to top row */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors relative focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
            aria-label="More options"
            aria-expanded={showMenu}
            aria-haspopup="menu"
            title="More"
          >
            <MoreVertical size={16} className="text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-2 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]">
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

        {/* Client Name - MORE PROMINENT with truncation */}
        <div className="mb-2 flex items-center gap-1">
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
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </Tippy>
          <span className="font-bold text-lg text-gray-900 truncate block" title={ticket.clientName}>{ticket.clientName}</span>
        </div>

        {/* Service - Allow 2 rows */}
        <div className="mb-2.5">
          <div 
            className="font-semibold text-sm text-gray-700"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.4',
            }}
            title={ticket.service}
          >
            {ticket.service}
          </div>
        </div>

        {/* Staff + Actions Row - HIGHLY RESPONSIVE */}
        <div className="flex items-start gap-1.5 mb-1 pt-2.5" style={{ borderTop: '1px solid rgba(59,130,246,0.12)' }}>
          <div 
            className="flex items-center gap-0.5 flex-wrap min-w-0 flex-1"
            style={{ 
              maxHeight: '2.5rem',
              overflow: 'hidden'
            }}
          >
            {staffList.length > 0 ? (
              <>
                {staffList.slice(0, 4).map((staff) => (
                  <div 
                    key={staff.id} 
                    className="px-1.5 py-0.5 rounded font-bold text-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    style={{ 
                      backgroundColor: staff.color,
                      letterSpacing: '0.2px',
                      fontSize: staffList.length >= 3 ? '9.5px' : '11px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                    }}
                    title={staff.name}
                  >
                    {staff.name.split(' ')[0].toUpperCase()}
                  </div>
                ))}
                {staffList.length > 4 && (
                  <span 
                    className="px-1 py-0.5 rounded bg-gray-100 font-bold"
                    style={{ 
                      color: '#6B7280',
                      fontSize: staffList.length >= 3 ? '9.5px' : '11px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.85)',
                    }}
                    title={staffList.slice(4).map(s => s.name).join(', ')}
                  >
                    +{staffList.length - 4}
                  </span>
                )}
              </>
            ) : (
              <div 
                className="px-1.5 py-0.5 rounded font-bold text-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
                style={{ 
                  backgroundColor: staffColor,
                  letterSpacing: '0.2px',
                  fontSize: '11px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                }}
                title={staffName}
              >
                {staffName.split(' ')[0].toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Action Icon - Complete only - COMPACT */}
          <button
            onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
            className="p-1.5 rounded-lg bg-white hover:bg-green-50 hover:scale-105 active:scale-95 transition-all flex-shrink-0 focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
            aria-label={`Complete service for ${ticket.clientName}`}
            style={{
              boxShadow: '0 3px 6px rgba(34, 197, 94, 0.25), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
              border: '1.5px solid rgba(34, 197, 94, 0.3)',
            }}
            title="Complete"
          >
            <Check size={16} className="text-green-600" strokeWidth={3.5} />
          </button>
        </div>

        {/* Spacer to push metrics to bottom */}
        <div className="flex-grow" />
        
        {/* Time + Progress Row - SUBTLE, FIXED AT BOTTOM */}
        <div className="flex items-center justify-between text-xs mt-auto" style={{ opacity: 0.7 }}>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-gray-400" />
            <span className="text-gray-500 font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
        </div>
      </div>
      
      {/* Progress Bar at Bottom Edge - ENHANCED */}
      <div className="absolute bottom-0 left-0 right-0 h-[10px] bg-gray-200 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
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
              className="font-bold flex-shrink-0 text-blue-900"
              style={{ 
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1,
                letterSpacing: '-0.5px',
              }}
            >
              #{ticket.number}
            </span>
            <div className="font-semibold truncate" style={{ color: '#111827', fontSize: '11px', letterSpacing: '-0.2px' }} title={ticket.clientName}>
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
          <div className="truncate" style={{ color: '#4B5563', fontSize: '9px', fontWeight: 600 }} title={ticket.service}>
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
          <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
        </div>
      </div>
      
      {/* Progress Bar at Bottom Edge */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-100 rounded-b-md overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
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
