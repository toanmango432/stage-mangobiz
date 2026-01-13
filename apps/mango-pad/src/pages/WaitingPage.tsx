import { Smartphone, Wifi, WifiOff, Settings, Play, Unlink } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePadMqtt, usePosConnection } from '../providers/PadMqttProvider';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { DemoBanner, isDemoMode } from '../components/DemoBanner';
import { unpairDevice, getPairingInfo } from '../services/pairingService';
import { useTransactionNavigation } from '../hooks/useTransactionNavigation';
import type { ActiveTransaction } from '../types';

/**
 * Get status text based on demo mode and connection state
 */
function getStatusText(isDemo: boolean, isConnected: boolean): string {
  if (isDemo) {
    return 'Demo mode - tap button below to start';
  }
  if (isConnected) {
    return 'Waiting for receipt from POS...';
  }
  return 'Waiting for POS connection...';
}

// Demo transaction with mock data
const DEMO_TRANSACTION: ActiveTransaction = {
  transactionId: `demo-${Date.now()}`,
  ticketId: 'demo-ticket-001',
  clientName: 'John Doe',
  clientEmail: 'john.doe@example.com',
  clientPhone: '555-123-4567',
  staffName: 'Sarah Smith',
  items: [
    { id: '1', name: 'Haircut', staffName: 'Sarah Smith', price: 45.00, quantity: 1 },
    { id: '2', name: 'Beard Trim', staffName: 'Sarah Smith', price: 20.00, quantity: 1 },
    { id: '3', name: 'Hair Product', staffName: 'Sarah Smith', price: 24.99, quantity: 1 },
  ],
  subtotal: 89.99,
  tax: 7.20,
  discount: 0,
  total: 97.19,
  suggestedTips: [15, 18, 20, 25],
  tipAmount: 0,
  tipPercent: null,
  step: 'receipt',
  startedAt: new Date().toISOString(),
};

export function WaitingPage() {
  const navigate = useNavigate();
  const { setCurrentScreen, setActiveTransaction } = usePadMqtt();
  const posConnection = usePosConnection();
  const [isDemo] = useState(() => isDemoMode());
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [stationName, setStationName] = useState<string | null>(null);

  // Auto-navigate when activeTransaction.step changes (for real transactions from Store App)
  useTransactionNavigation({ skipInitialNavigation: true });

  // Load station name from pairing info
  useEffect(() => {
    const pairing = getPairingInfo();
    if (pairing?.stationName) {
      setStationName(pairing.stationName);
    }
  }, []);

  // Update current screen for heartbeat (skip in demo mode)
  useEffect(() => {
    if (!isDemo) {
      setCurrentScreen('waiting');
    }
  }, [setCurrentScreen, isDemo]);

  // Demo mode: "Start Demo" button to begin the flow
  const handleStartDemo = useCallback(() => {
    // Create a demo transaction with fresh timestamp and ID
    const demoTransaction: ActiveTransaction = {
      ...DEMO_TRANSACTION,
      transactionId: `demo-${Date.now()}`,
      startedAt: new Date().toISOString(),
    };
    // Set the demo transaction in context (dispatches to Redux and navigates to order-review screen)
    setActiveTransaction(demoTransaction);
    // Navigate to receipt page
    navigate('/receipt');
  }, [setActiveTransaction, navigate]);

  // Handle unpair action
  const handleUnpair = useCallback(async () => {
    setIsUnpairing(true);
    try {
      await unpairDevice();
      // Navigate to welcome page after clearing pairing
      navigate('/welcome');
    } catch (error) {
      console.error('[WaitingPage] Unpair error:', error);
      setIsUnpairing(false);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col">
      {/* Demo banner (US-016) */}
      <DemoBanner />

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Settings gear icon - top left (US-014) - hide in demo mode */}
        {!isDemo && (
          <Link
            to="/settings"
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-white/50 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-500" />
          </Link>
        )}

        {/* Connection status indicator - top right - hide in demo mode */}
        {!isDemo && <ConnectionIndicator className="absolute top-4 right-4" />}
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Smartphone className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Mango Pad
      </h1>
      <p className="text-gray-600 text-lg mb-12 text-center">
        Ready for your transaction
      </p>

      {/* Animated dots indicator */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

        {/* Status text */}
        <p className="text-gray-500 text-sm mt-8">
          {getStatusText(isDemo, posConnection.isConnected)}
        </p>

        {/* Demo mode: Start Demo button */}
        {isDemo && (
          <button
            onClick={handleStartDemo}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Demo
          </button>
        )}

        {/* Connection status - hide in demo mode */}
        {!isDemo && (
          <div className="absolute bottom-8 flex flex-col items-center gap-3">
            <div className="flex items-center text-sm">
              {posConnection.isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium">
                    POS Connected
                  </span>
                  {posConnection.storeName && (
                    <span className="text-gray-400 ml-1">
                      • {posConnection.storeName}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">
                    POS Offline
                  </span>
                  {stationName && (
                    <span className="text-gray-400 ml-1">
                      • {stationName}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Unpair button - shown when offline to allow re-pairing */}
            {!posConnection.isConnected && (
              <button
                onClick={handleUnpair}
                disabled={isUnpairing}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-orange-600 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Unlink className="w-4 h-4" />
                {isUnpairing ? 'Unpairing...' : 'Unpair & Reconnect'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
