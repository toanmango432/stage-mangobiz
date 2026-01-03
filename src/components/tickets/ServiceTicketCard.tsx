import { useState, useEffect, memo } from 'react';
import { MoreVertical, Check, Pause, Play, Trash2, StickyNote } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { TicketDetailsModal } from './TicketDetailsModal';

// Service status for individual services within a ticket
type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

// Checkout service type for displaying actual services
interface CheckoutService {
  id: string;
  serviceName: string;
  price: number;
  duration?: number;
  staffId?: string;
  staffName?: string;
}

interface ServiceTicketCardProps {
  ticket: {
    id: string;
    number: number;
    clientName: string;
    clientType: string;
    service: string;
    duration: string;
    time: string;
    status: 'waiting' | 'in-service' | 'completed';
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
    lastVisitDate?: Date | null; // null for first-time clients
    // Service status - determines if ticket is paused
    serviceStatus?: ServiceStatus;
    // Actual services from checkout panel (auto-saved)
    checkoutServices?: CheckoutService[];
  };
  viewMode?: 'compact' | 'normal' | 'grid-normal' | 'grid-compact';
  onComplete?: (ticketId: string) => void;
  onPause?: (ticketId: string) => void;
  onResume?: (ticketId: string) => void;
  onDelete?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
}

