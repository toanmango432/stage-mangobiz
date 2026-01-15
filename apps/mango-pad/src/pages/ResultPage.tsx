/**
 * ResultPage - Payment Result Screen
 * US-007: Displays success or failure state after payment processing
 * US-014: WCAG 2.1 AA Accessibility compliance
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, CreditCard, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setScreen } from '@/store/slices/padSlice';
import { setPaymentResult } from '@/store/slices/transactionSlice';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function ResultPage() {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((state) => state.transaction.current);
  const paymentResult = useAppSelector((state) => state.transaction.paymentResult);
  const tip = useAppSelector((state) => state.transaction.tip);
  const config = useAppSelector((state) => state.config.config);
  const isSplitPayment = useAppSelector((state) => state.transaction.isSplitPayment);
  const splitPayments = useAppSelector((state) => state.transaction.splitPayments);
  const currentSplitIndex = useAppSelector((state) => state.transaction.currentSplitIndex);

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSplit = isSplitPayment ? splitPayments[currentSplitIndex] : null;
  const baseAmount = currentSplit ? currentSplit.amount : (transaction?.total ?? 0);
  const tipAmount = tip?.tipAmount ?? 0;
  const finalTotal = baseAmount + tipAmount;

  const handleRetry = useCallback(() => {
    dispatch(setPaymentResult(null as never));
    dispatch(setScreen('payment'));
  }, [dispatch]);

  const handleContinue = useCallback(() => {
    if (isSplitPayment) {
      dispatch(setScreen('split-status'));
    } else if (config.showReceiptOptions) {
      dispatch(setScreen('receipt'));
    } else {
      dispatch(setScreen('thank-you'));
    }
  }, [dispatch, config.showReceiptOptions, isSplitPayment]);

  useEffect(() => {
    if (paymentResult?.success) {
      const delay = (config.thankYouDelay ?? 5) * 1000;
      autoAdvanceTimer.current = setTimeout(() => {
        handleContinue();
      }, delay);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [paymentResult?.success, config.thankYouDelay, handleContinue]);

  // If we have payment result but no transaction, still show the result
  // and auto-advance (the transaction data might have been cleared)
  if (!paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">Waiting for payment result...</p>
      </div>
    );
  }

  const isSuccess = paymentResult.success;

  // If transaction is missing but we have payment result, show minimal result
  // The auto-advance useEffect will handle navigation
  if (!transaction) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          isSuccess ? 'bg-gradient-to-b from-green-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'
        }`}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          {isSuccess ? (
            <CheckCircle className="w-32 h-32 text-green-500 mx-auto mb-6" />
          ) : (
            <XCircle className="w-32 h-32 text-red-500 mx-auto mb-6" />
          )}
          <h1 className={`text-4xl font-bold ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>
          <p className="text-lg text-gray-500 mt-4">
            {isSuccess ? 'Continuing shortly...' : 'Please try again'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isSuccess
          ? 'bg-gradient-to-b from-green-50 to-white'
          : 'bg-gradient-to-b from-red-50 to-white'
      }`}
      role="main"
      id="main-content"
      aria-live="polite"
    >
      {/* Split payment indicator */}
      {isSplitPayment && currentSplit && (
        <div className="px-6 pt-4 text-center">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            Payment {currentSplit.splitIndex + 1} of {currentSplit.totalSplits}
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center max-w-lg"
        >
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, duration: 0.5 }}
            className="mb-6"
            aria-hidden="true"
          >
            {isSuccess ? (
              <CheckCircle className="w-32 h-32 text-green-500 mx-auto" />
            ) : (
              <XCircle className="w-32 h-32 text-red-500 mx-auto" />
            )}
          </motion.div>

          {/* Status Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-4xl font-bold mb-4 ${
              isSuccess ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </motion.h1>

          {/* Amount */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl text-gray-700 mb-6"
          >
            {formatCurrency(finalTotal)}
          </motion.p>

          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 mb-6 ${
              isSuccess ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {isSuccess ? (
              <div className="space-y-3">
                {paymentResult.cardLast4 && (
                  <div className="flex items-center justify-center gap-3 text-lg text-green-800">
                    <CreditCard className="w-6 h-6" />
                    <span>Card ending in {paymentResult.cardLast4}</span>
                  </div>
                )}
                {paymentResult.authCode && (
                  <p className="text-base text-green-700">
                    Authorization: {paymentResult.authCode}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg text-red-800 font-medium mb-2">
                  {paymentResult.failureReason || 'Transaction could not be processed'}
                </p>
                <p className="text-base text-red-600">
                  Please try again or use a different payment method
                </p>
              </div>
            )}
          </motion.div>

          {/* Auto-advance indicator for success */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <p className="text-base text-gray-500">
                Continuing in {config.thankYouDelay ?? 5} seconds...
              </p>
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{
                  duration: config.thankYouDelay ?? 5,
                  ease: 'linear',
                }}
                className="h-1 bg-green-400 rounded-full mt-3 origin-left"
              />
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {isSuccess ? (
            <button
              onClick={handleContinue}
              aria-label="Continue to receipt options"
              className="w-full min-h-[64px] text-xl font-semibold rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:from-green-600 hover:to-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleRetry}
              aria-label="Retry payment"
              className="w-full min-h-[64px] text-xl font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-6 h-6" aria-hidden="true" />
              <span>Try Again</span>
            </button>
          )}
        </motion.div>
      </footer>
    </div>
  );
}
