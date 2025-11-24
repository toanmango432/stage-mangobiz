/**
 * StaffCardMetrics Component
 * Displays clocked-in time and turn count
 */

import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { formatClockedInTime } from '../utils/formatters';

interface StaffCardMetricsProps {
  time: string;
  turnCount: number;
  showClockedInTime: boolean;
  showTurnCount: boolean;
  metaSize: string;
  iconSize: number;
}

export const StaffCardMetrics = React.memo<StaffCardMetricsProps>(
  ({
    time,
    turnCount,
    showClockedInTime,
    showTurnCount,
    metaSize,
    iconSize,
  }) => {
    if (!showClockedInTime && !showTurnCount) {
      return null;
    }

    return (
      <div className="flex items-center justify-center bg-white/60 rounded-full border border-gray-200/50 shadow-sm px-3 py-1 mb-1 backdrop-blur-sm">
        {showClockedInTime && (
          <div className="flex items-center gap-1.5">
            <Clock size={iconSize} className="text-gray-400" />
            <span
              className={`${metaSize} font-mono tracking-tight text-gray-700 font-medium`}
            >
              {formatClockedInTime(time)}
            </span>
          </div>
        )}

        {showClockedInTime && showTurnCount && (
          <div className="w-px h-3 bg-gray-300 mx-2.5" />
        )}

        {showTurnCount && (
          <div className="flex items-center gap-1.5" title="Turns">
            <RefreshCw size={iconSize} className="text-gray-400" />
            <span className={`${metaSize} font-mono font-bold text-gray-700`}>
              {turnCount}
            </span>
          </div>
        )}
      </div>
    );
  }
);

StaffCardMetrics.displayName = 'StaffCardMetrics';
