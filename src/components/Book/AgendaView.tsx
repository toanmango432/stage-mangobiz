/**
 * Agenda/List View Component
 * List format of all appointments - ideal for phone bookings
 */

import { useMemo } from 'react';
import { Clock, User, Phone, MapPin } from 'lucide-react';
import { LocalAppointment } from '../../types/appointment';
import { cn } from '../../lib/utils';

interface AgendaViewProps {
  appointments: LocalAppointment[];
  onAppointmentClick: (appointment: LocalAppointment) => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
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
 * Group appointments by date
 */
function groupAppointmentsByDate(
  appointments: LocalAppointment[]
): Map<string, LocalAppointment[]> {
  const grouped = new Map<string, LocalAppointment[]>();
  
  appointments.forEach(apt => {
    const aptDate = new Date(apt.scheduledStartTime);
    const dateKey = aptDate.toDateString();
    const dateLabel = formatDate(aptDate);
    
    if (!grouped.has(dateLabel)) {
      grouped.set(dateLabel, []);
    }
    
    grouped.get(dateLabel)!.push(apt);
  });
  
  // Sort appointments within each date group by time
  grouped.forEach((apts, dateLabel) => {
    apts.sort((a, b) => 
      new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
    );
  });
  
  return grouped;
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

export function AgendaView({
  appointments,
  onAppointmentClick,
  onStatusChange,
}: AgendaViewProps) {
  // Group appointments by date and sort
  const groupedAppointments = useMemo(() => {
    const grouped = groupAppointmentsByDate(appointments);
    
    // Sort date groups chronologically
    const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
      const dateA = new Date(a[1][0].scheduledStartTime);
      const dateB = new Date(b[1][0].scheduledStartTime);
      return dateA.getTime() - dateB.getTime();
    });
    
    return new Map(sortedGroups);
  }, [appointments]);

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
        <div key={dateLabel} className="mb-8">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-bold text-gray-900">{dateLabel}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {dateAppointments.length} appointment{dateAppointments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Appointments List */}
          <div className="divide-y divide-gray-100">
            {dateAppointments.map((apt) => {
              const startTime = new Date(apt.scheduledStartTime);
              const endTime = new Date(apt.scheduledEndTime);
              
              return (
                <button
                  key={apt.id}
                  onClick={() => onAppointmentClick(apt)}
                  className={cn(
                    'w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors',
                    'focus:outline-none focus:bg-teal-50'
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
                            {apt.clientName}
                          </h4>
                          {apt.clientPhone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{apt.clientPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border',
                          'flex-shrink-0',
                          getStatusColor(apt.status)
                        )}>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>

                      {/* Services */}
                      {apt.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {apt.services.map((service, index) => (
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
                        </div>
                      )}

                      {/* Staff */}
                      {apt.staffName && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="w-3.5 h-3.5" />
                          <span>{apt.staffName}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {apt.notes && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {apt.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

