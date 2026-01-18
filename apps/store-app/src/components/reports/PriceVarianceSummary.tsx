/**
 * PriceVarianceSummary Component
 *
 * Displays a summary of price variances across completed tickets.
 * Shows statistics including count of transactions with variance,
 * total variance amount, and breakdown by price decision type.
 *
 * @example
 * // Basic usage
 * <PriceVarianceSummary />
 *
 * @example
 * // With custom class
 * <PriceVarianceSummary className="mt-4" />
 */

import React, { useMemo, useState } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRightLeft,
  ChevronDown,
  DollarSign,
  Lock,
  Footprints,
  Gauge,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectCompletedTicketsWithPriceVariance, type PriceVarianceReportResult } from '@/store/slices/uiTicketsSlice';
import type { PriceDecision } from '@/types/Ticket';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

/**
 * Date range presets for filtering
 */
type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'all_time';

interface PriceVarianceSummaryProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get start of day for a date
 */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of week (Sunday) for a date
 */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of month for a date
 */
function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const prefix = amount < 0 ? '-' : amount > 0 ? '+' : '';
  return `${prefix}$${absAmount.toFixed(2)}`;
}

/**
 * Get date filter based on preset
 */
function getDateFilter(preset: DateRangePreset): { startDate?: Date; endDate?: Date } {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: now,
      };
    case 'this_week':
      return {
        startDate: startOfWeek(now),
        endDate: now,
      };
    case 'this_month':
      return {
        startDate: startOfMonth(now),
        endDate: now,
      };
    case 'all_time':
    default:
      return {}; // No filter
  }
}

/**
 * Labels for date range presets
 */
const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  this_week: 'This Week',
  this_month: 'This Month',
  all_time: 'All Time',
};

/**
 * Human-readable labels for price decisions
 */
const DECISION_LABELS: Record<PriceDecision, { label: string; description: string; icon: React.ElementType }> = {
  booked_honored: {
    label: 'Booked Price Honored',
    description: 'Original booking price was used',
    icon: CheckCircle,
  },
  catalog_applied: {
    label: 'Catalog Price Applied',
    description: 'Current catalog price was charged',
    icon: FileText,
  },
  lower_applied: {
    label: 'Lower Price Applied',
    description: 'Automatically applied the lower price',
    icon: TrendingDown,
  },
  manual_override: {
    label: 'Manual Override',
    description: 'Staff manually entered a custom price',
    icon: ArrowRightLeft,
  },
  deposit_locked: {
    label: 'Deposit Locked',
    description: 'Price locked by deposit payment',
    icon: Lock,
  },
  walk_in_current: {
    label: 'Walk-in Current',
    description: 'Walk-in used current catalog price',
    icon: Footprints,
  },
};

/**
 * Price Variance Summary Component
 */
export function PriceVarianceSummary({ className }: PriceVarianceSummaryProps) {
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');

  // Get date filter based on selected preset
  const dateFilter = useMemo(() => getDateFilter(dateRange), [dateRange]);

  // Get report data using selector
  const report: PriceVarianceReportResult = useAppSelector(
    selectCompletedTicketsWithPriceVariance(dateFilter)
  );

  // Calculate additional metrics
  const metrics = useMemo(() => {
    const { totalVarianceAmount, totalOverridesCount, ticketCount, decisionBreakdown } = report;

    // Average variance per ticket
    const avgVariancePerTicket = ticketCount > 0 ? totalVarianceAmount / ticketCount : 0;

    // Variance direction counts
    const positiveVariances = report.tickets.reduce((count, ticket) => {
      return count + (ticket.checkoutServices?.filter(s => (s.priceVariance ?? 0) > 0).length ?? 0);
    }, 0);
    const negativeVariances = report.tickets.reduce((count, ticket) => {
      return count + (ticket.checkoutServices?.filter(s => (s.priceVariance ?? 0) < 0).length ?? 0);
    }, 0);

    // Total decisions made
    const totalDecisions = Object.values(decisionBreakdown).reduce((sum, count) => sum + count, 0);

    return {
      avgVariancePerTicket,
      positiveVariances,
      negativeVariances,
      totalDecisions,
      overrideRate: totalDecisions > 0 ? (totalOverridesCount / totalDecisions) * 100 : 0,
    };
  }, [report]);

  // Get top decision types (non-zero counts)
  const activeDecisions = useMemo(() => {
    return (Object.entries(report.decisionBreakdown) as [PriceDecision, number][])
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
  }, [report.decisionBreakdown]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Price Variance Summary</h3>
            <p className="text-sm text-gray-500">
              {report.ticketCount} {report.ticketCount === 1 ? 'transaction' : 'transactions'} with price changes
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(DATE_RANGE_LABELS) as [DateRangePreset, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Variance */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <DollarSign className="h-5 w-5 text-gray-600" />
            </div>
            {report.totalVarianceAmount !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  report.totalVarianceAmount > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {report.totalVarianceAmount > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {report.totalVarianceAmount > 0 ? 'Revenue Up' : 'Revenue Down'}
              </div>
            )}
          </div>
          <div className="mt-3">
            <div
              className={cn(
                'text-2xl font-bold',
                report.totalVarianceAmount > 0
                  ? 'text-green-600'
                  : report.totalVarianceAmount < 0
                  ? 'text-red-600'
                  : 'text-gray-900'
              )}
            >
              {formatCurrency(report.totalVarianceAmount)}
            </div>
            <div className="text-sm text-gray-500">Total Variance</div>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{report.ticketCount}</div>
            <div className="text-sm text-gray-500">Transactions with Variance</div>
          </div>
        </div>

        {/* Override Count */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{report.totalOverridesCount}</div>
            <div className="text-sm text-gray-500">Price Overrides</div>
          </div>
        </div>

        {/* Override Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Gauge className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.overrideRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Override Rate</div>
          </div>
        </div>
      </div>

      {/* Decision Breakdown */}
      {activeDecisions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h4 className="mb-4 text-sm font-semibold text-gray-900">Decision Breakdown</h4>
          <div className="space-y-3">
            {activeDecisions.map(([decision, count]) => {
              const config = DECISION_LABELS[decision];
              const Icon = config.icon;
              const percentage =
                metrics.totalDecisions > 0 ? (count / metrics.totalDecisions) * 100 : 0;

              return (
                <div key={decision} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{config.label}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          decision === 'booked_honored'
                            ? 'bg-green-500'
                            : decision === 'manual_override'
                            ? 'bg-amber-500'
                            : decision === 'deposit_locked'
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs text-gray-400">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Variance Direction Summary */}
      {(metrics.positiveVariances > 0 || metrics.negativeVariances > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Price Increases */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Price Increases</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-green-700">
              {metrics.positiveVariances}
            </div>
            <div className="text-xs text-green-600">services charged higher than booked</div>
          </div>

          {/* Price Decreases */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Price Decreases</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-red-700">
              {metrics.negativeVariances}
            </div>
            <div className="text-xs text-red-600">services charged lower than booked</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {report.ticketCount === 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <Zap className="mx-auto h-12 w-12 text-gray-300" />
          <h4 className="mt-4 text-sm font-medium text-gray-900">No Price Variances</h4>
          <p className="mt-1 text-sm text-gray-500">
            No transactions with price changes found for the selected period.
          </p>
        </div>
      )}
    </div>
  );
}

export default PriceVarianceSummary;
