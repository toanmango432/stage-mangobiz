/**
 * TipPage - Tip Selection Screen
 * US-004: Allows clients to select a tip amount before payment
 * US-013: Uses activeTransaction from context with demo fallback
 * US-014: WCAG 2.1 AA Accessibility compliance
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight, HelpCircle, X, Delete } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { setScreen } from '@/store/slices/padSlice';
import { setTip } from '@/store/slices/transactionSlice';
import { useTransactionNavigation } from '@/hooks/useTransactionNavigation';
import type { ActiveTransaction } from '@/types';

/**
 * Demo transaction data for testing without a live Store App connection
 */
const DEMO_TRANSACTION: Omit<ActiveTransaction, 'step' | 'startedAt'> = {
  transactionId: 'demo-tip-page',
  ticketId: 'ticket-demo-001',
  clientName: 'Sarah Johnson',
  clientEmail: 'sarah@example.com',
  clientPhone: '555-0123',
  staffName: 'Mike Chen',
  items: [
    { id: '1', name: 'Haircut & Style', staffName: 'Mike Chen', price: 45.00, quantity: 1, type: 'service' },
    { id: '2', name: 'Deep Conditioning', staffName: 'Mike Chen', price: 25.00, quantity: 1, type: 'service' },
    { id: '3', name: 'Premium Shampoo', staffName: 'Mike Chen', price: 18.99, quantity: 1, type: 'product' },
  ],
  subtotal: 88.99,
  tax: 7.12,
  discount: 0,
  total: 96.11,
  suggestedTips: [15, 18, 20, 25],
  tipAmount: 0,
  tipPercent: null,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

interface NumericKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  maxValue?: number;
}

