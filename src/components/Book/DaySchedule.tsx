/**
 * DaySchedule Component v3.0 - Premium Edition
 * Beautiful calendar grid with premium design system
 * Glass morphism, smooth animations, refined colors
 */

import { memo, useMemo, useEffect, useState } from 'react';
import { LocalAppointment } from '../../types/appointment';
import { calendar } from '../../design-system';
import { cn } from '../../lib/utils';
import { AppointmentContextMenu } from './AppointmentContextMenu';
import {
  snapToGrid,
  checkDragConflict,
  getConflictColor,
} from '../../utils/dragAndDropHelpers';
import {
  calculateBufferBlocks,
  getBufferTimeStyle
} from '../../utils/bufferTimeUtils';
import { PremiumAvatar } from '../premium';
import { getStatusColor } from '../../constants/premiumDesignSystem';
import { staggerDelayStyle } from '../../utils/animations';
import { DayViewSkeleton } from './skeletons';
import type { BlockedTimeEntry, BusinessClosedPeriod } from '../../types/schedule';
import { localTimeToUTC } from '../../utils/dateUtils';

interface Staff {
  id: string;
  name: string;
  photo?: string;
}

interface DayScheduleProps {
  date: Date;
  staff: Staff[];
  appointments: LocalAppointment[];
  blockedTimeEntries?: BlockedTimeEntry[];
  /** Business closure for the current date (if any) */
  businessClosure?: BusinessClosedPeriod | null;
  onAppointmentClick: (appointment: LocalAppointment) => void;
  onTimeSlotClick?: (staffId: string, time: Date) => void;
  onAppointmentDrop?: (appointmentId: string, newStaffId: string, newTime: Date) => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
  onBlockedTimeClick?: (entry: BlockedTimeEntry) => void;
  /** Called when user clicks on the closure banner */
  onClosureClick?: (closure: BusinessClosedPeriod) => void;
  isLoading?: boolean;
  // Phase 9: Copy/Paste/Duplicate/Rebook handlers
  onCopyAppointment?: (appointment: LocalAppointment) => void;
  onDuplicateAppointment?: (appointment: LocalAppointment) => void;
  onRebookAppointment?: (appointment: LocalAppointment) => void;
}

/**
 * Generate time labels for the day (12am - 11pm)
 */
function generateTimeLabels(): { hour: number; displayHour: string; period: string }[] {
  const labels = [];
  for (let hour = 0; hour < 24; hour++) {
    const period = hour >= 12 ? 'pm' : 'am';
    let displayHour: string;
    
    if (hour === 0) {
      displayHour = '12:00';
    } else if (hour > 12) {
      displayHour = `${hour - 12}:00`;
    } else {
      displayHour = `${hour}:00`;
    }
    
    labels.push({
      hour,
      displayHour,
      period,
    });
  }
  return labels;
}

/**
 * Get current time position (in pixels from top)
 */
function getCurrentTimePosition(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Start at midnight (0:00)
  const minutesSinceMidnight = hours * 60 + minutes;
  
  // Position calculation for current time indicator
  
  // 60px per hour = 1px per minute
  return minutesSinceMidnight;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get appointment position and height
 */
function getAppointmentStyle(appointment: LocalAppointment) {
  const start = new Date(appointment.scheduledStartTime);
  const end = new Date(appointment.scheduledEndTime);
  
  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const endHour = end.getHours();
  const endMinute = end.getMinutes();
  
  // Calculate position from midnight (0:00)
  const topMinutes = startHour * 60 + startMinute;
  const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
  
  return {
    top: `${topMinutes}px`,
    height: `${durationMinutes}px`,
  };
}

/**
 * Get blocked time entry position and height
 */
function getBlockedTimeStyle(entry: BlockedTimeEntry) {
  const start = new Date(entry.startDateTime);
  const end = new Date(entry.endDateTime);

  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const endHour = end.getHours();
  const endMinute = end.getMinutes();

  const topMinutes = startHour * 60 + startMinute;
  const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);

  return {
    top: `${topMinutes}px`,
    height: `${Math.max(durationMinutes, 30)}px`, // Minimum 30px height
  };
}

/**
 * Format blocked time for display
 */
