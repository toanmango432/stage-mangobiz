import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Coffee } from 'lucide-react';
import { Card } from '../../../components/SharedComponents';
import type { ShiftStatusCardProps } from '../types';
import { TIMER_UPDATE_INTERVAL_MS } from '../constants';

/**
 * Live shift status card component
 * Displays current shift timer, break status, and shift statistics
 */
export const ShiftStatusCard: React.FC<ShiftStatusCardProps> = ({
  clockInTime,
  totalBreakMinutes,
  isOnBreak,
  currentBreakStart,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, TIMER_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Calculate live worked time
  const getLiveWorkedTime = useCallback(() => {
    if (!clockInTime) return 0;
    const clockIn = new Date(clockInTime).getTime();
    const now = currentTime.getTime();
    let worked = Math.floor((now - clockIn) / (1000 * 60)); // in minutes

    // Subtract breaks
    worked -= totalBreakMinutes;

    // If on break, also subtract current break duration
    if (isOnBreak && currentBreakStart) {
      const breakStart = new Date(currentBreakStart).getTime();
      worked -= Math.floor((now - breakStart) / (1000 * 60));
    }

    return Math.max(0, worked);
  }, [clockInTime, currentTime, totalBreakMinutes, isOnBreak, currentBreakStart]);

  // Calculate current break duration
  const getCurrentBreakDuration = useCallback(() => {
    if (!isOnBreak || !currentBreakStart) return 0;
    const breakStart = new Date(currentBreakStart).getTime();
    const now = currentTime.getTime();
    return Math.floor((now - breakStart) / (1000 * 60));
  }, [isOnBreak, currentBreakStart, currentTime]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  };

  const formatClockTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!clockInTime) {
    return (
      <Card className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Not clocked in</p>
        <p className="text-sm text-gray-400 mt-1">Clock in to start tracking time</p>
      </Card>
    );
  }

  const liveWorked = getLiveWorkedTime();
  const currentBreakDuration = getCurrentBreakDuration();

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-600">Clocked In</span>
        </div>
        <span className="text-sm text-gray-500">
          Started at {formatClockTime(clockInTime)}
        </span>
      </div>

      {/* Main Timer */}
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-gray-800 font-mono">
          {formatTime(liveWorked)}
        </div>
        <p className="text-sm text-gray-500 mt-1">Time Worked</p>
      </div>

      {/* Break Status */}
      {isOnBreak && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Coffee className="w-4 h-4" />
            <span className="font-medium">On Break</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {formatTime(currentBreakDuration)}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {formatTime(totalBreakMinutes + currentBreakDuration)}
          </div>
          <p className="text-xs text-gray-500">Total Breaks</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {formatTime(liveWorked + totalBreakMinutes + currentBreakDuration)}
          </div>
          <p className="text-xs text-gray-500">Total Shift</p>
        </div>
      </div>
    </Card>
  );
};

export default ShiftStatusCard;
