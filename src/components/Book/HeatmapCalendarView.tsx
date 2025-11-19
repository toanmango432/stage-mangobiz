/**
 * Heatmap Calendar View
 * Visual density overview - see busy/slow times at a glance
 * Color intensity shows utilization percentage
 */

import { useMemo } from 'react';
import { TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimeSlot {
  hour: number; // 0-23
  bookedMinutes: number; // 0-60
  revenue: number;
  appointmentCount: number;
}

interface DayData {
  date: Date;
  timeSlots: TimeSlot[];
  totalRevenue: number;
  totalAppointments: number;
  utilization: number; // 0-100
}

interface HeatmapCalendarViewProps {
  startDate: Date;
  days: DayData[];
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onDayClick?: (date: Date) => void;
  workingHours?: { start: number; end: number }; // Default: 9-18
  colorMode?: 'utilization' | 'revenue' | 'appointments';
}

export function HeatmapCalendarView({
  startDate,
  days,
  onTimeSlotClick,
  onDayClick,
  workingHours = { start: 9, end: 18 },
  colorMode = 'utilization',
}: HeatmapCalendarViewProps) {
  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = workingHours.start; h < workingHours.end; h++) {
      result.push(h);
    }
    return result;
  }, [workingHours]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate max values for normalization
  const maxRevenue = useMemo(() => {
    return Math.max(...days.flatMap(d => d.timeSlots.map(ts => ts.revenue)), 1);
  }, [days]);

  const maxAppointments = useMemo(() => {
    return Math.max(...days.flatMap(d => d.timeSlots.map(ts => ts.appointmentCount)), 1);
  }, [days]);

  /**
   * Get color intensity based on utilization/revenue/appointments
   */
  const getIntensityColor = (slot: TimeSlot | undefined): string => {
    if (!slot) return 'bg-gray-50';

    let intensity = 0;

    switch (colorMode) {
      case 'utilization':
        intensity = slot.bookedMinutes / 60; // 0-1
        break;
      case 'revenue':
        intensity = slot.revenue / maxRevenue; // 0-1
        break;
      case 'appointments':
        intensity = slot.appointmentCount / maxAppointments; // 0-1
        break;
    }

    // Return color based on intensity
    if (intensity === 0) return 'bg-gray-50 border-gray-200';
    if (intensity < 0.25) return 'bg-emerald-100 border-emerald-200';
    if (intensity < 0.5) return 'bg-teal-200 border-teal-300';
    if (intensity < 0.75) return 'bg-orange-300 border-orange-400';
    return 'bg-red-400 border-red-500';
  };

  /**
   * Get display value for tooltip
   */
  const getDisplayValue = (slot: TimeSlot | undefined): string => {
    if (!slot) return 'No data';

    switch (colorMode) {
      case 'utilization':
        return `${Math.round((slot.bookedMinutes / 60) * 100)}% booked`;
      case 'revenue':
        return `$${slot.revenue}`;
      case 'appointments':
        return `${slot.appointmentCount} appt${slot.appointmentCount !== 1 ? 's' : ''}`;
    }
  };

  /**
   * Format hour for display
   */
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  /**
   * Get day summary
   */
  const getDaySummary = (day: DayData): { icon: any; label: string; value: string } => {
    switch (colorMode) {
      case 'utilization':
        return {
          icon: Clock,
          label: 'Utilization',
          value: `${Math.round(day.utilization)}%`,
        };
      case 'revenue':
        return {
          icon: DollarSign,
          label: 'Revenue',
          value: `$${day.totalRevenue}`,
        };
      case 'appointments':
        return {
          icon: Users,
          label: 'Appointments',
          value: `${day.totalAppointments}`,
        };
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Legend */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Calendar Heatmap</h3>
            <p className="text-sm text-gray-600">Visual density overview</p>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2">
            {/* Legend */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
                <span className="text-xs text-gray-600">Empty</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
                <span className="text-xs text-gray-600">Light</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-teal-200 border border-teal-300" />
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-orange-300 border border-orange-400" />
                <span className="text-xs text-gray-600">Busy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-400 border border-red-500" />
                <span className="text-xs text-gray-600">Full</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Day Headers */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="flex">
              <div className="w-16 flex-shrink-0 border-r border-gray-200" />
              {days.map((day, idx) => {
                const summary = getDaySummary(day);
                const Icon = summary.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onDayClick?.(day.date)}
                    className="flex-1 min-w-[120px] p-3 border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-xs font-medium text-gray-500 uppercase">
                      {weekDays[day.date.getDay()]}
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-0.5">
                      {day.date.getDate()}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Icon className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">{summary.label}:</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {summary.value}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-gray-200 last:border-b-0">
              {/* Hour Label */}
              <div className="w-16 flex-shrink-0 px-2 py-3 border-r border-gray-200 bg-gray-50">
                <div className="text-xs font-medium text-gray-600 text-right">
                  {formatHour(hour)}
                </div>
              </div>

              {/* Day Cells */}
              {days.map((day, dayIdx) => {
                const slot = day.timeSlots.find(ts => ts.hour === hour);
                return (
                  <button
                    key={dayIdx}
                    onClick={() => onTimeSlotClick?.(day.date, hour)}
                    className={cn(
                      'flex-1 min-w-[120px] p-3 border-r border-gray-200 last:border-r-0',
                      'hover:ring-2 hover:ring-teal-500 hover:ring-inset transition-all',
                      'group relative',
                      getIntensityColor(slot)
                    )}
                    title={slot ? getDisplayValue(slot) : 'Empty'}
                  >
                    {slot && slot.appointmentCount > 0 && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="text-lg font-bold text-gray-900 opacity-80">
                          {slot.appointmentCount}
                        </div>
                        <div className="text-xs text-gray-700 opacity-70 mt-0.5">
                          {slot.bookedMinutes} min
                        </div>
                        {colorMode === 'revenue' && slot.revenue > 0 && (
                          <div className="text-xs font-semibold text-gray-900 opacity-80 mt-1">
                            ${slot.revenue}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        {formatHour(hour)} - {getDisplayValue(slot)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>Total Revenue</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                ${days.reduce((sum, d) => sum + d.totalRevenue, 0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Total Appointments</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {days.reduce((sum, d) => sum + d.totalAppointments, 0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Avg Utilization</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {Math.round(days.reduce((sum, d) => sum + d.utilization, 0) / days.length)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-teal-600">Best slot:</span>{' '}
              Find optimal booking times at a glance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
