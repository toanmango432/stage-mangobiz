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
import { PaymentPage } from '@/pages/PaymentPage';
import { ResultPage } from '@/pages/ResultPage';
import { ThankYouPage } from '@/pages/ThankYouPage';
import { SplitSelectionPage } from '@/pages/SplitSelectionPage';
import { SplitStatusPage } from '@/pages/SplitStatusPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ReconnectingOverlay } from '@/components/ReconnectingOverlay';
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
        return <PaymentPage />;
      case 'result':
        return <ResultPage />;
      case 'receipt':
        return <ReceiptPage />;
      case 'thank-you':
        return <ThankYouPage />;
      case 'split-selection':
        return <SplitSelectionPage />;
      case 'split-status':
        return <SplitStatusPage />;
      case 'settings':
        return <SettingsPage />;
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
      <ReconnectingOverlay />
    </PadMqttProvider>
  );
}
