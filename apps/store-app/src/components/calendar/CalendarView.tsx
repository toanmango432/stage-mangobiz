import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Filter, Search } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  onNewAppointment: () => void;
}

export function CalendarView({ onDateSelect, selectedDate, onNewAppointment }: CalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    onDateSelect(today);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-md transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Appointment</span>
          </button>
        </div>
      </div>

      {/* Week view */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                flex flex-col items-center py-3 border-r border-gray-200 last:border-r-0
                transition-all
                ${isSelected 
                  ? 'bg-gradient-to-b from-orange-50 to-pink-50 border-b-2 border-orange-500' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <span className={`text-xs font-medium ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`
                text-lg font-semibold mt-1
                ${isCurrentDay && !isSelected ? 'w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full' : ''}
                ${isSelected ? 'text-orange-600' : 'text-gray-900'}
              `}>
                {format(day, 'd')}
              </span>
              {/* Appointment count indicator */}
              <div className="flex gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
