/**
 * GiftCardDetailModal - Gift Card Detail View with Actions
 *
 * Shows:
 * - Gift card visual with code, balance, status
 * - Recipient information
 * - Transaction history timeline
 * - Action buttons: Reload, Adjust, Void, Resend Email
 *
 * Follows mango-designer patterns with tactile design
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Gift,
  RefreshCw,
  Ban,
  Mail,
  Phone,
  User,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  DollarSign,
  Send,
  Edit3,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { dataService } from '../../services/dataService';
import type { GiftCard, GiftCardTransaction, GiftCardStatus } from '../../types/gift-card';
import { formatCurrency } from '../../utils/formatters';

// Status configuration
const STATUS_CONFIG: Record<
  GiftCardStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bgColor: string; textColor: string }
> = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  depleted: {
    label: 'Depleted',
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  voided: {
    label: 'Voided',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  expired: {
    label: 'Expired',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
};

// Transaction type configuration
const TRANSACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof Plus; color: string; bgColor: string }
> = {
  purchase: {
    label: 'Issued',
    icon: Plus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  redeem: {
    label: 'Redeemed',
    icon: Minus,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  reload: {
    label: 'Reloaded',
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  refund: {
    label: 'Adjusted',
    icon: Edit3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  void: {
    label: 'Voided',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

interface GiftCardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftCard: GiftCard;
  onUpdate?: () => void;
}

export default function GiftCardDetailModal({
  open,
  onOpenChange,
  giftCard,
  onUpdate,
}: GiftCardDetailModalProps) {
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReloadForm, setShowReloadForm] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [reloadAmount, setReloadAmount] = useState('');
  const [voidReason, setVoidReason] = useState('');

  // Get auth info for actions
  const auth = useAppSelector((state) => state.auth);
  const storeId = auth.storeId || '';
  const userId = auth.user?.id || '';
  const deviceId = auth.device?.id || 'device-1';

  // Load transaction history
  const loadTransactions = useCallback(async () => {
    if (!giftCard.id) return;
    setLoading(true);
    try {
      const txns = await dataService.giftCardTransactions.getByCard(giftCard.id) as GiftCardTransaction[];
      setTransactions(txns);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [giftCard.id]);

  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open, loadTransactions]);

  // Handle reload
  const handleReload = async () => {
    const amount = parseFloat(reloadAmount);
    if (isNaN(amount) || amount <= 0) return;

    setActionLoading('reload');
    try {
      await dataService.giftCards.reload(
        { giftCardId: giftCard.id, amount, staffId: userId },
        storeId,
        userId,
        deviceId
      );
      setShowReloadForm(false);
      setReloadAmount('');
      loadTransactions();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to reload gift card:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle void
  const handleVoid = async () => {
    if (!voidReason.trim()) return;

    setActionLoading('void');
    try {
      await dataService.giftCards.void(
        giftCard.id,
        voidReason,
        storeId,
        userId,
        deviceId
      );
      setShowVoidConfirm(false);
      setVoidReason('');
      loadTransactions();
      onUpdate?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to void gift card:', error);
    } finally {
      setActionLoading(null);
    }
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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const statusConfig = STATUS_CONFIG[giftCard.status];
  const StatusIcon = statusConfig.icon;
  const isVoided = giftCard.status === 'voided';
  const canReload = !isVoided && giftCard.isReloadable !== false;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-[#faf9f7] rounded-t-3xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#faf9f7] border-b border-gray-200 px-4 py-4">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Gift Card Details
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {/* Gift Card Visual */}
              <div className="mt-4 mb-6">
                <div className="relative bg-gradient-to-br from-[#1a5f4a] via-[#1f6b54] to-[#2d7a5f] rounded-2xl p-5 text-white shadow-lg overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
                  </div>

                  {/* Card content */}
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Gift className="w-6 h-6" />
                        <span className="text-sm font-medium opacity-90">Mango Gift Card</span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm opacity-70 mb-1">Code</p>
                      <p
                        className="font-mono text-xl font-bold tracking-wider"
                        style={{ letterSpacing: '0.1em' }}
                      >
                        {giftCard.code}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm opacity-70 mb-1">Balance</p>
                        <p className="text-3xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                          {formatCurrency(giftCard.currentBalance)}
                        </p>
                        {giftCard.currentBalance !== giftCard.originalAmount && (
                          <p className="text-xs opacity-60 mt-0.5">
                            of {formatCurrency(giftCard.originalAmount)} original
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-60">Issued</p>
                        <p className="text-sm">{formatDate(giftCard.issuedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient Info */}
              {(giftCard.recipientName || giftCard.recipientEmail || giftCard.recipientPhone) && (
                <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Recipient
                  </h3>
                  <div className="space-y-2">
                    {giftCard.recipientName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{giftCard.recipientName}</span>
                      </div>
                    )}
                    {giftCard.recipientEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{giftCard.recipientEmail}</span>
                      </div>
                    )}
                    {giftCard.recipientPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{giftCard.recipientPhone}</span>
                      </div>
                    )}
                  </div>
                  {giftCard.message && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Message</p>
                      <p className="text-sm text-gray-700 italic">"{giftCard.message}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {!isVoided && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {canReload && (
                    <button
                      onClick={() => setShowReloadForm(true)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-[#1a5f4a]" />
                      Reload
                    </button>
                  )}
                  <button
                    onClick={() => setShowVoidConfirm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Void Card
                  </button>
                  {giftCard.recipientEmail && (
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors col-span-2"
                    >
                      <Send className="w-4 h-4 text-blue-500" />
                      Resend Email
                    </button>
                  )}
                </div>
              )}

              {/* Reload Form */}
              <AnimatePresence>
                {showReloadForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Reload Gift Card
                      </h3>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={reloadAmount}
                            onChange={(e) => setReloadAmount(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]/20 focus:border-[#1a5f4a]"
                          />
                        </div>
                        <button
                          onClick={handleReload}
                          disabled={!reloadAmount || parseFloat(reloadAmount) <= 0 || actionLoading === 'reload'}
                          className="px-4 py-2.5 bg-[#1a5f4a] text-white rounded-lg text-sm font-medium hover:bg-[#154d3c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === 'reload' ? 'Loading...' : 'Add'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReloadForm(false);
                            setReloadAmount('');
                          }}
                          className="px-3 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Void Confirmation */}
              <AnimatePresence>
                {showVoidConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
                      <h3 className="text-sm font-semibold text-red-800 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Void Gift Card
                      </h3>
                      <p className="text-xs text-red-600 mb-3">
                        This action cannot be undone. The remaining balance of{' '}
                        <strong>{formatCurrency(giftCard.currentBalance)}</strong> will be forfeited.
                      </p>
                      <input
                        type="text"
                        placeholder="Enter reason for voiding..."
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleVoid}
                          disabled={!voidReason.trim() || actionLoading === 'void'}
                          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === 'void' ? 'Voiding...' : 'Confirm Void'}
                        </button>
                        <button
                          onClick={() => {
                            setShowVoidConfirm(false);
                            setVoidReason('');
                          }}
                          className="px-4 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transaction History */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Transaction History
                </h3>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                          <div className="h-2 bg-gray-100 rounded w-32" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((txn) => {
                      const config = TRANSACTION_CONFIG[txn.type] || TRANSACTION_CONFIG.purchase;
                      const TxnIcon = config.icon;
                      const isPositive = txn.amount >= 0;

                      return (
                        <div key={txn.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                            <TxnIcon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{config.label}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {formatDateTime(txn.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${
                                isPositive ? 'text-emerald-600' : 'text-gray-700'
                              }`}
                            >
                              {isPositive ? '+' : ''}
                              {formatCurrency(txn.amount)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Bal: {formatCurrency(txn.balanceAfter)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
