import { useState, useEffect, memo } from 'react';
import { Clock, MoreVertical, UserPlus, Edit2, Trash2, StickyNote, ChevronRight, User, Calendar, Tag } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { TicketDetailsModal } from './TicketDetailsModal';
import {
  BasePaperTicket,
  StateIndicator,
  PriorityBadge,
  WaitTimeIndicator,
  paperColors
} from './paper';

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
    createdAt?: Date;
    lastVisitDate?: Date;
  };
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onAssign?: (ticketId: string) => void;
  onEdit?: (ticketId: string) => void;
  onDelete?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
}

function WaitListTicketCardComponent({
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

  // Map view mode to our base component format
  const mapViewMode = (mode: string): 'compact' | 'normal' | 'gridNormal' | 'gridCompact' => {
    switch (mode) {
      case 'grid-normal': return 'gridNormal';
      case 'grid-compact': return 'gridCompact';
      default: return mode as 'compact' | 'normal';
    }
  };

  // Calculate wait time based on createdAt timestamp
  useEffect(() => {
    const updateWaitTime = () => {
      const now = new Date();
      const startTime = ticket.createdAt || new Date(); // Use createdAt if available
      const elapsed = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60)); // minutes
      const expectedWait = 30; // Assume 30 min average wait
      const progress = Math.min((elapsed / expectedWait) * 100, 100);

      setWaitTime(elapsed);
      setWaitProgress(progress);
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

  // Get last visit text similar to service tickets
  const getLastVisitText = () => {
    if (ticket.clientType === 'New') return 'First visit';
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
  const isFirstVisit = ticket.clientType === 'New';

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
        <div className="py-2 pr-3 pl-9">
          {/* Row 1: Client name + Wait time - more compact */}
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[#1a1614] truncate">
                  {ticket.clientName}
                </span>
                {isFirstVisit && <span className="text-[10px]">⭐</span>}
                {hasNote && <StickyNote className="w-2.5 h-2.5 text-amber-500" />}
              </div>
              <div className="text-[9px] text-[#8b7968] mt-0.5 font-medium">
                {getLastVisitText()}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] text-[#6b5d52] font-semibold whitespace-nowrap">Waited {formatWaitTime(waitTime)}</span>
              <span className="text-[9px] text-[#8b7968]">•</span>
              <span className="text-[9px] text-[#6b5d52] whitespace-nowrap">{ticket.time}</span>
            </div>
          </div>

          {/* Row 2: Service + Assign button - more compact */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] text-[#2d2520] font-semibold truncate flex-1">
              {ticket.service}
            </div>

            <div className="px-1.5 py-1 rounded-md relative flex-shrink-0"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                   boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), 0 1px 2px rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(212, 184, 150, 0.15)'
                 }}>
              {/* Assign button */}
              <button
                onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                className="px-2 h-6 flex items-center justify-center gap-1 bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded shadow-sm hover:shadow font-semibold"
                title="Assign"
              >
                <UserPlus size={12} strokeWidth={2.5} />
                <span className="text-[10px]">Assign</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Normal view
    if (viewMode === 'normal') {
      return (
        <div className="py-3 pr-3 pl-10">
          {/* Row 1: Client name + Wait time */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[#1a1614] truncate text-base">{ticket.clientName}</span>
                {isFirstVisit && <span className="text-sm flex-shrink-0">⭐</span>}
                {hasNote && <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
              </div>
              <div className="text-[10px] text-[#8b7968] font-medium tracking-wide mb-1.5">{getLastVisitText()}</div>
              <div className="border-t border-[#e8dcc8]/50 mb-2" />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[#8b7968] whitespace-nowrap">Waited {formatWaitTime(waitTime)}</span>
              <span className="text-xs text-[#8b7968]">•</span>
              <span className="text-xs text-[#6b5d52] whitespace-nowrap">{ticket.time}</span>
            </div>
          </div>

          {/* Row 2: Service + Assign button */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#1a1614] font-semibold leading-snug flex-1 truncate">{ticket.service}</div>

            {/* Assign button with background container */}
            <div className="px-2 py-2 rounded-lg relative flex-shrink-0"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                   boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(212, 184, 150, 0.15)'
                 }}>
              <button
                onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }}
                className="px-3 h-8 flex items-center justify-center gap-1.5 bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded-md shadow-sm hover:shadow-md font-semibold"
                title="Assign"
              >
                <UserPlus size={16} strokeWidth={2.5} />
                <span className="text-xs">Assign</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // GRID COMPACT VIEW - Same design language, more compact
    if (viewMode === 'grid-compact') {
      return (
        <div onClick={() => onClick?.(ticket.id)} className="relative rounded-md overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col min-w-[220px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={handleKeyDown} style={{ background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)', border: '2px solid #e8dcc8', boxShadow: '-2px 0 6px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
          {/* Perforation dots - smaller */}
          <div className="absolute top-0 left-0 w-full h-[3px] flex justify-between items-center px-2 opacity-20">{[...Array(12)].map((_, i) => (<div key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-[#c4b5a0]" />))}</div>

          {/* Left notch hole */}
          <div className="absolute left-[-3px] top-[50%] w-1.5 h-1.5 rounded-full border-r border-[#d4b896]/50" style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)' }} />

          {/* Paper left edge shadow - thinner */}
          <div className="absolute top-0 left-0 w-1.5 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />
          <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-md" style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)', boxShadow: 'inset 0.5px 0 1px rgba(0,0,0,0.04)' }} />

          {/* Right notch hole */}
          <div className="absolute right-[-3px] top-[50%] w-1.5 h-1.5 rounded-full border-l border-[#d4b896]/50" style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)' }} />

          {/* Ticket number tab - smaller */}
          <div className="absolute left-0 top-1.5 w-7 text-[#1a1614] flex items-center justify-center font-black text-xs z-20" style={{ height: isFirstVisit ? 'clamp(1.4rem, 3vw, 1.6rem)' : 'clamp(1.3rem, 2.8vw, 1.5rem)', background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 100%)', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', borderTop: '1px solid rgba(212, 184, 150, 0.4)', borderRight: '1px solid rgba(212, 184, 150, 0.4)', borderBottom: '1px solid rgba(212, 184, 150, 0.4)', boxShadow: '2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 2px rgba(139, 92, 46, 0.08)', letterSpacing: '-0.02em', transform: 'translateX(-2.5px)' }}>{ticket.number}</div>
          <div className="flex items-start justify-between px-2 sm:px-3 pt-2 sm:pt-3 pb-1 pl-9 sm:pl-10"><div className="flex-1 min-w-0"><div className="flex items-center gap-1 sm:gap-1.5 mb-0.5"><span className="text-sm sm:text-base font-bold text-[#1a1614] truncate">{ticket.clientName}</span>{isFirstVisit && <span className="text-xs sm:text-sm flex-shrink-0">⭐</span>}{hasNote && <StickyNote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />}</div><div className="text-[9px] sm:text-[10px] text-[#8b7968] font-medium">{getLastVisitText()}</div></div>
            <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]"><button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Edit2 size={12} /> Edit</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#8b7968] hover:text-[#2d2520] p-0.5 sm:p-1 rounded-md hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0"><MoreVertical size={14} className="sm:w-4 sm:h-4" /></button></Tippy>
          </div>
          {/* Service - compact */}
          <div className="px-2 pb-1.5 text-[11px] text-[#1a1614] font-semibold line-clamp-1">{ticket.service}</div>

          {/* Divider */}
          <div className="mx-2 mb-1.5 border-t border-[#e8dcc8]/50" />

          {/* Wait info - compact */}
          <div className="px-2 pb-1 flex items-center justify-between">
            <div className="text-[9px] text-[#6b5d52]">Waited {formatWaitTime(waitTime)}</div>
            <div className="text-[9px] text-[#6b5d52]">In at {ticket.time}</div>
          </div>

          {/* Footer - compact */}
          <div className="mt-auto mx-1 mb-1 px-1.5 py-1.5 rounded-md relative" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08), 0 1px 2px rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 184, 150, 0.15)' }}>
            <button onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }} className="w-full h-7 flex items-center justify-center gap-1 bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded-md shadow-sm hover:shadow-md font-semibold" title="Assign Staff">
              <UserPlus size={14} strokeWidth={2.5} />
              <span className="text-[11px]">Assign</span>
            </button>
          </div>

          {/* Paper texture */}
          <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-md" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '150px 150px' }} />
          <div className="absolute inset-0 pointer-events-none opacity-10 rounded-md" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />
        </div>
      );
    }

    // GRID NORMAL VIEW - Full Reference Design
    if (viewMode === 'grid-normal') {
      return (
        <div onClick={() => onClick?.(ticket.id)} className="relative rounded-lg sm:rounded-xl overflow-visible transition-all duration-500 ease-out hover:-translate-y-2 hover:rotate-[0.5deg] flex flex-col min-w-[280px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Waiting ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={handleKeyDown} style={{ background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)', border: '2px solid #e8dcc8', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.70), inset 0 -0.8px 1px rgba(0,0,0,0.05), 0.5px 0.5px 0 rgba(255,255,255,0.80), -3px 0 8px rgba(0,0,0,0.08), 2px 3px 4px rgba(0,0,0,0.04), 4px 8px 12px rgba(0,0,0,0.08)' }}>
          <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-3 sm:px-4 z-10 opacity-25">{[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />))}</div>
          <div className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50" style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10)' }} />
          {/* Thick paper left edge shadow effect */}
          <div className="absolute top-0 left-0 w-2 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: `linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)`, boxShadow: `inset 0.5px 0 1px rgba(0,0,0,0.04)` }} />
          <div className="absolute top-0 left-1 w-1 h-full" style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.01) 0%, transparent 100%)', boxShadow: 'inset 0.5px 0 0.5px rgba(0,0,0,0.02)' }} />
          <div className="absolute right-[-6px] sm:right-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-l border-[#d4b896]/50" style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10), -1px 0 3px rgba(0,0,0,0.08)' }} />
          <div className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20" style={{ height: isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)', background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', borderTop: '1.5px solid rgba(212, 184, 150, 0.5)', borderRight: '1.5px solid rgba(212, 184, 150, 0.5)', borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)', boxShadow: `3px 0 8px rgba(139, 92, 46, 0.15), 2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(139, 92, 46, 0.08), inset -2px 0 2px rgba(255, 255, 255, 0.6)`, letterSpacing: '-0.02em', transform: 'translateX(-4px)' }}>{ticket.number}<div className="absolute top-0 right-0 w-[1.5px] h-full" style={{ background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)' }} /></div>
          <div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14"><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1"><span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">{ticket.clientName}</span>{isFirstVisit && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}{hasNote && <StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />}</div><div className="text-[10px] sm:text-xs text-[#8b7968] font-medium tracking-wide">{getLastVisitText()}</div></div>
            <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]"><button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Edit2 size={14} /> Edit</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#8b7968] hover:text-[#2d2520] p-1 sm:p-1.5 rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 -mr-0.5 sm:-mr-1"><MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" /></button></Tippy>
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">{ticket.service}</div>
          <div className="mx-3 sm:px-4 mb-3 sm:mb-4 border-t border-[#e8dcc8]/50" />
          <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between"><div className="text-xs sm:text-sm text-[#6b5d52] font-medium">Waited {formatWaitTime(waitTime)}</div><div className="text-xs sm:text-sm text-[#6b5d52]">In at {ticket.time}</div></div>
          <div className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg relative" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: `inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)`, border: '1px solid rgba(212, 184, 150, 0.15)' }}>
            <button onClick={(e) => { e.stopPropagation(); onAssign?.(ticket.id); }} className="w-full h-10 sm:h-11 flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-white hover:bg-blue-500 transition-all rounded-lg shadow-sm hover:shadow-md font-bold" title="Assign Staff"><UserPlus size={20} className="sm:w-5 sm:h-5" strokeWidth={2.5} /><span className="text-base">Assign</span></button>
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '200px 200px' }} />
          <div className="absolute inset-0 pointer-events-none opacity-15 rounded-xl" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px), repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)`, backgroundSize: '3px 3px' }} />
          <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)' }} />
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
            ticket={ticket}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </>
    );
  }

  // Line/List modes use BasePaperTicket wrapper
  return (
    <>
      <BasePaperTicket
        state="waiting"
        viewMode={mapViewMode(viewMode)}
        ticketNumber={ticket.number}
        onClick={() => onClick?.(ticket.id)}
        onKeyDown={handleKeyDown}
        className=""
      >
        {/* State indicator in corner */}
        <StateIndicator state="waiting" position="top-right" size="small" />

        {/* Priority badge if applicable */}
        {ticket.clientType !== 'Regular' && (
          <PriorityBadge
            priority={ticket.clientType as 'VIP' | 'Priority' | 'New'}
            position="top-left"
          />
        )}

        {/* Main content */}
        {renderContent()}

        {/* Wait time indicator at bottom right */}
        <WaitTimeIndicator minutes={waitTime} position="bottom-right" />
      </BasePaperTicket>

      {showDetailsModal && (
        <TicketDetailsModal
          ticket={ticket}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
}

export const WaitListTicketCard = memo(WaitListTicketCardComponent);