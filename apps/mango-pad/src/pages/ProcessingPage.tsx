/**
 * ProcessingPage - Payment Processing Screen
 * US-016: Shows a processing indicator while payment is being processed
 *
 * Displays a spinner animation while waiting for payment result from Store App.
 * Auto-navigates to /complete or /failed when transaction step changes.
 *
 * In demo mode, automatically simulates successful payment after a short delay
 * since no MQTT payment_result message will be sent from Store App.
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { useTransactionNavigation } from '@/hooks/useTransactionNavigation';
import { formatCurrency } from '@/utils/formatting';
import { createDemoTransaction } from '@/constants/demoData';
import { isDemoMode } from '@/components/DemoBanner';
import { useAppDispatch } from '@/store/hooks';
import { setPaymentResult } from '@/store/slices/transactionSlice';
import { setScreen } from '@/store/slices/padSlice';

export function ProcessingPage() {
  const { activeTransaction } = usePadMqtt();
  const dispatch = useAppDispatch();
  const hasSimulatedRef = useRef(false);

  // Enable auto-navigation on transaction step changes
  // Will navigate to /complete or /failed when payment result arrives
  useTransactionNavigation({ skipInitialNavigation: true });

  // In standalone demo mode (demo transaction, not real from Store App),
  // simulate successful payment after a short delay.
  // Only auto-complete if:
  // 1. In Demo Mode (localStorage flag)
  // 2. AND transaction is a demo transaction (ID starts with "demo-")
  //    OR no active transaction at all
  useEffect(() => {
    // Check if this is a demo transaction (created locally, not from Store App)
    const isDemoTransaction = activeTransaction?.transactionId?.startsWith('demo-') ?? false;
    const isStandaloneDemo = isDemoMode() && (isDemoTransaction || !activeTransaction);

    if (!isStandaloneDemo || hasSimulatedRef.current) {
      return;
    }

    console.log('[ProcessingPage] Demo transaction detected - will auto-complete in 2.5s', {
      transactionId: activeTransaction?.transactionId,
      isDemoTransaction,
    });

    const timer = setTimeout(() => {
      if (hasSimulatedRef.current) return;
      hasSimulatedRef.current = true;

      console.log('[ProcessingPage] Demo mode: Simulating successful payment');

      // Dispatch payment result to transaction slice
      dispatch(
        setPaymentResult({
          success: true,
          cardLast4: '4242',
          authCode: 'DEMO123',
          processedAt: new Date().toISOString(),
        })
      );

      // Navigate to result screen
      dispatch(setScreen('result'));
    }, 2500); // 2.5 second delay to show processing animation

    return () => clearTimeout(timer);
  }, [dispatch, activeTransaction]);

  // Use activeTransaction from context, fallback to demo data for demo mode
  const transaction = activeTransaction ?? createDemoTransaction('waiting_payment', {
    tipAmount: 17.33,
    tipPercent: 18,
  });

  // Calculate final total including tip
  const tipAmount = transaction.tipAmount ?? 0;
  const finalTotal = transaction.total + tipAmount;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-6"
      role="main"
      id="main-content"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        {/* Animated Card Icon Container */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative mb-8"
        >
          {/* Outer ring - pulsing */}
          <motion.div
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 w-32 h-32 bg-indigo-200 rounded-full"
          />

          {/* Inner container with icon */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <CreditCard className="w-14 h-14 text-white" aria-hidden="true" />
          </div>

          {/* Spinner ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 w-32 h-32"
          >
            <svg
              viewBox="0 0 128 128"
              className="w-full h-full"
              aria-hidden="true"
            >
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-indigo-100"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="100 280"
                className="text-indigo-500"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Processing Text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-bold text-gray-900 mb-2"
        >
          Processing Payment
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg text-gray-500 mb-6"
        >
          Please wait while we process your payment...
        </motion.p>

        {/* Total Amount */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full"
        >
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-4xl font-bold text-gray-900">{formatCurrency(finalTotal)}</p>
          {tipAmount > 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Includes {formatCurrency(tipAmount)} tip
            </p>
          )}
        </motion.div>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex gap-2 mt-8"
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              className="w-3 h-3 bg-indigo-400 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Processing payment for {formatCurrency(finalTotal)}. Please wait.
      </div>
    </div>
  );
}
