/**
 * DatePickerModal Component
 * Premium calendar date picker dropdown for jumping to any date
 * Essential for efficient calendar navigation
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerModalProps {
  isOpen: boolean;
  selectedDate: Date;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
}

/**
 * Get days in month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get first day of month (0 = Sunday, 6 = Saturday)
 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get calendar grid (6 weeks x 7 days = 42 cells)
 */
function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

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

  // Next month's leading days (fill to 42 cells)
  const remainingCells = 42 - grid.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    grid.push(new Date(nextYear, nextMonth, day));
  }

  return grid;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if date is today
 */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Month names
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Day names
 */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DatePickerModal({
  isOpen,
  selectedDate,
  onClose,
  onDateSelect,
}: DatePickerModalProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Update view when selected date changes
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [isOpen, selectedDate]);

  // Generate calendar grids for current and next month
  const currentMonthGrid = getCalendarGrid(currentYear, currentMonth);
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthGrid = getCalendarGrid(nextMonthYear, nextMonth);

  // Navigation handlers
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

  // Quick jump handlers
  const handleJumpWeeks = (weeks: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weeks * 7));
    onDateSelect(targetDate);
    onClose();
  };

  // Date selection handler
  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  // Keyboard navigation and click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-sm border border-gray-200/40 w-[680px]"
      style={{ animation: 'slideDown 200ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {/* Two Month Calendar Grid */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-2 gap-12">
          {/* Current Month */}
          <div>
            <div className="flex items-center justify-center mb-5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-md hover:bg-gray-50 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="min-w-[140px] text-center">
                <div className="text-base font-medium text-gray-900">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </div>
              </div>
              <div className="w-8" /> {/* Spacer for alignment */}
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-normal text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {currentMonthGrid.map((date, index) => {
                if (!date) return <div key={index} />;

                const isCurrentMonth = date.getMonth() === currentMonth;
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'aspect-square rounded-full text-sm font-normal transition-all',
                      'focus:outline-none focus:ring-1 focus:ring-gray-200',
                      // Current month vs other months
                      isCurrentMonth
                        ? 'text-gray-700'
                        : 'text-gray-300',
                      // Selected date
                      isSelected &&
                        'bg-blue-500 text-white hover:bg-blue-600',
                      // Today (but not selected)
                      isTodayDate && !isSelected &&
                        'bg-gray-100',
                      // Default state
                      !isSelected && 'hover:bg-gray-50'
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Month */}
          <div>
            <div className="flex items-center justify-center mb-5">
              <div className="w-8" /> {/* Spacer for alignment */}
              <div className="min-w-[140px] text-center">
                <div className="text-base font-medium text-gray-900">
                  {MONTH_NAMES[nextMonth]} {nextMonthYear}
                </div>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-md hover:bg-gray-50 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-normal text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {nextMonthGrid.map((date, index) => {
                if (!date) return <div key={index} />;

                const isNextMonth = date.getMonth() === nextMonth;
                const isSelected = isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'aspect-square rounded-full text-sm font-normal transition-all',
                      'focus:outline-none focus:ring-1 focus:ring-gray-200',
                      // Current month vs other months
                      isNextMonth
                        ? 'text-gray-700'
                        : 'text-gray-300',
                      // Selected date
                      isSelected &&
                        'bg-blue-500 text-white hover:bg-blue-600',
                      // Today (but not selected)
                      isTodayDate && !isSelected &&
                        'bg-gray-100',
                      // Default state
                      !isSelected && 'hover:bg-gray-50'
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Jump Buttons */}
      <div className="px-8 pb-6 pt-0 border-t border-gray-100">
        <div className="flex items-center gap-2 pt-5">
          <button
            onClick={() => handleJumpWeeks(1)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-600"
          >
            In 1 week
          </button>
          <button
            onClick={() => handleJumpWeeks(2)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-600"
          >
            In 2 weeks
          </button>
          <button
            onClick={() => handleJumpWeeks(3)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-600"
          >
            In 3 weeks
          </button>
          <button
            onClick={() => handleJumpWeeks(4)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-600"
          >
            In 4 weeks
          </button>
          <button
            onClick={() => handleJumpWeeks(5)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-sm font-normal text-gray-600"
          >
            In 5 weeks
          </button>
        </div>
      </div>
    </div>
  );
}
