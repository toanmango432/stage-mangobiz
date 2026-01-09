import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Gift,
  ScanBarcode,
  Check,
  X,
  Loader2,
  AlertCircle,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { giftCardDB } from '@/db/giftCardOperations';
import { useAppSelector } from '@/store/hooks';

export interface AppliedGiftCard {
  code: string;
  balance: number;
  appliedAmount: number;
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

// Gift card code pattern: GC-XXXX-XXXX-XXXX
const GIFT_CARD_PATTERN = /^GC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default function GiftCardRedeemModal({
  open,
  onOpenChange,
  remainingTotal,
  appliedGiftCards,
  onApplyGiftCard,
  onRemoveGiftCard,
}: GiftCardRedeemModalProps) {
  const storeId = useAppSelector((state) => state.auth.storeId);

  // Code input state
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Found card state
  const [foundCard, setFoundCard] = useState<{ code: string; balance: number } | null>(null);
  const [applyAmount, setApplyAmount] = useState<number>(0);

  // Scanner detection state
  const [lastInputTime, setLastInputTime] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCode('');
      setError(null);
      setFoundCard(null);
      setApplyAmount(0);
      setIsScanning(false);
    }
  }, [open]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-validate when code is complete (Task 6.3)
  useEffect(() => {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (GIFT_CARD_PATTERN.test(cleanCode) && !foundCard && !isValidating) {
      validateGiftCard(cleanCode);
    }
  }, [code, foundCard, isValidating]);

  // Set default apply amount when card is found
  useEffect(() => {
    if (foundCard) {
      // Smart default: apply the minimum of card balance or remaining total
      const defaultAmount = Math.min(foundCard.balance, remainingTotal);
      setApplyAmount(defaultAmount);
    }
  }, [foundCard, remainingTotal]);

  // Format code as user types (GC-XXXX-XXXX-XXXX)
  const formatCode = (input: string): string => {
    // Remove all non-alphanumeric except dash
    let clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add GC- prefix if not present
    if (!clean.startsWith('GC') && clean.length > 0) {
      clean = 'GC' + clean;
    }

    // Format with dashes
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6, 10)}-${clean.slice(10, 14)}`;
  };

  // Handle input change with scanner detection (Task 6.4)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = Date.now();
    const timeDiff = now - lastInputTime;
    const newValue = e.target.value;

    // Detect rapid input (scanner) - multiple chars in < 50ms
    if (timeDiff < 50 && newValue.length > code.length + 1) {
      setIsScanning(true);
      // Reset scanning indicator after animation
      setTimeout(() => setIsScanning(false), 1000);
    }

    setLastInputTime(now);
    setCode(formatCode(newValue));
    setError(null);

    // Clear found card if code changes
    if (foundCard && formatCode(newValue) !== foundCard.code) {
      setFoundCard(null);
    }
  };

  // Validate gift card
  const validateGiftCard = async (cardCode: string) => {
    if (!storeId) {
      setError('Store not initialized');
      return;
    }

    // Check if already applied
    if (appliedGiftCards.some(gc => gc.code === cardCode)) {
      setError('This gift card has already been applied');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const giftCard = await giftCardDB.getGiftCardByCode(storeId, cardCode);

      if (!giftCard) {
        setError('Gift card not found');
        setFoundCard(null);
        return;
      }

      if (giftCard.status !== 'active') {
        setError(`This gift card is ${giftCard.status}`);
        setFoundCard(null);
        return;
      }

      if (giftCard.currentBalance <= 0) {
        setError('This gift card has no remaining balance');
        setFoundCard(null);
        return;
      }

      if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
        setError('This gift card has expired');
        setFoundCard(null);
        return;
      }

      setFoundCard({
        code: cardCode,
        balance: giftCard.currentBalance,
      });
    } catch (err) {
      console.error('Error validating gift card:', err);
      setError('Failed to validate gift card');
      setFoundCard(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle apply gift card
  const handleApply = useCallback(() => {
    if (!foundCard || applyAmount <= 0) return;

    const appliedGiftCard: AppliedGiftCard = {
      code: foundCard.code,
      balance: foundCard.balance,
      appliedAmount: applyAmount,
      remainingBalance: foundCard.balance - applyAmount,
    };

    onApplyGiftCard(appliedGiftCard);

    // Reset for another card
    setCode('');
    setFoundCard(null);
    setApplyAmount(0);

    // Close modal if fully paid
    if (applyAmount >= remainingTotal) {
      onOpenChange(false);
    }
  }, [foundCard, applyAmount, remainingTotal, onApplyGiftCard, onOpenChange]);

  // Handle scan button click (opens camera or focuses input for external scanner)
  const handleScanClick = () => {
    // For now, just focus the input for USB/Bluetooth scanners
    inputRef.current?.focus();
    // TODO: Implement camera-based scanning with BarcodeScanner plugin
  };

  const isCodeComplete = GIFT_CARD_PATTERN.test(code);
  const maxApplyAmount = foundCard ? Math.min(foundCard.balance, remainingTotal) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-mango-primary" />
            Redeem Gift Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount to pay */}
          <div className="text-center py-2 px-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Amount to pay</p>
            <p className="text-2xl font-bold text-gray-900">
              ${remainingTotal.toFixed(2)}
            </p>
          </div>

          {/* Scan button - prominent at top (Task 6.2) */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 text-base gap-3 border-2 border-dashed hover:border-mango-primary hover:bg-mango-primary/5"
            onClick={handleScanClick}
          >
            <ScanBarcode className="h-6 w-6" />
            <span>Scan Gift Card</span>
            {isScanning && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
              >
                Scanning...
              </motion.span>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or enter code</span>
            </div>
          </div>

          {/* Code input with inline validation indicator */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={code}
              onChange={handleInputChange}
              placeholder="GC-XXXX-XXXX-XXXX"
              className={`text-center text-lg font-mono tracking-wider h-12 pr-10 ${
                error ? 'border-red-500 focus:ring-red-500' :
                foundCard ? 'border-green-500 focus:ring-green-500' : ''
              }`}
              maxLength={19}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidating && (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              )}
              {!isValidating && foundCard && (
                <Check className="h-5 w-5 text-green-500" />
              )}
              {!isValidating && error && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>

          {/* Auto-validates indicator */}
          {!foundCard && !error && !isValidating && (
            <p className="text-xs text-gray-400 text-center">
              Auto-validates when complete ✓
            </p>
          )}

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-600 text-center bg-red-50 py-2 px-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Found card details - slides in when valid (Task 6.6) */}
          <AnimatePresence>
            {foundCard && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Card Found</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    ${foundCard.balance.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Amount to apply:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <Input
                      type="number"
                      value={applyAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setApplyAmount(Math.min(val, maxApplyAmount));
                      }}
                      min={0}
                      max={maxApplyAmount}
                      step={0.01}
                      className="text-lg font-semibold"
                    />
                  </div>
                  {applyAmount < foundCard.balance && (
                    <p className="text-xs text-gray-500">
                      Remaining on card: ${(foundCard.balance - applyAmount).toFixed(2)}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleApply}
                  disabled={applyAmount <= 0}
                  className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Apply ${applyAmount.toFixed(2)}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Applied gift cards list */}
          {appliedGiftCards.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-gray-700">Applied Gift Cards:</p>
              {appliedGiftCards.map((gc) => (
                <div
                  key={gc.code}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-mono text-sm">{gc.code}</p>
                    <p className="text-xs text-gray-500">
                      Applied: ${gc.appliedAmount.toFixed(2)} (${gc.remainingBalance.toFixed(2)} remaining)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onRemoveGiftCard(gc.code)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
