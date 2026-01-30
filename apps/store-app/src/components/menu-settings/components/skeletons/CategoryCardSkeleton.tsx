/**
 * CategoryCardSkeleton - Loading skeleton for category cards
 *
 * Matches the layout of category cards in CategoriesSection.tsx.
 * Shows animated placeholders for drag handle, icon, name, description,
 * service count, color badge, and menu button during loading.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface CategoryCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function CategoryCardSkeleton({ className }: CategoryCardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 ${className || ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <Skeleton className="w-5 h-8" />

        {/* Color Icon */}
        <Skeleton className="w-12 h-12 rounded-xl" />

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Service Count */}
        <div className="text-center px-4">
          <Skeleton className="h-6 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Color Badge */}
        <Skeleton className="w-6 h-6 rounded-full" />

        {/* Menu button */}
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default CategoryCardSkeleton;