function NumericKeypadModal({ isOpen, onClose, onConfirm, maxValue = 999.99 }: NumericKeypadModalProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = useCallback((key: string) => {
    setInputValue((prev) => {
      if (key === 'backspace') {
        return prev.slice(0, -1);
      }
      if (key === 'clear') {
        return '';
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      const decimalIndex = prev.indexOf('.');
      if (decimalIndex !== -1 && prev.length - decimalIndex > 2) {
        return prev;
      }
      const newValue = prev + key;
      const numValue = parseFloat(newValue);
      if (numValue > maxValue) return prev;
      return newValue;
    });
  }, [maxValue]);

  const handleConfirm = () => {
    const value = parseFloat(inputValue) || 0;
    onConfirm(value);
    setInputValue('');
    onClose();
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="keypad-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 id="keypad-title" className="text-xl font-semibold text-gray-900">Enter Custom Tip</h3>
              <button
                onClick={handleClose}
                aria-label="Close keypad"
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
              </button>
            </div>

            {/* Display */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <p className="text-4xl font-bold text-gray-900 text-center">
                ${inputValue || '0.00'}
              </p>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6" role="group" aria-label="Numeric keypad">
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  aria-label={key === 'backspace' ? 'Delete last digit' : key === '.' ? 'Decimal point' : `Number ${key}`}
                  className="min-h-[64px] rounded-xl bg-gray-100 text-2xl font-semibold text-gray-800 hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center"
                >
                  {key === 'backspace' ? <Delete className="w-6 h-6" aria-hidden="true" /> : key}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3" role="group" aria-label="Keypad actions">
              <button
                onClick={handleClose}
                aria-label="Cancel and close keypad"
                className="flex-1 min-h-[56px] bg-gray-100 text-gray-700 text-lg font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                aria-label={`Confirm tip of ${inputValue || '0'} dollars`}
                className="flex-1 min-h-[56px] bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TipButtonProps {
  label: string;
  subLabel: string;
  isSelected: boolean;
  onClick: () => void;
}

function TipButton({ label, subLabel, isSelected, onClick }: TipButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={`Select ${label} tip, which is ${subLabel}`}
      aria-pressed={isSelected}
      className={`min-h-[100px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-4 ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
      }`}
    >
      <span className={`text-2xl font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
        {label}
      </span>
      <span className={`text-base mt-1 ${isSelected ? 'text-indigo-500' : 'text-gray-500'}`}>
        {subLabel}
      </span>
    </motion.button>
  );
}

export function TipPage() {
  const dispatch = useAppDispatch();
  const { publishTipSelected, publishHelpRequested, activeTransaction } = usePadMqtt();
  const config = useAppSelector((state) => state.config.config);
  const isSplitPayment = useAppSelector((state) => state.transaction.isSplitPayment);
  const splitPayments = useAppSelector((state) => state.transaction.splitPayments);
  const currentSplitIndex = useAppSelector((state) => state.transaction.currentSplitIndex);

  // Enable auto-navigation on transaction step changes
  useTransactionNavigation({ skipInitialNavigation: true });

  const [selectedTipIndex, setSelectedTipIndex] = useState<number | null>(1);
  const [customTipAmount, setCustomTipAmount] = useState<number | null>(null);
  const [isNoTip, setIsNoTip] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);

  // Use activeTransaction from context, fallback to demo data for demo mode
  const transaction = activeTransaction ?? {
    ...DEMO_TRANSACTION,
    step: 'tip' as const,
    startedAt: new Date().toISOString(),
  };

  const currentSplit = isSplitPayment ? splitPayments[currentSplitIndex] : null;
  const baseAmount = currentSplit ? currentSplit.amount : transaction.total;
  // Use suggestedTips from activeTransaction when available, fallback to config
  const tipSuggestions = transaction.suggestedTips?.length > 0 ? transaction.suggestedTips : config.tipSuggestions;
  const tipType = config.tipType;

  const calculateTipAmount = (suggestion: number): number => {
    if (tipType === 'percentage') {
      return baseAmount * (suggestion / 100);
    }
    return suggestion;
  };

  const getTipLabel = (suggestion: number): string => {
    if (tipType === 'percentage') {
      return `${suggestion}%`;
    }
    return formatCurrency(suggestion);
  };

  const getCurrentTipAmount = (): number => {
    if (isNoTip) return 0;
    if (customTipAmount !== null) return customTipAmount;
    if (selectedTipIndex !== null && tipSuggestions[selectedTipIndex] !== undefined) {
      return calculateTipAmount(tipSuggestions[selectedTipIndex]);
    }
    return 0;
  };

  const getCurrentTipPercent = (): number | null => {
    if (isNoTip) return 0;
    if (customTipAmount !== null) {
      return baseAmount > 0 ? (customTipAmount / baseAmount) * 100 : null;
    }
    if (selectedTipIndex !== null && tipSuggestions[selectedTipIndex] !== undefined) {
      if (tipType === 'percentage') {
        return tipSuggestions[selectedTipIndex];
      }
      return baseAmount > 0 ? (tipSuggestions[selectedTipIndex] / baseAmount) * 100 : null;
    }
    return null;
  };

  const currentTipAmount = getCurrentTipAmount();
  const runningTotal = baseAmount + currentTipAmount;

  const handleTipSelect = (index: number) => {
    setSelectedTipIndex(index);
    setCustomTipAmount(null);
    setIsNoTip(false);
  };

  const handleCustomTip = () => {
    setIsKeypadOpen(true);
  };

  const handleCustomTipConfirm = (value: number) => {
    setCustomTipAmount(value);
    setSelectedTipIndex(null);
    setIsNoTip(false);
  };

  const handleNoTip = () => {
    setIsNoTip(true);
    setSelectedTipIndex(null);
    setCustomTipAmount(null);
  };

  const handleContinue = async () => {
    const tipAmount = getCurrentTipAmount();
    const tipPercent = getCurrentTipPercent();

    dispatch(
      setTip({
        tipAmount,
        tipPercent,
        selectedAt: new Date().toISOString(),
      })
    );

    try {
      await publishTipSelected({
        tipAmount,
        tipPercent,
      });
    } catch (error) {
      console.error('Failed to publish tip selection:', error);
    }

    if (config.signatureRequired) {
      dispatch(setScreen('signature'));
    } else {
      dispatch(setScreen('payment'));
    }
  };

  const handleNeedHelp = async () => {
    try {
      await publishHelpRequested('tip');
    } catch (error) {
      console.error('Failed to publish help request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col" role="main" id="main-content">
      {/* Header */}
      <header className="p-6 bg-white border-b border-gray-100 shadow-sm" role="banner">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {isSplitPayment && currentSplit && (
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                Payment {currentSplit.splitIndex + 1} of {currentSplit.totalSplits}
              </span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-7 h-7 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">Add a Tip</h1>
          </div>
          <p className="text-lg text-gray-500">
            Show your appreciation for {transaction.staffName}
          </p>
        </motion.div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto"
        >
          {/* Tip Options Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6" role="group" aria-label="Tip selection options">
            {tipSuggestions.map((suggestion, index) => (
              <TipButton
                key={index}
                label={getTipLabel(suggestion)}
                subLabel={formatCurrency(calculateTipAmount(suggestion))}
                isSelected={selectedTipIndex === index && !isNoTip && customTipAmount === null}
                onClick={() => handleTipSelect(index)}
              />
            ))}
          </div>

          {/* Custom Tip Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCustomTip}
            aria-label={customTipAmount !== null ? `Custom tip of ${formatCurrency(customTipAmount)} selected. Press to change` : 'Enter a custom tip amount'}
            aria-pressed={customTipAmount !== null}
            className={`w-full min-h-[64px] rounded-2xl border-2 mb-4 text-lg font-medium transition-all flex items-center justify-center ${
              customTipAmount !== null
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
            }`}
          >
            {customTipAmount !== null
              ? `Custom: ${formatCurrency(customTipAmount)}`
              : 'Enter Custom Amount'}
          </motion.button>

          {/* No Tip Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNoTip}
            aria-label="Select no tip"
            aria-pressed={isNoTip}
            className={`w-full min-h-[56px] rounded-xl border-2 text-base font-medium transition-all ${
              isNoTip
                ? 'border-gray-400 bg-gray-100 text-gray-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            No Tip
          </motion.button>

          {/* Running Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg text-gray-600">Subtotal</span>
              <span className="text-lg text-gray-900">{formatCurrency(baseAmount)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg text-gray-600">Tip</span>
              <span className={`text-lg ${currentTipAmount > 0 ? 'text-green-600 font-medium' : 'text-gray-900'}`}>
                {formatCurrency(currentTipAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-900">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(runningTotal)}</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Continue Button */}
          <button
            onClick={handleContinue}
            aria-label={`Continue with ${formatCurrency(currentTipAmount)} tip, total ${formatCurrency(runningTotal)}`}
            className="w-full min-h-[64px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xl font-semibold rounded-2xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span>Continue</span>
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>

          {/* Need Help */}
          <button
            onClick={handleNeedHelp}
            aria-label="Request assistance from staff"
            className="w-full min-h-[56px] bg-orange-50 text-orange-700 text-lg font-medium rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span>Need Help</span>
          </button>
        </motion.div>
      </footer>

      {/* Numeric Keypad Modal */}
      <NumericKeypadModal
        isOpen={isKeypadOpen}
        onClose={() => setIsKeypadOpen(false)}
        onConfirm={handleCustomTipConfirm}
        maxValue={baseAmount * 2}
      />
    </div>
  );
}
