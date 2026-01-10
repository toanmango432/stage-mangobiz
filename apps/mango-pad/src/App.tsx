/**
 * Mango Pad App
 * Screen-based navigation with smooth transitions
 */

import { AnimatePresence, motion } from 'framer-motion';
import { PadMqttProvider } from '@/providers/PadMqttProvider';
import { useAppSelector } from '@/store/hooks';
import { IdlePage } from '@/pages/IdlePage';
import { OrderReviewPage } from '@/pages/OrderReviewPage';
import { ReceiptPage } from '@/pages/ReceiptPage';
import { TipPage } from '@/pages/TipPage';
import { SignaturePage } from '@/pages/SignaturePage';
import type { PadScreen } from '@/types';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

function ScreenRouter() {
  const currentScreen = useAppSelector((state) => state.pad.currentScreen);

  const renderScreen = (screen: PadScreen) => {
    switch (screen) {
      case 'idle':
        return <IdlePage />;
      case 'order-review':
        return <OrderReviewPage />;
      case 'tip':
        return <TipPage />;
      case 'signature':
        return <SignaturePage />;
      case 'payment':
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-2xl">Payment (Coming Soon)</div>;
      case 'result':
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-2xl">Result (Coming Soon)</div>;
      case 'receipt':
        return <ReceiptPage />;
      case 'thank-you':
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-2xl">Thank You (Coming Soon)</div>;
      case 'split-selection':
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-2xl">Split Selection (Coming Soon)</div>;
      case 'split-status':
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-2xl">Split Status (Coming Soon)</div>;
      case 'settings':
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-2xl">Settings (Coming Soon)</div>;
      default:
        return <IdlePage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="min-h-screen"
      >
        {renderScreen(currentScreen)}
      </motion.div>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <PadMqttProvider>
      <ScreenRouter />
    </PadMqttProvider>
  );
}
