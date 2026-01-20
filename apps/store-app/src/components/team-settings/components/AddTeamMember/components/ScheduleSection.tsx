import React from 'react';
import { Toggle } from '../../SharedComponents';
import type { WorkingDay } from '../../../types';
import { dayNames } from '../../../constants';

interface ScheduleSectionProps {
  workingHours: WorkingDay[];
  onToggleWorkingDay: (dayIndex: number) => void;
  onUpdateShiftTime: (dayIndex: number, field: 'startTime' | 'endTime', value: string) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  workingHours,
  onToggleWorkingDay,
  onUpdateShiftTime,
}) => {
  const workingDaysCount = workingHours.filter(d => d.isWorking).length;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-cyan-50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-medium text-cyan-900">Set Working Hours</h3>
            <p className="text-sm text-cyan-700 mt-0.5">
              Configure the regular weekly schedule. You can always adjust this later.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {workingHours.map((day, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-xl border-2 transition-all
              ${day.isWorking
                ? 'bg-white border-cyan-200 shadow-sm'
                : 'bg-gray-50 border-transparent'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Toggle
                  enabled={day.isWorking}
                  onChange={() => onToggleWorkingDay(index)}
                />
                <span className={`font-medium ${day.isWorking ? 'text-gray-900' : 'text-gray-400'}`}>
                  {dayNames[index]}
                </span>
              </div>

              {day.isWorking && day.shifts[0] && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.shifts[0].startTime}
                    onChange={(e) => onUpdateShiftTime(index, 'startTime', e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={day.shifts[0].endTime}
                    onChange={(e) => onUpdateShiftTime(index, 'endTime', e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              )}

              {!day.isWorking && (
                <span className="text-sm text-gray-400">Day off</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Working days per week:</span>
          <span className="font-semibold text-gray-900">{workingDaysCount} days</span>
        </div>
      </div>
    </div>
  );
};

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default ScheduleSection;
