/**
 * SplitStatusPage - Split Payment Status Screen
 * US-010: Shows progress of split payments (completed/pending)
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  XCircle,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setScreen } from '@/store/slices/padSlice';
import { 
  setCurrentSplitIndex, 
  updateSplitPayment,
  setTip,
  setSignature,
  setPaymentResult,
} from '@/store/slices/transactionSlice';
import { formatCurrency } from '@/utils/splitCalculations';
import type { SplitPayment } from '@/types';

interface SplitCardProps {
  split: SplitPayment;
  isCurrent: boolean;
  onPayNow: () => void;
}

function SplitCard({ split, isCurrent, onPayNow }: SplitCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      label: 'Pending',
      labelColor: 'text-gray-500',
    },
    completed: {
      icon: Check,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      label: 'Paid',
      labelColor: 'text-green-600',
    },
    failed: {
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      label: 'Failed',
      labelColor: 'text-red-600',
    },
  };

  const config = statusConfig[split.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: split.splitIndex * 0.1 }}
      className={`p-5 rounded-2xl border-2 transition-all ${
        isCurrent && split.status === 'pending'
          ? 'border-indigo-600 bg-indigo-50 shadow-lg'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.iconBg}`}>
          <Icon className={`w-7 h-7 ${config.iconColor}`} />
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900">
            Payment {split.splitIndex + 1} of {split.totalSplits}
          </p>
          <p className={`text-sm font-medium ${config.labelColor}`}>{config.label}</p>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(split.amount + (split.tipAmount || 0))}
          </p>
          {split.tipAmount && split.tipAmount > 0 && (
            <p className="text-sm text-gray-500">
              includes {formatCurrency(split.tipAmount)} tip
            </p>
          )}
        </div>
      </div>

      {/* Pay Now Button */}
      {isCurrent && split.status === 'pending' && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onClick={onPayNow}
          className="w-full mt-4 min-h-[56px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>Pay Now</span>
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}
    </motion.div>
  );
}

export function SplitStatusPage() {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((state) => state.transaction.current);
  const splitPayments = useAppSelector((state) => state.transaction.splitPayments);
  const currentSplitIndex = useAppSelector((state) => state.transaction.currentSplitIndex);
  const paymentResult = useAppSelector((state) => state.transaction.paymentResult);
  const config = useAppSelector((state) => state.config.config);
  
  const lastProcessedResult = useRef<string | null>(null);

  const completedCount = splitPayments.filter((s) => s.status === 'completed').length;
  const totalCount = splitPayments.length;
  const allComplete = completedCount === totalCount && totalCount > 0;

  useEffect(() => {
    if (paymentResult && lastProcessedResult.current !== paymentResult.processedAt) {
      lastProcessedResult.current = paymentResult.processedAt;
      
      if (paymentResult.success) {
        dispatch(updateSplitPayment({
          index: currentSplitIndex,
          update: { status: 'completed' },
        }));

        const nextPending = splitPayments.findIndex(
          (s, i) => i > currentSplitIndex && s.status === 'pending'
        );
        
        if (nextPending !== -1) {
          dispatch(setCurrentSplitIndex(nextPending));
          dispatch(setTip({ tipAmount: 0, tipPercent: null, selectedAt: '' }));
          dispatch(setSignature({ signatureBase64: '', agreedAt: '' }));
          dispatch(setPaymentResult(null as never));
        }
      } else {
        dispatch(updateSplitPayment({
          index: currentSplitIndex,
          update: { status: 'failed' },
        }));
      }
    }
  }, [paymentResult, currentSplitIndex, splitPayments, dispatch]);

  useEffect(() => {
    if (allComplete) {
      const timer = setTimeout(() => {
        if (config.showReceiptOptions) {
          dispatch(setScreen('receipt'));
        } else {
          dispatch(setScreen('thank-you'));
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allComplete, config.showReceiptOptions, dispatch]);

  const handleBack = () => {
    dispatch(setScreen('split-selection'));
  };

  const handlePayNow = (splitIndex: number) => {
    dispatch(setCurrentSplitIndex(splitIndex));
    dispatch(setTip({ tipAmount: 0, tipPercent: null, selectedAt: '' }));
    dispatch(setSignature({ signatureBase64: '', agreedAt: '' }));
    dispatch(setPaymentResult(null as never));
    
    if (config.tipEnabled) {
      dispatch(setScreen('tip'));
    } else if (config.signatureRequired) {
      dispatch(setScreen('signature'));
    } else {
      dispatch(setScreen('payment'));
    }
  };

  const handleCancelSplit = () => {
    dispatch(setScreen('order-review'));
  };

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
            <p className="text-gray-500">
              {completedCount} of {totalCount} payments completed
            </p>
          </div>
        </motion.div>
      </header>

      {/* Progress Bar */}
      <div className="px-6 pt-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
            transition={{ type: 'spring', stiffness: 100 }}
          />
        </div>
      </div>

      {/* Split Cards */}
      <main className="flex-1 overflow-auto p-6 space-y-4">
        {splitPayments.map((split) => (
          <SplitCard
            key={split.splitIndex}
            split={split}
            isCurrent={split.splitIndex === currentSplitIndex}
            onPayNow={() => handlePayNow(split.splitIndex)}
          />
        ))}

        {/* All Complete Message */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Payments Complete!</h2>
            <p className="text-gray-500">Redirecting...</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      {!allComplete && (
        <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleCancelSplit}
            className="w-full min-h-[56px] bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            Cancel Split & Pay Full Amount
          </button>
        </footer>
      )}
    </div>
  );
}
