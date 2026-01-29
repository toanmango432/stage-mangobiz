/**
 * ProductCardSkeleton - Loading skeleton for product cards
 *
 * Matches the layout of product cards in ProductsSection.tsx grid view.
 * Shows animated placeholders for name, SKU, brand, pricing,
 * margin, and meta info during loading.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className || ''}`}
    >
      <div className="p-4">
        {/* Header - Name and menu button */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-3/4" />
            </div>
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* SKU and Brand */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Pricing row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
