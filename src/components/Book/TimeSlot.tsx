/**
 * TimeSlot Component
 * Displays a single 15-minute time slot in the calendar
 */

import { memo } from 'react';
import { cn } from '../../lib/utils';
import { PIXELS_PER_15_MINUTES } from '../../constants/appointment';

interface TimeSlotProps {
  time: string;
  timeInSeconds: number;
  isCurrentTime?: boolean;
  isBlocked?: boolean;
  className?: string;
}

export const TimeSlot = memo(function TimeSlot({
  time,
  timeInSeconds,
  isCurrentTime = false,
  isBlocked = false,
  className,
}: TimeSlotProps) {
  return (
    <div
      data-time={time}
      data-time-seconds={timeInSeconds}
      className={cn(
        'relative border-b border-gray-200',
        'transition-colors duration-150',
        isCurrentTime && 'bg-blue-50',
        isBlocked && 'bg-gray-100 opacity-50',
        className
      )}
      style={{ height: `${PIXELS_PER_15_MINUTES}px` }}
    >
      {/* Time label (only show on hour marks) */}
      {time.endsWith(':00 AM') || time.endsWith(':00 PM') ? (
        <div className="absolute -left-16 top-0 w-14 text-right text-xs text-gray-500 font-medium">
          {time}
        </div>
      ) : null}

      {/* Current time indicator */}
      {isCurrentTime && (
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-blue-500 z-10">
          <div className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
});
