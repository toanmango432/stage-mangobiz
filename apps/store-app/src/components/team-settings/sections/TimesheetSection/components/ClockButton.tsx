import React from 'react';
import { Clock } from 'lucide-react';
import type { ClockButtonProps } from '../types';

/**
 * Clock in/out action button component
 * Displays a gradient button that toggles between clock in and clock out states
 */
export const ClockButton: React.FC<ClockButtonProps> = ({
  isClockedIn,
  isLoading,
  onClockIn,
  onClockOut,
}) => {
  return (
    <button
      onClick={isClockedIn ? onClockOut : onClockIn}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl
        font-semibold text-lg transition-all duration-300
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isClockedIn
          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30'
        }
      `}
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Clock className="w-6 h-6" />
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </>
      )}
    </button>
  );
};

export default ClockButton;
