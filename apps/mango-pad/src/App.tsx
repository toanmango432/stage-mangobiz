/**
 * Mango Pad App
 * Screen-based navigation with smooth transitions
 * US-014: WCAG 2.1 AA Accessibility compliance
 * US-015: Responsive design for multi-device support
 * US-018: Performance optimization with lazy loading
 */

import { useEffect, lazy, Suspense, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PadMqttProvider } from '@/providers/PadMqttProvider';
import { useAppSelector } from '@/store/hooks';
import { IdlePage } from '@/pages/IdlePage';
import { OrderReviewPage } from '@/pages/OrderReviewPage';
import { TipPage } from '@/pages/TipPage';
import { SignaturePage } from '@/pages/SignaturePage';
import { PaymentPage } from '@/pages/PaymentPage';
import { ResultPage } from '@/pages/ResultPage';
import { ReconnectingOverlay } from '@/components/ReconnectingOverlay';
import { useOrientation } from '@/hooks/useResponsive';
import type { PadScreen } from '@/types';

// Lazy load non-critical screens for code splitting
const ReceiptPage = lazy(() => import('@/pages/ReceiptPage').then(m => ({ default: m.ReceiptPage })));
const ThankYouPage = lazy(() => import('@/pages/ThankYouPage').then(m => ({ default: m.ThankYouPage })));
const SplitSelectionPage = lazy(() => import('@/pages/SplitSelectionPage').then(m => ({ default: m.SplitSelectionPage })));
const SplitStatusPage = lazy(() => import('@/pages/SplitStatusPage').then(m => ({ default: m.SplitStatusPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Loading fallback component for lazy-loaded screens
const PageLoadingFallback = memo(function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
});

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
    // Eagerly loaded screens (critical path)
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
      default:
        break;
    }

    // Lazy loaded screens (non-critical path)
    const LazyScreen = (() => {
      switch (screen) {
        case 'receipt':
          return ReceiptPage;
        case 'thank-you':
          return ThankYouPage;
        case 'split-selection':
          return SplitSelectionPage;
        case 'split-status':
          return SplitStatusPage;
        case 'settings':
          return SettingsPage;
        default:
          return null;
      }
    })();

    if (LazyScreen) {
      return (
        <Suspense fallback={<PageLoadingFallback />}>
          <LazyScreen />
        </Suspense>
      );
    }

    return <IdlePage />;
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
