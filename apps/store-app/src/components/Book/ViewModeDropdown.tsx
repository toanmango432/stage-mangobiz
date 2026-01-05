/**
 * ViewModeDropdown Component
 * Minimal dropdown for calendar view selection
 * Consolidates Day/Week/Month/Agenda views into single dropdown
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { CalendarView } from '../../constants/appointment';
import { ChevronDown, Calendar, LayoutGrid } from 'lucide-react';

interface ViewModeDropdownProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  className?: string;
}

const VIEW_OPTIONS = [
  {
    value: 'day' as CalendarView,
    label: 'Day',
    icon: Calendar,
  },
  {
    value: 'week' as CalendarView,
    label: 'Week',
    icon: LayoutGrid,
  },
  {
    value: 'month' as CalendarView,
    label: 'Month',
    icon: Calendar,
  },
];

export function ViewModeDropdown({
  currentView,
  onViewChange,
  className,
}: ViewModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current view label
  const currentLabel = VIEW_OPTIONS.find(opt => opt.value === currentView)?.label || 'Day';

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleViewSelect = (view: CalendarView) => {
    onViewChange(view);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-3 py-2 rounded-lg',
          'border border-gray-200/60',
          'bg-white',
          'hover:border-gray-300 hover:bg-gray-50/50',
          'transition-all',
          'text-sm font-normal text-gray-700',
          'flex items-center gap-2',
          'min-w-[100px]',
          isOpen && 'border-gray-300 bg-gray-50/50'
        )}
      >
        {currentLabel}
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-sm border border-gray-200/40 min-w-[140px] py-1"
          style={{ animation: 'slideDown 150ms ease-out' }}
        >
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === currentView;

            return (
              <button
                key={option.value}
                onClick={() => handleViewSelect(option.value)}
                className={cn(
                  'w-full px-3 py-2 text-left',
                  'flex items-center gap-2',
                  'text-sm font-normal',
                  'transition-colors',
                  isSelected
                    ? 'bg-gray-50 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {option.label}
                {isSelected && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
