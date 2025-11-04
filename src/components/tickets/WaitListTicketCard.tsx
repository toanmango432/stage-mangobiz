import { useState, useEffect } from 'react';
import { Clock, MoreVertical, UserPlus, Edit2, Trash2, StickyNote, ChevronRight } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { TicketDetailsModal } from './TicketDetailsModal';

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
  };
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onAssign?: (ticketId: string) => void;
  onEdit?: (ticketId: string) => void;
  onDelete?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
}

export function WaitListTicketCard({
  ticket,
  viewMode = 'compact',
  onAssign,
  onEdit,
  onDelete,
  onClick
}: WaitListTicketCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [waitProgress, setWaitProgress] = useState(0);

  // Calculate wait time progress (assume tickets are created now, show wait time)
  useEffect(() => {
    const startTime = new Date();
    startTime.setHours(parseInt(ticket.time.split(':')[0]));
    startTime.setMinutes(parseInt(ticket.time.split(':')[1]));
    
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

  // REFINED CLIENT TYPE BADGES (Apple-style subtle colors)
  const clientTypeBadge = {
    VIP: { bg: '#FFF9E6', text: '#8B6914', border: '#E5D4A0', icon: '⭐', accent: '#F59E0B' },
    Priority: { bg: '#FFF1F0', text: '#B91C1C', border: '#FCA5A5', icon: '🔥', accent: '#EF4444' },
    New: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: '✨', accent: '#6366F1' },
    Regular: { bg: '#F9FAFB', text: '#4B5563', border: '#E5E7EB', icon: '👤', accent: '#6B7280' }
  };

  const badge = clientTypeBadge[ticket.clientType as keyof typeof clientTypeBadge] || clientTypeBadge.Regular;

  // TACTILE PAPER AESTHETIC - WAITING (warm ivory with soft depth)
  const paperStyle = {
    background: 'linear-gradient(180deg, #FFFDF8 0%, #FDF9F2 100%)',
    backgroundImage: 'radial-gradient(rgba(0,0,0,0.015) 1px, transparent 1px)',
    backgroundSize: '2px 2px',
    boxShadow: `
      inset 0 0.5px 0 rgba(255,255,255,0.7),
      inset 0 -0.8px 1px rgba(0,0,0,0.05),
      0.5px 0.5px 0 rgba(255,255,255,0.8),
      1.5px 2px 2px rgba(0,0,0,0.04),
      3px 6px 8px rgba(0,0,0,0.08)
    `,
    border: 'none',
  };

  // Hover state - tactile lift
  const paperHoverStyle = {
    boxShadow: `
      inset 0 0.5px 0 rgba(255,255,255,0.9),
      0.5px 1px 2px rgba(0,0,0,0.05),
      4px 8px 12px rgba(0,0,0,0.10)
    `,
  };

  // COMPACT VIEW - Very small for high volume
  if (viewMode === 'compact') {
    return (
      <>
      <div
        onClick={() => onClick?.(ticket.id)}
        className="relative cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden"
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
          {/* Row 1: # + Name + Assign + More */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1">
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
              <div className="font-semibold truncate" style={{ color: '#222222', fontSize: '11px', letterSpacing: '0.3px', fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.clientName}>
                {ticket.clientName}
              </div>
            </div>
            
            {/* Assign + More */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                className="p-0.5 rounded bg-white hover:bg-blue-50 active:bg-blue-100 transition-all"
                style={{
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
                title="Assign"
              >
                <UserPlus size={11} className="text-blue-600" strokeWidth={2.5} />
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
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-1.5">
                      <Edit2 size={10} /> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-red-50 flex items-center gap-1.5 text-red-600">
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Service + Time/Duration */}
          <div className="flex items-center justify-between gap-1">
            <div className="truncate" style={{ color: '#555555', fontSize: '10px', fontWeight: 500, fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.service}>
              {ticket.service}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0 text-[9px] font-semibold">
              <div className="flex items-center gap-0.5">
                <Clock size={8} className="text-gray-500" />
                <span style={{ color: '#6B7280', fontSize: '8px', fontWeight: 700 }} title="Time">{ticket.time}</span>
              </div>
              <span style={{ color: '#D1D5DB', fontSize: '8px' }}>•</span>
              <span style={{ color: '#F59E0B', fontSize: '8px', fontWeight: 700 }} title="Wait time">{Math.round(waitProgress)}%</span>
            </div>
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
        <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-25 rounded-b-md overflow-hidden" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5C2E 0px, #8B5C2E 3px, transparent 3px, transparent 6px)' }} />
      </div>
      
      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticket={{
          ...ticket,
          status: 'waiting' as const
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
        className="relative cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] overflow-hidden"
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
          {/* Row 1: Number | Client + Badge + Note | Actions */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <span 
                className="font-bold flex-shrink-0 text-base sm:text-lg"
                style={{ 
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  color: '#222222',
                  lineHeight: 1,
                  letterSpacing: '0.3px',
                  textShadow: '0 0.4px 0 rgba(0,0,0,0.2)',
                  WebkitFontSmoothing: 'antialiased',
                  fontWeight: 600
                }}
              >
                #{ticket.number}
              </span>

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
                <div className="font-bold truncate text-sm sm:text-base" style={{ color: '#222222', letterSpacing: '0.3px', fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
                  {ticket.clientName}
                </div>
                {ticket.clientType !== 'Regular' && (
                  <span className="px-1.5 py-0.5 sm:px-1.5 sm:py-0.5 rounded flex-shrink-0 text-xs sm:text-sm" style={{ backgroundColor: badge.bg, color: badge.text, fontWeight: 700, border: `1px solid ${badge.border}` }}>
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

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                className="p-1.5 sm:p-1.5 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 transition-all"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
                title="Assign"
              >
                <UserPlus className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600" strokeWidth={2.5} />
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 sm:p-1.5 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 transition-all"
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
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center gap-2">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Service | Time + Duration + Wait % */}
          <div className="mt-0.5 sm:mt-1 flex items-center justify-between gap-1.5 sm:gap-2.5" style={{ paddingTop: '3px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="truncate flex-1 text-xs sm:text-sm" style={{ color: '#555555', fontWeight: 500, fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }}>
              {ticket.service}
            </div>

            <div className="flex items-center gap-1 sm:gap-1 flex-shrink-0 text-xs sm:text-sm">
              <div className="flex items-center gap-0.5 sm:gap-0.5">
                <Clock size={10} className="text-gray-500 sm:w-3 sm:h-3" />
                <span style={{ color: '#6B7280', fontWeight: 500 }}>{formatWaitTime(waitTime)}</span>
              </div>
              <span style={{ color: '#D1D5DB' }}>•</span>
              <span className="font-bold" style={{ color: '#F59E0B' }}>{Math.round(waitProgress)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-1.5" style={{ height: '2.5px', background: 'rgba(245,158,11,0.15)', borderRadius: '1px', overflow: 'hidden' }}>
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
        ticket={{
          ...ticket,
          status: 'waiting' as const
        }}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
    );
  }

  // Grid Normal view (NORMAL GRID - larger cards)
  if (viewMode === 'grid-normal') {
  // Paper-like aesthetic with directional lighting
  const paperCardStyle = {
    background: 'linear-gradient(180deg, #fffdf8 0%, #fdf9f2 100%)',
    backgroundImage: 'radial-gradient(rgba(0,0,0,0.015) 1px, transparent 1px)',
    backgroundSize: '2px 2px',
    border: 'none',
    borderRadius: '16px',
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
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = paperCardHoverStyle.boxShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
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
      {/* Paper Ticket Grid View */}
      <div className="flex flex-col h-full" style={{ gap: '10px' }}>
        {/* Header Row: Ticket # + Client Name + Badges + More */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Ticket # pill */}
            <div 
              className="flex-shrink-0"
              style={{
                background: '#fffefb',
                borderRadius: '12px',
                padding: '6px 10px',
                boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.06)',
                fontFamily: 'Inter, -apple-system, "SF Pro Text", sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#222222',
                letterSpacing: '0.3px',
                textShadow: '0 0.4px 0 rgba(0,0,0,0.20)',
                WebkitFontSmoothing: 'antialiased',
              }}
            >
              {ticket.number}
            </div>
            
            {/* Client Name */}
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

        {/* Service Title */}
        <div>
          <div 
            className="truncate"
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
            {ticket.service}
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
      
      {/* Perforation at Bottom Edge - ENHANCED */}
      <div className="absolute bottom-0 left-0 right-0 h-[10px] opacity-30 rounded-b-lg overflow-hidden"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #8B5C2E 0px, #8B5C2E 6px, transparent 6px, transparent 12px)',
        }}
      />
    </div>
    
    {/* Ticket Details Modal */}
    <TicketDetailsModal
      ticket={{
        ...ticket,
        status: 'waiting' as const
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
          <div className="truncate" style={{ color: '#555555', fontSize: '9px', fontWeight: 600, fontFamily: 'Inter, -apple-system, sans-serif', textShadow: '0 0.4px 0 rgba(0,0,0,0.2)', WebkitFontSmoothing: 'antialiased' }} title={ticket.service}>
            {ticket.service}
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
        <div className="flex items-center justify-between text-[9px] mt-auto" style={{ opacity: 0.7 }}>
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
      ticket={{
        ...ticket,
        status: 'waiting' as const
      }}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
    />
  </>
  );
}

  return null;
}
