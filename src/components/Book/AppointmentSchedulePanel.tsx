import React from 'react';
import { Zap, Layers } from 'lucide-react';

interface AppointmentSchedulePanelProps {
  date: Date;
  defaultStartTime: string;
  timeMode: 'sequential' | 'parallel';
  appointmentNotes: string;
  onDateChange: (date: Date) => void;
  onStartTimeChange: (time: string) => void;
  onTimeModeChange: (mode: 'sequential' | 'parallel') => void;
  onNotesChange: (notes: string) => void;
}

export function AppointmentSchedulePanel({
  date,
  defaultStartTime,
  timeMode,
  appointmentNotes,
  onDateChange,
  onStartTimeChange,
  onTimeModeChange,
  onNotesChange,
}: AppointmentSchedulePanelProps) {
  return (
    <>
      {/* Date & Time - COMPACT & FUNCTIONAL */}
      <div className="p-5 border-b border-gray-100 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Time
            </label>
            <input
              type="time"
              value={defaultStartTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>
        {/* Sequential/Parallel - ULTRA MINIMAL */}
        <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-600">Service timing</span>
          <button
            onClick={() =>
              onTimeModeChange(timeMode === 'sequential' ? 'parallel' : 'sequential')
            }
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-all"
            title={
              timeMode === 'sequential'
                ? 'Sequential: One after another'
                : 'Parallel: All at same time'
            }
          >
            {timeMode === 'sequential' ? (
              <Zap className="w-3.5 h-3.5" />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">{timeMode}</span>
          </button>
        </div>
      </div>

      {/* Appointment Notes */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Notes / Special Requests
        </label>
        <textarea
          value={appointmentNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any special requests, preferences, or important notes..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
        />
      </div>
    </>
  );
}

