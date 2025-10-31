/**
 * Week View Component
 * 7-day overview with compact appointments
 */

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LocalAppointment } from '../../types/appointment';
import { cn } from '../../lib/utils';

interface WeekViewProps {
  startDate: Date;
  appointments: LocalAppointment[];
  onAppointmentClick: (appointment: LocalAppointment) => void;
  onDateClick: (date: Date) => void;
}

export function WeekView({
  startDate,
  appointments,
  onAppointmentClick,
  onDateClick,
}: WeekViewProps) {
  // Generate 7 days starting from startDate
  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [startDate]);

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    const byDay: Record<string, LocalAppointment[]> = {};
    
    weekDays.forEach(day => {
      const dayKey = day.toDateString();
      byDay[dayKey] = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledStartTime);
        return aptDate.toDateString() === dayKey;
      }).sort((a, b) => 
        new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
      );
    });
    
    return byDay;
  }, [weekDays, appointments]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Week Header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <button
            key={index}
            onClick={() => onDateClick(day)}
            className={cn(
              'p-4 text-center border-r border-gray-200 last:border-r-0',
              'hover:bg-gray-50 transition-colors',
              isToday(day) && 'bg-teal-50'
            )}
          >
            <div className="text-xs font-medium text-gray-500 uppercase">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={cn(
              'text-2xl font-bold mt-1',
              isToday(day) ? 'text-teal-600' : 'text-gray-900'
            )}>
              {day.getDate()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {appointmentsByDay[day.toDateString()]?.length || 0} appts
            </div>
          </button>
        ))}
      </div>

      {/* Week Grid */}
      <div className="flex-1 grid grid-cols-7 overflow-hidden">
        {weekDays.map((day, index) => {
          const dayAppts = appointmentsByDay[day.toDateString()] || [];
          
          return (
            <div
              key={index}
              className="border-r border-gray-200 last:border-r-0 overflow-y-auto p-2 space-y-2"
            >
              {dayAppts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No appointments
                </div>
              ) : (
                dayAppts.map((apt) => {
                  const startTime = new Date(apt.scheduledStartTime);
                  const statusColors = {
                    scheduled: 'bg-blue-100 border-blue-300 text-blue-900',
                    'checked-in': 'bg-teal-100 border-teal-300 text-teal-900',
                    'in-service': 'bg-green-100 border-green-300 text-green-900',
                    completed: 'bg-gray-100 border-gray-300 text-gray-600',
                    cancelled: 'bg-red-100 border-red-300 text-red-600',
                    'no-show': 'bg-orange-100 border-orange-300 text-orange-600',
                  };

                  return (
                    <button
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className={cn(
                        'w-full text-left p-2 rounded-lg border-2 text-xs',
                        'hover:shadow-md transition-all',
                        statusColors[apt.status as keyof typeof statusColors] || statusColors.scheduled
                      )}
                    >
                      <div className="font-bold truncate">{apt.clientName}</div>
                      <div className="text-xs opacity-75 mt-0.5">
                        {formatTime(startTime)}
                      </div>
                      {apt.services[0] && (
                        <div className="text-xs opacity-75 truncate mt-0.5">
                          {apt.services[0].serviceName}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
