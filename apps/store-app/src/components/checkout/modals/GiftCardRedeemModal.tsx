import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  Calendar,
  Wallet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { giftCardDB } from '@/db/giftCardOperations';
import { useAppSelector } from '@/store/hooks';
import type { GiftCard } from '@/types/gift-card';

// ============================================================================
// Types
// ============================================================================

export interface AppliedGiftCard {
  id: string;
  code: string;
  originalBalance: number;
  amountUsed: number;
  remainingBalance: number;
}

interface GiftCardRedeemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingTotal: number;
  appliedGiftCards: AppliedGiftCard[];
  onApplyGiftCard: (giftCard: AppliedGiftCard) => void;
  onRemoveGiftCard: (code: string) => void;
}

type ModalView = 'entry' | 'found' | 'success';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format gift card code as user types: GC-XXXX-XXXX-XXXX
 */
function formatGiftCardCode(input: string): string {
  // Remove all non-alphanumeric characters
  const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  // Handle GC prefix
  if (cleaned.length <= 2) {
    return cleaned;
  }

  // Format: GC-XXXX-XXXX-XXXX
  const prefix = cleaned.slice(0, 2);
  const segments = cleaned.slice(2).match(/.{1,4}/g) || [];

  if (prefix === 'GC') {
    return `GC-${segments.join('-')}`;
  }

  // If user didn't type GC, auto-add it
  const allSegments = cleaned.match(/.{1,4}/g) || [];
  return `GC-${allSegments.join('-')}`;
}

/**
 * Normalize code for database lookup
 */
function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Visual gift card representation
 */
