/**
 * DaySchedule Component
 * Main calendar day view with time slots and staff columns
 */

import { memo, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { TimeSlot as TimeSlotType } from '../../utils/timeUtils';
import { TimeSlot } from './TimeSlot';
import { StaffColumn } from './StaffColumn';
import { EmptyState } from './EmptyState';
import { timeToSeconds } from '../../utils/timeUtils';
import { Users } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  photo?: string;
}

interface DayScheduleProps {
  staff: Staff[];
  appointments: LocalAppointment[];
  timeSlots: TimeSlotType[];
  onAppointmentClick?: (appointment: LocalAppointment) => void;
  className?: string;
}

export const DaySchedule = memo(function DaySchedule({
  staff,
  appointments,
  timeSlots,
  onAppointmentClick,
  className,
}: DayScheduleProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const now = new Date();
    const currentSeconds = timeToSeconds(now);

    // Find the closest time slot
    const currentSlotIndex = timeSlots.findIndex(
      slot => slot.timeInSeconds >= currentSeconds
    );

    if (currentSlotIndex > 0) {
      const scrollTop = (currentSlotIndex - 2) * 22; // Show 2 slots before current
      scrollContainerRef.current.scrollTop = scrollTop;
    }
  }, [timeSlots]);

  // Get current time for indicator
  const now = new Date();
  const currentSeconds = timeToSeconds(now);

  // Group appointments by staff
  const appointmentsByStaff = staff.reduce((acc, staffMember) => {
    acc[staffMember.id] = appointments.filter(
      apt => apt.staffId === staffMember.id
    );
    return acc;
  }, {} as Record<string, LocalAppointment[]>);

  return (
    <div className={cn('flex h-full bg-gray-50 rounded-lg', className)}>
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white">
        {/* Header spacer */}
        <div className="h-[60px] border-b-2 border-gray-300" />

        {/* Time labels */}
        <div className="relative">
          {timeSlots.map((slot) => (
            <TimeSlot
              key={slot.timeInSeconds}
              time={slot.time}
              timeInSeconds={slot.timeInSeconds}
              isCurrentTime={Math.abs(slot.timeInSeconds - currentSeconds) < 900}
            />
          ))}
        </div>
      </div>

      {/* Staff columns */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
      >
        <div className="flex min-w-full">
          {staff.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20 bg-white rounded-r-lg">
              <EmptyState
                icon={Users}
                title="No staff selected"
                description="Select staff from the sidebar to view their schedules"
              />
            </div>
          ) : (
            staff.map((staffMember) => (
              <StaffColumn
                key={staffMember.id}
                staffId={staffMember.id}
                staffName={staffMember.name}
                staffPhoto={staffMember.photo}
                appointments={appointmentsByStaff[staffMember.id] || []}
                timeSlots={timeSlots}
                onAppointmentClick={onAppointmentClick}
                className="border-r border-gray-200 last:border-r-0"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
