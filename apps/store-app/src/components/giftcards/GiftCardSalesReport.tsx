/**
 * GiftCardSalesReport - Gift Card Sales Analytics
 *
 * Shows gift card sales metrics:
 * - Total issued (cards sold, total value)
 * - Redemption stats (cards redeemed, value redeemed)
 * - Reload stats
 * - Date range filtering
 *
 * Uses giftCardDB.getSalesSummary() for data
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Calendar,
  ArrowLeft,
  ChevronDown,
  Download,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { giftCardDB } from '../../db/giftCardOperations';
import { formatCurrency } from '../../utils/formatters';

// Date range presets
type DateRangePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

interface SalesSummary {
  totalIssued: number;
  totalRedeemed: number;
  totalReloaded: number;
  countIssued: number;
  countRedeemed: number;
}

interface GiftCardSalesReportProps {
  onBack?: () => void;
}

export default function GiftCardSalesReport({ onBack }: GiftCardSalesReportProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('month');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const storeId = useAppSelector((state) => state.auth.storeId) || '';

  // Calculate date range
  const getDateRange = useCallback((preset: DateRangePreset) => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: Date;

    switch (preset) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate: startDate.toISOString(), endDate };
  }, []);

  // Load sales summary
  const loadSummary = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const data = await giftCardDB.getSalesSummary(storeId, startDate, endDate);
      setSummary(data);
    } catch (error) {
      console.error('Failed to load sales summary:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId, dateRange, getDateRange]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Calculate derived metrics
  const metrics = summary
    ? {
        netRevenue: summary.totalIssued - summary.totalRedeemed,
        avgTicketValue:
          summary.countIssued > 0
            ? summary.totalIssued / summary.countIssued
            : 0,
        redemptionRate:
          summary.totalIssued > 0
            ? (summary.totalRedeemed / summary.totalIssued) * 100
            : 0,
      }
    : null;

  const currentPreset = DATE_PRESETS.find((p) => p.value === dateRange);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1
                    className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Gift Card Sales
                  </h1>
                  <p className="text-sm text-gray-500">Performance report</p>
                </div>
              </div>
            </div>
            <button
              onClick={loadSummary}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#1a5f4a]" />
              {currentPreset?.label || 'Select period'}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showDatePicker ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20 min-w-[160px]"
              >
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setDateRange(preset.value);
                      setShowDatePicker(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      dateRange === preset.value
                        ? 'text-[#1a5f4a] font-medium bg-[#1a5f4a]/5'
                        : 'text-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Total Issued */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Gift Cards Issued
                  </span>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {summary.countIssued} cards
                </span>
              </div>
              <div
                className="text-3xl font-bold text-gray-900 mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {formatCurrency(summary.totalIssued)}
              </div>
              <p className="text-xs text-gray-500">
                Avg {formatCurrency(metrics?.avgTicketValue || 0)} per card
              </p>
            </motion.div>

            {/* Total Redeemed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Gift Cards Redeemed
                  </span>
                </div>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  {summary.countRedeemed} uses
                </span>
              </div>
              <div
                className="text-3xl font-bold text-gray-900 mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {formatCurrency(summary.totalRedeemed)}
              </div>
              <p className="text-xs text-gray-500">
                {metrics?.redemptionRate.toFixed(1)}% of issued value
              </p>
            </motion.div>

            {/* Reloaded */}
            {summary.totalReloaded > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Gift Cards Reloaded
                  </span>
                </div>
                <div
                  className="text-3xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {formatCurrency(summary.totalReloaded)}
                </div>
              </motion.div>
            )}

            {/* Net Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] rounded-xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white/80">
                  Net Gift Card Revenue
                </span>
              </div>
              <div
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {formatCurrency(metrics?.netRevenue || 0)}
              </div>
              <p className="text-xs text-white/60">
                Issued minus redeemed (unspent liability)
              </p>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Cards Sold</p>
                <p
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {summary.countIssued}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Redemption Rate</p>
                <p
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {metrics?.redemptionRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900 mb-1"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              No data available
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Gift card sales data will appear here once cards are sold
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
