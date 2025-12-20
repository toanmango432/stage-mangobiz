/**
 * Staff Card Skeleton
 * Loading state for staff cards in sidebar
 */

import { ShimmerSkeleton } from './Skeleton';
import { cn } from '@/lib/utils';

interface StaffCardSkeletonProps {
  className?: string;
}

export function StaffCardSkeleton({ className }: StaffCardSkeletonProps) {
  return (
    <div
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white',
        'animate-fade-in',
        className
      )}
    >
      {/* Avatar */}
      <ShimmerSkeleton
        variant="circular"
        width={40}
        height={40}
        className="flex-shrink-0"
      />

      {/* Name & count */}
      <div className="flex-1 min-w-0 space-y-2">
        <ShimmerSkeleton variant="text" className="h-4 w-3/4" />
        <ShimmerSkeleton variant="text" className="h-3 w-1/2" />
        {/* Workload progress bar */}
        <ShimmerSkeleton variant="rectangular" className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

/**
 * Multiple staff card skeletons with staggered animation
 */
interface StaffCardSkeletonListProps {
  count?: number;
  className?: string;
}

export function StaffCardSkeletonList({
  count = 5,
  className,
}: StaffCardSkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            animationDelay: `${index * 80}ms`,
          }}
        >
          <StaffCardSkeleton />
        </div>
      ))}
    </div>
  );
}
