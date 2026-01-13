/**
 * CompletePage - Payment Success Screen
 * US-017: Shows payment success confirmation with auto-return to waiting page
 *
 * Displays a success checkmark icon with "Payment Complete" message,
 * shows final total with tip included, and auto-returns to WaitingPage after 5 seconds.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Star } from 'lucide-react';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import type { ActiveTransaction } from '@/types';

/**
 * Demo transaction data for testing without a live Store App connection
 */
const DEMO_TRANSACTION: Omit<ActiveTransaction, 'step' | 'startedAt'> = {
  transactionId: 'demo-complete-page',
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
  tipAmount: 17.33, // 18% tip
  tipPercent: 18,
};

const AUTO_RETURN_DELAY_SECONDS = 5;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function CompletePage() {
  const navigate = useNavigate();
  const { activeTransaction, clearTransaction } = usePadMqtt();
  const autoReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCleared = useRef(false);

  // Use activeTransaction from context, fallback to demo data for demo mode
  const transaction = activeTransaction ?? {
    ...DEMO_TRANSACTION,
    step: 'complete' as const,
    startedAt: new Date().toISOString(),
  };

  // Calculate final total including tip
  const tipAmount = transaction.tipAmount ?? 0;
  const finalTotal = transaction.total + tipAmount;
  const clientName = transaction.clientName ?? 'Valued Customer';

  // Get payment result info if available
  const paymentResult = transaction.paymentResult;
  const cardInfo = paymentResult?.cardLast4
    ? `**** ${paymentResult.cardLast4}${paymentResult.cardBrand ? ` (${paymentResult.cardBrand})` : ''}`
    : null;

  const handleReturnToWaiting = useCallback(() => {
    // Clear transaction before navigating (only once)
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearTransaction();
    }
    navigate('/', { replace: true });
  }, [clearTransaction, navigate]);

  // Auto-return to waiting page after delay
  useEffect(() => {
    autoReturnTimer.current = setTimeout(() => {
      handleReturnToWaiting();
    }, AUTO_RETURN_DELAY_SECONDS * 1000);

    return () => {
      if (autoReturnTimer.current) {
        clearTimeout(autoReturnTimer.current);
      }
    };
  }, [handleReturnToWaiting]);

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
      className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 flex flex-col"
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
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 left-10"
        >
          <Sparkles className="w-12 h-12 text-yellow-400" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          className="absolute top-32 right-16"
        >
          <Star className="w-10 h-10 text-green-400" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-40 left-20"
        >
          <Sparkles className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-32 right-12"
        >
          <Star className="w-10 h-10 text-teal-400" />
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
          {/* Animated Checkmark Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl"
            >
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          {/* Success Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-3"
          >
            Payment Complete
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-8"
          >
            Thank you, {clientName}!
          </motion.p>

          {/* Total Amount Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <p className="text-sm text-gray-500 mb-1">Total Charged</p>
            <p className="text-4xl font-bold text-gray-900">{formatCurrency(finalTotal)}</p>
            {tipAmount > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Includes {formatCurrency(tipAmount)} tip ({transaction.tipPercent ?? 0}%)
              </p>
            )}
            {cardInfo && (
              <p className="text-sm text-gray-400 mt-2">
                Paid with {cardInfo}
              </p>
            )}
          </motion.div>

          {/* Receipt Confirmation */}
          {transaction.receiptPreference && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 rounded-xl p-4 border border-green-100"
            >
              <p className="text-sm text-green-700">
                {transaction.receiptPreference === 'email' && `Receipt sent to ${transaction.clientEmail ?? 'your email'}`}
                {transaction.receiptPreference === 'sms' && `Receipt sent to ${transaction.clientPhone ?? 'your phone'}`}
                {transaction.receiptPreference === 'print' && 'Your printed receipt is ready'}
                {transaction.receiptPreference === 'none' && 'No receipt requested'}
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer with Auto-return Indicator */}
      <footer className="p-6 bg-white/50 backdrop-blur border-t border-gray-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-base text-gray-500 mb-3">
            Returning to home screen in {AUTO_RETURN_DELAY_SECONDS} seconds...
          </p>
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: AUTO_RETURN_DELAY_SECONDS,
              ease: 'linear',
            }}
            className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full origin-left max-w-md mx-auto"
          />
          <button
            onClick={handleReturnToWaiting}
            className="mt-4 min-h-[56px] px-8 text-lg font-semibold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </motion.div>
      </footer>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Payment complete. {formatCurrency(finalTotal)} charged successfully. Thank you {clientName}.
      </div>
    </div>
  );
}
