/**
 * FailedPage - Payment Failure Screen
 * US-018: Shows payment failure information with return to waiting button
 *
 * Displays an error icon with "Payment Failed" message,
 * shows error message from payment_result if available,
 * and has a Return to Waiting button that clears transaction.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle } from 'lucide-react';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { formatCurrency } from '@/utils/formatting';
import { createDemoTransaction } from '@/constants/demoData';

export function FailedPage() {
  const navigate = useNavigate();
  const { activeTransaction, clearTransaction } = usePadMqtt();
  const hasCleared = useRef(false);

  // Use activeTransaction from context, fallback to demo data for demo mode
  const transaction = activeTransaction ?? createDemoTransaction('failed', {
    paymentResult: {
      success: false,
      failureReason: 'Card declined - insufficient funds',
    },
  });

  // Get error message from payment result (failureReason is the field name in PaymentResult type)
  const errorMessage = transaction.paymentResult?.failureReason ?? 'An unknown error occurred during payment processing.';
  const clientName = transaction.clientName ?? 'Customer';

  // Calculate attempted total including tip
  const tipAmount = transaction.tipAmount ?? 0;
  const attemptedTotal = transaction.total + tipAmount;

  const handleReturnToWaiting = useCallback(() => {
    // Clear transaction before navigating (only once)
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearTransaction();
    }
    navigate('/', { replace: true });
  }, [clearTransaction, navigate]);

  // Clear transaction on unmount if navigating away by other means
  useEffect(() => {
    return () => {
      if (!hasCleared.current) {
        hasCleared.current = true;
        clearTransaction();
      }
    };
  }, [clearTransaction]);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-red-50 via-white to-rose-50 flex flex-col"
      role="main"
      id="main-content"
    >
      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-24 left-12"
        >
          <AlertTriangle className="w-10 h-10 text-red-300" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          className="absolute top-36 right-16"
        >
          <AlertTriangle className="w-8 h-8 text-rose-300" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-44 left-16"
        >
          <AlertTriangle className="w-8 h-8 text-red-200" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-36 right-20"
        >
          <AlertTriangle className="w-10 h-10 text-rose-200" />
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center max-w-lg w-full"
        >
          {/* Animated Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl"
            >
              <XCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          {/* Error Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-3"
          >
            Payment Failed
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-8"
          >
            We're sorry, {clientName}
          </motion.p>

          {/* Error Details Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <div className="flex items-start gap-3 text-left">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 mb-1">Error Details</p>
                <p className="text-base text-gray-700">{errorMessage}</p>
              </div>
            </div>
          </motion.div>

          {/* Attempted Amount Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-red-50 rounded-xl p-4 border border-red-100 mb-8"
          >
            <p className="text-sm text-red-600 mb-1">Amount Not Charged</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(attemptedTotal)}</p>
            {tipAmount > 0 && (
              <p className="text-xs text-red-500 mt-1">
                (Includes {formatCurrency(tipAmount)} tip)
              </p>
            )}
          </motion.div>

          {/* Help Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-gray-500 mb-6"
          >
            Please try again or use a different payment method.
            <br />
            Contact staff if you need assistance.
          </motion.p>
        </motion.div>
      </main>

      {/* Footer with Return Button */}
      <footer className="p-6 bg-white/50 backdrop-blur border-t border-gray-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={handleReturnToWaiting}
            className="min-h-[56px] px-12 text-lg font-semibold rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:from-red-600 hover:to-rose-700 active:scale-[0.98] transition-all"
          >
            Return to Waiting
          </button>
        </motion.div>
      </footer>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Payment failed. {errorMessage} Amount of {formatCurrency(attemptedTotal)} was not charged.
      </div>
    </div>
  );
}
