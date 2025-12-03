/**
 * Calendar View Skeletons
 * Loading states for different calendar views
 */

import { ShimmerSkeleton, Skeleton } from './Skeleton';

/**
 * Day View Skeleton - Staff columns with time slots
 */
export function DayViewSkeleton() {
  return (
    <div className="h-full flex">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200 p-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-16 flex items-start">
            <Skeleton variant="text" className="h-3 w-10" />
          </div>
        ))}
      </div>

      {/* Staff columns */}
      <div className="flex-1 flex">
        {Array.from({ length: 3 }).map((_, staffIndex) => (
          <div
            key={staffIndex}
            className="flex-1 border-r border-gray-200 last:border-r-0 p-4"
            style={{
              animationDelay: `${staffIndex * 100}ms`,
            }}
          >
            {/* Staff header */}
            <div className="mb-4 flex items-center gap-2">
              <ShimmerSkeleton variant="circular" width={32} height={32} />
              <ShimmerSkeleton variant="text" className="h-4 w-24" />
            </div>

            {/* Appointment cards at various heights */}
            {[60, 180, 320, 480].map((top, index) => (
              <div
                key={index}
                className="absolute left-4 right-4 p-2 bg-white border border-gray-200 rounded-lg"
                style={{
                  top: `${top}px`,
                  height: '80px',
                }}
              >
                <ShimmerSkeleton variant="text" className="h-3 w-3/4 mb-2" />
                <ShimmerSkeleton variant="text" className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Week View Skeleton - Week grid with day columns
 */
export function WeekViewSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Week header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="p-4 text-center border-r border-gray-200 last:border-r-0"
            style={{
              animationDelay: `${i * 50}ms`,
            }}
          >
            <ShimmerSkeleton variant="text" className="h-3 w-8 mx-auto mb-1" />
            <ShimmerSkeleton variant="text" className="h-6 w-6 mx-auto mb-1" />
            <ShimmerSkeleton variant="text" className="h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="flex-1 grid grid-cols-7">
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div
            key={dayIndex}
            className="border-r border-gray-200 last:border-r-0 p-2 space-y-2"
            style={{
              animationDelay: `${dayIndex * 70}ms`,
            }}
          >
            {/* Random appointment cards */}
            {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, aptIndex) => (
              <div
                key={aptIndex}
                className="p-2 bg-white border border-gray-200 rounded-lg"
              >
                <ShimmerSkeleton variant="text" className="h-3 w-3/4 mb-1" />
                <ShimmerSkeleton variant="text" className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Month View Skeleton - Month grid with day cells
 */
export function MonthViewSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Month header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_day, i) => (
          <div
            key={i}
            className="p-3 text-center border-r border-gray-200 last:border-r-0"
          >
            <Skeleton variant="text" className="h-3 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5">
        {Array.from({ length: 35 }).map((_cellIndex, cellIndex) => {
          const row = Math.floor(cellIndex / 7);
          const col = cellIndex % 7;

          return (
            <div
              key={cellIndex}
              className="relative p-2 min-h-[80px] border-r border-b border-gray-200 last:border-r-0"
              style={{
                animationDelay: `${(row * 7 + col) * 20}ms`,
              }}
            >
              {/* Day number */}
              <ShimmerSkeleton variant="text" className="h-4 w-6 mb-2" />

              {/* Random appointment badges */}
              {Array.from({ length: Math.floor(Math.random() * 3) }).map((_, badgeIndex) => (
                <div key={badgeIndex} className="mb-1">
                  <ShimmerSkeleton variant="text" className="h-5 w-full" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Loading overlay for view transitions
 */
interface CalendarLoadingOverlayProps {
  message?: string;
}

export function CalendarLoadingOverlay({ message = 'Loading calendar...' }: CalendarLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
