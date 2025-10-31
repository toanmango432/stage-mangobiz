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
import { timeToSeconds } from '../../utils/timeUtils';

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
    <div className={cn('flex h-full bg-white', className)}>
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
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
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No staff selected</p>
                <p className="text-gray-500 text-sm mt-1">
                  Select staff from the sidebar to view their schedules
                </p>
              </div>
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
