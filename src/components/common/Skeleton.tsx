/**
 * Skeleton Loading Component
 * Provides loading placeholders while content loads
 */

import { memo } from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = memo(function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-gray-200 rounded', className)}
      aria-hidden="true"
    />
  );
});

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 && 'w-3/4',
            i === 1 && 'w-1/2',
            i === 2 && 'w-5/6',
            i > 2 && 'w-2/3'
          )}
        />
      ))}
    </div>
  );
});

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = memo(function SkeletonCard({
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}
      aria-hidden="true"
    >
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
});

interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SkeletonCircle = memo(function SkeletonCircle({
  size = 'md',
  className,
}: SkeletonCircleProps) {
  return (
    <Skeleton
      className={cn(
        'rounded-full',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-12 w-12',
        className
      )}
    />
  );
});

interface SkeletonButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SkeletonButton = memo(function SkeletonButton({
  variant = 'primary',
  size = 'md',
  className,
}: SkeletonButtonProps) {
  return (
    <Skeleton
      className={cn(
        'rounded-lg',
        size === 'sm' && 'h-8 w-20',
        size === 'md' && 'h-10 w-24',
        size === 'lg' && 'h-12 w-32',
        variant === 'primary' && 'bg-brand-200',
        variant === 'secondary' && 'bg-gray-200',
        className
      )}
    />
  );
});

// Appointment Card Skeleton (specific to Book module)
export const AppointmentCardSkeleton = memo(function AppointmentCardSkeleton() {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
      aria-hidden="true"
    >
      <div className="flex items-start gap-2">
        <SkeletonCircle size="sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
});

// Calendar Day View Skeleton
export const CalendarSkeleton = memo(function CalendarSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" variant="secondary" />
        </div>
      </div>

      {/* Time slots */}
      <div className="grid grid-cols-3 gap-4 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

// Client List Skeleton
export const ClientListSkeleton = memo(function ClientListSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
        >
          <SkeletonCircle size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
});
