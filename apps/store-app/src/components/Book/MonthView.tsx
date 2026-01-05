/**
 * Month View Component
 * Monthly calendar grid with appointment dots/badges
 */

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LocalAppointment } from '../../types/appointment';
import { cn } from '../../lib/utils';
import { MonthViewSkeleton } from './skeletons';

interface MonthViewProps {
  date: Date; // Any date in the month to display
  appointments: LocalAppointment[];
  onAppointmentClick: (appointment: LocalAppointment) => void;
  onDateClick: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  isLoading?: boolean;
}

/**
 * Get all days in a month organized by week
 */
function getMonthDays(date: Date): Date[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // First day of the calendar grid (may be in previous month)
  const firstCalendarDay = new Date(firstDay);
  // Start from Sunday (0 = Sunday)
  const dayOfWeek = firstDay.getDay();
  firstCalendarDay.setDate(firstDay.getDate() - dayOfWeek);
  
  // Last day of the calendar grid (may be in next month)
  const lastCalendarDay = new Date(lastDay);
  const lastDayOfWeek = lastDay.getDay();
  // Add days to complete the last week (Saturday = 6)
  const daysToAdd = 6 - lastDayOfWeek;
  lastCalendarDay.setDate(lastDay.getDate() + daysToAdd);
  
  const weeks: Date[][] = [];
  const currentDay = new Date(firstCalendarDay);
  
  while (currentDay <= lastCalendarDay) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    weeks.push(week);
  }
  
  return weeks;
}


/**
 * Format day number for display
 */
function formatDayNumber(day: Date): string {
  return day.getDate().toString();
}

/**
 * Check if date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the current month
 */
function isCurrentMonth(date: Date, monthDate: Date): boolean {
  return (
    date.getMonth() === monthDate.getMonth() &&
    date.getFullYear() === monthDate.getFullYear()
  );
}

export function MonthView({
  date,
  appointments,
  onAppointmentClick,
  onDateClick,
  onMonthChange,
  isLoading = false,
}: MonthViewProps) {
  const monthDays = useMemo(() => getMonthDays(date), [date]);
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    const prevMonth = new Date(date);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onMonthChange?.(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange?.(nextMonth);
  };

  // Get appointment status colors
  const getStatusColor = (status: string): string => {
    const statusColors = {
      scheduled: 'bg-blue-500',
      'checked-in': 'bg-brand-500',
      'in-service': 'bg-green-500',
      completed: 'bg-gray-400',
      cancelled: 'bg-red-500',
      'no-show': 'bg-orange-500',
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.scheduled;
  };

  // Pre-compute appointments grouped by date (performance optimization)
  // This replaces O(35×n) filtering with O(n) grouping
  const appointmentsByDateString = useMemo(() => {
    const byDate = new Map<string, LocalAppointment[]>();
    appointments.forEach(apt => {
      const dateStr = new Date(apt.scheduledStartTime).toDateString();
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, []);
      }
      byDate.get(dateStr)!.push(apt);
    });
    return byDate;
  }, [appointments]);

  // Show skeleton during loading
  if (isLoading) {
    return <MonthViewSkeleton />;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Month Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="btn-icon"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-gray-900">
            {monthName}
          </h2>

          <button
            onClick={handleNextMonth}
            className="btn-icon"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              'p-2 text-center text-xs font-medium text-gray-500 uppercase',
              'border-r border-gray-200 last:border-r-0'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="flex-1 grid grid-rows-6 overflow-hidden">
        {monthDays.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {week.map((day, dayIndex) => {
              const dayAppointments = appointmentsByDateString.get(day.toDateString()) || [];
              const isCurrentMonthDay = isCurrentMonth(day, date);
              const isTodayDay = isToday(day);
              
              return (
                <button
                  key={dayIndex}
                  onClick={() => onDateClick(day)}
                  className={cn(
                    'relative p-2 min-h-[80px] text-left border-r border-gray-200 last:border-r-0',
                    'hover:bg-gray-50 transition-colors',
                    // Focus indicators for accessibility
                    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 focus:z-10',
                    // Active state for press feedback
                    'active:scale-[0.98]',
                    !isCurrentMonthDay && 'text-gray-300 bg-gray-50',
                    isTodayDay && 'bg-brand-50 border-brand-200'
                  )}
                >
                  {/* Day Number */}
                  <div className={cn(
                    'text-sm font-medium mb-1',
                    isTodayDay && 'text-brand-600 font-bold',
                    !isCurrentMonthDay && 'text-gray-300',
                    isCurrentMonthDay && !isTodayDay && 'text-gray-900'
                  )}>
                    {formatDayNumber(day)}
                  </div>

                  {/* Appointment Dots/Badges */}
                  {dayAppointments.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {/* Show up to 3 appointments, then count */}
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <button
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded truncate w-full text-left',
                            'hover:shadow-sm transition-all cursor-pointer',
                            // Focus indicators for accessibility
                            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1',
                            // Active state for press feedback
                            'active:scale-95',
                            getStatusColor(apt.status),
                            'text-white'
                          )}
                          title={`${apt.clientName} - ${new Date(apt.scheduledStartTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}`}
                        >
                          <span className="font-medium">{apt.clientName}</span>
                          <span className="ml-1 opacity-90">
                            {new Date(apt.scheduledStartTime).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                        </button>
                      ))}
                      
                      {/* Show count if more than 3 */}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium px-2 py-0.5">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Appointment Count Badge */}
                  {dayAppointments.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                        'bg-brand-500 text-white'
                      )}>
                        {dayAppointments.length}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

