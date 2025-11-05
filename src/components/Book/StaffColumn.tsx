/**
 * StaffColumn Component
 * Displays a staff member's schedule column with time slots and appointments
 */

import { memo, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { TimeSlot as TimeSlotType } from '../../utils/timeUtils';
import { AppointmentCard } from './AppointmentCard';
import { calculateAppointmentTop, calculateAppointmentHeight } from '../../utils/timeUtils';
import { PIXELS_PER_15_MINUTES } from '../../constants/appointment';

interface StaffColumnProps {
  staffId: string;
  staffName: string;
  staffPhoto?: string;
  appointments: LocalAppointment[];
  timeSlots: TimeSlotType[];
  onAppointmentClick?: (appointment: LocalAppointment) => void;
  onAppointmentDrop?: (appointmentId: string, newStaffId: string, newTime: Date) => void;
  selectedDate?: Date;
  className?: string;
}

export const StaffColumn = memo(function StaffColumn({
  staffId,
  staffName,
  staffPhoto,
  appointments,
  timeSlots,
  onAppointmentClick,
  onAppointmentDrop,
  selectedDate = new Date(),
  className,
}: StaffColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  // Calculate positions for all appointments
  const positionedAppointments = useMemo(() => {
    return appointments.map(apt => {
      const startSeconds = Math.floor(apt.scheduledStartTime.getTime() / 1000) % 86400;
      const durationMinutes = Math.round(
        (apt.scheduledEndTime.getTime() - apt.scheduledStartTime.getTime()) / 60000
      );

      // Find the base time slot
      const baseSlotIndex = Math.floor(startSeconds / 900);
      const baseSlot = timeSlots[baseSlotIndex];

      if (!baseSlot) {
        return null;
      }

      // Calculate exact position
      const distanceTime = (startSeconds / 900) - baseSlotIndex;
      const top = baseSlotIndex * PIXELS_PER_15_MINUTES + 
                  calculateAppointmentTop(0, distanceTime);
      const height = calculateAppointmentHeight(durationMinutes);

      return {
        appointment: apt,
        top,
        height,
      };
    }).filter(Boolean);
  }, [appointments, timeSlots]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const appointmentId = e.dataTransfer.getData('appointment-id');
    if (!appointmentId || !onAppointmentDrop) return;

    // Calculate drop position relative to schedule area
    const scheduleArea = e.currentTarget as HTMLElement;
    const rect = scheduleArea.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    // Convert pixel position to time slot
    const slotIndex = Math.floor(offsetY / PIXELS_PER_15_MINUTES);
    const targetSlot = timeSlots[slotIndex];

    if (!targetSlot) return;

    // Calculate the new time based on the selected date and slot
    const newTime = new Date(selectedDate);
    const hours = Math.floor(targetSlot.timeInSeconds / 3600);
    const minutes = Math.floor((targetSlot.timeInSeconds % 3600) / 60);
    newTime.setHours(hours, minutes, 0, 0);

    // Call the drop handler
    onAppointmentDrop(appointmentId, staffId, newTime);
  };

  return (
    <div className={cn('relative flex-1 min-w-[150px]', className)}>
      {/* Staff header */}
      <div className="sticky top-0 z-20 bg-white border-b-2 border-gray-300 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Staff photo */}
          {staffPhoto ? (
            <img
              src={staffPhoto}
              alt={staffName}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              {staffName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Staff name */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {staffName}
            </div>
            <div className="text-xs text-gray-500">
              {appointments.length} {appointments.length === 1 ? 'appt' : 'apts'}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule area */}
      <div
        className={cn(
          'relative bg-white transition-colors',
          isDragOver && 'bg-teal-50 ring-2 ring-teal-400'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Time slot grid (for visual reference) */}
        <div className="absolute inset-0 pointer-events-none">
          {timeSlots.map((slot, idx) => (
            <div
              key={slot.timeInSeconds}
              className={cn(
                'border-b border-gray-200',
                idx % 4 === 0 && 'border-gray-300' // Hour marks - more visible
              )}
              style={{ height: `${PIXELS_PER_15_MINUTES}px` }}
            />
          ))}
        </div>

        {/* Appointments */}
        <div className="relative" style={{ height: `${timeSlots.length * PIXELS_PER_15_MINUTES}px` }}>
          {positionedAppointments.map(({ appointment, top, height }) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              top={top}
              height={height}
              onClick={() => onAppointmentClick?.(appointment)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
