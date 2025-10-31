import { useState } from 'react';
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

  // REFINED CLIENT TYPE BADGES (Apple-style subtle colors)
  const clientTypeBadge = {
    VIP: { bg: '#FFF9E6', text: '#8B6914', border: '#E5D4A0', icon: '⭐', accent: '#F59E0B' },
    Priority: { bg: '#FFF1F0', text: '#B91C1C', border: '#FCA5A5', icon: '🔥', accent: '#EF4444' },
    New: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: '✨', accent: '#6366F1' },
    Regular: { bg: '#F9FAFB', text: '#4B5563', border: '#E5E7EB', icon: '👤', accent: '#6B7280' }
  };

  const badge = clientTypeBadge[ticket.clientType as keyof typeof clientTypeBadge] || clientTypeBadge.Regular;

  // REAL PAPER TICKET - VISIBLE TEXTURE & WARMTH
  const paperStyle = {
    // Warm cream paper (like actual ticket stock)
    background: `
      linear-gradient(180deg, #FFF9E8 0%, #FFF4D6 100%)
    `,
    // VISIBLE paper texture
    backgroundImage: `
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
      repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139, 92, 46, 0.02) 1px, rgba(139, 92, 46, 0.02) 2px)
    `,
    // Real paper shadows (warm brown tones)
    boxShadow: `
      0 2px 4px rgba(139, 92, 46, 0.15),
      0 4px 8px rgba(139, 92, 46, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(139, 92, 46, 0.05)
    `,
    // Warm paper edge
    border: '1px solid #D4B896',
  };

  // Hover - paper lifts off surface
  const paperHoverStyle = {
    boxShadow: `
      0 4px 8px rgba(139, 92, 46, 0.18),
      0 8px 16px rgba(139, 92, 46, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.8),
      inset 0 -1px 2px rgba(139, 92, 46, 0.05)
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
              <div className="font-semibold truncate" style={{ color: '#111827', fontSize: '11px', letterSpacing: '-0.2px' }} title={ticket.clientName}>
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
            <div className="truncate" style={{ color: '#6B7280', fontSize: '10px', fontWeight: 500 }} title={ticket.service}>
              {ticket.service}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0 text-[9px] font-semibold">
              <div className="flex items-center gap-0.5">
                <Clock size={8} className="text-gray-500" />
                <span style={{ color: '#6B7280', fontSize: '8px', fontWeight: 700 }} title="Time">{ticket.time}</span>
              </div>
              <span style={{ color: '#D1D5DB', fontSize: '8px' }}>•</span>
              <span style={{ color: '#6B7280', fontSize: '8px', fontWeight: 700 }} title="Duration">{ticket.duration}</span>
            </div>
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
                  fontFamily: 'monospace',
                  color: '#111827',
                  lineHeight: 1,
                  letterSpacing: '-0.5px',
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
                <div className="font-bold truncate text-sm sm:text-base" style={{ color: '#111827', letterSpacing: '-0.2px' }}>
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

          {/* Row 2: Service | Time + Duration */}
          <div className="mt-0.5 sm:mt-1 flex items-center justify-between gap-1.5 sm:gap-2.5" style={{ paddingTop: '3px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="truncate flex-1 text-xs sm:text-sm" style={{ color: '#6B7280', fontWeight: 500 }}>
              {ticket.service}
            </div>

            <div className="flex items-center gap-1 sm:gap-1 flex-shrink-0 text-xs sm:text-sm">
              <div className="flex items-center gap-0.5 sm:gap-0.5">
                <Clock size={10} className="text-gray-500 sm:w-3 sm:h-3" />
                <span style={{ color: '#6B7280', fontWeight: 500 }}>{ticket.time}</span>
              </div>
              <span style={{ color: '#D1D5DB' }}>•</span>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>{ticket.duration}</span>
            </div>
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
  return (
    <>
    <div
      onClick={() => onClick?.(ticket.id)}
      className="relative cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200 overflow-hidden flex flex-col"
      style={{
        ...paperStyle,
        borderRadius: '8px',
        padding: '11px',
        paddingBottom: '9px',
        minHeight: '200px',
      }}
    >
      {/* Normal GRID VIEW - larger cards */}
      <div className="flex flex-col h-full">
        {/* Top Row - Ticket # + Badge + Note + More */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-gray-900" style={{ 
              fontFamily: 'monospace', 
              letterSpacing: '-0.5px'
            }}>
              #{ticket.number}
            </span>
            {ticket.clientType !== 'Regular' && (
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0" style={{ 
                backgroundColor: badge.bg, 
                color: badge.text,
                border: `1px solid ${badge.border}`,
              }}>
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
            className="p-1 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors relative"
            title="More"
          >
            <MoreVertical size={16} className="text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-2 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]">
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
          >
            {ticket.service}
          </div>
        </div>

        {/* Actions Row - Assign button only - COMPACT */}
        <div className="flex items-center justify-end gap-1.5 mb-1 pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
            className="p-1.5 rounded-lg bg-white hover:bg-blue-50 active:bg-blue-100 transition-all flex-shrink-0"
            style={{
              boxShadow: '0 3px 6px rgba(59,130,246,0.2), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.85)',
              border: '1.5px solid rgba(59,130,246,0.2)',
            }}
            title="Assign Staff"
          >
            <UserPlus size={16} className="text-blue-600" strokeWidth={2.5} />
          </button>
        </div>

        {/* Spacer to push metrics to bottom */}
        <div className="flex-grow" />
        
        {/* Time + Duration Row - SUBTLE, FIXED AT BOTTOM */}
        <div className="flex items-center justify-between text-xs mt-auto" style={{ opacity: 0.7 }}>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-gray-400" />
            <span className="text-gray-500 font-medium">{ticket.time}</span>
          </div>
          <span className="text-gray-600 font-semibold">{ticket.duration}</span>
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
          <div className="truncate" style={{ color: '#4B5563', fontSize: '9px', fontWeight: 600 }} title={ticket.service}>
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

        {/* Time + Duration - FIXED AT BOTTOM */}
        <div className="flex items-center justify-between text-[9px] mt-auto" style={{ opacity: 0.7 }}>
          <div className="flex items-center gap-0.5">
            <Clock size={9} className="text-gray-400" />
            <span className="text-gray-500 font-medium">{ticket.time}</span>
          </div>
          <span className="text-gray-600 font-semibold">{ticket.duration}</span>
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
