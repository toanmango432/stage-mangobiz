/**
 * Timeline View Component
 * Chronological feed of all appointments across all staff
 * Perfect for front desk operations and finding available slots
 */

import { useMemo } from 'react';
import { Clock, User, Calendar, Search } from 'lucide-react';
import { LocalAppointment } from '../../types/appointment';
import { cn } from '../../lib/utils';

interface TimelineViewProps {
  appointments: LocalAppointment[];
  date: Date;
  staff: Array<{ id: string; name: string; photo?: string }>;
  onAppointmentClick: (appointment: LocalAppointment) => void;
  onTimeSlotClick?: (staffId: string, time: Date) => void;
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
 * Format duration
 */
function formatDuration(startTime: Date, endTime: Date): string {
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Get status color class
 */
function getStatusColor(status: string): string {
  const statusColors = {
    scheduled: 'bg-blue-50 border-blue-200 text-blue-900',
    'checked-in': 'bg-teal-50 border-teal-200 text-teal-900',
    'in-service': 'bg-amber-50 border-amber-200 text-amber-900',
    completed: 'bg-green-50 border-green-200 text-green-900',
    cancelled: 'bg-red-50 border-red-200 text-red-900',
    'no-show': 'bg-orange-50 border-orange-200 text-orange-900',
  };
  return statusColors[status as keyof typeof statusColors] || statusColors.scheduled;
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status: string): string {
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
    'checked-in': 'bg-teal-100 text-teal-700 border-teal-300',
    'in-service': 'bg-amber-100 text-amber-700 border-amber-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
    'no-show': 'bg-orange-100 text-orange-700 border-orange-300',
  };
  return statusColors[status as keyof typeof statusColors] || statusColors.scheduled;
}

/**
 * Get status label
 */
function getStatusLabel(status: string): string {
  const statusLabels = {
    scheduled: 'Scheduled',
    'checked-in': 'Checked In',
    'in-service': 'In Service',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'no-show': 'No Show',
  };
  return statusLabels[status as keyof typeof statusLabels] || status;
}

interface TimelineEntry {
  type: 'appointment' | 'gap' | 'break';
  time: Date;
  staffId?: string;
  staffName?: string;
  appointment?: LocalAppointment;
  duration?: number; // for gaps
  endTime?: Date;
}

/**
 * Generate timeline entries with gaps
 */
function generateTimeline(
  appointments: LocalAppointment[],
  staff: Array<{ id: string; name: string }>,
  date: Date
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Sort appointments chronologically
  const sortedAppointments = [...appointments].sort((a, b) =>
    new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
  );

  // Add all appointments as timeline entries
  sortedAppointments.forEach(apt => {
    const staffMember = staff.find(s => s.id === apt.staffId);

    entries.push({
      type: 'appointment',
      time: new Date(apt.scheduledStartTime),
      endTime: new Date(apt.scheduledEndTime),
      staffId: apt.staffId,
      staffName: staffMember?.name || apt.staffName || 'Unknown Staff',
      appointment: apt,
    });
  });

  // Detect gaps (30+ minute slots with no appointments)
  const businessHours = {
    start: 9, // 9 AM
    end: 18,  // 6 PM
  };

  const selectedDate = new Date(date);
  selectedDate.setHours(businessHours.start, 0, 0, 0);
  const dayStart = selectedDate.getTime();

  selectedDate.setHours(businessHours.end, 0, 0, 0);
  const dayEnd = selectedDate.getTime();

  // Find gaps between appointments
  for (let currentTime = dayStart; currentTime < dayEnd; currentTime += 30 * 60 * 1000) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime + 30 * 60 * 1000);

    // Check if any staff member is free during this 30-min slot
    const availableStaff = staff.filter(staffMember => {
      const hasAppointment = sortedAppointments.some(apt => {
        const aptStart = new Date(apt.scheduledStartTime).getTime();
        const aptEnd = new Date(apt.scheduledEndTime).getTime();

        // Check if this staff member is booked during this time
        return apt.staffId === staffMember.id &&
               ((slotStart.getTime() >= aptStart && slotStart.getTime() < aptEnd) ||
                (slotEnd.getTime() > aptStart && slotEnd.getTime() <= aptEnd) ||
                (slotStart.getTime() <= aptStart && slotEnd.getTime() >= aptEnd));
      });

      return !hasAppointment;
    });

    // If 2+ staff members are free, show as available slot
    if (availableStaff.length >= 2) {
      entries.push({
        type: 'gap',
        time: slotStart,
        endTime: slotEnd,
        duration: 30,
        staffName: availableStaff.map(s => s.name).join(', '),
      });
    }
  }

  // Sort all entries by time
  entries.sort((a, b) => a.time.getTime() - b.time.getTime());

  return entries;
}

