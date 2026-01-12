/**
 * GiftCardManagement - Gift Card Management Page
 *
 * Full-featured gift card management with:
 * - Search by code, recipient name/email
 * - Status filter tabs (All, Active, Depleted, Voided, Expired)
 * - Gift card list with visual cards
 * - Quick actions (View, Reload, Void)
 * - Summary stats (Total issued, Active balance, Cards count)
 *
 * Follows mango-designer skill patterns:
 * - Tactile cream background
 * - Mango brand colors
 * - Touch-friendly targets (44px+)
 * - Distinctive typography (Plus Jakarta Sans)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Search,
  RefreshCw,
  Ban,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  Mail,
  User,
  Calendar,
  ArrowLeft,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { giftCardDB } from '../../db/giftCardOperations';
import type { GiftCard, GiftCardStatus } from '../../types/gift-card';
import { formatCurrency } from '../../utils/formatters';
import GiftCardDetailModal from './GiftCardDetailModal';

// Status configuration for visual display
const STATUS_CONFIG: Record<
  GiftCardStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }
> = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  depleted: {
    label: 'Depleted',
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  voided: {
    label: 'Voided',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
};

// Filter tab options
type FilterStatus = 'all' | GiftCardStatus;
const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'depleted', label: 'Depleted' },
  { value: 'voided', label: 'Voided' },
  { value: 'expired', label: 'Expired' },
];

// Sort options
type SortOption = 'newest' | 'oldest' | 'highestBalance' | 'lowestBalance' | 'highestAmount' | 'lowestAmount';
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highestBalance', label: 'Highest Balance' },
  { value: 'lowestBalance', label: 'Lowest Balance' },
  { value: 'highestAmount', label: 'Highest Amount' },
  { value: 'lowestAmount', label: 'Lowest Amount' },
];

interface GiftCardManagementProps {
  onBack?: () => void;
}

export default function GiftCardManagement({ onBack }: GiftCardManagementProps) {
  // State
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get store ID from auth state
  const storeId = useAppSelector((state) => state.auth.storeId) || '';

  // Load gift cards
  const loadGiftCards = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const cards = await giftCardDB.getAllGiftCards(storeId);
      setGiftCards(cards);
    } catch (error) {
      console.error('Failed to load gift cards:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadGiftCards();
  }, [loadGiftCards]);

  // Filtered and sorted gift cards
  const filteredCards = useMemo(() => {
    let result = giftCards;

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((gc) => gc.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (gc) =>
          gc.code.toLowerCase().includes(query) ||
          gc.recipientName?.toLowerCase().includes(query) ||
          gc.recipientEmail?.toLowerCase().includes(query) ||
          gc.recipientPhone?.includes(query)
      );
    }

    // Apply sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
        case 'highestBalance':
          return b.currentBalance - a.currentBalance;
        case 'lowestBalance':
          return a.currentBalance - b.currentBalance;
        case 'highestAmount':
          return b.originalAmount - a.originalAmount;
        case 'lowestAmount':
          return a.originalAmount - b.originalAmount;
        case 'newest':
        default:
          return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      }
    });
  }, [giftCards, statusFilter, searchQuery, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeCards = giftCards.filter((gc) => gc.status === 'active');
    const totalBalance = activeCards.reduce((sum, gc) => sum + gc.currentBalance, 0);
    const totalIssued = giftCards.reduce((sum, gc) => sum + gc.originalAmount, 0);

    return {
      totalCards: giftCards.length,
      activeCards: activeCards.length,
      totalBalance,
      totalIssued,
    };
  }, [giftCards]);

  // Count by status for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<FilterStatus, number> = {
      all: giftCards.length,
      active: 0,
      depleted: 0,
      voided: 0,
      expired: 0,
    };
    giftCards.forEach((gc) => {
      counts[gc.status]++;
    });
    return counts;
  }, [giftCards]);

  // Handle card actions
  const handleViewCard = (card: GiftCard) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  };

  const handleRefresh = () => {
    loadGiftCards();
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Gift Cards
                  </h1>
                  <p className="text-sm text-gray-500">
                    {statusCounts.all} total • {statusCounts.active} active
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-[#1a5f4a]" />
                <span className="text-xs font-medium text-gray-500">Active Balance</span>
              </div>
              <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {formatCurrency(stats.totalBalance)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-[#d4a853]" />
                <span className="text-xs font-medium text-gray-500">Total Issued</span>
              </div>
              <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {formatCurrency(stats.totalIssued)}
              </p>
            </div>
          </div>

          {/* Search and Sort Row */}
          <div className="flex gap-2 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]/20 focus:border-[#1a5f4a] transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Menu */}
              <AnimatePresence>
                {showSortMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 z-30 w-48 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${
                            sortBy === option.value ? 'text-[#1a5f4a] font-medium bg-[#1a5f4a]/5' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                          {sortBy === option.value && (
                            <Check className="w-4 h-4 text-[#1a5f4a]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {FILTER_TABS.map((tab) => {
              const isActive = statusFilter === tab.value;
              const count = statusCounts[tab.value];
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#1a5f4a] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {searchQuery || statusFilter !== 'all' ? 'No gift cards found' : 'No gift cards yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Gift cards will appear here once they are sold at checkout'}
            </p>
          </div>
        ) : (
          // Gift card list
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCards.map((card, index) => {
                const statusConfig = STATUS_CONFIG[card.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <button
                      onClick={() => handleViewCard(card)}
                      className="w-full bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1a5f4a]/20 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Card visual */}
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] flex items-center justify-center shadow-sm"
                          >
                            <Gift className="w-6 h-6 text-white" />
                          </div>
                          {/* Status badge overlay */}
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${statusConfig.bgColor} ring-2 ring-white`}
                          >
                            <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                          </div>
                        </div>

                        {/* Card info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-mono text-sm font-semibold text-gray-900"
                              style={{ letterSpacing: '0.05em' }}
                            >
                              {card.code}
                            </span>
                          </div>

                          {/* Balance */}
                          <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-lg font-bold text-[#1a5f4a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              {formatCurrency(card.currentBalance)}
                            </span>
                            {card.currentBalance !== card.originalAmount && (
                              <span className="text-xs text-gray-400">
                                / {formatCurrency(card.originalAmount)}
                              </span>
                            )}
                          </div>

                          {/* Recipient info */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            {card.recipientName && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{card.recipientName}</span>
                              </div>
                            )}
                            {card.recipientEmail && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{card.recipientEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(card.issuedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 self-center">
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1a5f4a] transition-colors" />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCard && (
        <GiftCardDetailModal
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
          giftCard={selectedCard}
          onUpdate={loadGiftCards}
        />
      )}
    </div>
  );
}
