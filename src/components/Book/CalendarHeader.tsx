/**
 * CalendarHeader Component - Premium Edition
 * Navigation and controls for the appointment calendar
 * With glass morphism, smooth animations, and premium design
 */

import { memo, useState } from 'react';
import { cn } from '../../lib/utils';
import { CalendarView, TimeWindowMode, CALENDAR_VIEWS, TIME_WINDOW_MODES } from '../../constants/appointment';
import { formatDateDisplay } from '../../utils/timeUtils';
import { ChevronLeft, ChevronRight, Calendar, Clock, Search, Plus, Users } from 'lucide-react';
import { FilterPanel, AppointmentFilters } from './FilterPanel';
import { PremiumButton, PremiumIconButton } from '../premium';

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
  onStaffDrawerOpen?: () => void;
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
  onStaffDrawerOpen,
  className,
}: CalendarHeaderProps) {
  const [dateTransition, setDateTransition] = useState(false);

  const handlePrevDay = () => {
    setDateTransition(true);
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
    setTimeout(() => setDateTransition(false), 300);
  };

  const handleNextDay = () => {
    setDateTransition(true);
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
    setTimeout(() => setDateTransition(false), 300);
  };

  return (
    <header className={cn(
      // Glass morphism effect
      'backdrop-blur-xl bg-white/90',
      'border-b border-gray-200/50',
      // Layout
      'sticky top-0 z-30',
      // Shadow
      'shadow-premium-sm',
      // Padding - Responsive
      'px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5',
      className
    )}>
      <div className="max-w-[1600px] mx-auto">
        {/* Top Row: Title & New Appointment */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight hidden md:block">
            Appointments
          </h1>

          {/* New Appointment Button - Desktop */}
          {onNewAppointment && (
            <div className="hidden sm:block">
              <PremiumButton
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={onNewAppointment}
                className="shadow-premium-md hover:shadow-premium-lg"
              >
                New Appointment
              </PremiumButton>
            </div>
          )}

          {/* New Appointment Button - Mobile */}
          {onNewAppointment && (
            <div className="sm:hidden">
              <PremiumButton
                variant="primary"
                size="md"
                icon={<Plus className="w-5 h-5" />}
                onClick={onNewAppointment}
              >
                New
              </PremiumButton>
            </div>
          )}
        </div>

        {/* Bottom Row: Navigation & Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Left: Date Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Staff Button - Mobile Only */}
            {onStaffDrawerOpen && (
              <button
                onClick={onStaffDrawerOpen}
                className={cn(
                  'lg:hidden',
                  'flex items-center justify-center',
                  'w-10 h-10 rounded-lg',
                  'bg-brand-50 text-brand-600',
                  'hover:bg-brand-100',
                  'transition-all duration-200',
                  'active:scale-95',
                  'shadow-premium-sm'
                )}
                aria-label="Select staff"
              >
                <Users className="w-5 h-5" />
              </button>
            )}

            {/* Previous Button */}
            <PremiumIconButton
              variant="ghost"
              size="md"
              icon={<ChevronLeft className="w-5 h-5" />}
              onClick={handlePrevDay}
              aria-label="Previous day"
            />

            {/* Current Date */}
            <div className={cn(
              'min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-center',
              'transition-all duration-300',
              dateTransition && 'opacity-50 scale-95'
            )}>
              <button
                onClick={onTodayClick}
                className={cn(
                  'text-sm sm:text-base md:text-lg font-semibold text-gray-900',
                  'hover:text-brand-600 transition-colors duration-200',
                  'px-2 sm:px-3 py-1.5 rounded-lg',
                  'hover:bg-brand-50'
                )}
              >
                {formatDateDisplay(selectedDate)}
              </button>
            </div>

            {/* Next Button */}
            <PremiumIconButton
              variant="ghost"
              size="md"
              icon={<ChevronRight className="w-5 h-5" />}
              onClick={handleNextDay}
              aria-label="Next day"
            />

            {/* Today Button */}
            <button
              onClick={onTodayClick}
              className={cn(
                'hidden sm:inline-flex',
                'text-sm font-medium text-brand-600',
                'hover:text-brand-700',
                'px-3 py-1.5 rounded-lg',
                'hover:bg-brand-50',
                'transition-all duration-200'
              )}
            >
              Today
            </button>
          </div>

          {/* Right: View Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Time Window Toggle - Available on tablet+ */}
            <div className="hidden md:flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
              <button
                onClick={() => onTimeWindowModeChange(TIME_WINDOW_MODES.TWO_HOUR)}
                className={cn(
                  'p-2 rounded-md',
                  'transition-all duration-200',
                  timeWindowMode === TIME_WINDOW_MODES.TWO_HOUR
                    ? 'bg-white text-gray-900 shadow-premium-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
                title="2-hour window"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={() => onTimeWindowModeChange(TIME_WINDOW_MODES.FULL_DAY)}
                className={cn(
                  'p-2 rounded-md',
                  'transition-all duration-200',
                  timeWindowMode === TIME_WINDOW_MODES.FULL_DAY
                    ? 'bg-white text-gray-900 shadow-premium-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
                title="Full day"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {/* View Switcher - Responsive */}
            <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-surface-secondary rounded-lg p-1">
              <button
                onClick={() => onViewChange(CALENDAR_VIEWS.DAY)}
                className={cn(
                  'px-2 sm:px-3 py-1.5 rounded-md',
                  'text-xs sm:text-sm font-medium',
                  'transition-all duration-200',
                  calendarView === CALENDAR_VIEWS.DAY
                    ? 'bg-white text-gray-900 shadow-premium-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
              >
                <span className="hidden sm:inline">Day</span>
                <span className="sm:hidden">D</span>
              </button>
              <button
                onClick={() => onViewChange(CALENDAR_VIEWS.WEEK)}
                className={cn(
                  'px-2 sm:px-3 py-1.5 rounded-md',
                  'text-xs sm:text-sm font-medium',
                  'transition-all duration-200',
                  calendarView === CALENDAR_VIEWS.WEEK
                    ? 'bg-white text-gray-900 shadow-premium-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
              >
                <span className="hidden sm:inline">Week</span>
                <span className="sm:hidden">W</span>
              </button>
              <button
                onClick={() => onViewChange(CALENDAR_VIEWS.MONTH)}
                className={cn(
                  'px-2 sm:px-3 py-1.5 rounded-md',
                  'text-xs sm:text-sm font-medium',
                  'transition-all duration-200',
                  calendarView === CALENDAR_VIEWS.MONTH
                    ? 'bg-white text-gray-900 shadow-premium-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
              >
                <span className="hidden sm:inline">Month</span>
                <span className="sm:hidden">M</span>
              </button>
              <button
                onClick={() => onViewChange(CALENDAR_VIEWS.AGENDA)}
                className={cn(
                  'px-2 sm:px-3 py-1.5 rounded-md',
                  'text-xs sm:text-sm font-medium',
                  'transition-all duration-200',
                  calendarView === CALENDAR_VIEWS.AGENDA
                    ? 'bg-white text-gray-900 shadow-premium-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                )}
              >
                <span className="hidden sm:inline">Agenda</span>
                <span className="sm:hidden">A</span>
              </button>
            </div>

            {/* Filters - Hidden on mobile */}
            {onFilterChange && (
              <div className="hidden lg:block">
                <FilterPanel onFilterChange={onFilterChange} />
              </div>
            )}

            {/* Search Button */}
            {onSearchClick && (
              <PremiumIconButton
                variant="ghost"
                size="md"
                icon={<Search className="w-5 h-5" />}
                onClick={onSearchClick}
                aria-label="Search appointments"
                className="hidden sm:flex"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
