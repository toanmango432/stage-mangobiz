/**
 * BookSidebar Component
 * Collapsible sidebar with calendar picker and staff filter
 * Clean, minimal design matching DatePickerModal style
 */

import { memo, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StaffChip } from './StaffChip';

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

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    grid.push(new Date(prevYear, prevMonth, daysInPrevMonth - i));
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(new Date(year, month, day));
  }

  // Fill remaining cells (up to 42 for 6 rows)
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
  className,
}: BookSidebarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const calendarGrid = useMemo(
    () => getCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

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
    onDateChange(date);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    onDateChange(today);
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

  return (
    <div
      className={cn(
        'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
        isOpen ? 'w-72' : 'w-0',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-900">Quick Access</span>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
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

        {/* Today Button */}
        <button
          onClick={handleGoToToday}
          className="w-full mt-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
        >
          Today
        </button>
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

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-2">
            {staff.map((staffMember, index) => (
              <StaffChip
                key={staffMember.id}
                staff={{
                  id: staffMember.id,
                  name: staffMember.name,
                  appointments: staffMember.appointmentCount || 0,
                  isActive: staffMember.isAvailable,
                }}
                index={index}
                isSelected={selectedStaffIds.includes(staffMember.id)}
                onClick={() => handleToggleStaff(staffMember.id)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {selectedStaffIds.length} of {staff.length} selected
          </p>
        </div>
      </div>
    </div>
  );
});
