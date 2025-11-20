/**
 * DaySchedule Component v3.0 - Premium Edition
 * Beautiful calendar grid with premium design system
 * Glass morphism, smooth animations, refined colors
 */

import { memo, useMemo, useEffect, useState } from 'react';
import { LocalAppointment } from '../../types/appointment';
import { colors, calendar } from '../../constants/designSystem';
import { cn } from '../../lib/utils';
import { AppointmentContextMenu } from './AppointmentContextMenu';
import {
  snapToGrid,
  checkDragConflict,
  getConflictColor,
  calculateEndTime
} from '../../utils/dragAndDropHelpers';
import {
  calculateBufferBlocks,
  getBufferTimeStyle
} from '../../utils/bufferTimeUtils';
import { PremiumAvatar, StatusBadge } from '../premium';
import { getStatusColor, getStaffColor } from '../../constants/premiumDesignSystem';
import { staggerDelayStyle } from '../../utils/animations';
import { DayViewSkeleton } from './skeletons';

interface Staff {
  id: string;
  name: string;
  photo?: string;
}

interface DayScheduleProps {
  date: Date;
  staff: Staff[];
  appointments: LocalAppointment[];
  onAppointmentClick: (appointment: LocalAppointment) => void;
  onTimeSlotClick?: (staffId: string, time: Date) => void;
  onAppointmentDrop?: (appointmentId: string, newStaffId: string, newTime: Date) => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
  isLoading?: boolean;
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
 * Get appointment color based on status
 */
function getAppointmentColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return colors.appointment.scheduled;
    case 'checked-in':
      return colors.appointment.checkedIn;
    case 'in-service':
      return colors.appointment.inService;
    case 'completed':
      return colors.appointment.completed;
    case 'cancelled':
      return colors.appointment.cancelled;
    case 'no-show':
      return colors.appointment.noShow;
    default:
      return colors.appointment.scheduled;
  }
}

export const DaySchedule = memo(function DaySchedule({
  staff,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentDrop,
  onStatusChange,
  isLoading = false,
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

  return (
    <div className="flex h-full overflow-auto bg-gray-50 overscroll-contain">
      {/* Time Column */}
      <div 
        className="sticky left-0 z-10 bg-white border-r border-gray-200 flex-shrink-0"
        style={{ width: calendar.timeColumn.width }}
      >
        {/* Header spacer */}
        <div style={{ height: calendar.staffColumn.headerHeight }} className="border-b border-gray-200" />
        
        {/* Time labels - Premium styling */}
        <div className="relative" style={{ height: `${gridHeight}px` }}>
          {timeLabels.map(({ hour, displayHour, period }) => (
            <div
              key={hour}
              className="absolute w-full flex flex-col items-end justify-start pr-3"
              style={{
                top: `${hour * 60}px`,
                height: '60px',
              }}
            >
              {/* Two-line format: hour on first line, am/pm on second */}
              <div className="flex flex-col items-end" style={{ marginTop: '-8px' }}>
                <span className="text-xs text-gray-800 font-semibold leading-tight tabular-nums">
                  {displayHour}
                </span>
                <span className="text-[10px] text-gray-500 uppercase leading-tight tracking-wide">
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
                  'flex flex-col items-center justify-center gap-2',
                  'py-3',
                  'shadow-premium-xs'
                )}
                style={{ height: calendar.staffColumn.headerHeight }}
              >
                {/* Premium Avatar with gradient and status */}
                <PremiumAvatar
                  name={staffMember.name}
                  src={staffMember.photo}
                  size="lg"
                  showStatus
                  status="online"
                  colorIndex={staff.findIndex(s => s.id === staffMember.id)}
                  gradient
                  className="shadow-premium-md"
                />

                {/* Name with better typography */}
                <div className="text-center px-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {staffMember.name}
                  </p>
                  {/* Appointment count */}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {appointmentsByStaff[staffMember.id]?.length || 0} appointments
                  </p>
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

                {/* Clickable time slots with responsive intervals */}
                {onTimeSlotClick && timeLabels.map(({ hour }) => {
                  // Create responsive interval slots (60min mobile, 30min tablet, 15min desktop)
                  return Array.from({ length: slotConfig.intervalsPerHour }, (_, intervalIndex) => {
                    const slotTime = new Date();
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
                          onTimeSlotClick(staffMember.id, snappedTime);
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
                            onAppointmentDrop(draggedAppointment.id, staffMember.id, finalTime);
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
                        title={isDropTarget && slotConflict?.hasConflict ? slotConflict.message : undefined}
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
            top: `calc(${calendar.staffColumn.headerHeight} + ${currentTimePos}px - 4px)`,
            left: `calc(${calendar.timeColumn.width} - 5px)`,
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
      />
    </div>
  );
});