function ServiceTicketCardComponent({
  ticket,
  viewMode = 'compact',
  onComplete,
  onPause,
  onResume,
  onDelete,
  onClick
}: ServiceTicketCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Check if ticket is paused
  const isPaused = ticket.serviceStatus === 'paused';

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

  // Format last visit date
  const getLastVisitText = () => {
    if (!ticket.lastVisitDate || ticket.clientType === 'New') {
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


  // LIST COMPACT VIEW - Thermal Receipt Design
  if (viewMode === 'compact') {
    return (
      <>
        <div
          onClick={() => onClick?.(ticket.id)}
          className={`relative overflow-visible transition-all duration-200 ease-out hover:-translate-y-0.5 cursor-pointer ${isPaused ? 'opacity-75' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}${isPaused ? ' (Paused)' : ''}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
          style={{
            background: isPaused
              ? 'linear-gradient(145deg, #FFF8E1 0%, #FFF3CD 50%, #FFECB3 100%)'
              : 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
            border: '1px dashed #D8D8D8',
            borderLeft: isPaused
              ? '3px solid rgba(245, 158, 11, 0.6)'
              : '3px solid rgba(16, 185, 129, 0.28)',
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

          {/* Compact content area */}
          <div className="py-1 px-2.5 pr-12 relative">
            {/* Row 1: Client name + Ticket # + Last visit + Paused badge */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-xs text-[#1a1614] truncate leading-tight">{ticket.clientName}</span>
              {hasStar && <span className="text-2xs">⭐</span>}
              {hasNote && <span className="text-2xs">📋</span>}
              {/* Paused badge */}
              {isPaused && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-semibold rounded bg-amber-100 text-amber-700 border border-amber-300">
                  <Pause size={10} /> PAUSED
                </span>
              )}
              {/* Inline ticket number badge */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs"
                   style={{
                     background: 'rgba(16, 185, 129, 0.12)',
                     border: '1.5px solid rgba(16, 185, 129, 0.35)',
                     color: '#1a1614',
                     boxShadow: '0 1px 2px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                   }}>
                {ticket.number}
              </div>
              <span className="text-2xs text-[#6b5d52] whitespace-nowrap">{getLastVisitText()}</span>
            </div>

            {/* Row 2: Service + Progress + Staff */}
            <div className="flex items-center justify-between gap-1">
              <div className="text-2xs text-[#6b5d52] truncate leading-tight flex-1 min-w-0 flex items-center gap-1">
                <span className="truncate">{serviceDisplay}</span>
                {hasCheckoutServices && serviceCount > 1 && (
                  <span className="flex-shrink-0 text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">
                    ${serviceTotal.toFixed(0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-2xs font-bold whitespace-nowrap" style={{ color: currentStatus.text }}>{Math.round(progress)}%</span>
                {/* Staff badges (max 2) */}
                <div className="flex items-center gap-0.5">
                  {staffList.slice(0, 2).map((staff, i) => (
                    <div key={i} className="text-white text-2xs font-semibold px-1 py-0.5 rounded"
                         style={{ background: getStaffColor(staff), boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)' }}>
                      {getFirstName(staff.name)}
                    </div>
                  ))}
                  {staffList.length > 2 && <span className="text-2xs text-[#6b5d52]">+{staffList.length - 2}</span>}
                </div>
              </div>
            </div>

            {/* Compact action button - Done or Resume based on paused state */}
            {isPaused ? (
              <button
                onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-7 sm:h-7 min-w-[44px] sm:min-w-[28px] min-h-[44px] sm:min-h-[28px] flex items-center justify-center bg-white border-2 border-amber-400 text-amber-600 hover:border-amber-500 hover:text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                title="Resume Service"
              >
                <Play size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-7 sm:h-7 min-w-[44px] sm:min-w-[28px] min-h-[44px] sm:min-h-[28px] flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                title="Mark as Done"
              >
                <Check size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </div>
        <TicketDetailsModal ticketId={parseInt(ticket.id) || ticket.number} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      </>
    );
  }

  // LIST NORMAL VIEW - Thermal Receipt Design
  if (viewMode === 'normal') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)}
           className={`relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer ${isPaused ? 'opacity-75' : ''}`}
           role="button"
           tabIndex={0}
           aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}${isPaused ? ' (Paused)' : ''}`}
           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }}
           style={{
             background: isPaused
               ? 'linear-gradient(145deg, #FFF8E1 0%, #FFF3CD 50%, #FFECB3 100%)'
               : 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
             border: '1px dashed #D8D8D8',
             borderLeft: isPaused
               ? '3px solid rgba(245, 158, 11, 0.6)'
               : '3px solid rgba(16, 185, 129, 0.28)',
             borderRadius: '10px',
             boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)'
           }}>

        {/* Dog-ear corner */}
        <div className="absolute top-0 right-0 w-[6px] h-[6px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

        {/* Perforation dots - barely visible */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
          {[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}
        </div>

        {/* Content area */}
        <div className="py-1.5 px-3">
          {/* Row 1: Client name + Ticket # + Last visit + Paused badge | Time + Progress % + More menu */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-bold text-[#1a1614] truncate text-base leading-tight">{ticket.clientName}</span>
              {hasStar && <span className="text-sm flex-shrink-0">⭐</span>}
              {hasNote && <span className="text-sm flex-shrink-0">📋</span>}
              {/* Paused badge */}
              {isPaused && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-700 border border-amber-300">
                  <Pause size={12} /> PAUSED
                </span>
              )}
              {/* Inline ticket number badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-base"
                   style={{
                     background: isPaused ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                     border: isPaused ? '2px solid rgba(245, 158, 11, 0.35)' : '2px solid rgba(16, 185, 129, 0.35)',
                     color: '#1a1614',
                     boxShadow: isPaused ? '0 1px 3px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)' : '0 1px 3px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                   }}>
                {ticket.number}
              </div>
              <span className="text-2xs text-[#6b5d52] font-medium tracking-wide whitespace-nowrap">{getLastVisitText()}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-[#6b5d52] whitespace-nowrap">{formatTime(timeRemaining)}</span>
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: isPaused ? '#D97706' : currentStatus.text }}>{isPaused ? 'PAUSED' : `${Math.round(progress)}%`}</span>
              {/* More menu */}
              <Tippy
                content={
                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]">
                    {isPaused ? (
                      <button onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                        <Play size={14} /> Resume
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                        <Pause size={14} /> Pause
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <StickyNote size={14} /> Details
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                }
                visible={showMenu}
                onClickOutside={() => setShowMenu(false)}
                interactive={true}
                placement="bottom-end"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="text-[#6b5d52] hover:text-[#2d2520] p-1.5 rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0"
                >
                  <MoreVertical size={18} />
                </button>
              </Tippy>
            </div>
          </div>

          {/* Divider - spans full content width */}
          <div className="border-t border-[#e8dcc8]/50" />

          {/* Row 2: Service + Staff badges + Done/Resume button */}
          <div className="flex items-center justify-between gap-1.5 mt-1">
            <div className="text-sm text-[#1a1614] font-semibold leading-snug flex-1 min-w-0 flex items-center gap-1.5">
              <span className="truncate">{serviceDisplay}</span>
              {hasCheckoutServices && serviceCount > 1 && (
                <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                  ${serviceTotal.toFixed(0)}
                </span>
              )}
            </div>

            {/* Staff badges + Done/Resume button */}
            <div className="relative flex-shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {staffList.map((staff, i) => (
                  <div key={i} className="text-white text-xs font-semibold px-2 py-0.5 rounded-md border border-white/30 tracking-wide"
                       style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>
                    {getFirstName(staff.name)}
                  </div>
                ))}
              </div>
              {isPaused ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }}
                  className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] sm:min-w-[40px] min-h-[44px] sm:min-h-[40px] flex items-center justify-center bg-white border-2 border-amber-400 text-amber-600 hover:border-amber-500 hover:text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                  title="Resume Service"
                >
                  <Play size={22} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                  className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] sm:min-w-[40px] min-h-[44px] sm:min-h-[40px] flex items-center justify-center bg-white border-2 border-gray-300 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}
                  title="Mark as Done"
                >
                  <Check size={22} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
      </div>
      <TicketDetailsModal ticketId={parseInt(ticket.id) || ticket.number} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      </>
    );
  }

  // GRID NORMAL VIEW - Full Reference Design
  if (viewMode === 'grid-normal') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)} className="relative rounded-lg sm:rounded-xl overflow-visible transition-all duration-500 ease-out hover:-translate-y-2 hover:rotate-[0.5deg] flex flex-col min-w-[280px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }} style={{ background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)', border: '2px solid #e8dcc8', boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.70), inset 0 -0.8px 1px rgba(0,0,0,0.05), 0.5px 0.5px 0 rgba(255,255,255,0.80), -3px 0 8px rgba(0,0,0,0.08), 2px 3px 4px rgba(0,0,0,0.04), 4px 8px 12px rgba(0,0,0,0.08)' }}>
        <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-3 sm:px-4 z-10 opacity-25">{[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />))}</div>
        <div className="absolute left-[-6px] sm:left-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-r border-[#d4b896]/50" style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10)' }} />
        {/* Thick paper left edge shadow effect */}
        <div className="absolute top-0 left-0 w-2 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: `linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)`, boxShadow: `inset 0.5px 0 1px rgba(0,0,0,0.04)` }} />
        <div className="absolute top-0 left-1 w-1 h-full" style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.01) 0%, transparent 100%)', boxShadow: 'inset 0.5px 0 0.5px rgba(0,0,0,0.02)' }} />
        <div className="absolute right-[-6px] sm:right-[-8px] top-[50%] w-3 h-3 sm:w-4 sm:h-4 rounded-full border-l border-[#d4b896]/50" style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 2px 0 3px rgba(139, 92, 46, 0.10), -1px 0 3px rgba(0,0,0,0.08)' }} />
        <div className="absolute left-0 top-4 sm:top-5 w-11 sm:w-14 text-[#1a1614] flex items-center justify-center font-black text-lg sm:text-2xl z-20" style={{ height: isFirstVisit ? 'clamp(2.25rem, 5vw, 2.75rem)' : 'clamp(2rem, 4.5vw, 2.5rem)', background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', borderTop: '1.5px solid rgba(212, 184, 150, 0.5)', borderRight: '1.5px solid rgba(212, 184, 150, 0.5)', borderBottom: '1.5px solid rgba(212, 184, 150, 0.5)', boxShadow: `3px 0 8px rgba(139, 92, 46, 0.15), 2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 -2px 3px rgba(139, 92, 46, 0.08), inset -2px 0 2px rgba(255, 255, 255, 0.6)`, letterSpacing: '-0.02em', transform: 'translateX(-4px)' }}>{ticket.number}<div className="absolute top-0 right-0 w-[1.5px] h-full" style={{ background: 'linear-gradient(to bottom, rgba(180, 150, 110, 0.3) 0%, rgba(139, 92, 46, 0.2) 50%, rgba(180, 150, 110, 0.3) 100%)' }} /></div>
        <div className="flex items-start justify-between px-3 sm:px-4 pt-4 sm:pt-5 pb-1 pl-12 sm:pl-14"><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1"><span className="text-base sm:text-lg md:text-xl font-bold text-[#1a1614] truncate tracking-tight">{ticket.clientName}</span>{hasStar && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">⭐</span>}{hasNote && <span className="text-sm sm:text-base md:text-lg flex-shrink-0">📋</span>}</div><div className="text-2xs sm:text-xs text-[#6b5d52] font-medium tracking-wide">{getLastVisitText()}</div></div>
          <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]"><button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Pause size={14} /> Pause</button><button onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><StickyNote size={14} /> Details</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#6b5d52] hover:text-[#2d2520] p-1 sm:p-1.5 rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 -mr-0.5 sm:-mr-1"><MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" /></button></Tippy>
        </div>
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base text-[#1a1614] font-semibold leading-snug tracking-tight flex items-center gap-2">
          <span className="line-clamp-2">{serviceDisplay}</span>
          {hasCheckoutServices && serviceCount > 1 && (
            <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
              ${serviceTotal.toFixed(0)}
            </span>
          )}
        </div>
        <div className="mx-3 sm:px-4 mb-3 sm:mb-4 border-t border-[#e8dcc8]/50" />
        <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex items-center justify-between"><div className="text-xs sm:text-sm text-[#6b5d52] font-medium">{formatTime(timeRemaining)} left</div><div className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: currentStatus.text }}>{Math.round(progress)}%</div></div>
        <div className="px-3 sm:px-4 pb-4 sm:pb-5"><div className="h-2 sm:h-2.5 bg-[#f5f0e8] rounded-full border border-[#e8dcc8]/40 overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}><div className="h-full transition-all duration-300 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)' }} /></div></div>
        <div className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-3 rounded-lg relative" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: `inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)`, border: '1px solid rgba(212, 184, 150, 0.15)' }}><div className="flex items-center flex-wrap gap-1.5 sm:gap-2 pr-11 sm:pr-12">{staffList.map((staff, index) => (<div key={index} className="text-white text-2xs sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide" style={{ background: getStaffColor(staff), boxShadow: `0 3px 6px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>{getFirstName(staff.name)}</div>))}</div>
          <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }} className="absolute top-1/2 right-2 md:right-3 -translate-y-1/2 w-11 h-11 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all" title="Mark as Done"><Check size={20} className="md:w-5 md:h-5" strokeWidth={2} /></button>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay rounded-xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '200px 200px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-15 rounded-xl" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px), repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)`, backgroundSize: '3px 3px' }} />
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)' }} />
      </div>
      <TicketDetailsModal ticketId={parseInt(ticket.id) || ticket.number} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
    </>
    );
  }

  // GRID COMPACT VIEW
  if (viewMode === 'grid-compact') {
    return (
      <>
      <div onClick={() => onClick?.(ticket.id)} className="relative rounded-md sm:rounded-lg overflow-visible transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col min-w-[240px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(ticket.id); } }} style={{ background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)', border: '2px solid #e8dcc8', boxShadow: '-2px 0 6px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 opacity-20">{[...Array(15)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />))}</div>
        <div className="absolute left-[-4px] sm:left-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-r border-[#d4b896]/50" style={{ background: 'linear-gradient(to right, #f8f3eb, #f5f0e8)', boxShadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)' }} />
        {/* Thick paper left edge shadow effect */}
        <div className="absolute top-0 left-0 w-2 h-full" style={{ boxShadow: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)' }} />
        <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-md" style={{ background: 'linear-gradient(to right, rgba(139, 92, 46, 0.03) 0%, rgba(139, 92, 46, 0.02) 20%, transparent 40%)', boxShadow: 'inset 0.5px 0 1px rgba(0,0,0,0.04)' }} />
        <div className="absolute right-[-4px] sm:right-[-5px] top-[50%] w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-l border-[#d4b896]/50" style={{ background: 'linear-gradient(to left, #f8f3eb, #f5f0e8)', boxShadow: 'inset 1px 0 2px rgba(139, 92, 46, 0.10)' }} />
        <div className="absolute left-0 top-2 sm:top-3 w-8 sm:w-9 text-[#1a1614] flex items-center justify-center font-black text-sm sm:text-base z-20" style={{ height: isFirstVisit ? 'clamp(1.65rem, 3.5vw, 2rem)' : 'clamp(1.5rem, 3vw, 1.85rem)', background: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 100%)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', borderTop: '1px solid rgba(212, 184, 150, 0.4)', borderRight: '1px solid rgba(212, 184, 150, 0.4)', borderBottom: '1px solid rgba(212, 184, 150, 0.4)', boxShadow: '2px 0 4px rgba(139, 92, 46, 0.12), 1px 0 2px rgba(139, 92, 46, 0.10), inset 0 1px 0 rgba(255, 255, 255, 1), inset 0 -1px 2px rgba(139, 92, 46, 0.08)', letterSpacing: '-0.02em', transform: 'translateX(-3px)' }}>{ticket.number}</div>
        <div className="flex items-start justify-between px-2 sm:px-3 pt-2 sm:pt-3 pb-1 pl-9 sm:pl-10"><div className="flex-1 min-w-0"><div className="flex items-center gap-1 sm:gap-1.5 mb-0.5"><span className="text-sm sm:text-base font-bold text-[#1a1614] truncate">{ticket.clientName}</span>{hasStar && <span className="text-xs sm:text-sm flex-shrink-0">⭐</span>}{hasNote && <span className="text-xs sm:text-sm flex-shrink-0">📋</span>}</div><div className="text-2xs text-[#6b5d52] font-medium">{getLastVisitText()}</div></div>
          <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]"><button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Pause size={12} /> Pause</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#6b5d52] hover:text-[#2d2520] p-0.5 sm:p-1 rounded-md hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0"><MoreVertical size={14} className="sm:w-4 sm:h-4" /></button></Tippy>
        </div>
        <div className="px-2 sm:px-3 pb-2 sm:pb-3 text-xs sm:text-sm text-[#1a1614] font-semibold flex items-center gap-1">
          <span className="line-clamp-1">{serviceDisplay}</span>
          {hasCheckoutServices && serviceCount > 1 && (
            <span className="flex-shrink-0 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">
              ${serviceTotal.toFixed(0)}
            </span>
          )}
        </div>
        <div className="mx-2 sm:mx-3 mb-2 border-t border-[#e8dcc8]/50" />
        <div className="px-2 sm:px-3 pb-1 flex items-center justify-between"><div className="text-2xs sm:text-xs text-[#6b5d52]">{formatTime(timeRemaining)} left</div><div className="text-base sm:text-lg font-bold" style={{ color: currentStatus.text }}>{Math.round(progress)}%</div></div>
        <div className="px-2 sm:px-3 pb-2 sm:pb-3"><div className="h-1.5 sm:h-2 bg-[#f5f0e8] rounded-full overflow-hidden"><div className="h-full transition-all duration-300 rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress }} /></div></div>
        <div className="mt-auto mx-1.5 sm:mx-2 mb-1.5 sm:mb-2 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-md relative" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08), 0 1px 2px rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 184, 150, 0.15)' }}><div className="flex items-center flex-wrap gap-1 pr-9 sm:pr-10">{staffList.slice(0, 2).map((staff, index) => (<div key={index} className="text-white text-2xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-white/30 tracking-wide" style={{ background: getStaffColor(staff), boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)' }}>{getFirstName(staff.name)}</div>))}{staffList.length > 2 && <span className="text-2xs text-[#6b5d52] font-medium">+{staffList.length - 2}</span>}</div>
          <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }} className="absolute top-1/2 right-1.5 md:right-2 -translate-y-1/2 w-11 h-11 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all" title="Done"><Check size={18} className="md:w-[18px] md:h-[18px]" strokeWidth={2} /></button>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay rounded-lg" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")', backgroundSize: '150px 150px' }} />
        <div className="absolute inset-0 pointer-events-none opacity-10 rounded-lg" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)', backgroundSize: '2px 2px' }} />
      </div>
      <TicketDetailsModal ticketId={parseInt(ticket.id) || ticket.number} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
    </>
    );
  }

  return null;
}

// Export memoized component - only re-renders when ticket data changes
export const ServiceTicketCard = memo(ServiceTicketCardComponent, (prevProps, nextProps) => {
  // Custom comparison - only re-render if ticket data actually changed
  return (
    prevProps.ticket.id === nextProps.ticket.id &&
    prevProps.ticket.number === nextProps.ticket.number &&
    prevProps.ticket.clientName === nextProps.ticket.clientName &&
    prevProps.ticket.service === nextProps.ticket.service &&
    prevProps.ticket.assignedStaff?.length === nextProps.ticket.assignedStaff?.length &&
    prevProps.ticket.serviceStatus === nextProps.ticket.serviceStatus &&
    prevProps.viewMode === nextProps.viewMode
  );
});
