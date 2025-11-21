/**
 * BookSidebar Component
 * Collapsible sidebar with calendar picker and staff filter
 * Two modes: expanded (full sidebar) or collapsed (hidden)
 */

import { memo, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  Calendar,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface StaffMember {
  id: string;
  name: string;
  photo?: string;
  isAvailable?: boolean;
  appointmentCount?: number;
}

interface BookSidebarProps {
  // Sidebar state
  isOpen: boolean;
  onToggle: () => void;

  // Date picker props
  selectedDate: Date;
  onDateChange: (date: Date) => void;

  // Staff filter props
  staff: StaffMember[];
  selectedStaffIds: string[];
  onStaffSelection: (staffIds: string[]) => void;

  className?: string;
}

// Mini Calendar Component
function MiniCalendar({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const monthYear = viewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [viewDate]);

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="p-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthYear}</span>
        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => onDateChange(date)}
                className={cn(
                  'w-full h-full rounded-lg text-xs font-medium transition-all',
                  'hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500',
                  isSelected(date) && 'bg-teal-500 text-white hover:bg-teal-600',
                  isToday(date) && !isSelected(date) && 'ring-2 ring-teal-500 text-teal-600',
                  !isSelected(date) && !isToday(date) && 'text-gray-700'
                )}
              >
                {date.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Today Button */}
      <button
        onClick={() => {
          const today = new Date();
          setViewDate(today);
          onDateChange(today);
        }}
        className="w-full mt-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
      >
        Today
      </button>
    </div>
  );
}

// Staff Filter List Component
function StaffFilterList({
  staff,
  selectedStaffIds,
  onStaffSelection,
}: {
  staff: StaffMember[];
  selectedStaffIds: string[];
  onStaffSelection: (staffIds: string[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter((s) => s.name.toLowerCase().includes(query));
  }, [staff, searchQuery]);

  const toggleStaff = (staffId: string) => {
    if (selectedStaffIds.includes(staffId)) {
      onStaffSelection(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      onStaffSelection([...selectedStaffIds, staffId]);
    }
  };

  const selectAll = () => {
    onStaffSelection(staff.map((s) => s.id));
  };

  const clearAll = () => {
    onStaffSelection([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 flex gap-2 border-b border-gray-100">
        <button
          onClick={selectAll}
          className="flex-1 py-1.5 text-[10px] font-medium text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
        >
          Select All
        </button>
        <button
          onClick={clearAll}
          className="flex-1 py-1.5 text-[10px] font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredStaff.map((staffMember) => {
            const isSelected = selectedStaffIds.includes(staffMember.id);
            return (
              <button
                key={staffMember.id}
                onClick={() => toggleStaff(staffMember.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 p-2 rounded-lg transition-all',
                  'hover:bg-gray-50',
                  isSelected && 'bg-teal-50 hover:bg-teal-100'
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                    {staffMember.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {staffMember.name}
                  </p>
                  {staffMember.appointmentCount !== undefined && (
                    <p className="text-[10px] text-gray-500">
                      {staffMember.appointmentCount} appts
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-500 text-center">
          {selectedStaffIds.length} of {staff.length} selected
        </p>
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'staff'>('calendar');

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out',
          isOpen ? 'w-64' : 'w-0 overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Quick Access</h2>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'calendar'
                ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Date
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === 'staff'
                ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Staff ({selectedStaffIds.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'calendar' && (
            <MiniCalendar
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
          )}
          {activeTab === 'staff' && (
            <StaffFilterList
              staff={staff}
              selectedStaffIds={selectedStaffIds}
              onStaffSelection={onStaffSelection}
            />
          )}
        </div>
      </div>

      {/* Collapsed Toggle Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={cn(
            'fixed left-2 top-20 z-20',
            'p-2.5 rounded-lg',
            'bg-white border border-gray-200 shadow-md',
            'text-gray-600 hover:text-teal-600 hover:border-teal-300',
            'transition-all duration-200',
            'hover:shadow-lg'
          )}
          title="Expand sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}
    </>
  );
});
