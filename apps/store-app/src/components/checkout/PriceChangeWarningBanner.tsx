import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/store/hooks';
import {
  selectUnresolvedPriceChanges,
  selectServicePriceChanges,
} from '@/store/slices/uiTicketsSlice';
import { formatPriceVariance } from '@/utils/priceComparisonUtils';
import { colors } from '@/design-system';

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
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
        style={{
          backgroundColor: colors.status.warning.light,
          color: colors.status.warning.dark,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.status.warning.main + '33'; // 20% opacity
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.status.warning.light;
        }}
        aria-label={`${changeCount} service${changeCount !== 1 ? 's' : ''} with price changes. Click to review.`}
      >
        <Zap className="h-3 w-3" />
        <span>{changeCount}</span>
      </button>
    );
  }

  // Warning color styles for the banner
  const warningBorderColor = `${colors.status.warning.main}66`; // ~40% opacity for border

  // Full banner mode
  return (
    <div
      className="flex items-start gap-2 p-2.5 rounded-lg"
      style={{
        backgroundColor: colors.status.warning.light,
        border: `1px solid ${warningBorderColor}`,
      }}
      role="alert"
      data-testid="price-change-warning-banner"
    >
      <Zap
        className="h-4 w-4 flex-shrink-0 mt-0.5"
        style={{ color: colors.status.warning.dark }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold"
          style={{ color: colors.status.warning.dark }}
        >
          Price Changes Detected
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: colors.status.warning.dark }}
        >
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
        className="h-7 px-2 text-xs flex-shrink-0"
        style={{ color: colors.status.warning.dark }}
        onClick={onReview}
        data-testid="button-review-price-changes"
      >
        Review &amp; Resolve
      </Button>
    </div>
  );
}
