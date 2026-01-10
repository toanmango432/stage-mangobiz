/**
 * SplitSelectionPage - Split Payment Selection Screen
 * US-010: Allows client to choose how to split the bill
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Check, 
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { setScreen } from '@/store/slices/padSlice';
import { initializeSplitPayment } from '@/store/slices/transactionSlice';
import { 
  calculateEqualSplits, 
  validateSplitAmounts, 
  formatCurrency,
  adjustLastSplit,
} from '@/utils/splitCalculations';

type SplitMode = 'equal' | 'custom';

interface EqualSplitButtonProps {
  splits: number;
  amount: number;
  isSelected: boolean;
  onSelect: () => void;
}

function EqualSplitButton({ splits, amount, isSelected, onSelect }: EqualSplitButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all min-h-[120px] ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className={`flex items-center gap-1 mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`}>
        {Array.from({ length: splits }).map((_, i) => (
          <Users key={i} className="w-5 h-5" />
        ))}
      </div>
      <p className={`text-lg font-semibold ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
        {splits}-Way Split
      </p>
      <p className={`text-2xl font-bold mt-1 ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
        {formatCurrency(amount)} each
      </p>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

interface CustomAmountInputProps {
  index: number;
  amount: number;
  onChange: (value: number) => void;
  total: number;
}

function CustomAmountInput({ index, amount, onChange, total }: CustomAmountInputProps) {
  const [inputValue, setInputValue] = useState(amount.toFixed(2));

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.min(parsed, total));
      setInputValue(Math.min(parsed, total).toFixed(2));
    } else {
      setInputValue(amount.toFixed(2));
    }
  };

  const adjust = (delta: number) => {
    const newValue = Math.max(0, Math.min(total, amount + delta));
    onChange(newValue);
    setInputValue(newValue.toFixed(2));
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">Person {index + 1}</p>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            className="flex-1 text-2xl font-bold text-gray-900 bg-transparent border-none outline-none w-24"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => adjust(-5)}
          className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all"
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => adjust(5)}
          className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export function SplitSelectionPage() {
  const dispatch = useAppDispatch();
  const { publishSplitPayment } = usePadMqtt();
  const transaction = useAppSelector((state) => state.transaction.current);
  const config = useAppSelector((state) => state.config.config);
  
  const [mode, setMode] = useState<SplitMode>('equal');
  const [selectedEqualSplit, setSelectedEqualSplit] = useState<number>(2);
  const [customSplitCount, setCustomSplitCount] = useState(2);
  const [customAmounts, setCustomAmounts] = useState<number[]>([]);

  const total = transaction?.total ?? 0;
  const maxSplits = config.maxSplits || 4;

  const handleBack = () => {
    dispatch(setScreen('order-review'));
  };

  const handleEqualSplitSelect = (splits: number) => {
    setSelectedEqualSplit(splits);
  };

  const handleCustomAmountChange = useCallback((index: number, value: number) => {
    setCustomAmounts((prev) => {
      const newAmounts = [...prev];
      newAmounts[index] = value;
      return newAmounts;
    });
  }, []);

  const handleAddCustomSplit = () => {
    if (customSplitCount < maxSplits) {
      const newCount = customSplitCount + 1;
      setCustomSplitCount(newCount);
      const equalSplits = calculateEqualSplits(total, newCount);
      setCustomAmounts(equalSplits.map((s) => s.amount));
    }
  };

  const handleRemoveCustomSplit = () => {
    if (customSplitCount > 2) {
      const newCount = customSplitCount - 1;
      setCustomSplitCount(newCount);
      const equalSplits = calculateEqualSplits(total, newCount);
      setCustomAmounts(equalSplits.map((s) => s.amount));
    }
  };

  const handleModeChange = (newMode: SplitMode) => {
    setMode(newMode);
    if (newMode === 'custom') {
      const equalSplits = calculateEqualSplits(total, customSplitCount);
      setCustomAmounts(equalSplits.map((s) => s.amount));
    }
  };

  const handleContinue = async () => {
    let amounts: number[];
    
    if (mode === 'equal') {
      const splits = calculateEqualSplits(total, selectedEqualSplit);
      amounts = splits.map((s) => s.amount);
    } else {
      amounts = adjustLastSplit(customAmounts, total);
      const validation = validateSplitAmounts(amounts, total);
      if (!validation.isValid) {
        return;
      }
    }

    dispatch(initializeSplitPayment({ amounts }));

    try {
      await publishSplitPayment({
        splitType: mode,
        splits: amounts.map((amount, index) => ({ index, amount })),
      });
    } catch (error) {
      console.error('Failed to publish split payment:', error);
    }

    dispatch(setScreen('split-status'));
  };

  const validation = mode === 'custom' 
    ? validateSplitAmounts(customAmounts, total)
    : { isValid: true, difference: 0 };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">No transaction data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="p-6 bg-white border-b border-gray-100 shadow-sm">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Split Payment</h1>
            <p className="text-gray-500">Total: {formatCurrency(total)}</p>
          </div>
        </motion.div>
      </header>

      {/* Mode Selector */}
      <div className="p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleModeChange('equal')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              mode === 'equal'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Equal Split
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              mode === 'custom'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Amounts
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          {mode === 'equal' ? (
            <motion.div
              key="equal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 gap-4"
            >
              {[2, 3, 4].filter(n => n <= maxSplits).map((splits) => {
                const splitAmounts = calculateEqualSplits(total, splits);
                return (
                  <div key={splits} className="relative">
                    <EqualSplitButton
                      splits={splits}
                      amount={splitAmounts[0].amount}
                      isSelected={selectedEqualSplit === splits}
                      onSelect={() => handleEqualSplitSelect(splits)}
                    />
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Split Count Controls */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-medium text-gray-700">Number of splits</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRemoveCustomSplit}
                    disabled={customSplitCount <= 2}
                    className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-8 text-center">
                    {customSplitCount}
                  </span>
                  <button
                    onClick={handleAddCustomSplit}
                    disabled={customSplitCount >= maxSplits}
                    className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Custom Amount Inputs */}
              {customAmounts.map((amount, index) => (
                <CustomAmountInput
                  key={index}
                  index={index}
                  amount={amount}
                  onChange={(value) => handleCustomAmountChange(index, value)}
                  total={total}
                />
              ))}

              {/* Validation Message */}
              {customAmounts.length > 0 && (
                <div className={`p-4 rounded-xl ${validation.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-center font-medium ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {validation.isValid 
                      ? '✓ Amounts equal total'
                      : `Difference: ${formatCurrency(Math.abs(validation.difference))}`
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleContinue}
            disabled={mode === 'custom' && !validation.isValid}
            className="w-full min-h-[64px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xl font-semibold rounded-2xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue to First Payment</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </motion.div>
      </footer>
    </div>
  );
}
