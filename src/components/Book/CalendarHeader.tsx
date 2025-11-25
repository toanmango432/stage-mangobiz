/**
 * CalendarHeader Component - Premium Edition
 * Navigation and controls for the appointment calendar
 * With glass morphism, smooth animations, and premium design
 */

import { memo, useState } from 'react';
import { cn } from '../../lib/utils';
import { CalendarView, TimeWindowMode, CALENDAR_VIEWS, TIME_WINDOW_MODES } from '../../constants/appointment';
import { formatDateDisplay } from '../../utils/timeUtils';
import { ChevronLeft, ChevronRight, Calendar, Clock, Search, Plus, Settings, RefreshCw, PanelLeftOpen } from 'lucide-react';
import { FilterPanel, AppointmentFilters } from './FilterPanel';
import { DatePickerModal } from './DatePickerModal';
import { ViewModeDropdown } from './ViewModeDropdown';
import { StaffFilterDropdown } from './StaffFilterDropdown';
import { PremiumButton, PremiumIconButton } from '../premium';

interface Staff {
  id: string;
  name: string;
}

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
  onSettingsClick?: () => void;
  onRefreshClick?: () => void;
  staff?: Staff[];
  selectedStaffIds?: string[];
  onStaffFilterChange?: (staffIds: string[]) => void;
  // Sidebar state - when open, hide date/staff from header (desktop only)
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
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
  onSettingsClick,
  onRefreshClick,
  staff = [],
  selectedStaffIds = [],
  onStaffFilterChange,
  sidebarOpen = false,
  onSidebarToggle,
  className,
}: CalendarHeaderProps) {
  // On desktop (lg+): hide date/staff controls when sidebar is open (they're in sidebar)
  // On mobile/tablet (<lg): always show date controls in header (sidebar is drawer, not inline)
  const showDateControlsDesktop = !sidebarOpen;
  const showStaffFilterDesktop = !sidebarOpen;
  const [dateTransition, setDateTransition] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      // Minimal design
      'bg-white',
      'border-b border-gray-200/40',
      // Layout
      'sticky top-0 z-30',
      // Subtle shadow
      'shadow-sm',
      // Responsive padding
      'px-2 sm:px-4 py-2 sm:py-3',
      className
    )}>
      <div className="max-w-[1600px] mx-auto">
        {/* Single Row: All Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Sidebar Toggle + Date Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Sidebar Toggle - Only when sidebar is closed */}
            {!sidebarOpen && onSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200/60"
                aria-label="Open sidebar"
                title="Open sidebar"
              >
                <PanelLeftOpen className="w-5 h-5 text-gray-400" />
              </button>
            )}

            {/* Date Controls - Always on mobile, conditional on desktop */}
            <div className={cn(
              'flex items-center gap-1 sm:gap-2',
              // On desktop: hide when sidebar is open
              !showDateControlsDesktop && 'lg:hidden'
            )}>
              {/* Today Button */}
              <button
                onClick={onTodayClick}
                className="hidden sm:inline-flex px-3 py-2 rounded-lg border border-gray-200/60 bg-white hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-700"
              >
                Today
              </button>

              {/* Previous Button */}
              <button
                onClick={handlePrevDay}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              {/* Current Date - Click to open date picker */}
              <div className={cn(
                'relative',
                'transition-all duration-300',
                dateTransition && 'opacity-50 scale-95'
              )}>
                <button
                  onClick={() => setIsDatePickerOpen(true)}
                  className="px-2 sm:px-3 py-2 min-h-[40px] rounded-lg border border-gray-200/60 bg-white hover:border-gray-300 hover:bg-gray-50/50 transition-all text-xs sm:text-sm font-normal text-gray-700"
                  title="Click to open date picker"
                >
                  {formatDateDisplay(selectedDate)}
                </button>

                {/* Date Picker Dropdown */}
                <DatePickerModal
                  isOpen={isDatePickerOpen}
                  selectedDate={selectedDate}
                  onClose={() => setIsDatePickerOpen(false)}
                  onDateSelect={(date) => {
                    onDateChange(date);
                    setIsDatePickerOpen(false);
                  }}
                />
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextDay}
                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Minimal date display when sidebar is open (desktop only) */}
            {!showDateControlsDesktop && (
              <span className="hidden lg:inline text-sm font-medium text-gray-700">
                {formatDateDisplay(selectedDate)}
              </span>
            )}
          </div>

          {/* Staff Filter - Always visible on mobile, conditional on desktop */}
          {onStaffFilterChange && staff && staff.length > 0 && (
            <div className={cn(
              // On desktop: hide when sidebar is open (staff filter is in sidebar)
              !showStaffFilterDesktop && 'lg:hidden'
            )}>
              <StaffFilterDropdown
                staff={staff}
                selectedStaffIds={selectedStaffIds}
                onStaffFilterChange={onStaffFilterChange}
              />
            </div>
          )}

          {/* Right: Actions & Settings */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Icon Buttons Group - Desktop only */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Settings Button */}
              {onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {/* Search Button */}
              {onSearchClick && (
                <button
                  onClick={onSearchClick}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="Search appointments"
                >
                  <Search className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {/* Refresh Button */}
              {onRefreshClick && (
                <button
                  onClick={onRefreshClick}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="Refresh"
                >
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>

            {/* View Mode Dropdown */}
            <ViewModeDropdown
              currentView={calendarView}
              onViewChange={onViewChange}
            />

            {/* New Appointment Button */}
            {onNewAppointment && (
              <button
                data-testid="new-appointment-button"
                onClick={onNewAppointment}
                className="px-3 sm:px-4 py-2 min-h-[40px] rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm font-normal"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
