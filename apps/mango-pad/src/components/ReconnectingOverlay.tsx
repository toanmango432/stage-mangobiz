/**
 * Reconnecting Overlay Component
 * Shows when MQTT connection is lost and reconnecting
 * Displays different messages based on connection duration and transaction state
 *
 * US-003: Only shows overlay when:
 * - Device is paired (has pairing info in localStorage)
 * - NOT on /welcome or /pair routes
 * - Device was previously connected and connection dropped
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { mqttService } from '@/services/mqttClient';

/**
 * Check if device is paired (has pairing info in localStorage)
 */
function checkIsPaired(): boolean {
  const pairingInfo = localStorage.getItem('mango_pad_pairing');
  if (!pairingInfo) return false;
  try {
    const parsed = JSON.parse(pairingInfo);
    return Boolean(parsed.stationId && parsed.salonId);
  } catch {
    return false;
  }
}

/**
 * Routes where the reconnecting overlay should NOT appear
 */
const EXCLUDED_ROUTES = ['/welcome', '/pair'];

interface ReconnectingOverlayProps {
  onAlertStaff?: () => void;
}

export function ReconnectingOverlay({ onAlertStaff }: ReconnectingOverlayProps) {
  const location = useLocation();
  const showReconnecting = useAppSelector((state) => state.ui.showReconnecting);
  const currentScreen = useAppSelector((state) => state.pad.currentScreen);
  const transaction = useAppSelector((state) => state.transaction.current);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [showExtendedWarning, setShowExtendedWarning] = useState(false);
  // Track if device was previously connected (for this session)
  const wasConnectedRef = useRef(false);
  const [wasConnected, setWasConnected] = useState(false);

  const isActiveTransaction = currentScreen !== 'idle' && currentScreen !== 'settings' && transaction !== null;

  // Track when we've been connected at least once
  useEffect(() => {
    if (!showReconnecting && !wasConnectedRef.current) {
      // When showReconnecting is false and we haven't tracked connection yet,
      // it means we're connected - mark that we were connected
      const isPaired = checkIsPaired();
      if (isPaired) {
        wasConnectedRef.current = true;
        setWasConnected(true);
      }
    }
  }, [showReconnecting]);

  // Check if overlay should be shown based on route and pairing status
  const isExcludedRoute = EXCLUDED_ROUTES.includes(location.pathname);
  const isPaired = checkIsPaired();

  // US-003: Only show overlay when:
  // 1. showReconnecting flag is true (connection lost)
  // 2. Device is paired
  // 3. NOT on excluded routes (/welcome, /pair)
  // 4. Device was previously connected (not initial connection)
  const shouldShow = showReconnecting && isPaired && !isExcludedRoute && wasConnected;

  useEffect(() => {
    if (!shouldShow) {
      setOfflineDuration(0);
      setShowExtendedWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const duration = mqttService.getOfflineDuration();
      setOfflineDuration(duration);

      if (duration >= 30000 && !showExtendedWarning) {
        setShowExtendedWarning(true);
        onAlertStaff?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldShow, showExtendedWarning, onAlertStaff]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const queuedCount = mqttService.getQueuedMessageCount();

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          >
            {showExtendedWarning ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Connection Issue
                </h2>
                <p className="mb-4 text-lg text-gray-600">
                  {isActiveTransaction
                    ? 'Please wait, reconnecting... Your transaction data is safe.'
                    : 'Unable to connect to the system.'}
                </p>
                <p className="mb-4 text-sm text-gray-500">
                  Offline for {formatDuration(offlineDuration)}
                </p>
                {queuedCount > 0 && (
                  <p className="mb-4 text-sm text-amber-600">
                    {queuedCount} pending message{queuedCount !== 1 ? 's' : ''} will be sent when reconnected
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Attempting to reconnect...</span>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <WifiOff className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Reconnecting...
                </h2>
                <p className="mb-4 text-lg text-gray-600">
                  {isActiveTransaction
                    ? 'Please wait while we restore the connection.'
                    : 'Connecting to the system...'}
                </p>
                {offlineDuration > 5000 && (
                  <p className="mb-4 text-sm text-gray-500">
                    Offline for {formatDuration(offlineDuration)}
                  </p>
                )}
                {queuedCount > 0 && (
                  <p className="mb-4 text-sm text-gray-500">
                    {queuedCount} message{queuedCount !== 1 ? 's' : ''} queued
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 text-blue-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Please wait...</span>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
