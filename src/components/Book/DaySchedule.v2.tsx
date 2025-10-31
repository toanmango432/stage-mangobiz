/**
 * DaySchedule Component v2.0
 * Fresha's layout + Mango's refined colors
 * Professional, clean, feature-rich
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
}: DayScheduleProps) {
  const [currentTimePos, setCurrentTimePos] = useState(getCurrentTimePosition());
  const [draggedAppointment, setDraggedAppointment] = useState<LocalAppointment | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ staffId: string; time: Date } | null>(null);
  const [dragConflict, setDragConflict] = useState<{ hasConflict: boolean; conflictType?: string; message?: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ appointment: LocalAppointment; x: number; y: number } | null>(null);
  const timeLabels = useMemo(() => generateTimeLabels(), []);
  
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
  }, [gridHeight]);

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

  return (
    <div className="flex h-full overflow-auto bg-gray-50 overscroll-contain">
      {/* Time Column */}
      <div 
        className="sticky left-0 z-10 bg-white border-r border-gray-200 flex-shrink-0"
        style={{ width: calendar.timeColumn.width }}
      >
        {/* Header spacer */}
        <div style={{ height: calendar.staffColumn.headerHeight }} className="border-b border-gray-200" />
        
        {/* Time labels */}
        <div className="relative" style={{ height: `${gridHeight}px` }}>
          {timeLabels.map(({ hour, displayHour, period }) => (
            <div
              key={hour}
              className="absolute w-full flex flex-col items-end justify-start pr-2"
              style={{
                top: `${hour * 60}px`,
                height: '60px',
              }}
            >
              {/* Two-line format: hour on first line, am/pm on second */}
              <div className="flex flex-col items-end" style={{ marginTop: '-8px' }}>
                <span className="text-xs text-gray-700 font-medium leading-tight">
                  {displayHour}
                </span>
                <span className="text-[10px] text-gray-500 uppercase leading-tight">
                  {period}
                </span>
              </div>
              
              {/* Pink hour marker (optional - Mango style) */}
              <div 
                className="absolute left-0 w-1 h-1 bg-pink-400 rounded-full"
                style={{ top: '0', left: '-2px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Staff Columns */}
      <div className="flex-1 flex">
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
          staff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="flex-1 border-r border-gray-200 last:border-r-0"
              style={{ minWidth: 'min(200px, 40vw)' }}
            >
              {/* Staff Header */}
              <div 
                className="sticky top-0 z-10 bg-white border-b border-gray-200 flex flex-col items-center justify-center"
                style={{ height: calendar.staffColumn.headerHeight }}
              >
                {/* Avatar */}
                <div className="relative mb-1 sm:mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg shadow-md">
                    {staffMember.photo ? (
                      <img 
                        src={staffMember.photo} 
                        alt={staffMember.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      staffMember.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {/* Status dot */}
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                
                {/* Name */}
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate px-2">
                  {staffMember.name}
                </p>
              </div>

              {/* Time Grid */}
              <div 
                className="relative bg-white"
                style={{ height: `${gridHeight}px` }}
              >
                {/* Hour lines */}
                {timeLabels.map(({ hour }) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-gray-200"
                    style={{
                      top: `${hour * 60}px`,
                      height: '60px',
                    }}
                  >
                    {/* 15-minute sub-lines (very subtle) */}
                    <div className="absolute w-full border-t border-gray-100" style={{ top: '15px' }} />
                    <div className="absolute w-full border-t border-gray-100" style={{ top: '30px' }} />
                    <div className="absolute w-full border-t border-gray-100" style={{ top: '45px' }} />
                  </div>
                ))}

                {/* Alternating row backgrounds */}
                {timeLabels.map(({ hour }, index) => (
                  <div
                    key={`bg-${hour}`}
                    className={cn(
                      'absolute w-full pointer-events-none',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                    )}
                    style={{
                      top: `${hour * 60}px`,
                      height: '60px',
                    }}
                  />
                ))}

                {/* Clickable time slots with 15-minute intervals */}
                {onTimeSlotClick && timeLabels.map(({ hour }) => {
                  // Create 15-minute interval slots
                  return Array.from({ length: 4 }, (_, intervalIndex) => {
                    const slotTime = new Date();
                    slotTime.setHours(hour, intervalIndex * 15, 0, 0);
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
                          isDropTarget 
                            ? slotConflict?.hasConflict
                              ? getConflictColor(slotConflict.conflictType)
                              : "bg-teal-100 border-2 border-dashed border-teal-400"
                            : "hover:bg-teal-50/50",
                          isDropTarget && slotConflict?.hasConflict && "ring-2 ring-red-400"
                        )}
                        style={{
                          top: `${hour * 60 + intervalIndex * 15}px`,
                          height: '15px',
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

                {/* Appointments */}
                {appointmentsByStaff[staffMember.id]?.map((appointment) => {
                  const style = getAppointmentStyle(appointment);
                  const bgColor = getAppointmentColor(appointment.status);
                  
                  // Subtle status-based border colors
                  const getBorderColor = (status: string) => {
                    switch (status) {
                      case 'checked-in':
                        return 'rgba(38, 198, 218, 0.3)'; // Soft teal
                      case 'in-service':
                        return 'rgba(129, 199, 132, 0.4)'; // Soft green
                      default:
                        return 'rgba(0, 0, 0, 0.08)'; // Default gray
                    }
                  };
                  
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
                        'absolute left-2 right-2 rounded-lg border-2 transition-all duration-200',
                        'text-left p-3 overflow-hidden group cursor-move',
                        'hover:shadow-lg hover:scale-[1.02] hover:z-10',
                        draggedAppointment?.id === appointment.id && 'opacity-50 scale-95',
                        draggedAppointment?.id === appointment.id && dragConflict?.hasConflict && 'ring-2 ring-red-400'
                      )}
                      style={{
                        ...style,
                        backgroundColor: bgColor,
                        borderColor: getBorderColor(appointment.status),
                        minHeight: '50px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      {/* Client name - Bold and prominent */}
                      <p className="font-bold text-sm text-gray-900 truncate mb-0.5">
                        {appointment.clientName}
                      </p>
                      
                      {/* Service name - Secondary */}
                      {appointment.services[0] && (
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {appointment.services[0].serviceName}
                        </p>
                      )}
                      
                      {/* Time range - Subtle */}
                      <p className="text-xs text-gray-500 font-medium">
                        {formatTime(new Date(appointment.scheduledStartTime))} - {formatTime(new Date(appointment.scheduledEndTime))}
                      </p>
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

                {/* Current Time Indicator - Inside grid */}
                {currentTimePos >= 0 && currentTimePos <= gridHeight && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-30"
                    style={{
                      top: `${currentTimePos}px`,
                    }}
                  >
                    {/* Line */}
                    <div 
                      className="w-full shadow-sm"
                      style={{
                        height: '2px',
                        backgroundColor: '#EF4444',
                        opacity: 0.8,
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
