/**
 * BookSidebar Component
 * Collapsible sidebar with calendar picker and staff filter
 * Clean, minimal design matching DatePickerModal style
 */

import { memo, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose, Search, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StaffMember {
  id: string;
  name: string;
  photo?: string;
  isAvailable?: boolean;
  appointmentCount?: number;
}

interface BookSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  staff: StaffMember[];
  selectedStaffIds: string[];
  onStaffSelection: (staffIds: string[]) => void;
  /** Mode: 'sidebar' for desktop, 'drawer' for mobile overlay */
  mode?: 'sidebar' | 'drawer';
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: (Date | null)[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    grid.push(new Date(prevYear, prevMonth, daysInPrevMonth - i));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(new Date(year, month, day));
  }

  const remainingCells = 42 - grid.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    grid.push(new Date(nextYear, nextMonth, day));
  }

  return grid;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export const BookSidebar = memo(function BookSidebar({
  isOpen,
  onToggle,
  selectedDate,
  onDateChange,
  staff,
  selectedStaffIds,
  onStaffSelection,
  mode = 'sidebar',
  className,
}: BookSidebarProps) {
  const isDrawer = mode === 'drawer';
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  const calendarGrid = useMemo(
    () => getCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    return staff.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (date: Date) => {
    // Normalize to noon to avoid timezone shift issues
    // When we create Date(year, month, day), it's at local midnight
    // But timezone conversions can shift it by a day
    // Setting to noon (12:00) ensures the date stays correct across timezones
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, // Set to noon instead of midnight
      0,
      0,
      0
    );
    onDateChange(normalized);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    // Normalize to noon to avoid timezone issues
    const normalized = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0,
      0
    );
    onDateChange(normalized);
  };

  const handleJumpWeeks = (weeks: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeks * 7);
    setCurrentMonth(targetDate.getMonth());
    setCurrentYear(targetDate.getFullYear());
    // Normalize to noon to avoid timezone issues
    const normalized = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      12,
      0,
      0,
      0
    );
    onDateChange(normalized);
  };

  const handleToggleStaff = (staffId: string) => {
    if (selectedStaffIds.includes(staffId)) {
      onStaffSelection(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      onStaffSelection([...selectedStaffIds, staffId]);
    }
  };

  const handleSelectAll = () => {
    onStaffSelection(staff.map((s) => s.id));
  };

  const handleClearAll = () => {
    onStaffSelection([]);
  };

  // Drawer mode: full overlay with backdrop
  if (isDrawer) {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={onToggle}
        />
        {/* Drawer */}
        <div
          className={cn(
            'fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50',
            'flex flex-col shadow-2xl animate-slide-in-left',
            className
          )}
        >
          {renderContent()}
        </div>
      </>
    );
  }

  // Sidebar mode: inline collapsible
  return (
    <div
      className={cn(
        'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
        isOpen ? 'w-72' : 'w-0',
        className
      )}
    >
      {renderContent()}
    </div>
  );

  function renderContent() {
    return (
      <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 min-h-[52px]">
        <span className="text-sm font-medium text-gray-900">
          {isDrawer ? 'Date & Staff' : 'Quick Access'}
        </span>
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
          title={isDrawer ? 'Close' : 'Collapse sidebar'}
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-normal text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((date, index) => {
            if (!date) return <div key={index} />;

            const isCurrentMonth = date.getMonth() === currentMonth;
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={cn(
                  'aspect-square rounded-full text-xs font-normal transition-all',
                  'focus:outline-none focus:ring-1 focus:ring-gray-200',
                  isCurrentMonth ? 'text-gray-700' : 'text-gray-300',
                  isSelected && 'bg-gray-900 text-white hover:bg-gray-800',
                  isTodayDate && !isSelected && 'bg-gray-100',
                  !isSelected && 'hover:bg-gray-50'
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* Today + Week Jump Buttons */}
        <div className="mt-3 space-y-2">
          <button
            onClick={handleGoToToday}
            className="w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          >
            Today
          </button>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleJumpWeeks(1)}
              className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              +1w
            </button>
            <button
              onClick={() => handleJumpWeeks(2)}
              className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              +2w
            </button>
            <button
              onClick={() => handleJumpWeeks(3)}
              className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              +3w
            </button>
            <button
              onClick={() => handleJumpWeeks(4)}
              className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              +4w
            </button>
          </div>
        </div>
      </div>

      {/* Staff Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Staff Header */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Team</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              None
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1.5">
            {filteredStaff.map((staffMember) => {
              const isSelected = selectedStaffIds.includes(staffMember.id);
              return (
                <button
                  key={staffMember.id}
                  onClick={() => handleToggleStaff(staffMember.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all',
                    'hover:border-gray-300',
                    isSelected
                      ? 'bg-gray-50 border-gray-300'
                      : 'bg-white border-gray-200'
                  )}
                >
                  {/* Avatar */}
                  {staffMember.photo ? (
                    <img
                      src={staffMember.photo}
                      alt={staffMember.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-medium">
                      {staffMember.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {staffMember.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {staffMember.appointmentCount || 0} appts
                    </p>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                      isSelected
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-gray-300'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
            {filteredStaff.length === 0 && searchQuery && (
              <div className="text-center py-4 text-xs text-gray-500">
                No staff found
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {selectedStaffIds.length} of {staff.length} selected
          </p>
        </div>
      </div>
      </>
    );
  }
});
