/**
 * ThankYouPage - Transaction Complete Screen
 * US-009: Displays thank you message, loyalty points, promo, and auto-returns to idle
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Gift, Star } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { resetToIdle } from '@/store/slices/padSlice';
import { clearTransaction } from '@/store/slices/transactionSlice';
import { usePadMqtt } from '@/providers/PadMqttProvider';

export function ThankYouPage() {
  const dispatch = useAppDispatch();
  const { publishTransactionComplete } = usePadMqtt();
  const transaction = useAppSelector((state) => state.transaction.current);
  const config = useAppSelector((state) => state.config.config);

  const autoReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPublished = useRef(false);

  const clientName = transaction?.clientName ?? 'Valued Customer';
  const loyaltyPoints = transaction?.loyaltyPoints;
  const thankYouDelay = config.thankYouDelay ?? 5;

  const handleReturnToIdle = useCallback(() => {
    dispatch(clearTransaction());
    dispatch(resetToIdle());
  }, [dispatch]);

  useEffect(() => {
    if (!hasPublished.current) {
      hasPublished.current = true;
      publishTransactionComplete();
    }

    autoReturnTimer.current = setTimeout(() => {
      handleReturnToIdle();
    }, thankYouDelay * 1000);

    return () => {
      if (autoReturnTimer.current) {
        clearTimeout(autoReturnTimer.current);
      }
    };
  }, [thankYouDelay, handleReturnToIdle, publishTransactionComplete]);

  const firstPromo = config.promoSlides?.[0];
  const promoMessage = firstPromo?.subtitle ?? firstPromo?.title;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 flex flex-col">
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
          <Star className="w-10 h-10 text-purple-400" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-40 left-20"
        >
          <Heart className="w-8 h-8 text-pink-400" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-32 right-12"
        >
          <Gift className="w-10 h-10 text-indigo-400" />
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center max-w-lg"
        >
          {/* Animated Heart Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl"
            >
              <Heart className="w-14 h-14 text-white fill-white" />
            </motion.div>
          </motion.div>

          {/* Thank You Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
          >
            Thank You, {clientName}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-8"
          >
            We appreciate your visit and look forward to seeing you again!
          </motion.p>

          {/* Loyalty Points Earned */}
          {loyaltyPoints && loyaltyPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl p-6 mb-6 border border-amber-200"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-amber-600" />
                <span className="text-lg font-semibold text-amber-800">
                  Loyalty Points Earned
                </span>
              </div>
              <p className="text-4xl font-bold text-amber-700">
                +{loyaltyPoints} <span className="text-lg font-medium">points</span>
              </p>
            </motion.div>
          )}

          {/* Promotional Message */}
          {promoMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur rounded-xl p-5 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <Gift className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-600 uppercase tracking-wide">
                  Special Offer
                </span>
              </div>
              <p className="text-base text-gray-700">{promoMessage}</p>
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
            Returning to home screen in {thankYouDelay} seconds...
          </p>
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{
              duration: thankYouDelay,
              ease: 'linear',
            }}
            className="h-1.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full origin-left max-w-md mx-auto"
          />
          <button
            onClick={handleReturnToIdle}
            className="mt-4 min-h-[56px] px-8 text-lg font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </motion.div>
      </footer>
    </div>
  );
}
