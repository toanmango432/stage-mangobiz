/**
 * StaffColumn Component
 * Displays a staff member's schedule column with time slots and appointments
 */

import { memo, useMemo } from 'react';
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
  className?: string;
}

export const StaffColumn = memo(function StaffColumn({
  staffId,
  staffName,
  staffPhoto,
  appointments,
  timeSlots,
  onAppointmentClick,
  className,
}: StaffColumnProps) {
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
      <div className="relative bg-white">
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
