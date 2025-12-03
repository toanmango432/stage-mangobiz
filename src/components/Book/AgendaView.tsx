/**
 * Agenda/List View Component
 * List format of all appointments - ideal for phone bookings
 * Phase 8: Performance optimized with memoization
 */

import { memo, useMemo, useCallback } from 'react';
import { Clock, User, Phone } from 'lucide-react';
import { LocalAppointment } from '../../types/appointment';
import { cn } from '../../lib/utils';

interface AgendaViewProps {
  appointments: LocalAppointment[];
  onAppointmentClick: (appointment: LocalAppointment) => void;
}

// Row height for virtual list (reserved for future virtualization)

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
 * Format date for grouping
 */
function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get status color class
 */
function getStatusColor(status: string): string {
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-900 border-blue-300',
    'checked-in': 'bg-teal-100 text-teal-900 border-teal-300',
    'in-service': 'bg-green-100 text-green-900 border-green-300',
    completed: 'bg-gray-100 text-gray-600 border-gray-300',
    cancelled: 'bg-red-100 text-red-600 border-red-300',
    'no-show': 'bg-orange-100 text-orange-600 border-orange-300',
  };
  return statusColors[status as keyof typeof statusColors] || statusColors.scheduled;
}

/**
 * Get status badge text
 */
function getStatusBadge(status: string): string {
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

/**
 * Memoized Appointment Row Component
 * Uses custom comparison to only re-render when appointment data changes
 */
const AppointmentRow = memo(function AppointmentRow({
  appointment,
  onClick,
}: {
  appointment: LocalAppointment;
  onClick: () => void;
}) {
  const startTime = new Date(appointment.scheduledStartTime);
  const endTime = new Date(appointment.scheduledEndTime);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors',
        'focus:outline-none focus:bg-teal-50 border-b border-gray-100'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Time Column */}
        <div className="flex-shrink-0 w-20 text-center">
          <div className="text-lg font-bold text-gray-900">
            {formatTime(startTime)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {formatTime(endTime)}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-gray-900 truncate">
                {appointment.clientName}
              </h4>
              {appointment.clientPhone && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{appointment.clientPhone}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border',
              'flex-shrink-0',
              getStatusColor(appointment.status)
            )}>
              {getStatusBadge(appointment.status)}
            </div>
          </div>

          {/* Services */}
          {appointment.services.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {appointment.services.slice(0, 3).map((service, index) => (
                <div
                  key={index}
                  className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                >
                  {service.serviceName}
                  {service.duration && (
                    <span className="ml-1 text-gray-500">
                      ({service.duration} min)
                    </span>
                  )}
                </div>
              ))}
              {appointment.services.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{appointment.services.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Staff */}
          {appointment.staffName && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <User className="w-3.5 h-3.5" />
              <span>{appointment.staffName}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.appointment.id === nextProps.appointment.id &&
    prevProps.appointment.status === nextProps.appointment.status &&
    prevProps.appointment.syncStatus === nextProps.appointment.syncStatus
  );
});

/**
 * Date Header Component (memoized)
 */
const DateHeader = memo(function DateHeader({
  dateLabel,
  count,
}: {
  dateLabel: string;
  count: number;
}) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <h3 className="text-lg font-bold text-gray-900">{dateLabel}</h3>
      <p className="text-sm text-gray-500 mt-0.5">
        {count} appointment{count !== 1 ? 's' : ''}
      </p>
    </div>
  );
});

/**
 * AgendaView - Main component with optimized rendering
 */
export const AgendaView = memo(function AgendaView({
  appointments,
  onAppointmentClick,
}: AgendaViewProps) {
  // Group appointments by date with memoization
  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, LocalAppointment[]>();

    // Sort appointments by date
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    );

    sorted.forEach((apt) => {
      const aptDate = new Date(apt.scheduledStartTime);
      const dateLabel = formatDate(aptDate);

      if (!groups.has(dateLabel)) {
        groups.set(dateLabel, []);
      }
      groups.get(dateLabel)!.push(apt);
    });

    return groups;
  }, [appointments]);

  // Memoized click handler creator
  const createClickHandler = useCallback((apt: LocalAppointment) => {
    return () => onAppointmentClick(apt);
  }, [onAppointmentClick]);

  if (appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">No appointments</p>
          <p className="text-sm">Create your first appointment to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      {Array.from(groupedAppointments.entries()).map(([dateLabel, dateAppointments]) => (
        <div key={dateLabel} className="mb-4">
          <DateHeader dateLabel={dateLabel} count={dateAppointments.length} />
          <div>
            {dateAppointments.map((apt) => (
              <AppointmentRow
                key={apt.id}
                appointment={apt}
                onClick={createClickHandler(apt)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

export { AgendaView as default };
