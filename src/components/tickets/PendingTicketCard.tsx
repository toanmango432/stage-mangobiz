import { DollarSign } from 'lucide-react';
import {
  UnpaidWatermark,
} from './pending';
import { PremiumTypography } from '../../constants/premiumDesignTokens';

/**
 * PendingTicket Interface
 *
 * Matches the data structure from uiTicketsSlice.ts PendingTicket type
 */
export interface PendingTicket {
  id: string;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  additionalServices: number;
  subtotal: number;
  tax: number;
  tip: number;
  paymentType: 'card' | 'cash' | 'venmo';
  time: string;
  technician?: string;
  techColor?: string;
  techId?: string;
  // Multi-staff support
  assignedStaff?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  lastVisitDate?: Date | null;
  // When service was marked done (for urgency calculation)
  completedAt?: Date | string;
}

interface PendingTicketCardProps {
  ticket: PendingTicket;
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onMarkPaid: (id: string) => void;
  onClick?: (ticketId: string) => void;
}

/**
 * PendingTicketCard Component
 *
 * Supports 4 view modes matching ServiceTicketCard:
 * - compact: List view, minimal design
 * - normal: List view, full paper design
 * - grid-compact: Grid view, smaller cards
 * - grid-normal: Grid view, full premium design
 */
export function PendingTicketCard({
  ticket,
  viewMode = 'grid-normal',
  onMarkPaid,
  onClick,
}: PendingTicketCardProps) {

  // Helper flags
  const isFirstVisit = !ticket.lastVisitDate || ticket.clientType?.toLowerCase().includes('first');
  const hasStar = ticket.clientType?.toLowerCase().includes('vip');

  // Get staff info - support multiple staff
  const staffList = ticket.assignedStaff || [];

  // Helper to get first name only
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0].toUpperCase();
  };

  // Use exact staff color for badge
  const getStaffColor = (staff: any) => staff.color || '#6B7280';

  // Format last visit date
  const getLastVisitText = () => {
    if (!ticket.lastVisitDate || isFirstVisit) {
      return 'First Visit';
    }

    const now = new Date();
    const lastVisit = new Date(ticket.lastVisitDate);
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  };

  // Calculate total
  const total = ticket.subtotal + ticket.tax + ticket.tip;

  // Payment type is chosen during payment, not displayed on pending tickets

  // ====================
  // COMPACT LIST VIEW
  // ====================
  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => onClick?.(ticket.id)}
        className="relative overflow-visible transition-all duration-200 ease-out hover:-translate-y-0.5 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFEF8 0%, #FFFDF5 50%, #FFFCF0 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.3)',
          borderLeft: '4px solid #B8860B',
          borderRadius: '10px',
          boxShadow: 'inset 0 12px 12px -10px rgba(0,0,0,0.09), inset -2px 0 4px rgba(255,255,255,0.95), inset 2px 0 4px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.05), 0 0 20px rgba(184, 134, 11, 0.25), 0 0 40px rgba(184, 134, 11, 0.15)'
        }}
      >
        {/* UNPAID Watermark */}
        <UnpaidWatermark />

        {/* Dog-ear corner */}
        <div className="absolute top-0 right-0 w-[5px] h-[5px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

        {/* Perforation dots - barely visible */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
          {[...Array(15)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Compact ticket number badge */}
        <div className="absolute left-0 top-1.5 w-7 text-[#1a1614] flex items-center justify-center font-black text-xs z-20"
          style={{
            height: '24px',
            background: 'rgba(184, 134, 11, 0.12)',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            borderTop: '2px solid #B8860B',
            borderRight: '2px solid #B8860B',
            borderBottom: '2px solid #B8860B',
            boxShadow: '2px 0 4px rgba(184, 134, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            letterSpacing: '-0.02em',
            transform: 'translateX(-2px)'
          }}>
          {ticket.number}
        </div>

        {/* Compact content area */}
        <div className="py-1.5 pr-2 pl-9 relative">
          {/* Row 1: Client Name + Total */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#1a1614] truncate leading-tight" style={{ fontSize: 'clamp(13px, 1.7vw, 15px)' }}>{ticket.clientName}</span>
                {hasStar && <span className="text-[10px]">⭐</span>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="font-bold whitespace-nowrap text-[#1a1614]" style={{ fontFamily: PremiumTypography.fontFamily.mono, fontSize: 'clamp(11px, 1.5vw, 13px)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Row 2: Service + Staff + Pay button */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-[#6b5d52] truncate flex-1 leading-tight" style={{ fontSize: 'clamp(12px, 1.6vw, 14px)' }}>{ticket.service}</div>

            <div className="flex-shrink-0 flex items-center gap-1">
              {/* Staff badges */}
              {staffList.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {staffList.slice(0, 1).map((staff, i) => (
                    <div key={i} className="text-white font-semibold px-1.5 py-0.5 rounded border border-white/30"
                      style={{ background: getStaffColor(staff), fontSize: '10px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}>
                      {getFirstName(staff.name)}
                    </div>
                  ))}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
                className="flex items-center justify-center bg-white border border-gray-300 text-gray-600 hover:border-yellow-600 hover:text-white hover:bg-yellow-600 hover:scale-105 active:scale-95 transition-all rounded shadow-sm hover:shadow"
                style={{ width: '24px', height: '24px' }}
                title="Pay"
              >
                <DollarSign size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
      </div>
    );
  }

  // ====================
  // NORMAL LIST VIEW
  // ====================
  if (viewMode === 'normal') {
    return (
      <div
        onClick={() => onClick?.(ticket.id)}
        className="relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFEF8 0%, #FFFDF5 50%, #FFFCF0 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.3)',
          borderLeft: '4px solid #B8860B',
          borderRadius: '10px',
          boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06), 0 0 20px rgba(184, 134, 11, 0.25), 0 0 40px rgba(184, 134, 11, 0.15)'
        }}
      >
        {/* UNPAID Watermark */}
        <UnpaidWatermark />

        {/* Dog-ear corner */}
        <div className="absolute top-0 right-0 w-[7px] h-[7px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

        {/* Perforation dots - barely visible */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
          {[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Wrap-around ticket number badge at Row 1 height */}
        <div className="absolute left-0 top-2 w-9 min-h-[30px] text-[#1a1614] flex items-center justify-center font-black text-sm z-20"
          style={{
            background: 'rgba(184, 134, 11, 0.12)',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            borderTop: '2px solid #B8860B',
            borderRight: '2px solid #B8860B',
            borderBottom: '2px solid #B8860B',
            boxShadow: '2px 0 4px rgba(184, 134, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            letterSpacing: '-0.02em',
            transform: 'translateX(-3px)'
          }}>
          {ticket.number}
        </div>

        {/* Content area */}
        <div className="py-2.5 pr-3 pl-11">
          {/* Row 1: Client name + Total */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-[#1a1614] truncate leading-tight" style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}>{ticket.clientName}</span>
                {hasStar && <span className="text-sm flex-shrink-0">⭐</span>}
              </div>
              <div className="text-[#8b7968] font-medium tracking-wide leading-tight text-xs">{getLastVisitText()}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
              <span className="font-bold whitespace-nowrap text-[#1a1614]" style={{ fontFamily: PremiumTypography.fontFamily.mono, fontSize: 'clamp(14px, 1.75vw, 16px)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Divider - spans full content width */}
          <div className="border-t border-[#e8dcc8]/50 mb-1.5" />

          {/* Row 2: Service + Staff badges + Pay button */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-[#1a1614] font-semibold leading-snug flex-1 min-w-0 truncate text-sm">{ticket.service}</div>

            {/* Staff badges + Pay button */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {staffList.map((staff, i) => (
                  <div key={i} className="text-white font-semibold px-2 py-0.5 rounded border border-white/30 tracking-wide"
                    style={{ background: getStaffColor(staff), fontSize: '11px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)', textShadow: '0 1px 1px rgba(0, 0, 0, 0.25)' }}>
                    {getFirstName(staff.name)}
                  </div>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
                className="flex items-center justify-center bg-white border border-gray-300 text-gray-600 hover:border-yellow-600 hover:text-white hover:bg-yellow-600 hover:scale-105 active:scale-95 transition-all rounded shadow-sm hover:shadow"
                style={{ width: '30px', height: '30px' }}
                title="Pay"
              >
                <DollarSign size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
      </div>
    );
  }

  // ====================
  // GRID COMPACT VIEW
  // ====================
  if (viewMode === 'grid-compact') {
    return (
      <div
        onClick={() => onClick?.(ticket.id)}
        className="relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[5px] hover:shadow-2xl flex flex-col min-w-[220px] max-w-full cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFEF8 0%, #FFFDF5 50%, #FFFCF0 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.3)',
          borderLeft: '4px solid #B8860B',
          borderRadius: '10px',
          boxShadow: 'inset 0 12px 12px -10px rgba(0,0,0,0.09), inset -2px 0 4px rgba(255,255,255,0.95), inset 2px 0 4px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.05), 0 0 20px rgba(184, 134, 11, 0.25), 0 0 40px rgba(184, 134, 11, 0.15)'
        }}
      >
        {/* UNPAID Watermark */}
        <UnpaidWatermark />

        {/* Perforation dots - compact */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-2 z-10" style={{ opacity: 0.108 }}>
          {[...Array(10)].map((_, i) => (<div key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Dog-ear corner - compact size */}
        <div className="absolute top-0 right-0 w-5 h-5 z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

        {/* Ticket number tab - smaller */}
        <div className="absolute left-0 top-1.5 w-7 text-[#1a1614] flex items-center justify-center font-black text-xs z-20"
          style={{
            height: isFirstVisit ? 'clamp(1.4rem, 3vw, 1.6rem)' : 'clamp(1.3rem, 2.8vw, 1.5rem)',
            background: 'rgba(184, 134, 11, 0.12)',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            borderTop: '2px solid #B8860B',
            borderRight: '2px solid #B8860B',
            borderBottom: '2px solid #B8860B',
            boxShadow: '2px 0 4px rgba(184, 134, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            letterSpacing: '-0.02em',
            transform: 'translateX(-2.5px)'
          }}>
          {ticket.number}
        </div>

        {/* Header - more compact */}
        <div className="flex items-start justify-between px-2 pt-1.5 pb-1 pl-7">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#1a1614] truncate">{ticket.clientName}</span>
              {hasStar && <span className="text-[10px] flex-shrink-0">⭐</span>}
            </div>
            <div className="text-2xs text-[#8b7968] font-medium">{getLastVisitText()}</div>
          </div>
        </div>

        {/* Service - compact */}
        <div className="px-2 pb-1.5 text-[11px] text-[#1a1614] font-semibold line-clamp-1">{ticket.service}</div>

        {/* Divider */}
        <div className="mx-2 mb-1.5 border-t border-[#e8dcc8]/50" />

        {/* Total - compact */}
        <div className="px-2 pb-1 flex items-center justify-end">
          <div className="text-sm font-bold text-[#1a1614]" style={{ fontFamily: PremiumTypography.fontFamily.mono }}>
            ${total.toFixed(2)}
          </div>
        </div>

        {/* Staff badges - compact */}
        {staffList.length > 0 && (
          <div className="px-2 pb-1 flex items-center gap-0.5 flex-wrap">
            {staffList.slice(0, 2).map((staff, index) => (
              <div key={index} className="text-white text-2xs font-semibold px-1.5 py-0.5 rounded border border-white/30 tracking-wide"
                style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>
                {getFirstName(staff.name)}
              </div>
            ))}
            {staffList.length > 2 && <span className="text-2xs text-[#8b7968] font-medium">+{staffList.length - 2}</span>}
          </div>
        )}

        {/* Footer - compact with Pay button inside */}
        <div className="mt-auto mx-1 px-1 py-1 rounded-md flex items-center justify-center gap-1"
          style={{
            marginBottom: '4px',
            background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
            boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(212, 184, 150, 0.15)'
          }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
            className="w-full flex items-center justify-center bg-white border border-gray-400 text-gray-600 hover:border-yellow-600 hover:text-white hover:bg-yellow-600 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full"
            style={{
              height: 'clamp(32px, 4.5vw, 40px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(234, 179, 8, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
            title="Pay"
          >
            <DollarSign style={{ width: 'clamp(14px, 2vw, 18px)', height: 'clamp(14px, 2vw, 18px)' }} strokeWidth={2.5} />
          </button>
        </div>

        {/* Paper texture - enhanced for more tangibility */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
      </div>
    );
  }

  // ====================
  // GRID NORMAL VIEW (DEFAULT)
  // ====================
  return (
    <div
      onClick={() => onClick?.(ticket.id)}
      className="relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[6px] hover:shadow-2xl flex flex-col min-w-[240px] sm:min-w-[280px] max-w-full cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(ticket.id);
        }
      }}
      style={{
        background: 'linear-gradient(145deg, #FFFEF8 0%, #FFFDF5 50%, #FFFCF0 100%)',
        border: '1.5px solid rgba(212, 175, 55, 0.3)',
        borderLeft: '4px solid #B8860B',
        borderRadius: '10px',
        boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06), 0 0 20px rgba(184, 134, 11, 0.25), 0 0 40px rgba(184, 134, 11, 0.15)'
      }}
    >
      {/* UNPAID Watermark */}
      <UnpaidWatermark />

      {/* Perforation dots - lightened */}
      <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-2 sm:px-3 md:px-4 z-10" style={{ opacity: 0.108 }}>
        {[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />))}
      </div>

      {/* Dog-ear corner - top-right */}
      <div className="absolute top-0 right-0 w-7 h-7 z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

      {/* Wrap-around number badge */}
      <div
        className="absolute left-0 text-[#1a1614] flex items-center justify-center font-black z-20"
        style={{
          top: 'clamp(12px, 2vw, 20px)',
          width: 'clamp(40px, 5.5vw, 56px)',
          fontSize: 'clamp(16px, 2.25vw, 24px)',
          height: isFirstVisit ? 'clamp(2rem, 4.5vw, 2.75rem)' : 'clamp(1.85rem, 4vw, 2.5rem)',
          background: 'rgba(184, 134, 11, 0.12)',
          borderTopRightRadius: '8px',
          borderBottomRightRadius: '8px',
          borderTop: '2px solid #B8860B',
          borderRight: '2px solid #B8860B',
          borderBottom: '2px solid #B8860B',
          boxShadow: `3px 0 6px rgba(184, 134, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
          letterSpacing: '-0.02em',
          transform: 'translateX(-4px)',
        }}
      >
        {ticket.number}
      </div>

      {/* Header with client info */}
      <div className="flex items-start justify-between px-2 sm:px-3 md:px-4 pb-1" style={{ paddingTop: 'clamp(12px, 2vw, 20px)', paddingLeft: 'clamp(44px, calc(5.5vw + 4px), 60px)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="font-bold text-[#1a1614] truncate tracking-tight" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>{ticket.clientName}</span>
            {hasStar && <span className="text-xs sm:text-sm md:text-base flex-shrink-0">⭐</span>}
          </div>
          <div className="text-[#6b5d52] font-medium tracking-wide" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{getLastVisitText()}</div>
        </div>
      </div>

      {/* Service name */}
      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 text-xs sm:text-sm md:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">{ticket.service}</div>

      {/* Divider */}
      <div className="mx-2 sm:mx-3 md:mx-4 mb-2 sm:mb-3 border-t border-[#e8dcc8]/50" />

      {/* Payment breakdown */}
      <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 space-y-1" style={{ fontFamily: PremiumTypography.fontFamily.mono }}>
        <div className="flex justify-between text-xs sm:text-sm text-[#6b5d52]">
          <span>Subtotal:</span>
          <span>${ticket.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-[#6b5d52]">
          <span>Tax:</span>
          <span>${ticket.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-[#6b5d52]">
          <span>Tip:</span>
          <span>${ticket.tip.toFixed(2)}</span>
        </div>
        <div className="border-t border-[#e8dcc8]/50 pt-1 mt-1" />
        <div className="flex justify-between text-sm sm:text-base md:text-lg font-bold text-[#1a1614]">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Staff badges */}
      {staffList.length > 0 && (
        <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 flex items-center gap-1.5 flex-wrap">
          {staffList.map((staff, index) => (
            <div key={index} className="text-white text-xs sm:text-sm font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-white/30 tracking-wide"
              style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>
              {getFirstName(staff.name)}
            </div>
          ))}
        </div>
      )}

      {/* Footer with Mark Paid button inside */}
      <div className="mt-auto mx-2 sm:mx-3 md:mx-4 mb-2 px-2 py-1.5 rounded-md flex items-center justify-center gap-1.5"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
          boxShadow: `inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)`,
          border: '1px solid rgba(212, 184, 150, 0.15)'
        }}>
        <button
          onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
          className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-400 text-gray-600 hover:border-yellow-600 hover:text-white hover:bg-yellow-600 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full"
          style={{
            height: 'clamp(36px, 5vw, 44px)',
            background: 'linear-gradient(to bottom, #ffffff 0%, #fefefe 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(234, 179, 8, 0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'}
          title="Pay"
        >
          <DollarSign style={{ width: 'clamp(16px, 2.25vw, 20px)', height: 'clamp(16px, 2.25vw, 20px)' }} strokeWidth={2.5} />
          <span style={{ fontSize: 'clamp(12px, 1.6vw, 15px)' }} className="font-bold">Pay</span>
        </button>
      </div>

      {/* Paper texture - enhanced for more tangibility */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
    </div>
  );
}
