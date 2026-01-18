import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/store/hooks';
import {
  selectUnresolvedPriceChanges,
  selectServicePriceChanges,
} from '@/store/slices/uiTicketsSlice';
import { formatPriceVariance } from '@/utils/priceComparisonUtils';

/**
 * Props for the PriceChangeWarningBanner component.
 */
interface PriceChangeWarningBannerProps {
  /** The ID of the ticket to check for price changes */
  ticketId: string;
  /** Callback when user clicks to review/resolve price changes */
  onReview: () => void;
  /** If true, shows compact mode (icon + count only) for summary views */
  compact?: boolean;
}

/**
 * Warning banner displayed when a ticket has unresolved service price changes.
 * Shows when prices have changed since booking and staff needs to make a decision.
 *
 * @example
 * ```tsx
 * <PriceChangeWarningBanner
 *   ticketId="ticket-123"
 *   onReview={() => setShowResolutionModal(true)}
 * />
 * ```
 *
 * @example Compact mode for summary views
 * ```tsx
 * <PriceChangeWarningBanner
 *   ticketId="ticket-123"
 *   onReview={handleReview}
 *   compact
 * />
 * ```
 */
export default function PriceChangeWarningBanner({
  ticketId,
  onReview,
  compact = false,
}: PriceChangeWarningBannerProps) {
  // Get unresolved price changes (services needing staff decision)
  const unresolvedChanges = useAppSelector(selectUnresolvedPriceChanges(ticketId));
  // Get all price changes for variance calculation
  const allPriceChanges = useAppSelector(selectServicePriceChanges(ticketId));

  // Don't show banner if no unresolved changes
  if (!unresolvedChanges || unresolvedChanges.length === 0) {
    return null;
  }

  const changeCount = unresolvedChanges.length;

  // Calculate total variance from all price changes
  const totalVariance = allPriceChanges.reduce((sum, change) => sum + change.variance, 0);
  const avgVariancePercent = allPriceChanges.length > 0
    ? allPriceChanges.reduce((sum, change) => sum + change.variancePercent, 0) / allPriceChanges.length
    : 0;

  // Compact mode: icon + count for summary views
  if (compact) {
    return (
      <button
        onClick={onReview}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-200 transition-colors"
        aria-label={`${changeCount} service${changeCount !== 1 ? 's' : ''} with price changes. Click to review.`}
      >
        <Zap className="h-3 w-3" />
        <span>{changeCount}</span>
      </button>
    );
  }

  // Full banner mode
  return (
    <div
      className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200"
      role="alert"
      data-testid="price-change-warning-banner"
    >
      <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-800">
          Price Changes Detected
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {changeCount} service{changeCount !== 1 ? 's have' : ' has'} price changes since booking
          {totalVariance !== 0 && (
            <span className="ml-1 font-medium">
              ({formatPriceVariance(totalVariance, avgVariancePercent)})
            </span>
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 flex-shrink-0"
        onClick={onReview}
        data-testid="button-review-price-changes"
      >
        Review &amp; Resolve
      </Button>
    </div>
  );
}
