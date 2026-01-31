/**
 * GiftCardLiabilityReport - Gift Card Outstanding Balance Report
 *
 * Shows gift card liability (unredeemed balances):
 * - Total outstanding balance
 * - Cards expiring soon
 * - Breakdown by status
 *
 * Uses giftCardDB.getTotalLiability() and getExpiringGiftCards()
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  DollarSign,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { dataService } from '../../services/dataService';
import type { GiftCard } from '../../types/gift-card';
import { formatCurrency } from '../../utils/formatters';

interface LiabilityData {
  totalLiability: number;
  activeCards: GiftCard[];
  expiringIn30Days: GiftCard[];
  expiringIn60Days: GiftCard[];
  expiringIn90Days: GiftCard[];
}

interface GiftCardLiabilityReportProps {
  onBack?: () => void;
  onViewCard?: (card: GiftCard) => void;
}

export default function GiftCardLiabilityReport({
  onBack,
  onViewCard,
}: GiftCardLiabilityReportProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LiabilityData | null>(null);

  const storeId = useAppSelector((state) => state.auth.storeId) || '';

  // Load liability data
  const loadData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [totalLiability, activeCards, expiring30, expiring60, expiring90] =
        await Promise.all([
          dataService.giftCards.getLiability(storeId) as Promise<number>,
          dataService.giftCards.getByStatus(storeId, 'active') as Promise<GiftCard[]>,
          dataService.giftCards.getExpiring(storeId, 30) as Promise<GiftCard[]>,
          dataService.giftCards.getExpiring(storeId, 60) as Promise<GiftCard[]>,
          dataService.giftCards.getExpiring(storeId, 90) as Promise<GiftCard[]>,
        ]);

      setData({
        totalLiability,
        activeCards,
        expiringIn30Days: expiring30,
        expiringIn60Days: expiring60.filter(
          (gc) => !expiring30.some((e) => e.id === gc.id)
        ),
        expiringIn90Days: expiring90.filter(
          (gc) =>
            !expiring30.some((e) => e.id === gc.id) &&
            !expiring60.some((e) => e.id === gc.id)
        ),
      });
    } catch (error) {
      console.error('Failed to load liability data:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate metrics
  const metrics = data
    ? {
        avgBalance:
          data.activeCards.length > 0
            ? data.totalLiability / data.activeCards.length
            : 0,
        totalExpiring30:
          data.expiringIn30Days.reduce((sum, gc) => sum + gc.currentBalance, 0),
        totalExpiring60:
          data.expiringIn60Days.reduce((sum, gc) => sum + gc.currentBalance, 0),
        totalExpiring90:
          data.expiringIn90Days.reduce((sum, gc) => sum + gc.currentBalance, 0),
      }
    : null;

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderExpiringCard = (card: GiftCard) => (
    <button
      key={card.id}
      onClick={() => onViewCard?.(card)}
      className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-amber-200 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-mono text-sm font-medium text-gray-900">
            {card.code}
          </p>
          <p className="text-xs text-gray-500">
            Expires {card.expiresAt ? formatDate(card.expiresAt) : 'Never'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="font-semibold text-[#1a5f4a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {formatCurrency(card.currentBalance)}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1
                    className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Gift Card Liability
                  </h1>
                  <p className="text-sm text-gray-500">Outstanding balances</p>
                </div>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          // Loading skeleton
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-10 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse"
              >
                <div className="h-3 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Total Liability */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white/80">
                  Total Outstanding Liability
                </span>
              </div>
              <div
                className="text-4xl font-bold mb-1"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {formatCurrency(data.totalLiability)}
              </div>
              <p className="text-xs text-white/60">
                {data.activeCards.length} active cards • Avg{' '}
                {formatCurrency(metrics?.avgBalance || 0)} per card
              </p>
            </motion.div>

            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-gray-500">Active</span>
                </div>
                <p
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {data.activeCards.length}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-500">Expiring</span>
                </div>
                <p
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {data.expiringIn30Days.length +
                    data.expiringIn60Days.length +
                    data.expiringIn90Days.length}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-2">
                  <DollarSign className="w-4 h-4 text-[#1a5f4a]" />
                  <span className="text-xs text-gray-500">Avg Balance</span>
                </div>
                <p
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {formatCurrency(metrics?.avgBalance || 0).replace('$', '')}
                </p>
              </motion.div>
            </div>

            {/* Expiring Soon Section */}
            {data.expiringIn30Days.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-red-50 rounded-xl p-4 border border-red-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-800">
                      Expiring in 30 days
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(metrics?.totalExpiring30 || 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.expiringIn30Days.slice(0, 3).map(renderExpiringCard)}
                  {data.expiringIn30Days.length > 3 && (
                    <p className="text-xs text-red-600 text-center pt-1">
                      +{data.expiringIn30Days.length - 3} more cards
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Expiring 31-60 days */}
            {data.expiringIn60Days.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-amber-50 rounded-xl p-4 border border-amber-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">
                      Expiring in 31-60 days
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">
                    {formatCurrency(metrics?.totalExpiring60 || 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.expiringIn60Days.slice(0, 3).map(renderExpiringCard)}
                  {data.expiringIn60Days.length > 3 && (
                    <p className="text-xs text-amber-600 text-center pt-1">
                      +{data.expiringIn60Days.length - 3} more cards
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Expiring 61-90 days */}
            {data.expiringIn90Days.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-yellow-50 rounded-xl p-4 border border-yellow-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">
                      Expiring in 61-90 days
                    </span>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">
                    {formatCurrency(metrics?.totalExpiring90 || 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.expiringIn90Days.slice(0, 3).map(renderExpiringCard)}
                  {data.expiringIn90Days.length > 3 && (
                    <p className="text-xs text-yellow-600 text-center pt-1">
                      +{data.expiringIn90Days.length - 3} more cards
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* No expiring cards message */}
            {data.expiringIn30Days.length === 0 &&
              data.expiringIn60Days.length === 0 &&
              data.expiringIn90Days.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-800">
                    No gift cards expiring soon
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    All active cards have no expiration or expire after 90 days
                  </p>
                </motion.div>
              )}
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900 mb-1"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              No liability data
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Gift card liability data will appear here once cards are issued
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
