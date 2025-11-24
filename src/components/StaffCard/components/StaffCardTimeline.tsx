/**
 * StaffCardTimeline Component
 * Displays last service and next appointment timeline
 */

import React from 'react';
import { formatTime } from '../utils/formatters';

interface StaffCardTimelineProps {
  lastServiceTime?: string;
  nextAppointmentTime?: string;
  timelineTextSize: string;
  isUltra: boolean;
}

export const StaffCardTimeline = React.memo<StaffCardTimelineProps>(
  ({ lastServiceTime, nextAppointmentTime, timelineTextSize, isUltra }) => {
    if (!lastServiceTime && !nextAppointmentTime) {
      return null;
    }

    return (
      <div className="flex items-center justify-between w-full px-1">
        {/* Last Service */}
        {lastServiceTime && (
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              {!isUltra && 'Last'}
            </div>
            <span
              className={`${timelineTextSize} font-mono font-medium text-gray-600`}
            >
              {formatTime(lastServiceTime)}
            </span>
          </div>
        )}

        {/* Connector Line (Horizontal) */}
        <div className="flex-1 h-px bg-gray-200 mx-2 mt-2" />

        {/* Next Appointment */}
        {nextAppointmentTime && (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1 text-[10px] text-blue-400 uppercase tracking-wider font-bold">
              {!isUltra && 'Next'}
              <div className="w-1 h-1 rounded-full bg-blue-400" />
            </div>
            <span
              className={`${timelineTextSize} font-mono font-bold text-blue-600 bg-blue-50 px-1.5 rounded-md`}
            >
              {formatTime(nextAppointmentTime)}
            </span>
          </div>
        )}
      </div>
    );
  }
);

StaffCardTimeline.displayName = 'StaffCardTimeline';