function GiftCardVisual({
  code,
  balance,
  status,
  expiresAt,
}: {
  code: string;
  balance: number;
  status: string;
  expiresAt?: string | null;
}) {
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const isDepleted = balance <= 0;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
    >
      {/* Card container with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 shadow-xl">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white" />
        </div>

        {/* Card content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-white/90" />
              <span className="text-sm font-medium text-white/90">Gift Card</span>
            </div>
            {status === 'active' && !isExpired && !isDepleted && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                Active
              </span>
            )}
            {(isExpired || status === 'expired') && (
              <span className="rounded-full bg-red-500/80 px-2.5 py-0.5 text-xs font-medium text-white">
                Expired
              </span>
            )}
            {isDepleted && (
              <span className="rounded-full bg-gray-500/80 px-2.5 py-0.5 text-xs font-medium text-white">
                Depleted
              </span>
            )}
          </div>

          {/* Code - embossed effect */}
          <div className="mb-6">
            <p className="font-mono text-lg tracking-wider text-white/60 [text-shadow:0_1px_0_rgba(255,255,255,0.2)]">
              {code}
            </p>
          </div>

          {/* Balance */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-white/60">Available Balance</p>
              <p className="text-3xl font-bold text-white">
                ${balance.toFixed(2)}
              </p>
            </div>
            {expiresAt && (
              <div className="flex items-center gap-1 text-white/60">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {new Date(expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Applied gift cards list
 */
function AppliedGiftCardsList({
  appliedGiftCards,
  onRemove,
  disabled,
}: {
  appliedGiftCards: AppliedGiftCard[];
  onRemove: (code: string) => void;
  disabled?: boolean;
}) {
  if (appliedGiftCards.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Applied Gift Cards
      </p>
      {appliedGiftCards.map((gc) => (
        <motion.div
          key={gc.code}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="flex items-center justify-between rounded-xl bg-violet-50 border border-violet-100 p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
              <CreditCard className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="font-mono text-sm font-medium text-violet-900">
                {gc.code}
              </p>
              <p className="text-xs text-violet-600">
                -${gc.amountUsed.toFixed(2)} applied • ${gc.remainingBalance.toFixed(2)} remaining
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-violet-400 hover:text-violet-600 hover:bg-violet-100"
            onClick={() => onRemove(gc.code)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function GiftCardRedeemModal({
  open,
  onOpenChange,
  remainingTotal,
  appliedGiftCards,
  onApplyGiftCard,
  onRemoveGiftCard,
}: GiftCardRedeemModalProps) {
  // State
  const [view, setView] = useState<ModalView>('entry');
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundCard, setFoundCard] = useState<GiftCard | null>(null);
  const [amountToApply, setAmountToApply] = useState('');

  // Get store context
  const storeId = useAppSelector((state) => state.auth.currentStore?.id);

  // Calculate totals
  const totalApplied = appliedGiftCards.reduce((sum, gc) => sum + gc.amountUsed, 0);
  const actualRemaining = Math.max(0, remainingTotal - totalApplied);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setView('entry');
        setCode('');
        setError(null);
        setFoundCard(null);
        setAmountToApply('');
      }, 200);
    }
  }, [open]);

  // Handle code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatGiftCardCode(e.target.value);
    // Limit to full code length: GC-XXXX-XXXX-XXXX = 18 chars
    if (formatted.length <= 18) {
      setCode(formatted);
      setError(null);
    }
  };

  // Check balance
  const handleCheckBalance = useCallback(async () => {
    if (!code.trim() || !storeId) {
      setError('Please enter a gift card code');
      return;
    }

    // Validate format
    const normalizedCode = normalizeCode(code);
    if (!/^GC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizedCode)) {
      setError('Invalid format. Use: GC-XXXX-XXXX-XXXX');
      return;
    }

    // Check if already applied
    if (appliedGiftCards.some((gc) => gc.code === normalizedCode)) {
      setError('This gift card is already applied');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const giftCard = await giftCardDB.getGiftCardByCode(storeId, normalizedCode);

      if (!giftCard) {
        setError('Gift card not found');
        setIsValidating(false);
        return;
      }

      // Check status
      if (giftCard.status === 'voided') {
        setError('This gift card has been voided');
        setIsValidating(false);
        return;
      }

      if (giftCard.status === 'expired' || (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date())) {
        setError('This gift card has expired');
        setIsValidating(false);
        return;
      }

      if (giftCard.currentBalance <= 0) {
        setError('This gift card has no remaining balance');
        setIsValidating(false);
        return;
      }

      // Success - show found view
      setFoundCard(giftCard);
      const maxApplicable = Math.min(giftCard.currentBalance, actualRemaining);
      setAmountToApply(maxApplicable.toFixed(2));
      setView('found');
    } catch (err) {
      console.error('Error checking gift card:', err);
      setError('Unable to verify gift card. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }, [code, storeId, appliedGiftCards, actualRemaining]);

  // Handle apply
  const handleApply = useCallback(() => {
    if (!foundCard) return;

    const amount = parseFloat(amountToApply);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > foundCard.currentBalance) {
      setError(`Amount exceeds balance ($${foundCard.currentBalance.toFixed(2)})`);
      return;
    }

    if (amount > actualRemaining) {
      setError(`Amount exceeds remaining total ($${actualRemaining.toFixed(2)})`);
      return;
    }

    // Apply the gift card
    onApplyGiftCard({
      id: foundCard.id,
      code: foundCard.code,
      originalBalance: foundCard.currentBalance,
      amountUsed: amount,
      remainingBalance: foundCard.currentBalance - amount,
    });

    // Show success briefly, then close or reset
    setView('success');
    setTimeout(() => {
      if (actualRemaining - amount > 0) {
        // More to pay - reset for another card
        setView('entry');
        setCode('');
        setFoundCard(null);
        setAmountToApply('');
        setError(null);
      } else {
        // Fully paid - close modal
        onOpenChange(false);
      }
    }, 1200);
  }, [foundCard, amountToApply, actualRemaining, onApplyGiftCard, onOpenChange]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (view === 'entry') {
        handleCheckBalance();
      } else if (view === 'found') {
        handleApply();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#faf9f7] border-0 shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <Gift className="h-5 w-5 text-violet-600" />
            </div>
            <span className="font-semibold text-gray-900">
              {view === 'success' ? 'Gift Card Applied' : 'Redeem Gift Card'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Remaining balance context */}
          {view !== 'success' && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">Amount to pay</span>
              </div>
              <span className="text-lg font-bold text-amber-900">
                ${actualRemaining.toFixed(2)}
              </span>
            </div>
          )}

          {/* Applied gift cards */}
          {view === 'entry' && (
            <AppliedGiftCardsList
              appliedGiftCards={appliedGiftCards}
              onRemove={onRemoveGiftCard}
              disabled={isValidating}
            />
          )}

          <AnimatePresence mode="wait">
            {/* Entry View */}
            {view === 'entry' && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Enter Gift Card Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={code}
                      onChange={handleCodeChange}
                      onKeyDown={handleKeyDown}
                      placeholder="GC-XXXX-XXXX-XXXX"
                      className={`flex-1 h-12 font-mono text-base tracking-wider uppercase bg-white border-gray-200 ${
                        error ? 'border-red-300 focus-visible:ring-red-200' : ''
                      }`}
                      disabled={isValidating}
                      autoFocus
                    />
                    <Button
                      onClick={handleCheckBalance}
                      disabled={!code.trim() || isValidating}
                      className="h-12 px-5 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isValidating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Check'
                      )}
                    </Button>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 text-red-600"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Helper text */}
                <p className="text-xs text-gray-400">
                  Gift card codes are printed on physical cards or emailed receipts
                </p>
              </motion.div>
            )}

            {/* Found View */}
            {view === 'found' && foundCard && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Gift card visual */}
                <GiftCardVisual
                  code={foundCard.code}
                  balance={foundCard.currentBalance}
                  status={foundCard.status}
                  expiresAt={foundCard.expiresAt}
                />

                {/* Amount input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount to Apply
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-400">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={Math.min(foundCard.currentBalance, actualRemaining)}
                      value={amountToApply}
                      onChange={(e) => {
                        setAmountToApply(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={handleKeyDown}
                      className="h-14 pl-9 text-2xl font-bold text-gray-900 bg-white border-gray-200"
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAmountToApply(Math.min(foundCard.currentBalance, actualRemaining).toFixed(2))}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Max ${Math.min(foundCard.currentBalance, actualRemaining).toFixed(2)}
                    </button>
                    {actualRemaining < foundCard.currentBalance && (
                      <button
                        onClick={() => setAmountToApply(actualRemaining.toFixed(2))}
                        className="flex-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        Pay Full ${actualRemaining.toFixed(2)}
                      </button>
                    )}
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 text-red-600"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setView('entry');
                      setFoundCard(null);
                      setAmountToApply('');
                      setError(null);
                    }}
                    className="h-12 flex-1 border-gray-200"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={!amountToApply || parseFloat(amountToApply) <= 0}
                    className="h-12 flex-[2] bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Apply ${parseFloat(amountToApply || '0').toFixed(2)}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Success View */}
            {view === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
                >
                  <Check className="h-8 w-8 text-green-600" />
                </motion.div>
                <p className="text-lg font-semibold text-gray-900">
                  Gift Card Applied!
                </p>
                <p className="text-sm text-gray-500">
                  ${parseFloat(amountToApply || '0').toFixed(2)} has been applied to your order
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