function formatBlockedTime(entry: BlockedTimeEntry): string {
  const start = new Date(entry.startDateTime);
  const end = new Date(entry.endDateTime);
  const formatT = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  return `${formatT(start)} - ${formatT(end)}`;
}

export const DaySchedule = memo(function DaySchedule({
  date,
  staff,
  appointments,
  blockedTimeEntries = [],
  businessClosure,
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentDrop,
  onStatusChange,
  onBlockedTimeClick,
  onClosureClick,
  isLoading = false,
  onCopyAppointment,
  onDuplicateAppointment,
  onRebookAppointment,
}: DayScheduleProps) {
  const [currentTimePos, setCurrentTimePos] = useState(getCurrentTimePosition());
  const [draggedAppointment, setDraggedAppointment] = useState<LocalAppointment | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ staffId: string; time: Date } | null>(null);
  const [dragConflict, setDragConflict] = useState<{ hasConflict: boolean; conflictType?: string; message?: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ appointment: LocalAppointment; x: number; y: number } | null>(null);
  const timeLabels = useMemo(() => generateTimeLabels(), []);

  // Responsive slot configuration for touch targets
  // Mobile: 60min slots (60px), Tablet: 30min slots (30px), Desktop: 15min slots (15px)
  const [slotConfig, setSlotConfig] = useState({ intervalsPerHour: 4, minutesPerSlot: 15 });
  const [isMobile, setIsMobile] = useState(false);
  const [currentStaffIndex, setCurrentStaffIndex] = useState(0);

  useEffect(() => {
    const updateSlotConfig = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobile(mobile);

      if (mobile) {
        // Mobile: 60-minute slots (meets 44px minimum touch target)
        setSlotConfig({ intervalsPerHour: 1, minutesPerSlot: 60 });
      } else if (width < 1024) {
        // Tablet: 30-minute slots
        setSlotConfig({ intervalsPerHour: 2, minutesPerSlot: 30 });
      } else {
        // Desktop: 15-minute slots (precision)
        setSlotConfig({ intervalsPerHour: 4, minutesPerSlot: 15 });
      }
    };

    updateSlotConfig();
    window.addEventListener('resize', updateSlotConfig);
    return () => window.removeEventListener('resize', updateSlotConfig);
  }, []);
  
  // Calculate grid height (12am to 11pm = 24 hours = 1440px)
  const gridHeight = 24 * 60; // 24 hours * 60px per hour
  
  // Update current time indicator every minute
  useEffect(() => {
    // Update immediately on mount
    const pos = getCurrentTimePosition();
    setCurrentTimePos(pos);
    // Update current time position immediately

    const interval = setInterval(() => {
      const newPos = getCurrentTimePosition();
      setCurrentTimePos(newPos);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []); // No dependencies needed - gridHeight is constant

  // Group appointments by staff
  const appointmentsByStaff = useMemo(() => {
    const grouped: Record<string, LocalAppointment[]> = {};
    staff.forEach(s => {
      grouped[s.id] = [];
    });
    appointments.forEach(apt => {
      if (grouped[apt.staffId]) {
        grouped[apt.staffId].push(apt);
      }
    });
    return grouped;
  }, [staff, appointments]);

  // Group blocked time entries by staff
  const blockedTimeByStaff = useMemo(() => {
    const grouped: Record<string, BlockedTimeEntry[]> = {};
    staff.forEach(s => {
      grouped[s.id] = [];
    });
    blockedTimeEntries.forEach(entry => {
      if (grouped[entry.staffId]) {
        grouped[entry.staffId].push(entry);
      }
    });
    return grouped;
  }, [staff, blockedTimeEntries]);

  // On mobile, show only one staff at a time to prevent horizontal scrolling
  const displayedStaff = useMemo(() => {
    if (isMobile && staff.length > 0) {
      return [staff[Math.min(currentStaffIndex, staff.length - 1)]];
    }
    return staff;
  }, [isMobile, staff, currentStaffIndex]);

  const handlePreviousStaff = () => {
    setCurrentStaffIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextStaff = () => {
    setCurrentStaffIndex((prev) => Math.min(staff.length - 1, prev + 1));
  };

  // Show skeleton during loading
  if (isLoading) {
    return <DayViewSkeleton />;
  }

  // Check if business is closed (full day or partial)
  const isBusinessClosed = !!businessClosure;
  const isPartialClosure = businessClosure?.isPartialDay ?? false;

  // For partial closures, calculate which hours are closed
  const getClosedTimeRange = () => {
    if (!businessClosure?.isPartialDay || !businessClosure.startTime || !businessClosure.endTime) {
      return null;
    }
    const [startHour, startMin] = businessClosure.startTime.split(':').map(Number);
    const [endHour, endMin] = businessClosure.endTime.split(':').map(Number);
    return {
      startMinutes: startHour * 60 + startMin,
      endMinutes: endHour * 60 + endMin,
    };
  };

  const closedTimeRange = getClosedTimeRange();

  return (
    <div className="flex h-full min-h-0 overflow-auto bg-gray-50 overscroll-contain rounded-lg shadow-sm relative">
      {/* Business Closure Banner - Sticky at top */}
      {isBusinessClosed && (
        <button
          onClick={() => businessClosure && onClosureClick?.(businessClosure)}
          className={cn(
            'absolute top-0 left-0 right-0 z-50',
            'flex items-center justify-center gap-3',
            'py-3 px-4',
            'text-white font-medium',
            'shadow-lg',
            'cursor-pointer hover:brightness-110 transition-all',
            'backdrop-blur-sm'
          )}
          style={{
            backgroundColor: businessClosure?.color || '#EF4444',
          }}
        >
          {/* Closed Icon */}
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>

          {/* Closure Info */}
          <div className="text-center">
            <span className="font-semibold">{businessClosure?.name || 'Business Closed'}</span>
            {isPartialClosure && businessClosure?.startTime && businessClosure?.endTime && (
              <span className="ml-2 text-sm opacity-90">
                ({businessClosure.startTime} - {businessClosure.endTime})
              </span>
            )}
          </div>

          {/* Annual badge */}
          {businessClosure?.isAnnual && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              Annual
            </span>
          )}

          {/* Click hint */}
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}

      {/* Time Column */}
      <div
        className="sticky left-0 z-10 bg-white border-r border-gray-200 flex-shrink-0"
        style={{ width: isMobile ? '50px' : calendar.timeColumn.width }}
      >
        {/* Header spacer */}
        <div style={{ height: isMobile ? '60px' : calendar.staffColumn.headerHeight }} className="border-b border-gray-200" />
        
        {/* Time labels - Premium styling */}
        <div className="relative" style={{ height: `${gridHeight}px` }}>
          {timeLabels.map(({ hour, displayHour, period }) => (
            <div
              key={hour}
              className={cn(
                "absolute w-full flex flex-col items-end justify-start",
                isMobile ? "pr-1" : "pr-3"
              )}
              style={{
                top: `${hour * 60}px`,
                height: '60px',
              }}
            >
              {/* Two-line format: hour on first line, am/pm on second */}
              <div className="flex flex-col items-end" style={{ marginTop: '-8px' }}>
                <span className={cn(
                  "text-gray-800 font-semibold leading-tight tabular-nums",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>
                  {isMobile ? displayHour.replace(':00', '') : displayHour}
                </span>
                <span className={cn(
                  "text-gray-500 uppercase leading-tight tracking-wide",
                  isMobile ? "text-[8px]" : "text-[10px]"
                )}>
                  {period}
                </span>
              </div>

              {/* Brand-colored hour marker */}
              <div
                className="absolute left-0 w-1 h-1 bg-brand-400 rounded-full opacity-60"
                style={{ top: '0', left: '-2px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Staff Columns */}
      <div className="flex-1 flex relative">
        {/* Mobile Staff Navigation */}
        {isMobile && staff.length > 1 && (
          <>
            {/* Previous Staff Button */}
            <button
              onClick={handlePreviousStaff}
              disabled={currentStaffIndex === 0}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 z-20',
                'w-10 h-10 rounded-full',
                'bg-white border-2 border-brand-500',
                'flex items-center justify-center',
                'shadow-premium-md',
                'transition-all duration-200',
                currentStaffIndex === 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-brand-50 active:scale-95'
              )}
              aria-label="Previous staff"
            >
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Staff Button */}
            <button
              onClick={handleNextStaff}
              disabled={currentStaffIndex >= staff.length - 1}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 z-20',
                'w-10 h-10 rounded-full',
                'bg-white border-2 border-brand-500',
                'flex items-center justify-center',
                'shadow-premium-md',
                'transition-all duration-200',
                currentStaffIndex >= staff.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-brand-50 active:scale-95'
              )}
              aria-label="Next staff"
            >
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Staff Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-premium-sm border border-gray-200">
              <span className="text-xs font-medium text-gray-700">
                {currentStaffIndex + 1} of {staff.length}
              </span>
            </div>
          </>
        )}

        {staff.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900 mb-1">No staff selected</p>
              <p className="text-sm text-gray-500">Select staff from the sidebar to view their schedules</p>
            </div>
          </div>
        ) : (
          displayedStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="flex-1 border-r border-gray-200 last:border-r-0"
              style={{ minWidth: isMobile ? '100%' : 'min(200px, 40vw)' }}
            >
              {/* Staff Header - Premium Design */}
              <div
                className={cn(
                  'sticky top-0 z-10',
                  'backdrop-blur-md bg-white/95',
                  'border-b border-gray-200/50',
                  'flex items-center justify-center',
                  isMobile ? 'gap-2 py-2 px-2 flex-row' : 'flex-col gap-2 py-3',
                  'shadow-premium-xs'
                )}
                style={{ height: isMobile ? '60px' : calendar.staffColumn.headerHeight }}
              >
                {/* Premium Avatar with gradient and status */}
                <PremiumAvatar
                  name={staffMember.name}
                  src={staffMember.photo}
                  size={isMobile ? "md" : "lg"}
                  showStatus
                  status="online"
                  colorIndex={staff.findIndex(s => s.id === staffMember.id)}
                  gradient
                  className="shadow-premium-md"
                />

                {/* Name with better typography */}
                <div className={cn(
                  "text-center",
                  isMobile ? "flex-1 text-left" : "px-2"
                )}>
                  <p className={cn(
                    "font-semibold text-gray-900 truncate",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {staffMember.name}
                  </p>
                  {/* Appointment count */}
                  {!isMobile && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {appointmentsByStaff[staffMember.id]?.length || 0} appointments
                    </p>
                  )}
                </div>
              </div>

              {/* Time Grid */}
              <div 
                className="relative bg-white"
                style={{ height: `${gridHeight}px` }}
              >
                {/* Hour lines - Subtle, minimal */}
                {timeLabels.map(({ hour }) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-gray-100"
                    style={{
                      top: `${hour * 60}px`,
                      height: '60px',
                    }}
                  />
                ))}

                {/* Alternating row backgrounds - Subtle, minimal */}
                {timeLabels.map(({ hour }, index) => (
                  <div
                    key={`bg-${hour}`}
                    className={cn(
                      'absolute w-full pointer-events-none transition-colors duration-200',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    )}
                    style={{
                      top: `${hour * 60}px`,
                      height: '60px',
                    }}
                  />
                ))}

                {/* Business Closure Overlay - Gray out closed hours */}
                {isBusinessClosed && !isPartialClosure && (
                  <div
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                      backgroundColor: `${businessClosure?.color || '#EF4444'}10`,
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        ${businessClosure?.color || '#EF4444'}08 10px,
                        ${businessClosure?.color || '#EF4444'}08 20px
                      )`,
                    }}
                  />
                )}

                {/* Partial Day Closure Overlay - Gray out specific hours */}
                {isBusinessClosed && isPartialClosure && closedTimeRange && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{
                      top: `${closedTimeRange.startMinutes}px`,
                      height: `${closedTimeRange.endMinutes - closedTimeRange.startMinutes}px`,
                      backgroundColor: `${businessClosure?.color || '#EF4444'}15`,
                      backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        ${businessClosure?.color || '#EF4444'}10 10px,
                        ${businessClosure?.color || '#EF4444'}10 20px
                      )`,
                      borderTop: `2px dashed ${businessClosure?.color || '#EF4444'}40`,
                      borderBottom: `2px dashed ${businessClosure?.color || '#EF4444'}40`,
                    }}
                  >
                    {/* Partial closure label */}
                    <div
                      className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${businessClosure?.color || '#EF4444'}20`,
                        color: businessClosure?.color || '#EF4444',
                      }}
                    >
                      Closed: {businessClosure?.startTime} - {businessClosure?.endTime}
                    </div>
                  </div>
                )}

                {/* Clickable time slots with responsive intervals */}
                {onTimeSlotClick && timeLabels.map(({ hour }) => {
                  // Create responsive interval slots (60min mobile, 30min tablet, 15min desktop)
                  return Array.from({ length: slotConfig.intervalsPerHour }, (_, intervalIndex) => {
                    const slotTime = new Date(date);
                    slotTime.setHours(hour, intervalIndex * slotConfig.minutesPerSlot, 0, 0);
                    const snappedTime = snapToGrid(slotTime);

                    const isDropTarget = dragOverSlot?.staffId === staffMember.id &&
                      dragOverSlot?.time.getHours() === snappedTime.getHours() &&
                      dragOverSlot?.time.getMinutes() === snappedTime.getMinutes();

                    // Check for conflicts if dragging
                    let slotConflict = null;
                    if (draggedAppointment && isDropTarget) {
                      slotConflict = checkDragConflict(
                        draggedAppointment,
                        staffMember.id,
                        snappedTime,
                        appointments
                      );
                    }

                    return (
                      <button
                        key={`slot-${hour}-${intervalIndex}`}
                        onClick={() => {
                          // Convert to timezone-aware UTC for storage
                          const h = snappedTime.getHours();
                          const m = snappedTime.getMinutes();
                          const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                          const utcTime = new Date(localTimeToUTC(date, timeStr));
                          onTimeSlotClick(staffMember.id, utcTime);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          const newSnappedTime = snapToGrid(slotTime);
                          setDragOverSlot({ staffId: staffMember.id, time: newSnappedTime });

                          // Check for conflicts
                          if (draggedAppointment) {
                            const conflict = checkDragConflict(
                              draggedAppointment,
                              staffMember.id,
                              newSnappedTime,
                              appointments
                            );
                            setDragConflict(conflict);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverSlot?.staffId === staffMember.id &&
                              dragOverSlot?.time.getHours() === snappedTime.getHours() &&
                              dragOverSlot?.time.getMinutes() === snappedTime.getMinutes()) {
                            setDragOverSlot(null);
                            setDragConflict(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedAppointment && onAppointmentDrop) {
                            const finalTime = snapToGrid(slotTime);
                            // Convert to timezone-aware UTC for storage
                            const h = finalTime.getHours();
                            const m = finalTime.getMinutes();
                            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                            const utcTime = new Date(localTimeToUTC(date, timeStr));
                            onAppointmentDrop(draggedAppointment.id, staffMember.id, utcTime);
                          }
                          setDragOverSlot(null);
                          setDragConflict(null);
                        }}
                        className={cn(
                          "absolute w-full transition-all duration-200 cursor-pointer",
                          // Focus indicators for accessibility
                          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 focus:z-10",
                          // Active state for press feedback
                          "active:scale-[0.98] active:bg-brand-100",
                          // Drop target states
                          isDropTarget
                            ? slotConflict?.hasConflict
                              ? getConflictColor(slotConflict.conflictType)
                              : "bg-brand-100 border-2 border-dashed border-brand-400"
                            : "hover:bg-brand-50/50",
                          isDropTarget && slotConflict?.hasConflict && "ring-2 ring-red-400"
                        )}
                        style={{
                          top: `${hour * 60 + intervalIndex * slotConfig.minutesPerSlot}px`,
                          height: `${slotConfig.minutesPerSlot}px`,
                        }}
                        title={
                          isDropTarget && slotConflict?.hasConflict
                            ? slotConflict.message
                            : undefined
                        }
                      />
                    );
                  });
                }).flat()}

                {/* Buffer Time Blocks - Visualize buffer times between appointments */}
                {appointmentsByStaff[staffMember.id] && calculateBufferBlocks(
                  appointmentsByStaff[staffMember.id],
                  10 // Default buffer time
                ).map((buffer, index) => {
                  const bufferStart = new Date(buffer.startTime);
                  const bufferEnd = new Date(buffer.endTime);
                  
                  const startHour = bufferStart.getHours();
                  const startMinute = bufferStart.getMinutes();
                  const endHour = bufferEnd.getHours();
                  const endMinute = bufferEnd.getMinutes();
                  
                  const topMinutes = startHour * 60 + startMinute;
                  const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
                  
                  if (durationMinutes <= 0) return null; // Skip invalid buffers
                  
                  return (
                    <div
                      key={`buffer-${staffMember.id}-${index}`}
                      className={cn(
                        'absolute left-2 right-2 rounded opacity-50 pointer-events-none border border-dashed z-0',
                        getBufferTimeStyle(buffer.type)
                      )}
                      style={{
                        top: `${topMinutes}px`,
                        height: `${Math.max(durationMinutes, 5)}px`, // Minimum 5px height
                        minHeight: '5px',
                      }}
                      title={`${buffer.type === 'after' ? 'Buffer after' : buffer.type === 'before' ? 'Buffer before' : 'Gap buffer'}: ${Math.round(durationMinutes)} min`}
                    />
                  );
                })}

                {/* Blocked Time Entries - Visual blocks with type color and emoji */}
                {blockedTimeByStaff[staffMember.id]?.map((entry, index) => {
                  const style = getBlockedTimeStyle(entry);
                  const isRecurring = entry.seriesId !== null;

                  return (
                    <button
                      key={entry.id}
                      onClick={() => onBlockedTimeClick?.(entry)}
                      className={cn(
                        'absolute left-2 right-2',
                        'rounded-lg',
                        'border-2 border-dashed',
                        'text-left p-2',
                        'overflow-hidden',
                        'group cursor-pointer',
                        'transition-all duration-200',
                        'hover:shadow-md hover:scale-[1.01] hover:z-10',
                        'animate-fade-in',
                        'z-5'
                      )}
                      style={{
                        ...style,
                        backgroundColor: `${entry.typeColor}15`,
                        borderColor: `${entry.typeColor}60`,
                        ...staggerDelayStyle(index, 30),
                      }}
                      title={`${entry.typeName}${isRecurring ? ' (recurring)' : ''}`}
                    >
                      {/* Emoji and Type Info */}
                      <div className="flex items-start gap-2">
                        <span
                          className="text-lg flex-shrink-0"
                          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
                        >
                          {entry.typeEmoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: entry.typeColor }}
                          >
                            {entry.typeName}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {formatBlockedTime(entry)}
                          </p>
                          {isRecurring && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="text-[10px] text-gray-400">Recurring</span>
                            </div>
                          )}
                          {entry.notes && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Paid indicator badge */}
                      {entry.isPaid && (
                        <div
                          className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                          style={{ backgroundColor: `${entry.typeColor}30`, color: entry.typeColor }}
                        >
                          Paid
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Appointments - Premium Design with stagger animations */}
                {appointmentsByStaff[staffMember.id]?.map((appointment, index) => {
                  const style = getAppointmentStyle(appointment);
                  const statusColors = getStatusColor(appointment.status);

                  return (
                    <button
                      key={appointment.id}
                      draggable={onAppointmentDrop !== undefined}
                      onClick={() => onAppointmentClick(appointment)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          appointment,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onDragStart={(e) => {
                        setDraggedAppointment(appointment);
                        e.dataTransfer.effectAllowed = 'move';
                        // Create ghost image
                        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                        dragImage.style.opacity = '0.8';
                        dragImage.style.transform = 'rotate(2deg)';
                        dragImage.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        document.body.appendChild(dragImage);
                        dragImage.style.position = 'absolute';
                        dragImage.style.top = '-1000px';
                        e.dataTransfer.setDragImage(dragImage, e.clientX - e.currentTarget.getBoundingClientRect().left, e.clientY - e.currentTarget.getBoundingClientRect().top);
                        setTimeout(() => document.body.removeChild(dragImage), 0);
                        e.currentTarget.style.opacity = '0.5';
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }}
                      onDragEnd={(e) => {
                        setDraggedAppointment(null);
                        setDragOverSlot(null);
                        setDragConflict(null);
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      className={cn(
                        'absolute left-2 right-2',
                        'rounded-lg',
                        'border border-gray-200/60',
                        'bg-white',
                        'text-left p-2.5',
                        'overflow-hidden',
                        'group cursor-move',
                        'transition-all duration-200',
                        'hover:shadow-md hover:scale-[1.02] hover:z-10',
                        'hover:border-gray-300',
                        'active:ring-2 active:ring-brand-400 active:ring-offset-2',
                        'animate-fade-in',
                        draggedAppointment?.id === appointment.id && 'opacity-50 scale-95 rotate-2',
                        draggedAppointment?.id === appointment.id && dragConflict?.hasConflict && 'ring-2 ring-red-400'
                      )}
                      style={{
                        ...style,
                        ...staggerDelayStyle(index, 30),
                        minHeight: '60px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                      }}
                    >
                      {/* Status indicator - Enhanced left border */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                        style={{ backgroundColor: statusColors.accent }}
                      />

                      {/* Content - Redesigned hierarchy */}
                      <div className="space-y-0.5 pl-2">
                        {/* Time - Most prominent */}
                        <p className="text-sm font-semibold text-gray-900">
                          {formatTime(new Date(appointment.scheduledStartTime))}
                        </p>

                        {/* Client name - Important */}
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {appointment.clientName}
                        </p>

                        {/* Service & Price - Supporting info */}
                        {appointment.services[0] && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="truncate">{appointment.services[0].serviceName}</span>
                            {appointment.services[0]?.price && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-gray-700">
                                  ${appointment.services[0].price}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hover menu indicator */}
                      <div
                        className={cn(
                          'absolute top-2 right-2',
                          'w-6 h-6 rounded-full',
                          'bg-gray-100',
                          'flex items-center justify-center',
                          'opacity-0 group-hover:opacity-100',
                          'transition-opacity duration-200'
                        )}
                      >
                        <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 4 16">
                          <circle cx="2" cy="2" r="2" />
                          <circle cx="2" cy="8" r="2" />
                          <circle cx="2" cy="14" r="2" />
                        </svg>
                      </div>
                    </button>
                  );
                })}

                {/* Conflict Warning Tooltip */}
                {dragConflict?.hasConflict && dragOverSlot?.staffId === staffMember.id && (
                  <div
                    className="absolute z-40 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
                    style={{
                      top: `${(dragOverSlot.time.getHours() * 60 + dragOverSlot.time.getMinutes()) - 25}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {dragConflict.message}
                  </div>
                )}

                {/* Current Time Indicator - Premium design */}
                {currentTimePos >= 0 && currentTimePos <= gridHeight && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-30"
                    style={{
                      top: `${currentTimePos}px`,
                    }}
                  >
                    {/* Animated dot on the left */}
                    <div
                      className={cn(
                        'absolute -left-1 top-1/2 -translate-y-1/2',
                        'w-3 h-3 rounded-full',
                        'bg-brand-500 shadow-premium-md',
                        'animate-pulse-slow',
                        'ring-4 ring-brand-100'
                      )}
                    />

                    {/* Line with gradient and glow */}
                    <div
                      className={cn(
                        'w-full h-0.5',
                        'bg-gradient-to-r from-brand-500 to-brand-400',
                        'shadow-premium-sm'
                      )}
                      style={{
                        boxShadow: '0 0 8px rgba(42, 167, 158, 0.4)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Current Time Dot - On time column */}
      {currentTimePos >= 0 && currentTimePos <= gridHeight && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            top: `calc(${isMobile ? '60px' : calendar.staffColumn.headerHeight} + ${currentTimePos}px - 4px)`,
            left: `calc(${isMobile ? '50px' : calendar.timeColumn.width} - 5px)`,
          }}
        >
          <div
            className="rounded-full animate-pulse shadow-md"
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)',
            }}
          />
        </div>
      )}

      {/* Context Menu */}
      <AppointmentContextMenu
        appointment={contextMenu?.appointment || null}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        onClose={() => setContextMenu(null)}
        onCheckIn={(apt) => onStatusChange?.(apt.id, 'checked-in')}
        onStartService={(apt) => onStatusChange?.(apt.id, 'in-service')}
        onComplete={(apt) => onStatusChange?.(apt.id, 'completed')}
        onEdit={(apt) => onAppointmentClick(apt)}
        onReschedule={(apt) => onAppointmentClick(apt)}
        onCancel={(apt) => onStatusChange?.(apt.id, 'cancelled')}
        onNoShow={(apt) => onStatusChange?.(apt.id, 'no-show')}
        onCopy={onCopyAppointment}
        onDuplicate={onDuplicateAppointment}
        onRebook={onRebookAppointment}
      />
    </div>
  );
});
