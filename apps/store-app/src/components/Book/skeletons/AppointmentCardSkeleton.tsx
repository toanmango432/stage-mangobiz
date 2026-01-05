/**
 * Appointment Card Skeleton
 * Loading state for appointment cards in calendar
 */

import { ShimmerSkeleton } from './Skeleton';
import { cn } from '@/lib/utils';

interface AppointmentCardSkeletonProps {
  className?: string;
  compact?: boolean;
}

export function AppointmentCardSkeleton({ className, compact = false }: AppointmentCardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-3',
        'animate-fade-in',
        className
      )}
    >
      {/* Client name */}
      <ShimmerSkeleton
        variant="text"
        className="h-4 w-3/4 mb-2"
      />

      {!compact && (
        <>
          {/* Service name */}
          <ShimmerSkeleton
            variant="text"
            className="h-3 w-1/2 mb-2"
          />

          {/* Time & price */}
          <div className="flex items-center justify-between mt-2">
            <ShimmerSkeleton variant="text" className="h-3 w-16" />
            <ShimmerSkeleton variant="text" className="h-3 w-12" />
          </div>

          {/* Status badge */}
          <div className="mt-2">
            <ShimmerSkeleton variant="rectangular" className="h-5 w-20 rounded-full" />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Multiple appointment card skeletons with staggered animation
 */
interface AppointmentCardSkeletonListProps {
  count?: number;
  className?: string;
  compact?: boolean;
}

export function AppointmentCardSkeletonList({
  count = 3,
  className,
  compact = false,
}: AppointmentCardSkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <AppointmentCardSkeleton compact={compact} />
        </div>
      ))}
    </div>
  );
}