export function TimelineView({
  appointments,
  date,
  staff,
  onAppointmentClick,
  onTimeSlotClick,
}: TimelineViewProps) {
  // Generate timeline with appointments and gaps
  const timelineEntries = useMemo(() => {
    return generateTimeline(appointments, staff, date);
  }, [appointments, staff, date]);

  // Filter: only show appointments for selected date
  const filteredEntries = useMemo(() => {
    return timelineEntries.filter(entry => {
      const entryDate = new Date(entry.time);
      return entryDate.toDateString() === date.toDateString();
    });
  }, [timelineEntries, date]);

  if (filteredEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
            <Clock className="w-10 h-10 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No appointments scheduled
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-sm">
            No appointments found for {date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <button
            onClick={() => onTimeSlotClick?.(staff[0]?.id || '', new Date())}
            className="px-6 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors shadow-premium-sm hover:shadow-premium-md"
          >
            Create First Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 px-6 py-4 shadow-premium-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Timeline View
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-600">
              <Clock className="w-4 h-4" />
              <span>{filteredEntries.filter(e => e.type === 'gap').length} slots available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Entries */}
      <div className="px-6 py-4 space-y-1">
        {filteredEntries.map((entry, index) => {
          if (entry.type === 'appointment' && entry.appointment) {
            const apt = entry.appointment;
            const startTime = new Date(apt.scheduledStartTime);
            const endTime = new Date(apt.scheduledEndTime);

            return (
              <div
                key={`apt-${apt.id}-${index}`}
                className="animate-slide-up"
                style={{
                  animationDelay: `${index * 30}ms`,
                  animationDuration: '400ms',
                  animationFillMode: 'both'
                }}
              >
                <button
                  onClick={() => onAppointmentClick(apt)}
                  className={cn(
                    'w-full text-left px-5 py-4 rounded-xl border transition-all duration-200',
                    'hover:shadow-premium-md hover:-translate-y-0.5',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                    'active:scale-[0.98]',
                    getStatusColor(apt.status)
                  )}
                >
                  {/* Timeline connector */}
                  <div className="flex items-start gap-4">
                    {/* Time column with visual timeline */}
                    <div className="flex-shrink-0 relative">
                      <div className="flex flex-col items-center">
                        {/* Time bubble */}
                        <div className="w-16 h-16 rounded-xl bg-white shadow-premium-sm border border-gray-200 flex flex-col items-center justify-center">
                          <div className="text-base font-bold text-gray-900">
                            {formatTime(startTime).split(' ')[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(startTime).split(' ')[1]}
                          </div>
                        </div>

                        {/* Vertical line connector (if not last item) */}
                        {index < filteredEntries.length - 1 && (
                          <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent mt-2" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-gray-900 truncate">
                            {apt.clientName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">{entry.staffName}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">
                              {formatTime(startTime)} - {formatTime(endTime)}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">
                              {formatDuration(startTime, endTime)}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className={cn(
                          'px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
                          getStatusBadgeColor(apt.status)
                        )}>
                          {getStatusLabel(apt.status)}
                        </div>
                      </div>

                      {/* Services */}
                      {apt.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {apt.services.map((service, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1 bg-white/70 rounded-lg text-xs font-medium text-gray-700 border border-gray-200/50"
                            >
                              {service.serviceName}
                              {service.price && (
                                <span className="ml-1.5 text-brand-600 font-semibold">
                                  ${service.price}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {apt.notes && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-1 italic">
                          "{apt.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          }

          if (entry.type === 'gap') {
            return (
              <div
                key={`gap-${entry.time.getTime()}-${index}`}
                className="animate-fade-in"
                style={{
                  animationDelay: `${index * 30}ms`,
                  animationDuration: '400ms',
                  animationFillMode: 'both'
                }}
              >
                <div className="flex items-start gap-4 px-5 py-3 rounded-xl bg-green-50/50 border border-green-200/50">
                  {/* Time column */}
                  <div className="flex-shrink-0 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-premium-sm flex flex-col items-center justify-center">
                        <Search className="w-6 h-6 text-white mb-0.5" />
                        <div className="text-xs text-white/90 font-medium">Available</div>
                      </div>

                      {index < filteredEntries.length - 1 && (
                        <div className="w-0.5 h-6 bg-gradient-to-b from-green-300 to-transparent mt-2" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">
                        {formatTime(entry.time)} - {entry.endTime && formatTime(entry.endTime)}
                      </span>
                      <span className="text-green-600">({entry.duration} min slot)</span>
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Available: {entry.staffName}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Bottom padding */}
      <div className="h-20" />
    </div>
  );
}
