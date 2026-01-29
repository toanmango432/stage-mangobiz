import { useState, useEffect, memo } from 'react';
import { MoreVertical, Check, Pause, Play, Trash2, StickyNote, Edit2 } from 'lucide-react';
import Tippy from '@tippyjs/react';
import { TicketDetailsModal } from './TicketDetailsModal';
import {
  ProgressIndicator,
} from './paper';

// Service status for individual services within a ticket
import type { ServiceStatus } from '@/store/slices/uiTicketsSlice';

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
  onEdit?: (ticketId: string) => void;
  onClick?: (ticketId: string) => void;
  onAddNote?: (ticketId: string, ticketNumber: number, clientName: string, currentNote?: string) => void;
}

function ServiceTicketCardComponent({
  ticket,
  viewMode = 'compact',
  onComplete,
  onPause,
  onResume,
  onDelete,
  onEdit,
  onClick,
  onAddNote: _onAddNote, // Available for use when wiring up the note modal
}: ServiceTicketCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Check if ticket is paused
  const isPaused = ticket.serviceStatus === 'paused';

  /**
   * Calculate total duration from checkoutServices if available.
   * This ensures staff-specific duration overrides (customDuration) are used.
   * Falls back to ticket.duration string for backwards compatibility.
   */
  const getTotalDuration = (): number => {
    // Use checkoutServices if available (each service duration may include staff override)
    if (ticket.checkoutServices && ticket.checkoutServices.length > 0) {
      return ticket.checkoutServices.reduce((total, service) => {
        return total + (service.duration || 0);
      }, 0);
    }
    // Fall back to ticket.duration string (legacy format like "30min" or "30")
    return parseInt(ticket.duration) || 30;
  };

  const totalDurationMinutes = getTotalDuration();

  // Calculate elapsed time and progress
  useEffect(() => {
    if (!ticket.createdAt) return;

    const updateProgress = () => {
      const now = new Date().getTime();
      const start = new Date(ticket.createdAt!).getTime();
      const elapsed = Math.floor((now - start) / 1000 / 60); // minutes
      const durationMinutes = totalDurationMinutes;
      const progressPercent = Math.min((elapsed / durationMinutes) * 100, 100);

      setElapsedTime(elapsed);
      setProgress(progressPercent);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [ticket.createdAt, totalDurationMinutes]);

  // Get staff info - support multiple staff
  // Priority: assignedStaff > assignedTo > technician/techColor
  const staffList = ticket.assignedStaff ||
    (ticket.assignedTo ? [ticket.assignedTo] :
      (ticket.technician ? [{ id: '', name: ticket.technician, color: ticket.techColor || '#6B7280' }] : []));

  // Calculate time remaining using total duration (includes staff overrides from checkoutServices)
  const timeRemaining = Math.max(0, totalDurationMinutes - elapsedTime);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // PROGRESS COLOR SYSTEM (Light Blue/Green/Red)
  // 0-79%: Light Blue, 80-100%: Green, >100%: Red (overdue)
  const getStatusColor = (percentage: number) => {
    if (percentage > 100) return { progress: 'linear-gradient(to right, #D9534F, #C9302C)', text: '#C9302C' };
    if (percentage >= 80) return { progress: 'linear-gradient(to right, #5CB85C, #449D44)', text: '#449D44' };
    return { progress: 'linear-gradient(to right, #60A5FA, #3B82F6)', text: '#3B82F6' };
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
    const visit = new Date(ticket.lastVisitDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - visit.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

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
        <>
          {/* Dog-ear corner - compact size */}
          <div className="absolute top-0 right-0 w-[5px] h-[5px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          <div className="py-1.5 pr-2 pl-9 relative">
            {/* Row 1: Client name + Time Left */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#1a1614] truncate leading-tight" style={{ fontSize: 'clamp(13px, 1.7vw, 15px)' }}>
                    {ticket.clientName}
                  </span>
                  {hasStar && <span className="text-[10px]">⭐</span>}
                  {hasNote && <StickyNote className="w-2.5 h-2.5 text-amber-500" />}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[#4a3d34] font-medium whitespace-nowrap" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{formatTime(timeRemaining)} left</span>
              </div>
            </div>

            {/* Row 2: Service + Staff badges + Done button */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[#2d2520] truncate flex-1 leading-tight flex items-center gap-1.5" style={{ fontSize: 'clamp(12px, 1.6vw, 14px)' }}>
                <span className="truncate">{serviceDisplay}</span>
                {hasCheckoutServices && serviceCount > 1 && (
                  <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                    ${serviceTotal.toFixed(0)}
                  </span>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {staffList.slice(0, 2).map((staff, i) => (
                    <div key={i}
                      className="text-white font-semibold px-1.5 py-0.5 rounded border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide"
                      style={{
                        fontSize: '10px',
                        background: getStaffColor(staff),
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)'
                      }}>
                      {getFirstName(staff.name)}
                    </div>
                  ))}
                  {staffList.length > 2 && <span className="text-[#6b5d52] font-medium text-[10px]">+{staffList.length - 2}</span>}
                </div>

                {/* Done/Resume button - Bug #6 fix */}
                {isPaused ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }}
                    className="flex items-center justify-center bg-white border border-amber-400 text-amber-600 hover:border-amber-500 hover:text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all rounded shadow-sm hover:shadow"
                    style={{ width: '24px', height: '24px' }}
                    title="Resume"
                  >
                    <Play style={{ width: '12px', height: '12px' }} strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                    className="flex items-center justify-center bg-white border border-gray-300 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all rounded shadow-sm hover:shadow"
                    style={{ width: '24px', height: '24px' }}
                    title="Mark as Done"
                  >
                    <Check style={{ width: '12px', height: '12px' }} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Super thin progress line at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#f0e9e0] overflow-hidden" style={{ borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: currentStatus.progress,
                  opacity: 0.8
                }}
              />
            </div>
          </div>

          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </>
      );
    }

    // Normal view
    if (viewMode === 'normal') {
      return (
        <>
          {/* Dog-ear corner - normal size */}
          <div className="absolute top-0 right-0 w-[7px] h-[7px] z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          <div className="py-2.5 pr-3 pl-11">
            {/* Row 1: Client name + Time/Progress */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-[#1a1614] truncate" style={{ fontSize: 'clamp(16px, 2vw, 18px)' }}>{ticket.clientName}</span>
                  {hasStar && <span className="flex-shrink-0 text-xs">⭐</span>}
                  {hasNote && <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </div>
                <div className="text-[#6b5d52] font-medium tracking-wide text-xs">{getLastVisitText()}</div>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 self-start mt-0.5">
                <span className="text-[#4a3d34] font-medium whitespace-nowrap text-xs">{formatTime(timeRemaining)} left</span>

                {/* Progress Bar Component */}
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-[#f5f0e8] border border-[#e8dcc8]/40 overflow-hidden"
                    style={{ borderRadius: '6px', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}>
                    <div className="h-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress, borderRadius: '5px' }} />
                  </div>
                  <span className="font-bold whitespace-nowrap text-xs" style={{ color: currentStatus.text }}>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e8dcc8]/50 mb-1.5" />

            {/* Row 2: Service + Staff badges + Done button */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-[#1a1614] font-semibold leading-snug flex-1 truncate text-sm flex items-center gap-2">
                <span className="truncate">{serviceDisplay}</span>
                {hasCheckoutServices && serviceCount > 1 && (
                  <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                    ${serviceTotal.toFixed(0)}
                  </span>
                )}
              </div>

              {/* Staff badges + Done button */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {staffList.map((staff, i) => (
                    <div key={i} className="text-white font-semibold px-2 py-0.5 rounded border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide"
                      style={{ fontSize: '11px', background: getStaffColor(staff), boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)', textShadow: '0 1px 1px rgba(0, 0, 0, 0.25)' }}>
                      {getFirstName(staff.name)}
                    </div>
                  ))}
                </div>
                {/* Done/Resume button - Bug #6 fix */}
                {isPaused ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }}
                    className="flex items-center justify-center bg-white border border-amber-400 text-amber-600 hover:border-amber-500 hover:text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all rounded shadow-sm hover:shadow"
                    style={{ width: '30px', height: '30px' }}
                    title="Resume"
                  >
                    <Play style={{ width: '16px', height: '16px' }} strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }}
                    className="flex items-center justify-center bg-white border border-gray-300 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all rounded shadow-sm hover:shadow"
                    style={{ width: '30px', height: '30px' }}
                    title="Mark as Done"
                  >
                    <Check style={{ width: '16px', height: '16px' }} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </>
      );
    }

    // GRID COMPACT VIEW - Same design language, more compact
    if (viewMode === 'grid-compact') {
      return (
        <div onClick={() => onClick?.(ticket.id)} className="relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[5px] hover:shadow-2xl flex flex-col min-w-[220px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={handleKeyDown} style={{ background: isPaused ? 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)' : 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)', border: '1px dashed #D8D8D8', borderLeft: isPaused ? '3px solid rgba(245, 158, 11, 0.6)' : '3px solid rgba(16, 185, 129, 0.28)', borderRadius: '10px', boxShadow: 'inset 0 12px 12px -10px rgba(0,0,0,0.09), inset -2px 0 4px rgba(255,255,255,0.95), inset 2px 0 4px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.05)' }}>
          {/* Perforation dots - compact */}
          <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-2 z-10" style={{ opacity: 0.108 }}>{[...Array(10)].map((_, i) => (<div key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-[#c4b5a0]" />))}</div>

          {/* Dog-ear corner - compact size */}
          <div className="absolute top-0 right-0 w-5 h-5 z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />

          {/* Ticket number tab - smaller */}
          <div className="absolute left-0 top-1.5 w-7 text-[#1a1614] flex items-center justify-center font-black text-xs z-20" style={{ height: isFirstVisit ? 'clamp(1.4rem, 3vw, 1.6rem)' : 'clamp(1.3rem, 2.8vw, 1.5rem)', background: 'rgba(16, 185, 129, 0.06)', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', borderTop: '2px solid rgba(16, 185, 129, 0.28)', borderRight: '2px solid rgba(16, 185, 129, 0.28)', borderBottom: '2px solid rgba(16, 185, 129, 0.28)', boxShadow: '2px 0 4px rgba(16, 185, 129, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)', letterSpacing: '-0.02em', transform: 'translateX(-2.5px)' }}>{ticket.number}</div>

          {/* Header - more compact */}
          <div className="flex items-start justify-between px-2 pt-1.5 pb-1 pl-7">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#1a1614] truncate">{ticket.clientName}</span>
                {isPaused && <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-1 py-0.5 rounded flex-shrink-0">PAUSED</span>}
                {hasStar && <span className="text-[10px] flex-shrink-0">⭐</span>}
                {hasNote && <StickyNote className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
              </div>
            </div>
            <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]">{isPaused ? <button onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Play size={12} /> Resume</button> : <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Pause size={12} /> Pause</button>}<button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"><Edit2 size={12} /> Edit</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={12} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end">
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#6b5d52] hover:text-[#2d2520] p-2 min-w-[44px] min-h-[44px] rounded-md hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 flex items-center justify-center">
                <MoreVertical size={16} />
              </button>
            </Tippy>
          </div>

          {/* Service - compact */}
          <div className="px-2 pb-1.5 text-[11px] text-[#1a1614] font-semibold line-clamp-1 flex items-center gap-1">
            <span className="truncate">{serviceDisplay}</span>
            {hasCheckoutServices && serviceCount > 1 && (
              <span className="flex-shrink-0 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-semibold">
                ${serviceTotal.toFixed(0)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="mx-2 mb-1.5 border-t border-[#e8dcc8]/50" />

          {/* Progress info - compact */}
          <div className="px-2 pb-1 flex items-center justify-between">
            <div className="text-[#4a3d34] font-medium" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{formatTime(timeRemaining)} left</div>
            <div className="font-bold tracking-tight" style={{ fontSize: 'clamp(12px, 1.6vw, 14px)', color: currentStatus.text }}>{Math.round(progress)}%</div>
          </div>

          {/* Progress bar - compact (increased height for better visibility) */}
          <div className="px-2 pb-1.5">
            <div className="bg-[#f5f0e8] border border-[#e8dcc8]/40 overflow-hidden" style={{ height: '4px', minHeight: '4px', borderRadius: '6px', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}>
              <div className="h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)', borderRadius: '5px' }} />
            </div>
          </div>

          {/* Footer - compact with Done button inside */}
          <div className="mt-auto mx-1 px-1 py-1 rounded-md flex items-center justify-between gap-1" style={{ marginBottom: '4px', background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: 'inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 184, 150, 0.15)' }}>
            <div className="flex items-center flex-wrap gap-0.5 flex-1 min-w-0">
              {staffList.slice(0, 2).map((staff, index) => (
                <div key={index} className="text-white text-[9px] font-semibold px-1.5 py-0.5 rounded border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide" style={{ background: getStaffColor(staff), boxShadow: '0 2.1px 4.2px rgba(0, 0, 0, 0.126), 0 0.7px 2.1px rgba(0, 0, 0, 0.084), inset 0 1px 0 rgba(255, 255, 255, 0.5)', textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>
                  {getFirstName(staff.name)}
                </div>
              ))}
              {staffList.length > 2 && <span className="text-[9px] text-[#6b5d52] font-medium">+{staffList.length - 2}</span>}
            </div>

            {/* Done/Resume button - inside footer */}
            {isPaused ? (
              <button onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }} className="flex items-center justify-center bg-white border border-amber-400 text-amber-600 hover:border-amber-500 hover:text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0" style={{ width: 'clamp(32px, 4.5vw, 40px)', height: 'clamp(32px, 4.5vw, 40px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.25)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'} title="Resume">
                <Play style={{ width: 'clamp(14px, 2vw, 18px)', height: 'clamp(14px, 2vw, 18px)' }} strokeWidth={2.5} />
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }} className="flex items-center justify-center bg-white border border-gray-400 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0" style={{ width: 'clamp(32px, 4.5vw, 40px)', height: 'clamp(32px, 4.5vw, 40px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.25)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'} title="Mark as Done">
                <Check style={{ width: 'clamp(14px, 2vw, 18px)', height: 'clamp(14px, 2vw, 18px)' }} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Paper texture - enhanced for more tangibility */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
        </div>
      );
    }

    // GRID NORMAL VIEW - Thermal Receipt Design
    if (viewMode === 'grid-normal') {
      return (
        <div onClick={() => onClick?.(ticket.id)} className="relative overflow-visible transition-all duration-300 ease-out hover:-translate-y-[6px] hover:shadow-2xl flex flex-col min-w-[240px] sm:min-w-[280px] max-w-full cursor-pointer" role="button" tabIndex={0} aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`} onKeyDown={handleKeyDown} style={{ background: isPaused ? 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)' : 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)', border: '1px dashed #D8D8D8', borderLeft: isPaused ? '3px solid rgba(245, 158, 11, 0.6)' : '3px solid rgba(16, 185, 129, 0.28)', borderRadius: '10px', boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)' }}>
          {/* Perforation dots - lightened */}
          <div className="absolute top-0 left-0 w-full h-[6px] flex justify-between items-center px-2 sm:px-3 md:px-4 z-10" style={{ opacity: 0.108 }}>{[...Array(20)].map((_, i) => (<div key={i} className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#c4b5a0]" />))}</div>

          {/* Dog-ear corner - top-right */}
          <div className="absolute top-0 right-0 w-7 h-7 z-10" style={{ background: 'linear-gradient(225deg, #FFFDFB 50%, transparent 50%)', boxShadow: '-1px 1px 2px rgba(0,0,0,0.06), -0.5px 0.5px 1px rgba(0,0,0,0.04)', borderRadius: '0 10px 0 0' }} />
          <div className="absolute left-0 text-[#1a1614] flex items-center justify-center font-black z-20" style={{ top: 'clamp(12px, 2vw, 20px)', width: 'clamp(40px, 5.5vw, 56px)', fontSize: 'clamp(16px, 2.25vw, 24px)', height: isFirstVisit ? 'clamp(2rem, 4.5vw, 2.75rem)' : 'clamp(1.85rem, 4vw, 2.5rem)', background: 'rgba(16, 185, 129, 0.06)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', borderTop: '2px solid rgba(16, 185, 129, 0.28)', borderRight: '2px solid rgba(16, 185, 129, 0.28)', borderBottom: '2px solid rgba(16, 185, 129, 0.28)', boxShadow: `3px 0 6px rgba(16, 185, 129, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)`, letterSpacing: '-0.02em', transform: 'translateX(-4px)' }}>{ticket.number}</div>
          <div className="flex items-start justify-between px-2 sm:px-3 md:px-4 pb-1" style={{ paddingTop: 'clamp(12px, 2vw, 20px)', paddingLeft: 'clamp(44px, calc(5.5vw + 4px), 60px)' }}><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1"><span className="font-bold text-[#1a1614] truncate tracking-tight" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>{ticket.clientName}</span>{isPaused && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">PAUSED</span>}{hasStar && <span className="text-xs sm:text-sm md:text-base flex-shrink-0">⭐</span>}{hasNote && <StickyNote className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-500 flex-shrink-0" />}</div><div className="text-[#6b5d52] font-medium tracking-wide" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{getLastVisitText()}</div></div>
            <Tippy content={<div className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]">{isPaused ? <button onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Play size={14} /> Resume</button> : <button onClick={(e) => { e.stopPropagation(); onPause?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Pause size={14} /> Pause</button>}<button onClick={(e) => { e.stopPropagation(); onEdit?.(ticket.id); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><Edit2 size={14} /> Edit</button><button onClick={(e) => { e.stopPropagation(); setShowDetailsModal(true); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"><StickyNote size={14} /> Details</button><button onClick={(e) => { e.stopPropagation(); onDelete?.(ticket.id); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button></div>} visible={showMenu} onClickOutside={() => setShowMenu(false)} interactive={true} placement="bottom-end"><button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="text-[#6b5d52] hover:text-[#2d2520] p-2 sm:p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#f5f0eb]/50 transition-colors flex-shrink-0 flex items-center justify-center"><MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" /></button></Tippy>
          </div>
          {/* Service name */}
          <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 text-xs sm:text-sm md:text-base text-[#1a1614] font-semibold leading-snug tracking-tight flex items-center gap-2">
            <span className="line-clamp-2">{serviceDisplay}</span>
            {hasCheckoutServices && serviceCount > 1 && (
              <span className="flex-shrink-0 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                ${serviceTotal.toFixed(0)}
              </span>
            )}
          </div>

          {/* Divider - moved below service */}
          <div className="mx-2 sm:mx-3 md:mx-4 mb-2 sm:mb-3 border-t border-[#e8dcc8]/50" />

          {/* Progress row - improved text contrast, smaller percentage */}
          <div className="px-2 sm:px-3 md:px-4 pb-1.5 sm:pb-2 flex items-center justify-between"><div className="text-[#4a3d34] font-medium" style={{ fontSize: 'clamp(11px, 1.5vw, 13px)' }}>{formatTime(timeRemaining)} left</div><div className="text-sm sm:text-base md:text-lg font-bold tracking-tight" style={{ color: currentStatus.text }}>{Math.round(progress)}%</div></div>

          {/* Progress bar - smoothed edges (6px radius) */}
          <div className="px-2 sm:px-3 md:px-4 pb-3 sm:pb-4 md:pb-5"><div className="h-1.5 sm:h-2 bg-[#f5f0e8] border border-[#e8dcc8]/40 overflow-hidden" style={{ borderRadius: '6px', boxShadow: 'inset 0 1px 2px rgba(139, 92, 46, 0.08)' }}><div className="h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%`, background: currentStatus.progress, boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5)', borderRadius: '5px' }} /></div></div>
          {/* Staff footer with Done/Resume button inside */}
          <div className="mt-auto mx-2 sm:mx-3 md:mx-4 mb-2 px-2 py-1.5 rounded-md flex items-center justify-between gap-1.5" style={{ background: 'linear-gradient(135deg, rgba(255, 252, 247, 0.6) 0%, rgba(245, 240, 232, 0.5) 100%)', boxShadow: `inset 0 1px 3px rgba(139, 92, 46, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(255, 255, 255, 0.8)`, border: '1px solid rgba(212, 184, 150, 0.15)' }}>
            <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 md:gap-2 flex-1 min-w-0">{staffList.map((staff, index) => (<div key={index} className="text-white text-[9px] sm:text-[10px] md:text-xs font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded sm:rounded-md md:rounded-lg border border-white/30 cursor-pointer hover:scale-105 transition-transform tracking-wide" style={{ background: getStaffColor(staff), boxShadow: `0 2.1px 4.2px rgba(0, 0, 0, 0.126), 0 0.7px 2.1px rgba(0, 0, 0, 0.084), inset 0 1px 0 rgba(255, 255, 255, 0.5)`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>{getFirstName(staff.name)}</div>))}</div>

            {/* Done/Resume button - inside footer */}
            {isPaused ? (
              <button onClick={(e) => { e.stopPropagation(); onResume?.(ticket.id); }} className="flex items-center justify-center bg-white border border-amber-400 text-amber-600 hover:border-amber-500 hover:text-white hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0" style={{ width: 'clamp(36px, 5vw, 44px)', height: 'clamp(36px, 5vw, 44px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.25)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'} title="Resume"><Play style={{ width: 'clamp(16px, 2.25vw, 20px)', height: 'clamp(16px, 2.25vw, 20px)' }} strokeWidth={2.5} /></button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onComplete?.(ticket.id); }} className="flex items-center justify-center bg-white border border-gray-400 text-gray-600 hover:border-green-500 hover:text-white hover:bg-green-500 hover:scale-105 active:scale-95 transition-all duration-250 rounded-full flex-shrink-0" style={{ width: 'clamp(36px, 5vw, 44px)', height: 'clamp(36px, 5vw, 44px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.25)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'} title="Mark as Done"><Check style={{ width: 'clamp(16px, 2.25vw, 20px)', height: 'clamp(16px, 2.25vw, 20px)' }} strokeWidth={2.5} /></button>
            )}
          </div>

          {/* Paper texture - enhanced for more tangibility */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/white-paper.png")', backgroundSize: '200px 200px', borderRadius: '10px', zIndex: 1 }} />
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
            ticketId={parseInt(ticket.id) || ticket.number}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </>
    );
  }

  // Line/List modes use thermal receipt design
  return (
    <>
      <div
        onClick={() => onClick?.(ticket.id)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Service ticket ${ticket.number} for ${ticket.clientName}`}
        className="relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg"
        style={{
          background: 'linear-gradient(145deg, #FFFEFC 0%, #FFFDFB 50%, #FFFCFA 100%)',
          border: '1px dashed #D8D8D8',
          borderLeft: '3px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '10px',
          boxShadow: 'inset 0 15px 15px -12px rgba(0,0,0,0.10), inset -2px 0 5px rgba(255,255,255,0.95), inset 2px 0 5px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)'
        }}
      >
        {/* Perforation dots - barely visible */}
        <div className="absolute top-0 left-0 w-full h-[4px] flex justify-between items-center px-3 z-10" style={{ opacity: 0.108 }}>
          {[...Array(viewMode === 'compact' ? 15 : 20)].map((_, i) => (
            <div key={i} className="w-[2px] h-[2px] rounded-full bg-[#c4b5a0]" />
          ))}
        </div>

        {/* Ticket number badge */}
        <div
          className="absolute left-0 top-2 z-20 text-[#1a1614] flex items-center justify-center font-black"
          style={{
            width: viewMode === 'compact' ? '28px' : '36px',
            height: viewMode === 'compact' ? 'clamp(1.3rem, 2.8vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 1.85rem)',
            fontSize: viewMode === 'compact' ? '11px' : '14px',
            background: 'rgba(16, 185, 129, 0.06)',
            borderTopRightRadius: viewMode === 'compact' ? '6px' : '8px',
            borderBottomRightRadius: viewMode === 'compact' ? '6px' : '8px',
            borderTop: '2px solid rgba(16, 185, 129, 0.28)',
            borderRight: '2px solid rgba(16, 185, 129, 0.28)',
            borderBottom: '2px solid rgba(16, 185, 129, 0.28)',
            boxShadow: '2px 0 4px rgba(16, 185, 129, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
            letterSpacing: '-0.02em',
            transform: viewMode === 'compact' ? 'translateX(-2px)' : 'translateX(-3px)'
          }}
        >
          {ticket.number}
        </div>

        {/* Main content */}
        {renderContent()}

        {/* Progress indicator at bottom */}
        <ProgressIndicator percentage={progress} position="bottom" />
      </div>

      {showDetailsModal && (
        <TicketDetailsModal
          ticketId={parseInt(ticket.id) || ticket.number}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
}

export const ServiceTicketCard = memo(ServiceTicketCardComponent);