import { useState, useEffect } from 'react';
import { MoreVertical, CheckCircle, Pause, Trash2, StickyNote } from 'lucide-react';
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

  // Calculate time remaining
  const durationMinutes = parseInt(ticket.duration) || 30;
  const timeRemaining = Math.max(0, durationMinutes - elapsedTime);
  
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // PROGRESS COLOR SYSTEM (Purple/Green/Red)
  const getStatusColor = (percentage: number) => {
    if (percentage > 100) return { progress: 'linear-gradient(to right, #D9534F, #C9302C)', text: '#C9302C' };
    if (percentage >= 80) return { progress: 'linear-gradient(to right, #5CB85C, #449D44)', text: '#449D44' };
    return { progress: 'linear-gradient(to right, #9B7EAE, #7E5F93)', text: '#7E5F93' };
  };
  const currentStatus = getStatusColor(progress);

  // Helper to get first name only
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0].toUpperCase();
  };

  // Use exact staff color for badge
  const getStaffColor = (staff: any) => staff.color || '#6B7280';

  // Helper flags for reference design
  const isFirstVisit = ticket.clientType === 'New';
  const hasStar = ticket.clientType === 'VIP';
  const hasNote = !!ticket.notes;


  // LIST COMPACT VIEW - With Paper Ticket Design
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => onClick?.(ticket.id)}
          className="relative rounded-md border border-[#d4b896]/40 overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
          style={{ 
            background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
            boxShadow: '0 1px 3px rgba(139, 92, 46, 0.12), 0 2px 4px rgba(139, 92, 46, 0.08)'
          }}
        >
          {/* Perforation dots */}
          <div className="absolute top-0 left-0 w-full h-[3px] flex justify-between items-center px-2 opacity-20">
            {[...Array(12)].map((_, i) => (<div key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-[#c4b5a0]" />))}
          </div>
          
          {/* Left notch */}
          <div className="absolute left-[-3px] top-[50%] w-1.5 h-1.5 rounded-full border-r border-[#d4b896]/50" 
               style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)' }} />
          
          {/* Right notch */}
          <div className="absolute right-[-3px] top-[50%] w-1.5 h-1.5 rounded-full border-l border-[#d4b896]/50"
               style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)' }} />
          
          {/* Paper thickness edge */}
          <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-md" 
               style={{ 
                 background: 'linear-gradient(to right, rgba(139, 92, 46, 0.15) 0%, transparent 100%)',
                 boxShadow: 'inset 1px 0 1px rgba(139, 92, 46, 0.15)'
               }} />
          
          {/* Wrap-around ticket number badge at Row 1 height */}
          <div className="absolute left-0 top-[10px] w-8 h-7 text-[#1a1614] flex items-center justify-center font-black text-xs z-20"
               style={{
                 background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',
                 borderTopRightRadius: '8px',
                 borderBottomRightRadius: '8px',
                 borderTop: '1.5px solid rgba(212, 184, 150, 0.5)',
                 borderRight: '1.5px solid rgba(212, 184, 150, 0.5)',
                 borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)',
                 boxShadow: '2px 0 6px rgba(139, 92, 46, 0.15), 1.5px 0 3px rgba(139, 92, 46, 0.12), 1px 0 1.5px rgba(139, 92, 46, 0.10), inset 0 1.5px 0 rgba(255, 255, 255, 1), inset 0 -1.5px 2px rgba(139, 92, 46, 0.08), inset -1.5px 0 1.5px rgba(255, 255, 255, 0.6)',
                 letterSpacing: '-0.02em',
                 transform: 'translateX(-3px)'
               }}>
            {ticket.number}
            <div className="absolute top-0 right-0 w-[1px] h-full"
                 style={{ background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)' }} />
          </div>

          {/* Content area */}
          <div className="py-2.5 pr-3 pl-9">
            {/* Row 1: Client name + Time/Progress */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-sm text-[#1a1614] truncate">{ticket.clientName}</span>
                    {hasStar && <span className="text-xs flex-shrink-0">⭐</span>}
                    {hasNote && <span className="text-xs flex-shrink-0">📋</span>}
                  </div>
                  {isFirstVisit && (
                    <>
                      <div className="text-[10px] text-[#8b7968] font-medium tracking-wide mb-1">FIRST VISIT</div>
                      <div className="border-t border-[#e8dcc8]/50 mb-2" />
                    </>
                  )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-[#8b7968] whitespace-nowrap">{formatTime(timeRemaining)}</span>
                <div className="w-20 h-1 bg-[#f5f0e8] rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress }} />
                </div>
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: currentStatus.text }}>{Math.round(progress)}%</span>
              </div>
            </div>
            
            {/* Row 2: Service + Staff badges + Done button */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-[#1a1614] font-semibold leading-snug flex-1 truncate">{ticket.service}</div>
              
              {/* Staff badges + Done button with background container */}
              <div className="px-2 py-1.5 rounded-md relative flex-shrink-0"
                   style={{
                     background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                     boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), 0 1px 2px rgba(255, 255, 255, 0.8)',
                     border: '1px solid rgba(212, 184, 150, 0.15)'
                   }}>
                <div className="flex items-center gap-1.5 pr-9">
                  {staffList.slice(0, 3).map((staff, i) => (
                    <div key={i} className="text-white text-[10px] font-semibold px-2 py-0.5 rounded border border-white/30 tracking-wide" 
                         style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)' }}>
                      {getFirstName(staff.name)}
                    </div>
                  ))}
                  {staffList.length > 3 && <span className="text-[10px] text-[#8b7968] font-medium">+{staffList.length - 3}</span>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                  className="absolute top-1/2 right-2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
                  title="Done"
                >
                  <CheckCircle size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Paper textures */}
          <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-md" 
               style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '150px 150px' }} />
          <div className="absolute inset-0 pointer-events-none opacity-10 rounded-md"
               style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />
        </div>
        <TicketDetailsModal ticket={{ ...ticket, status: 'in-service' as const, priority: ticket.priority || 'normal' }} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      </>
    );
  }

  // LIST NORMAL VIEW - With Paper Ticket Design
  if (viewMode === 'normal') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)} 
           className="relative rounded-lg border border-[#d4b896]/40 overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-[0.2deg] cursor-pointer" 
           role="button" 
           tabIndex={0} 
           aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} 
           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
           style={{ 
             background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',
             boxShadow: '0 2px 4px rgba(139, 92, 46, 0.12), 0 4px 6px rgba(139, 92, 46, 0.08)'
           }}>
        
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
        
        {/* Paper thickness edge */}
        <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-lg"
             style={{ 
               background: 'linear-gradient(to right, rgba(139, 92, 46, 0.18) 0%, rgba(139, 92, 46, 0.10) 50%, transparent 100%)',
               boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.20)'
             }} />
        
        {/* Wrap-around ticket number badge at Row 1 height */}
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

        {/* Content area */}
        <div className="py-3 pr-3 pl-10">
          {/* Row 1: Client name + Time/Progress */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#1a1614] truncate text-base">{ticket.clientName}</span>
                  {hasStar && <span className="text-sm flex-shrink-0">⭐</span>}
                  {hasNote && <span className="text-sm flex-shrink-0">📋</span>}
                </div>
                {isFirstVisit && (
                  <>
                    <div className="text-[10px] text-[#8b7968] font-medium tracking-wide mb-1.5">FIRST VISIT</div>
                    <div className="border-t border-[#e8dcc8]/50 mb-2" />
                  </>
                )}
              </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[#8b7968] whitespace-nowrap">{formatTime(timeRemaining)}</span>
              <div className="w-24 h-1.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden"
                   style={{ boxShadow: 'inset 0 1px 1px rgba(139, 92, 46, 0.08)' }}>
                <div className="h-full transition-all duration-300 rounded-full" 
                     style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' }} />
              </div>
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: currentStatus.text }}>{Math.round(progress)}%</span>
            </div>
          </div>
          
          {/* Row 2: Service + Staff badges + Done button */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[#1a1614] font-semibold leading-snug flex-1 truncate">{ticket.service}</div>
            
            {/* Staff badges + Done button with background container */}
            <div className="px-2 py-2 rounded-lg relative flex-shrink-0"
                 style={{
                   background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)',
                   boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(212, 184, 150, 0.15)'
                 }}>
              <div className="flex items-center gap-1.5 pr-11">
                {staffList.map((staff, i) => (
                  <div key={i} className="text-white text-xs font-semibold px-2 py-1 rounded-md border border-white/30 tracking-wide" 
                       style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>
                    {getFirstName(staff.name)}
                  </div>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all flex items-center justify-center"
                title="Done"
              >
                <CheckCircle size={18} strokeWidth={2} />
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
      <TicketDetailsModal ticket={{ ...ticket, status: 'in-service' as const, priority: ticket.priority || 'normal' }} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      </>
    );
  }

  // GRID NORMAL VIEW - Full Reference Design
  if (viewMode === 'grid-normal') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)} className="relative rounded-lg sm:rounded-xl border border-[#d4b896]/40 overflow-visible transition-all duration-500 ease-out hover:-translate-y-2 hover:rotate-[0.5deg] flex flex-col min-w-[280px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }} style={{ background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)', boxShadow: `0 2px 4px rgba(139, 92, 46, 0.12), 0 4px 8px rgba(139, 92, 46, 0.10), 0 8px 16px rgba(139, 92, 46, 0.08), 0 12px 24px rgba(139, 92, 46, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(139, 92, 46, 0.06), inset 3px 0 1px rgba(255, 255, 255, 0.6), -4px 0 8px rgba(139, 92, 46, 0.18), -2px 0 4px rgba(139, 92, 46, 0.15), -1px 0 2px rgba(139, 92, 46, 0.12)` }}>
        <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-3 sm:px-4 z-10 opacity-25">{[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />))}</div>
        <div className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50" style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10), 1px 0 3px rgba(0,0,0,0.08)' }} />
        <div className="absolute right-[-6px] sm:right-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-l border-[#d4b896]/50" style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10), -1px 0 3px rgba(0,0,0,0.08)' }} />
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: `linear-gradient(to right, rgba(139, 92, 46, 0.20) 0%, rgba(139, 92, 46, 0.12) 30%, rgba(180, 150, 110, 0.08) 60%, transparent 100%)`, boxShadow: `inset 2px 0 3px rgba(139, 92, 46, 0.25), inset 1px 0 2px rgba(0, 0, 0, 0.15), -2px 0 4px rgba(139, 92, 46, 0.12), -1px 0 2px rgba(139, 92, 46, 0.10)` }} />
        <div className="absolute top-0 left-1 w-1 h-full" style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.08) 0%, transparent 100%)', boxShadow: 'inset 1px 0 1px rgba(139, 92, 46, 0.10)' }} />
        <div className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20" style={{ height: isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)', background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', borderTop: '1.5px solid rgba(212, 184, 150, 0.5)', borderRight: '1.5px solid rgba(212, 184, 150, 0.5)', borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)', boxShadow: `3px 0 8px rgba(139, 92, 46, 0.15), 2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(139, 92, 46, 0.08), inset -2px 0 2px rgba(255, 255, 255, 0.6)`, letterSpacing: '-0.02em', transform: 'translateX(-4px)' }}>{ticket.number}<div className="absolute top-0 right-0 w-[1.5px] h-full" style={{ background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)' }} /></div>
        <div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14"><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1"><span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">{ticket.clientName}</span>{hasStar && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}{hasNote && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">📋</span>}</div>{isFirstVisit && (<div className="text-[10px] sm:text-xs text-[#8b7968] font-medium tracking-wide">FIRST VISIT</div>)}</div>
          <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]"><button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Pause size={14} /> Pause</button><button onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><StickyNote size={14} /> Details</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#8b7968] hover:text-[#2d2520] p-1 sm:p-1.5 rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 -mr-0.5 sm:-mr-1"><MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" /></button></Tippy>
        </div>
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight line-clamp-2">{ticket.service}</div>
        <div className="mx-3 sm:px-4 mb-3 sm:mb-4 border-t border-[#e8dcc8]/50" />
        <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between"><div className="text-xs sm:text-sm text-[#6b5d52] font-medium">{formatTime(timeRemaining)} left</div><div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: currentStatus.text }}>{Math.round(progress)}%</div></div>
        <div className="px-3 sm:px-4 pb-4 sm:pb-5"><div className="h-2 sm:h-2.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}><div className="h-full transition-all duration-300 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' }} /></div></div>
        <div className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg relative" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: `inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)`, border: '1px solid rgba(212, 184, 150, 0.15)' }}><div className="flex items-center flex-wrap gap-1.5 sm:gap-2 pr-11 sm:pr-12">{staffList.map((staff, index) => (<div key={index} className="text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide" style={{ background: getStaffColor(staff), boxShadow: `0 3px 6px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>{getFirstName(staff.name)}</div>))}</div>
          <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }} className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all" title="Mark as Done"><CheckCircle size={20} className="sm:w-5 sm:h-5" strokeWidth={2} /></button>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '200px 200px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-15 rounded-xl" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px), repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)`, backgroundSize: '3px 3px' }} />
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)' }} />
      </div>
      <TicketDetailsModal ticket={{ ...ticket, status: 'in-service' as const, priority: ticket.priority || 'normal' }} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
    </>
    );
  }

  // GRID COMPACT VIEW
  if (viewMode === 'grid-compact') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)} className="relative rounded-md sm:rounded-lg border border-[#d4b896]/40 overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col min-w-[240px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }} style={{ background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)', boxShadow: '0 2px 6px rgba(139, 92, 46, 0.12), 0 1px 3px rgba(139, 92, 46, 0.10)' }}>
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 opacity-20">{[...Array(15)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}</div>
        <div className="absolute left-[-4px] sm:left-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-r border-[#d4b896]/50" style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)' }} />
        <div className="absolute right-[-4px] sm:right-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-l border-[#d4b896]/50" style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)' }} />
        <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-md" style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.20) 0%, rgba(139, 92, 46, 0.12) 30%, transparent 100%)', boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.25), -1px 0 2px rgba(139, 92, 46, 0.12)' }} />
        <div className="absolute left-0 top-2 sm:top-3 w-8 sm:w-9 text-[#1a1614] flex items-center justify-center font-black text-sm sm:text-base z-20" style={{ height: isFirstVisit ? 'clamp(1.65rem, 3.5vw, 2rem)' : 'clamp(1.5rem, 3vw, 1.85rem)', background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 100%)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', borderTop: '1px solid rgba(212, 184, 150, 0.4)', borderRight: '1px solid rgba(212, 184, 150, 0.4)', borderBottom: '1px solid rgba(212, 184, 150, 0.4)', boxShadow: '2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 2px rgba(139, 92, 46, 0.08)', letterSpacing: '-0.02em', transform: 'translateX(-3px)' }}>{ticket.number}</div>
        <div className="flex items-start justify-between px-2 sm:px-3 pt-2 sm:pt-3 pb-1 pl-9 sm:pl-10"><div className="flex-1 min-w-0"><div className="flex items-center gap-1 sm:gap-1.5 mb-0.5"><span className="text-sm sm:text-base font-bold text-[#1a1614] truncate">{ticket.clientName}</span>{hasStar && <span className="text-xs sm:text-sm flex-shrink-0">⭐</span>}{hasNote && <span className="text-xs sm:text-sm flex-shrink-0">📋</span>}</div>{isFirstVisit && <div className="text-[9px] sm:text-[10px] text-[#8b7968] font-medium">FIRST VISIT</div>}</div>
          <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]"><button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Pause size={12} /> Pause</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#8b7968] hover:text-[#2d2520] p-0.5 sm:p-1 rounded-md hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0"><MoreVertical size={14} className="sm:w-4 sm:h-4" /></button></Tippy>
        </div>
        <div className="px-2 sm:px-3 pb-2 sm:pb-3 text-xs sm:text-sm text-[#1a1614] font-semibold line-clamp-1">{ticket.service}</div>
        <div className="mx-2 sm:mx-3 mb-2 border-t border-[#e8dcc8]/50" />
        <div className="px-2 sm:px-3 pb-1 flex items-center justify-between"><div className="text-[10px] sm:text-xs text-[#6b5d52]">{formatTime(timeRemaining)} left</div><div className="text-base sm:text-lg font-bold" style={{ color: currentStatus.text }}>{Math.round(progress)}%</div></div>
        <div className="px-2 sm:px-3 pb-2 sm:pb-3"><div className="h-1.5 sm:h-2 bg-[#f5f0e8] rounded-full overflow-hidden"><div className="h-full transition-all duration-300 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress }} /></div></div>
        <div className="mt-auto mx-1.5 sm:mx-2 mb-1.5 sm:mb-2 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-md relative" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08), 0 1px 2px rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 184, 150, 0.15)' }}><div className="flex items-center flex-wrap gap-1 pr-9 sm:pr-10">{staffList.slice(0, 2).map((staff, index) => (<div key={index} className="text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-white/30 tracking-wide" style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)' }}>{getFirstName(staff.name)}</div>))}{staffList.length > 2 && <span className="text-[9px] sm:text-[10px] text-[#8b7968] font-medium">+{staffList.length - 2}</span>}</div>
          <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }} className="absolute top-1/2 right-1.5 sm:right-2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all" title="Done"><CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} /></button>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-lg" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '150px 150px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-10 rounded-lg" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />
      </div>
      <TicketDetailsModal ticket={{ ...ticket, status: 'in-service' as const, priority: ticket.priority || 'normal' }} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
    </>
    );
  }

  return null;
}
