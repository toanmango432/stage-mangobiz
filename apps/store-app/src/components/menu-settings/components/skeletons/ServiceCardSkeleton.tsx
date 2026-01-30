/**
 * ServiceCardSkeleton - Loading skeleton for service cards
 *
 * Matches the layout of service cards in ServicesSection.tsx grid view.
 * Shows animated placeholders for icon, title, description, duration/price,
 * and tags during loading.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface ServiceCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function ServiceCardSkeleton({ className }: ServiceCardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 ${className || ''}`}
    >
      {/* Header - Icon and menu button */}
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Service name */}
      <Skeleton className="h-5 w-3/4 mb-2" />

      {/* Description (2 lines) */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />

      {/* Meta Info - Duration and Price */}
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default ServiceCardSkeleton;
