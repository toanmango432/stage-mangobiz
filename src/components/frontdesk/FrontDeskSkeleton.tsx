/**
 * FrontDeskSkeleton Components
 * Loading placeholders for front desk ticket sections
 */

import { memo } from 'react';
import { cn } from '../../lib/utils';

type ViewMode = 'grid-normal' | 'grid-compact' | 'normal' | 'compact';

interface TicketCardSkeletonProps {
  viewMode?: ViewMode;
}

/**
 * Base skeleton element with pulse animation
 */
const Skeleton = memo(function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse bg-gray-200 rounded', className)}
      aria-hidden="true"
    />
  );
});

/**
 * Skeleton for ticket cards in Wait List and Service sections
 */
export const TicketCardSkeleton = memo<TicketCardSkeletonProps>(
  function TicketCardSkeleton({ viewMode = 'normal' }) {
    const isCompact = viewMode === 'compact' || viewMode === 'grid-compact';
    const isGrid = viewMode === 'grid-normal' || viewMode === 'grid-compact';

    if (isCompact) {
      // Compact view - single row
      return (
        <div
          className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100"
          role="status"
          aria-label="Loading ticket"
        >
          {/* Status strip */}
          <div className="w-1 h-8 bg-gray-200 rounded-full" />

          {/* Ticket number */}
          <Skeleton className="w-8 h-5 rounded" />

          {/* Client name */}
          <Skeleton className="flex-1 h-4 max-w-[120px] rounded" />

          {/* Time */}
          <Skeleton className="w-12 h-4 rounded" />
        </div>
      );
    }

    if (isGrid) {
      // Grid view - card layout
      return (
        <div
          className="flex flex-col p-4 bg-white rounded-lg border border-gray-100 h-[160px]"
          role="status"
          aria-label="Loading ticket"
        >
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-6 rounded" />
              <Skeleton className="w-16 h-4 rounded-full" />
            </div>
            <Skeleton className="w-6 h-6 rounded" />
          </div>

          {/* Client name */}
          <Skeleton className="w-3/4 h-5 mb-2 rounded" />

          {/* Service */}
          <Skeleton className="w-1/2 h-4 mb-auto rounded" />

          {/* Bottom info */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <Skeleton className="w-16 h-4 rounded" />
            <Skeleton className="w-12 h-4 rounded" />
          </div>
        </div>
      );
    }

    // Normal list view
    return (
      <div
        className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100"
        role="status"
        aria-label="Loading ticket"
      >
        {/* Status strip */}
        <div className="w-1 h-12 bg-gray-200 rounded-full" />

        {/* Ticket number */}
        <Skeleton className="w-10 h-6 rounded" />

        {/* Main content */}
        <div className="flex-1 space-y-2">
          <Skeleton className="w-1/3 h-4 rounded" />
          <Skeleton className="w-1/4 h-3 rounded" />
        </div>

        {/* Time and actions */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-4 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    );
  }
);

TicketCardSkeleton.displayName = 'TicketCardSkeleton';

/**
 * Grid of skeleton cards for initial section load
 */
interface TicketCardSkeletonGridProps {
  count?: number;
  viewMode?: ViewMode;
  className?: string;
}

export const TicketCardSkeletonGrid = memo<TicketCardSkeletonGridProps>(
  function TicketCardSkeletonGrid({ count = 4, viewMode = 'normal', className }) {
    const isGrid = viewMode === 'grid-normal' || viewMode === 'grid-compact';

    return (
      <div
        className={cn(
          isGrid
            ? 'grid gap-3'
            : 'space-y-2',
          isGrid && viewMode === 'grid-compact' && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
          isGrid && viewMode === 'grid-normal' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          className
        )}
        role="status"
        aria-label="Loading tickets"
      >
        {Array.from({ length: count }).map((_, index) => (
          <TicketCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
        ))}
      </div>
    );
  }
);

TicketCardSkeletonGrid.displayName = 'TicketCardSkeletonGrid';

/**
 * Section skeleton with header placeholder
 */
interface SectionSkeletonProps {
  headerHeight?: number;
  ticketCount?: number;
  viewMode?: ViewMode;
}

export const SectionSkeleton = memo<SectionSkeletonProps>(
  function SectionSkeleton({ headerHeight = 64, ticketCount = 4, viewMode = 'normal' }) {
    return (
      <div className="flex flex-col h-full" role="status" aria-label="Loading section">
        {/* Header skeleton */}
        <div
          className="flex items-center gap-3 px-4 bg-gray-50 border-b border-gray-100"
          style={{ height: headerHeight }}
        >
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-32 h-5 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 overflow-hidden">
          <TicketCardSkeletonGrid count={ticketCount} viewMode={viewMode} />
        </div>
      </div>
    );
  }
);

SectionSkeleton.displayName = 'SectionSkeleton';
