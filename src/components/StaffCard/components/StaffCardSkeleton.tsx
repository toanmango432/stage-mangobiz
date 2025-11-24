/**
 * StaffCardSkeleton Component
 * Loading placeholder for staff cards with shimmer animation
 */

import React from 'react';
import type { ViewMode } from '../StaffCardVertical';
import { CARD_DIMENSIONS } from '../constants/staffCardTokens';

interface StaffCardSkeletonProps {
  viewMode?: ViewMode;
}

/**
 * Skeleton loading state for staff cards
 * Provides visual feedback during data loading
 */
export const StaffCardSkeleton = React.memo<StaffCardSkeletonProps>(
  ({ viewMode = 'normal' }) => {
    const dimensions = CARD_DIMENSIONS[viewMode];
    const isUltra = viewMode === 'ultra-compact';
    const isCompact = viewMode === 'compact';

    return (
      <div
        className="relative flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 animate-pulse"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.cardRadius,
          border: '1px solid #E5E7EB',
        }}
        role="status"
        aria-label="Loading staff card"
      >
        {/* Shimmer Effect Overlay */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        {/* Notch Skeleton */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30">
          <div
            className="bg-gray-200 rounded-b-xl"
            style={{
              width: isUltra ? '40px' : '60px',
              height: isUltra ? '18px' : '24px',
            }}
          />
        </div>

        {/* Top Section - Avatar Area */}
        <div
          className="relative flex flex-col items-center pt-8 px-2"
          style={{ height: '70%' }}
        >
          {/* Queue Number Skeleton */}
          <div className="absolute top-3 left-3">
            <div
              className="bg-gray-200 rounded-lg"
              style={{
                width: isUltra ? '24px' : isCompact ? '34px' : '42px',
                height: isUltra ? '24px' : isCompact ? '34px' : '42px',
              }}
            />
          </div>

          {/* More Options Skeleton */}
          {!isUltra && (
            <div className="absolute top-3 right-3">
              <div className="bg-gray-200 rounded-full w-7 h-7" />
            </div>
          )}

          {/* Avatar Skeleton */}
          <div
            className="bg-gray-300 rounded-full mb-2"
            style={{
              width: dimensions.avatarSize,
              height: dimensions.avatarSize,
              border: '4px solid white',
            }}
          />

          {/* Name Skeleton */}
          <div className="w-full px-4 mb-2">
            <div
              className="bg-gray-200 rounded-md mx-auto"
              style={{
                width: isUltra ? '60%' : '80%',
                height: isUltra ? '14px' : isCompact ? '18px' : '20px',
              }}
            />
          </div>

          {/* Metrics Skeleton */}
          <div className="flex items-center gap-2 bg-gray-200/60 rounded-full px-3 py-1">
            <div className="w-12 h-3 bg-gray-300 rounded" />
            <div className="w-px h-3 bg-gray-300" />
            <div className="w-8 h-3 bg-gray-300 rounded" />
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200" />

        {/* Bottom Section - Timeline Area */}
        <div
          className="relative flex items-center justify-between px-3"
          style={{ height: '30%' }}
        >
          {/* Last Service Skeleton */}
          <div className="flex flex-col gap-1">
            <div className="w-2 h-2 bg-gray-200 rounded-full" />
            <div className="w-12 h-2 bg-gray-200 rounded" />
          </div>

          {/* Timeline Line */}
          <div className="flex-1 h-px bg-gray-200 mx-2" />

          {/* Next Appointment Skeleton */}
          <div className="flex flex-col gap-1 items-end">
            <div className="w-2 h-2 bg-blue-200 rounded-full" />
            <div className="w-12 h-2 bg-blue-200 rounded" />
          </div>
        </div>
      </div>
    );
  }
);

StaffCardSkeleton.displayName = 'StaffCardSkeleton';

/**
 * Grid of skeleton cards for initial page load
 */
interface StaffCardSkeletonGridProps {
  count?: number;
  viewMode?: ViewMode;
}

export const StaffCardSkeletonGrid = React.memo<StaffCardSkeletonGridProps>(
  ({ count = 6, viewMode = 'normal' }) => {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={`skeleton-${index}`} className="w-full">
            <StaffCardSkeleton viewMode={viewMode} />
          </div>
        ))}
      </>
    );
  }
);

StaffCardSkeletonGrid.displayName = 'StaffCardSkeletonGrid';
