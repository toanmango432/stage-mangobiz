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
      <div className="flex items-center justify-center gap-2.5 mt-1.5 mb-0.5">
        {showClockedInTime && (
          <div className="flex items-center gap-1">
            <Clock size={iconSize} className="text-gray-400" strokeWidth={2.5} />
            <span
              className={`${metaSize} font-mono tracking-tight text-gray-600 font-semibold`}
            >
              {formatClockedInTime(time)}
            </span>
          </div>
        )}

        {showClockedInTime && showTurnCount && (
          <div className="w-1 h-1 rounded-full bg-gray-300" />
        )}

        {showTurnCount && (
          <div className="flex items-center gap-1" title="Turns">
            <RefreshCw size={iconSize} className="text-gray-500" strokeWidth={2.5} />
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
