/**
 * AddOnGroupSkeleton - Loading skeleton for add-on group cards
 *
 * Matches the layout of add-on group cards in AddOnsSection.tsx.
 * Shows animated placeholders for expand icon, group icon, name, description,
 * option count, and menu button during loading.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface AddOnGroupSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function AddOnGroupSkeleton({ className }: AddOnGroupSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 ${className || ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Expand Icon */}
        <Skeleton className="w-8 h-8 rounded-lg" />

        {/* Group Icon */}
        <Skeleton className="w-10 h-10 rounded-lg" />

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-56 mb-2" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Status Indicator */}
        <Skeleton className="w-8 h-8 rounded-lg" />

        {/* Menu button */}
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default AddOnGroupSkeleton;
