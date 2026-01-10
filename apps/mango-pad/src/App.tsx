/**
 * Mango Pad App
 * Screen-based navigation with smooth transitions
 * US-014: WCAG 2.1 AA Accessibility compliance
 * US-015: Responsive design for multi-device support
 */

import { useEffect } from 'react';
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
import { useOrientation } from '@/hooks/useResponsive';
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
  const orientation = useOrientation();

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
        className="min-h-screen min-h-[100dvh] safe-area-all"
        data-orientation={orientation}
      >
        {renderScreen(currentScreen)}
      </motion.div>
    </AnimatePresence>
  );
}

function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const config = useAppSelector((state) => state.config.config);

  useEffect(() => {
    const html = document.documentElement;
    
    if (config.highContrastMode) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }

    if (config.largeTextMode) {
      html.classList.add('large-text');
    } else {
      html.classList.remove('large-text');
    }
  }, [config.highContrastMode, config.largeTextMode]);

  return <>{children}</>;
}

export function App() {
  return (
    <PadMqttProvider>
      <AccessibilityProvider>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ScreenRouter />
        <ReconnectingOverlay />
      </AccessibilityProvider>
    </PadMqttProvider>
  );
}
