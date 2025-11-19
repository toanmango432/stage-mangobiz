import { useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import {
  UnpaidWatermark,
  TicketHeader,
  ClientInfo,
  PriceBreakdown,
  PaymentFooter,
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
  lastVisitDate?: Date | null;
}

interface PendingTicketCardProps {
  ticket: PendingTicket;
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onMarkPaid: (id: string) => void;
  onCancel?: (id: string) => void;
  isMenuOpen: boolean;
  onOpenMenu: (id: string, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
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
  onCancel,
  isMenuOpen,
  onOpenMenu,
  onCloseMenu,
  onClick,
}: PendingTicketCardProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper flags
  const isFirstVisit = !ticket.lastVisitDate || ticket.clientType?.toLowerCase().includes('first');
  const hasStar = ticket.clientType?.toLowerCase().includes('vip');

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
        className="relative rounded border border-[#d4b896]/40 overflow-visible transition-all duration-200 ease-out hover:-translate-y-0.5 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
          boxShadow: '0 1px 2px rgba(139, 92, 46, 0.08), 0 1px 3px rgba(139, 92, 46, 0.06)'
        }}
      >
        {/* Minimal perforation dots */}
        <div className="absolute top-0 left-0 w-full h-[2px] flex justify-between items-center px-1.5 opacity-15">
          {[...Array(8)].map((_, i) => (<div key={i} className="w-[1px] h-[1px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Minimal left edge shadow */}
        <div className="absolute top-0 left-0 w-1 h-full" style={{ boxShadow: 'inset 2px 0 3px rgba(0,0,0,0.15)' }} />

        {/* Compact ticket number badge */}
        <div className="absolute left-0 top-[6px] w-6 h-5 text-[#1a1614] flex items-center justify-center font-black text-2xs z-20"
             style={{
               background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 100%)',
               borderTopRightRadius: '6px',
               borderBottomRightRadius: '6px',
               borderTop: '1px solid rgba(212, 184, 150, 0.4)',
               borderRight: '1px solid rgba(212, 184, 150, 0.4)',
               borderBottom: '1px solid rgba(212, 184, 150, 0.4)',
               boxShadow: '1px 0 3px rgba(139, 92, 46, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1)',
               letterSpacing: '-0.02em',
               transform: 'translateX(-2px)'
             }}>
          {ticket.number}
        </div>

        {/* Compact content area */}
        <div className="py-1.5 pr-12 pl-7 relative">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Client + Service */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="font-semibold text-xs text-[#1a1614] truncate">{ticket.clientName}</span>
                {hasStar && <span className="text-2xs">⭐</span>}
              </div>
              <div className="text-2xs text-[#6b5d52] truncate">{ticket.service}</div>
            </div>

            {/* Right: Total */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="text-sm font-bold text-[#1a1614]" style={{ fontFamily: PremiumTypography.fontFamily.mono }}>
                ${total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Compact Mark Paid button */}
          <button
            onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 md:w-8 md:h-8 rounded-full bg-white border border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
            title="Mark as Paid"
          >
            <CheckCircle size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={2} />
          </button>
        </div>

        {/* Paper textures */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-md"
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '150px 150px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-10 rounded-md"
             style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />
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
        className="relative rounded-lg border border-[#d4b896]/40 overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-[0.2deg] cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
          boxShadow: '0 2px 4px rgba(139, 92, 46, 0.12), 0 4px 6px rgba(139, 92, 46, 0.08)'
        }}
      >
        {/* Perforation dots */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 opacity-20">
          {[...Array(15)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Left notch */}
        <div className="absolute left-[-4px] top-[50%] w-2 h-2 rounded-full border-r border-[#d4b896]/50"
             style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)' }} />

        {/* Right notch */}
        <div className="absolute right-[-4px] top-[50%] w-2 h-2 rounded-full border-l border-[#d4b896]/50"
             style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)' }} />

        {/* Thick paper left edge shadow effect */}
        <div className="absolute top-0 left-0 w-2 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />

        {/* Paper thickness edge */}
        <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-lg"
             style={{
               background: 'linear-gradient(to right, rgba(139, 92, 46, 0.18) 0%, rgba(139, 92, 46, 0.10) 50%, transparent 100%)',
               boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.20)'
             }} />

        {/* Wrap-around ticket number badge */}
        <div className="absolute left-0 top-[12px] w-9 h-8 text-[#1a1614] flex items-center justify-center font-black text-sm z-20"
             style={{
               background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
               borderTopRightRadius: '9px',
               borderBottomRightRadius: '9px',
               borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
               borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
               borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
               boxShadow: '2.5px 0 7px rgba(139, 92, 46, 0.15), 1.5px 0 3.5px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 -2px 2.5px rgba(139, 92, 46, 0.08), inset -1.5px 0 1.5px rgba(255, 255, 255, 0.6)',
               letterSpacing: '-0.02em',
               transform: 'translateX(-3px)'
             }}>
          {ticket.number}
          <div className="absolute top-0 right-0 w-[1.2px] h-full"
               style={{ background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)' }} />
        </div>

        {/* UNPAID watermark */}
        <UnpaidWatermark />

        {/* Content area */}
        <div className="py-1.5 pr-2.5 pl-8">
          {/* Row 1: Client name + Total */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-[#1a1614] truncate text-base">{ticket.clientName}</span>
                {hasStar && <span className="text-sm flex-shrink-0">⭐</span>}
              </div>
              <div className="text-2xs text-[#8b7968] font-medium tracking-wide mb-0.5">{getLastVisitText()}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-lg font-bold text-[#1a1614]" style={{ fontFamily: PremiumTypography.fontFamily.mono }}>
                ${total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#e8dcc8]/50 my-1" />

          {/* Row 2: Service + Mark Paid button */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#1a1614] font-semibold leading-snug flex-1 truncate">{ticket.service}</div>

            {/* Mark Paid button container */}
            <div className="px-2 py-1 rounded-lg relative flex-shrink-0"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                   boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(212, 184, 150, 0.15)'
                 }}>
              <div className="pr-14 md:pr-11">
                {/* Empty space for button positioning */}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
                className="absolute top-1/2 right-2 -translate-y-1/2 w-11 h-11 md:w-8 md:h-8 rounded-full bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
                title="Mark as Paid"
              >
                <CheckCircle size={18} className="md:w-[18px] md:h-[18px]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Paper textures */}
        <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-lg"
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '180px 180px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-12 rounded-lg"
             style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />
        <div className="absolute inset-0 pointer-events-none rounded-lg"
             style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.3)' }} />
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
        className="relative rounded-md sm:rounded-lg overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col min-w-[240px] max-w-full cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`Pending payment ticket ${ticket.number} for ${ticket.clientName}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
        style={{
          background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
          border: '2px solid #e8dcc8',
          boxShadow: '-2px 0 6px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {/* Perforation dots */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 opacity-20">
          {[...Array(15)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Left notch */}
        <div className="absolute left-[-4px] sm:left-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-r border-[#d4b896]/50"
             style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)' }} />

        {/* Right notch */}
        <div className="absolute right-[-4px] sm:right-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-l border-[#d4b896]/50"
             style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)' }} />

        {/* Edge shadows */}
        <div className="absolute top-0 left-0 w-2 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />
        <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-md"
             style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)', boxShadow: 'inset 0.5px 0 1px rgba(0,0,0,0.04)' }} />

        {/* Number badge */}
        <div className="absolute left-0 top-2 sm:top-3 w-8 sm:w-9 text-[#1a1614] flex items-center justify-center font-black text-sm sm:text-base z-20"
             style={{
               height: isFirstVisit ? 'clamp(1.65rem, 3.5vw, 2rem)' : 'clamp(1.5rem, 3vw, 1.85rem)',
               background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 100%)',
               borderTopRightRadius: '8px',
               borderBottomRightRadius: '8px',
               borderTop: '1px solid rgba(212, 184, 150, 0.4)',
               borderRight: '1px solid rgba(212, 184, 150, 0.4)',
               borderBottom: '1px solid rgba(212, 184, 150, 0.4)',
               boxShadow: '2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 2px rgba(139, 92, 46, 0.08)',
               letterSpacing: '-0.02em',
               transform: 'translateX(-3px)'
             }}>
          {ticket.number}
        </div>

        <UnpaidWatermark />

        {/* Content */}
        <div className="flex items-start justify-between px-2 sm:px-3 pt-2 sm:pt-3 pb-1 pl-9 sm:pl-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
              <span className="text-sm sm:text-base font-bold text-[#1a1614] truncate">{ticket.clientName}</span>
              {hasStar && <span className="text-xs sm:text-sm flex-shrink-0">⭐</span>}
            </div>
            <div className="text-2xs text-[#8b7968] font-medium">{getLastVisitText()}</div>
          </div>
        </div>

        <div className="px-2 sm:px-3 pb-2 sm:pb-3 text-xs sm:text-sm text-[#1a1614] font-semibold line-clamp-1">{ticket.service}</div>
        <div className="mx-2 sm:mx-3 mb-2 border-t border-[#e8dcc8]/50" />

        <div className="px-2 sm:px-3 pb-1 flex items-center justify-end">
          <div className="text-base sm:text-lg font-bold" style={{ fontFamily: PremiumTypography.fontFamily.mono }}>
            ${total.toFixed(2)}
          </div>
        </div>

        <div className="mt-auto mx-1.5 sm:mx-2 mb-1.5 sm:mb-2 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-md relative"
             style={{
               background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
               boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08), 0 1px 2px rgba(255, 255, 255, 0.8)',
               border: '1px solid rgba(212, 184, 150, 0.15)'
             }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMarkPaid(ticket.id); }}
            className="absolute top-1/2 right-1.5 md:right-2 -translate-y-1/2 w-11 h-11 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all"
            title="Mark as Paid"
          >
            <CheckCircle size={18} className="md:w-[18px] md:h-[18px]" strokeWidth={2} />
          </button>
        </div>

        {/* Textures */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-lg"
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '150px 150px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-10 rounded-lg"
             style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />

        <style>{`
          @keyframes amberGlow {
            0%, 100% { border-color: #F59E0B; }
            50% { border-color: #FCD34D; }
          }
        `}</style>
      </div>
    );
  }

  // ====================
  // GRID NORMAL VIEW (DEFAULT)
  // ====================
  return (
    <div
      onClick={() => onClick?.(ticket.id)}
      className="relative rounded-xl overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-[0.5deg] flex flex-col min-w-[280px] max-w-full cursor-pointer"
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
        background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
        border: '2px solid #F59E0B',
        boxShadow: `
          inset 0 0.5px 0 rgba(255,255,255,0.70),
          inset 0 -0.8px 1px rgba(0,0,0,0.05),
          0.5px 0.5px 0 rgba(255,255,255,0.80),
          -3px 0 8px rgba(0,0,0,0.08),
          2px 3px 4px rgba(0,0,0,0.04),
          4px 8px 12px rgba(0,0,0,0.08),
          0 0 0 1px rgba(245, 158, 11, 0.1)
        `,
        animation: 'amberGlow 3s ease-in-out infinite',
      }}
    >
      {/* Perforation dots */}
      <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10 opacity-25">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#c4b5a0]" />
        ))}
      </div>

      {/* Left notch */}
      <div
        className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50"
        style={{
          background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
          boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10), 1px 0 3px rgba(0,0,0,0.08)',
        }}
      />

      {/* Right notch */}
      <div
        className="absolute right-[-6px] sm:right-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-l border-[#d4b896]/50"
        style={{
          background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',
          boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10), -1px 0 3px rgba(0,0,0,0.08)',
        }}
      />

      {/* Edge shadows - 3 layers */}
      <div className="absolute top-0 left-0 w-2 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{
          background: 'linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)',
          boxShadow: 'inset 0.5px 0 1px rgba(0,0,0,0.04)',
        }}
      />
      <div className="absolute top-0 left-1 w-1 h-full"
        style={{
          background: 'linear-gradient(to right, rgba(139, 92, 46, 0.01) 0%, transparent 100%)',
          boxShadow: 'inset 0.5px 0 0.5px rgba(0,0,0,0.02)',
        }}
      />

      {/* Wrap-around number badge */}
      <div
        className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20"
        style={{
          height: isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
          borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
          borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
          borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
          boxShadow: `
            3px 0 8px rgba(139, 92, 46, 0.15),
            2px 0 4px rgba(139, 92, 46, 0.12),
            1px 0 2px rgba(139, 92, 46, 0.10),
            inset 0 2px 0 rgba(255, 255, 255, 1),
            inset 0 -2px 3px rgba(139, 92, 46, 0.08),
            inset -2px 0 2px rgba(255, 255, 255, 0.6)
          `,
          letterSpacing: '-0.02em',
          transform: 'translateX(-4px)',
        }}
      >
        {ticket.number}
        <div
          className="absolute top-0 right-0 w-[1.5px] h-full"
          style={{
            background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)',
          }}
        />
      </div>

      <UnpaidWatermark />

      <div className="pl-12 sm:pl-14">
        <TicketHeader
          ticketId={ticket.id}
          isMenuOpen={isMenuOpen}
          onOpenMenu={onOpenMenu}
          onCloseMenu={onCloseMenu}
          dropdownRef={dropdownRef}
        />
      </div>

      <ClientInfo
        clientName={ticket.clientName}
        clientType={ticket.clientType}
        service={ticket.service}
        additionalServices={ticket.additionalServices}
        lastVisitDate={ticket.lastVisitDate}
      />

      <div className="mx-3 sm:px-4 mb-3 sm:mb-4 border-t border-[#e8dcc8]/50" />

      <PriceBreakdown
        subtotal={ticket.subtotal}
        tax={ticket.tax}
        tip={ticket.tip}
      />

      <PaymentFooter
        ticketId={ticket.id}
        onMarkPaid={onMarkPaid}
        onCancel={onCancel}
      />

      {/* Paper textures */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
          backgroundSize: '200px 200px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-15 rounded-xl"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
            repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
          `,
          backgroundSize: '3px 3px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)' }}
      />

      {/* Amber glow animation */}
      <style>{`
        @keyframes amberGlow {
          0%, 100% {
            border-color: #F59E0B;
            box-shadow:
              inset 0 0.5px 0 rgba(255,255,255,0.70),
              inset 0 -0.8px 1px rgba(0,0,0,0.05),
              0.5px 0.5px 0 rgba(255,255,255,0.80),
              -3px 0 8px rgba(0,0,0,0.08),
              2px 3px 4px rgba(0,0,0,0.04),
              4px 8px 12px rgba(0,0,0,0.08),
              0 0 0 1px rgba(245, 158, 11, 0.1);
          }
          50% {
            border-color: #FCD34D;
            box-shadow:
              inset 0 0.5px 0 rgba(255,255,255,0.70),
              inset 0 -0.8px 1px rgba(0,0,0,0.05),
              0.5px 0.5px 0 rgba(255,255,255,0.80),
              -3px 0 8px rgba(0,0,0,0.08),
              2px 3px 4px rgba(0,0,0,0.04),
              4px 8px 12px rgba(0,0,0,0.08),
              0 0 0 2px rgba(245, 158, 11, 0.2),
              0 0 8px rgba(245, 158, 11, 0.15);
          }
        }
      `}</style>
    </div>
  );
}
