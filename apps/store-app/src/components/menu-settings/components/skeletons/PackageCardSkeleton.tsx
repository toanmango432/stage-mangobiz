/**
 * PackageCardSkeleton - Loading skeleton for package cards
 *
 * Matches the layout of package cards in PackagesSection.tsx grid view.
 * Shows animated placeholders for header, name, description,
 * services list, pricing, and meta info during loading.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface PackageCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function PackageCardSkeleton({ className }: PackageCardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className || ''}`}
    >
      {/* Savings banner placeholder */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="p-4">
        {/* Header - Icon and menu button */}
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* Package name */}
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* Description */}
        <Skeleton className="h-4 w-full mb-3" />

        {/* Services list placeholder */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Meta Info - Duration and availability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Pricing row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageCardSkeleton;
