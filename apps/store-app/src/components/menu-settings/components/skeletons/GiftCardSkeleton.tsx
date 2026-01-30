/**
 * GiftCardSkeleton - Loading skeleton for gift card denomination cards
 *
 * Matches the layout of denomination cards in GiftCardsSection.tsx.
 * Shows animated placeholders for icon, amount, and label during loading.
 */

import { Skeleton } from '@/components/ui/skeleton';

interface GiftCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

export function GiftCardSkeleton({ className }: GiftCardSkeletonProps) {
  return (
    <div
      className={`bg-gray-100 rounded-xl p-4 ${className || ''}`}
    >
      {/* Gift Icon */}
      <Skeleton className="w-6 h-6 mb-2" />

      {/* Amount */}
      <Skeleton className="h-8 w-16 mb-2" />

      {/* Label */}
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export default GiftCardSkeleton;
