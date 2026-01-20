import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  X,
  Wallet,
  Camera,
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

type ModalView = 'entry' | 'success';

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
  const [isScanning, setIsScanning] = useState(false);

  // Get store context
  const storeId = useAppSelector((state) => state.auth.store?.storeId ?? state.auth.storeId);

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
        setIsScanning(false);
      }, 200);
    }
  }, [open]);

  // Auto-lookup when code is complete (18 chars: GC-XXXX-XXXX-XXXX)
  const lookupGiftCard = useCallback(async (lookupCode: string) => {
    if (!storeId) return;

    const normalizedCode = normalizeCode(lookupCode);

    // Check if already applied
    if (appliedGiftCards.some((gc) => gc.code === normalizedCode)) {
      setError('This gift card is already applied');
      setFoundCard(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const giftCard = await giftCardDB.getGiftCardByCode(storeId, normalizedCode);

      if (!giftCard) {
        setError('Gift card not found');
        setFoundCard(null);
        setIsValidating(false);
        return;
      }

      // Check status
      if (giftCard.status === 'voided') {
        setError('This gift card has been voided');
        setFoundCard(null);
        setIsValidating(false);
        return;
      }

      if (giftCard.status === 'expired' || (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date())) {
        setError('This gift card has expired');
        setFoundCard(null);
        setIsValidating(false);
        return;
      }

      if (giftCard.currentBalance <= 0) {
        setError('This gift card has no remaining balance');
        setFoundCard(null);
        setIsValidating(false);
        return;
      }

      // Success - set found card and auto-fill max amount
      setFoundCard(giftCard);
      const maxApplicable = Math.min(giftCard.currentBalance, actualRemaining);
      setAmountToApply(maxApplicable.toFixed(2));
      setError(null);
    } catch (err) {
      console.error('Error checking gift card:', err);
      setError('Unable to verify gift card. Please try again.');
      setFoundCard(null);
    } finally {
      setIsValidating(false);
    }
  }, [storeId, appliedGiftCards, actualRemaining]);

  // Handle code input with auto-lookup
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatGiftCardCode(e.target.value);
    // Limit to full code length: GC-XXXX-XXXX-XXXX = 18 chars
    if (formatted.length <= 18) {
      setCode(formatted);
      setError(null);
      setFoundCard(null);

      // Auto-lookup when code is complete
      if (formatted.length === 18 && /^GC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(formatted)) {
        lookupGiftCard(formatted);
      }
    }
  };

  // Handle scan button - opens camera (placeholder for now)
  const handleScan = async () => {
    setIsScanning(true);
    // TODO: Integrate with device camera API
    // For now, show a message that scanning is coming soon
    setTimeout(() => {
      setIsScanning(false);
      setError('Camera scanning coming soon. Please enter code manually.');
    }, 1500);
  };

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

  // Handle Enter key - apply directly if card is found
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (foundCard && amountToApply) {
        handleApply();
      }
    }
  };

  // Clear and try another card
  const handleClear = () => {
    setCode('');
    setFoundCard(null);
    setAmountToApply('');
    setError(null);
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
          <AnimatePresence mode="wait">
            {/* Entry View - Streamlined single page */}
            {view === 'entry' && (
              <motion.div
                key="entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Remaining balance context */}
                <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-800">Amount to pay</span>
                  </div>
                  <span className="text-lg font-bold text-amber-900">
                    ${actualRemaining.toFixed(2)}
                  </span>
                </div>

                {/* Applied gift cards */}
                <AppliedGiftCardsList
                  appliedGiftCards={appliedGiftCards}
                  onRemove={onRemoveGiftCard}
                  disabled={isValidating}
                />

                {/* Scanning mode */}
                {isScanning ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-8 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-violet-600 animate-pulse" />
                    </div>
                    <p className="text-sm text-gray-600">Scanning for gift card...</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsScanning(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    {/* Code input with scan button */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Enter or Scan Gift Card Code
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={code}
                            onChange={handleCodeChange}
                            onKeyDown={handleKeyDown}
                            placeholder="GC-XXXX-XXXX-XXXX"
                            className={`h-12 font-mono text-base tracking-wider uppercase bg-white border-gray-200 pr-10 ${
                              error ? 'border-red-300 focus-visible:ring-red-200' : ''
                            } ${foundCard ? 'border-green-300 bg-green-50' : ''}`}
                            disabled={isValidating}
                            autoFocus
                          />
                          {isValidating && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-5 w-5 text-violet-600 animate-spin" />
                            </div>
                          )}
                          {foundCard && !isValidating && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Check className="h-5 w-5 text-green-600" />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleScan}
                          variant="outline"
                          className="h-12 px-4 border-gray-200 hover:bg-violet-50 hover:border-violet-200"
                          title="Scan gift card"
                        >
                          <Camera className="h-5 w-5 text-gray-600" />
                        </Button>
                        {code && (
                          <Button
                            onClick={handleClear}
                            variant="outline"
                            className="h-12 px-4 border-gray-200 hover:bg-red-50 hover:border-red-200"
                            title="Clear"
                          >
                            <X className="h-5 w-5 text-gray-600" />
                          </Button>
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

                    {/* Found card - inline display with apply button */}
                    <AnimatePresence>
                      {foundCard && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {/* Compact card visual */}
                          <div className="rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 shadow-lg">
                            <div className="flex items-center justify-between text-white">
                              <div>
                                <p className="text-xs text-white/60 mb-1">Available Balance</p>
                                <p className="text-2xl font-bold">${foundCard.currentBalance.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-white/60 mb-1">Card</p>
                                <p className="font-mono text-sm">{foundCard.code}</p>
                              </div>
                            </div>
                          </div>

                          {/* Amount to apply - pre-filled with max */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700">
                                Amount to Apply
                              </label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setAmountToApply(Math.min(foundCard.currentBalance, actualRemaining).toFixed(2))}
                                  className="text-xs px-2 py-1 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                                >
                                  Max
                                </button>
                                {actualRemaining < foundCard.currentBalance && (
                                  <button
                                    onClick={() => setAmountToApply(actualRemaining.toFixed(2))}
                                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                  >
                                    Full Payment
                                  </button>
                                )}
                              </div>
                            </div>
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
                          </div>

                          {/* Apply button */}
                          <Button
                            onClick={handleApply}
                            disabled={!amountToApply || parseFloat(amountToApply) <= 0}
                            className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-lg"
                          >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Apply ${parseFloat(amountToApply || '0').toFixed(2)}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Helper text - only show if no card found */}
                    {!foundCard && (
                      <p className="text-xs text-gray-400 text-center">
                        Enter the 16-character code from your gift card
                      </p>
                    )}
                  </>
                )}
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
