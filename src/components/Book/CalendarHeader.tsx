/**
 * CalendarHeader Component - Premium Edition
 * Navigation and controls for the appointment calendar
 * With glass morphism, smooth animations, and premium design
 */

import { memo, useState } from 'react';
import { cn } from '../../lib/utils';
import { CalendarView, TimeWindowMode, CALENDAR_VIEWS, TIME_WINDOW_MODES } from '../../constants/appointment';
import { formatDateDisplay } from '../../utils/timeUtils';
import { ChevronLeft, ChevronRight, Calendar, Clock, Search, Plus, Users, Settings, RefreshCw, PanelLeftOpen } from 'lucide-react';
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
  onStaffDrawerOpen?: () => void;
  onSettingsClick?: () => void;
  onRefreshClick?: () => void;
  staff?: Staff[];
  selectedStaffIds?: string[];
  onStaffFilterChange?: (staffIds: string[]) => void;
  // Sidebar state - when open, hide date/staff from header
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
  onStaffDrawerOpen,
  onSettingsClick,
  onRefreshClick,
  staff = [],
  selectedStaffIds = [],
  onStaffFilterChange,
  sidebarOpen = false,
  onSidebarToggle,
  className,
}: CalendarHeaderProps) {
  // When sidebar is open, hide date/staff controls (they're in sidebar)
  const showDateControls = !sidebarOpen;
  const showStaffFilter = !sidebarOpen;
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
      // Compact padding
      'px-4 py-3',
      className
    )}>
      <div className="max-w-[1600px] mx-auto">
        {/* Single Row: All Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Sidebar Toggle + Date Navigation */}
          <div className="flex items-center gap-2">
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

            {/* Staff Button - Mobile Only */}
            {onStaffDrawerOpen && (
              <button
                onClick={onStaffDrawerOpen}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Select staff"
              >
                <Users className="w-5 h-5 text-gray-400" />
              </button>
            )}

            {/* Date Controls - Only when sidebar is closed */}
            {showDateControls && (
              <>
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
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                    className="px-3 py-2 rounded-lg border border-gray-200/60 bg-white hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-700 min-w-[140px]"
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
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label="Next day"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}

            {/* Minimal date display when sidebar is open */}
            {!showDateControls && (
              <span className="hidden lg:inline text-sm font-medium text-gray-700">
                {formatDateDisplay(selectedDate)}
              </span>
            )}
          </div>

          {/* Center: Staff Filter (desktop) - Only when sidebar is closed */}
          {showStaffFilter && onStaffFilterChange && staff && staff.length > 0 && (
            <div className="hidden md:block">
              <StaffFilterDropdown
                staff={staff}
                selectedStaffIds={selectedStaffIds}
                onStaffFilterChange={onStaffFilterChange}
              />
            </div>
          )}

          {/* Right: Actions & Settings */}
          <div className="flex items-center gap-4">
            {/* Icon Buttons Group */}
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
                onClick={onNewAppointment}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-normal"
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
