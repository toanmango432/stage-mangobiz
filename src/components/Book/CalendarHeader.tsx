/**
 * CalendarHeader Component
 * Navigation and controls for the appointment calendar
 */

import { memo } from 'react';
import { cn } from '../../lib/utils';
import { CalendarView, TimeWindowMode, CALENDAR_VIEWS, TIME_WINDOW_MODES } from '../../constants/appointment';
import { formatDateDisplay } from '../../utils/timeUtils';
import { ChevronLeft, ChevronRight, Calendar, Clock, Search, Plus } from 'lucide-react';
import { FilterPanel, AppointmentFilters } from './FilterPanel';

interface CalendarHeaderProps {
  selectedDate: Date;
  calendarView: CalendarView;
  timeWindowMode: TimeWindowMode;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onTimeWindowModeChange: (mode: TimeWindowMode) => void;
  onSearchClick?: () => void;
  onTodayClick: () => void;
  onFilterChange?: (filters: AppointmentFilters) => void;
  onNewAppointment?: () => void;
  className?: string;
}

export const CalendarHeader = memo(function CalendarHeader({
  selectedDate,
  calendarView,
  timeWindowMode,
  onDateChange,
  onViewChange,
  onTimeWindowModeChange,
  onSearchClick,
  onTodayClick,
  onFilterChange,
  onNewAppointment,
  className,
}: CalendarHeaderProps) {
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };

  return (
    <div className={cn(
      'flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4',
      'bg-white border-b border-gray-200',
      'sticky top-0 z-30 shadow-sm',
      className
    )}>
      {/* Left: Title & Date Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <h1 className="hidden md:block text-xl font-bold text-gray-900">APPOINTMENTS</h1>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Previous day */}
          <button
            onClick={handlePrevDay}
            className={cn(
              'p-1.5 sm:p-2 rounded-lg transition-colors',
              'hover:bg-gray-100 active:bg-gray-200',
              'text-gray-600 hover:text-gray-900'
            )}
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Current date */}
          <button
            onClick={onTodayClick}
            className={cn(
              'px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors',
              'hover:bg-gray-100 active:bg-gray-200',
              'text-gray-900'
            )}
          >
            {formatDateDisplay(selectedDate)}
          </button>

          {/* Next day */}
          <button
            onClick={handleNextDay}
            className={cn(
              'p-1.5 sm:p-2 rounded-lg transition-colors',
              'hover:bg-gray-100 active:bg-gray-200',
              'text-gray-600 hover:text-gray-900'
            )}
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right: View Controls */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Time Window Toggle - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onTimeWindowModeChange(TIME_WINDOW_MODES.TWO_HOUR)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              timeWindowMode === TIME_WINDOW_MODES.TWO_HOUR
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
            title="2-hour window"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTimeWindowModeChange(TIME_WINDOW_MODES.FULL_DAY)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              timeWindowMode === TIME_WINDOW_MODES.FULL_DAY
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
            title="Full day"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange(CALENDAR_VIEWS.DAY)}
            className={cn(
              'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all',
              calendarView === CALENDAR_VIEWS.DAY
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Day
          </button>
          <button
            onClick={() => onViewChange(CALENDAR_VIEWS.WEEK)}
            className={cn(
              'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all',
              calendarView === CALENDAR_VIEWS.WEEK
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Week
          </button>
          <button
            onClick={() => onViewChange(CALENDAR_VIEWS.MONTH)}
            className={cn(
              'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all',
              calendarView === CALENDAR_VIEWS.MONTH
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Month
          </button>
          <button
            onClick={() => onViewChange(CALENDAR_VIEWS.AGENDA)}
            className={cn(
              'px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all',
              calendarView === CALENDAR_VIEWS.AGENDA
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            Agenda
          </button>
        </div>

        {/* Filters - Hidden on mobile */}
        {onFilterChange && (
          <div className="hidden lg:block">
            <FilterPanel onFilterChange={onFilterChange} />
          </div>
        )}

        {/* Search - Hidden on small mobile */}
        <button
          onClick={onSearchClick}
          className={cn(
            'hidden sm:flex p-2 rounded-lg transition-colors',
            'hover:bg-gray-100 active:bg-gray-200',
            'text-gray-600 hover:text-gray-900'
          )}
          aria-label="Search appointments"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* New Appointment Button */}
        {onNewAppointment && (
          <button
            onClick={onNewAppointment}
            className={cn(
              'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg',
              'bg-gradient-to-r from-orange-500 to-pink-500',
              'text-white font-semibold text-sm',
              'hover:from-orange-600 hover:to-pink-600',
              'active:scale-95',
              'transition-all duration-200',
              'shadow-md hover:shadow-lg'
            )}
            aria-label="New appointment"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>
    </div>
  );
});
