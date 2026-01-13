/**
 * PaymentPage - Payment Instruction Screen
 * US-006: Displays payment instructions while waiting for terminal result
 * US-014: WCAG 2.1 AA Accessibility compliance
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  HelpCircle,
  Wifi,
  Square,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { setScreen } from '@/store/slices/padSlice';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

interface TerminalIconProps {
  type?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}

function TerminalIcon({ type }: TerminalIconProps) {
  switch (type) {
    case 'pax':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-24 bg-gray-800 rounded-lg flex flex-col items-center justify-end pb-2 relative">
            <div className="absolute top-2 w-10 h-6 bg-blue-400 rounded-sm" />
            <div className="grid grid-cols-3 gap-0.5 mt-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-600 rounded-sm" />
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500 font-medium">PAX Terminal</span>
        </div>
      );
    case 'dejavoo':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-24 bg-gray-800 rounded-xl flex flex-col items-center justify-end pb-2 relative">
            <div className="absolute top-2 w-10 h-8 bg-green-400 rounded-sm" />
            <div className="grid grid-cols-3 gap-0.5 mt-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-600 rounded-full" />
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500 font-medium">Dejavoo Terminal</span>
        </div>
      );
    case 'clover':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center relative">
            <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Square className="w-4 h-4 text-white" fill="white" />
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-500 font-medium">Clover Terminal</span>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-24 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg flex flex-col items-center justify-end pb-2 relative">
            <div className="absolute top-2 w-10 h-6 bg-gray-400 rounded-sm" />
            <div className="w-4 h-0.5 bg-gray-600 absolute top-10" />
            <div className="grid grid-cols-3 gap-0.5 mt-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-600 rounded-sm" />
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500 font-medium">Payment Terminal</span>
        </div>
      );
  }
}

function CardAnimation() {
  return (
    <motion.div className="relative w-64 h-48 flex items-center justify-center">
      {/* NFC waves */}
      <AnimatePresence>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.5, 1.8],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut',
            }}
            className="absolute w-24 h-24 border-4 border-indigo-400 rounded-full"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </AnimatePresence>

      {/* Card icon bouncing */}
      <motion.div
        animate={{
          y: [-5, 5, -5],
          rotate: [0, -5, 0, 5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-4 shadow-xl"
      >
        <CreditCard className="w-16 h-16 text-white" />
      </motion.div>

      {/* Tap phone animation */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{
          opacity: [0, 1, 1, 0],
          x: [50, 20, 20, 50],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20"
      >
        <div className="bg-gray-800 rounded-2xl p-2 shadow-lg">
          <Smartphone className="w-10 h-10 text-gray-300" />
          <Wifi className="w-4 h-4 text-green-400 absolute -top-1 -left-1 rotate-45" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function PulsingLoader() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-3 h-3 bg-indigo-500 rounded-full"
        />
      ))}
    </div>
  );
}

export function PaymentPage() {
  const dispatch = useAppDispatch();
  const { publishHelpRequested, isConnected } = usePadMqtt();
  const transaction = useAppSelector((state) => state.transaction.current);
  const tip = useAppSelector((state) => state.transaction.tip);
  const paymentResult = useAppSelector((state) => state.transaction.paymentResult);
  const config = useAppSelector((state) => state.config.config);
  const isSplitPayment = useAppSelector((state) => state.transaction.isSplitPayment);
  const splitPayments = useAppSelector((state) => state.transaction.splitPayments);
  const currentSplitIndex = useAppSelector((state) => state.transaction.currentSplitIndex);

  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSplit = isSplitPayment ? splitPayments[currentSplitIndex] : null;
  const baseAmount = currentSplit ? currentSplit.amount : (transaction?.total ?? 0);
  const totalWithTip = baseAmount + (tip?.tipAmount ?? 0);
  const terminalType = transaction?.terminalType;
  const paymentTimeout = config.paymentTimeout * 1000;

  useEffect(() => {
    if (paymentResult) {
      dispatch(setScreen('result'));
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
    }, paymentTimeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [paymentResult, paymentTimeout, dispatch]);

  const handleNeedHelp = useCallback(async () => {
    try {
      await publishHelpRequested('payment');
    } catch (error) {
      console.error('Failed to publish help request:', error);
    }
  }, [publishHelpRequested]);

  const handleRetry = useCallback(() => {
    setIsTimedOut(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
    }, paymentTimeout);
  }, [paymentTimeout]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">No transaction data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col" role="main" id="main-content">
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
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-lg text-gray-500 mt-1">
            Follow the instructions below
          </p>
        </motion.div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {isTimedOut ? (
            <motion.div
              key="timeout"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="w-12 h-12 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Payment Taking Longer Than Expected
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Please ensure your card is inserted or tapped on the terminal.
                If you need assistance, tap the button below.
              </p>
              <div className="flex flex-col gap-4" role="group" aria-label="Payment timeout options">
                <button
                  onClick={handleRetry}
                  aria-label="Retry payment"
                  className="w-full min-h-[56px] bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleNeedHelp}
                  aria-label="Request assistance from staff"
                  className="w-full min-h-[56px] bg-orange-50 text-orange-700 text-lg font-medium rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Need Help</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-lg"
            >
              {/* Card animation */}
              <div className="mb-8">
                <CardAnimation />
              </div>

              {/* Instructions */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900 mb-4"
              >
                Please Insert or Tap Card
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-600 mb-8"
              >
                on the payment terminal
              </motion.p>

              {/* Terminal icon */}
              {terminalType && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <TerminalIcon type={terminalType} />
                </motion.div>
              )}

              {/* Amount */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
              >
                <p className="text-lg text-gray-500 mb-2">Amount to Charge</p>
                <p className="text-4xl font-bold text-gray-900">
                  {formatCurrency(totalWithTip)}
                </p>
              </motion.div>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <PulsingLoader />
                <p className="text-base text-gray-500">Waiting for payment...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {!isTimedOut && (
            <button
              onClick={handleNeedHelp}
              aria-label="Request assistance from staff"
              className="w-full min-h-[56px] bg-orange-50 text-orange-700 text-lg font-medium rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              <span>Need Help</span>
            </button>
          )}
        </motion.div>

        {/* Connection status indicator */}
        <div className="mt-4 flex items-center justify-center gap-2" role="status" aria-live="polite">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            aria-hidden="true"
          />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </footer>
    </div>
  );
}
