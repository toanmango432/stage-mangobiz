/**
 * PriceResolutionSummary - Summary statistics card for price resolution modal.
 *
 * Displays:
 * - Total services affected by price changes
 * - Total variance (sum of all price differences)
 * - Pending count (services still needing resolution)
 *
 * @module PriceResolutionModal/PriceResolutionSummary
 */

import { colors } from '@/design-system';
import { formatCurrencyWithSign } from '@/utils/formatters';

/**
 * Summary statistics for display.
 */
export interface PriceResolutionSummaryData {
  /** Total number of services with price changes */
  totalServices: number;
  /** Sum of all price variances (current - booked) */
  totalVariance: number;
  /** Number of services still needing resolution */
  unresolvedCount: number;
}

/**
 * Props for PriceResolutionSummary component.
 */
export interface PriceResolutionSummaryProps {
  /** Summary statistics to display */
  summary: PriceResolutionSummaryData;
}

/**
 * Get the appropriate color style for variance display.
 */
function getVarianceColorStyle(variance: number): React.CSSProperties {
  if (variance > 0) {
    return { color: colors.status.warning.dark }; // Price increase
  }
  if (variance < 0) {
    return { color: colors.status.success.dark }; // Price decrease (favorable)
  }
  return {}; // No variance - default text color
}

/**
 * Summary card showing price change statistics.
 *
 * Shows total services affected, total variance amount, and pending count.
 * Uses design system colors for semantic meaning:
 * - Warning color for price increases (unfavorable)
 * - Success color for price decreases (favorable)
 *
 * @example
 * ```tsx
 * <PriceResolutionSummary
 *   summary={{
 *     totalServices: 3,
 *     totalVariance: 15.00,
 *     unresolvedCount: 2,
 *   }}
 * />
 * ```
 */
export function PriceResolutionSummary({ summary }: PriceResolutionSummaryProps) {
  const { totalServices, totalVariance, unresolvedCount } = summary;

  return (
    <div
      className="flex flex-wrap gap-3 p-3 rounded-lg border"
      style={{
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.light,
      }}
    >
      {/* Services Affected */}
      <div className="flex-1 min-w-[100px]">
        <p
          className="text-xs"
          style={{ color: colors.text.secondary }}
        >
          Services Affected
        </p>
        <p
          className="text-lg font-semibold"
          style={{ color: colors.text.primary }}
        >
          {totalServices}
        </p>
      </div>

      {/* Total Variance */}
      <div className="flex-1 min-w-[100px]">
        <p
          className="text-xs"
          style={{ color: colors.text.secondary }}
        >
          Total Variance
        </p>
        <p
          className="text-lg font-semibold"
          style={getVarianceColorStyle(totalVariance)}
        >
          {formatCurrencyWithSign(totalVariance, true)}
        </p>
      </div>

      {/* Pending (only shown when > 0) */}
      {unresolvedCount > 0 && (
        <div className="flex-1 min-w-[100px]">
          <p
            className="text-xs"
            style={{ color: colors.text.secondary }}
          >
            Pending
          </p>
          <p
            className="text-lg font-semibold"
            style={{ color: colors.status.warning.dark }}
          >
            {unresolvedCount}
          </p>
        </div>
      )}
    </div>
  );
}

export default PriceResolutionSummary;
