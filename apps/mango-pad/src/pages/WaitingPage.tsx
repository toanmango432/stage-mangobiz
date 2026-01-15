/**
 * WaitingPage - Premium Customer-Facing Idle Screen
 *
 * The home screen shown when Mango Pad is waiting for a transaction.
 * Design follows Mango Designer principles:
 * - Premium, tactile aesthetic befitting high-end salons
 * - Clear visual hierarchy with one primary focus
 * - Subtle animations that don't distract
 * - Settings accessible but not prominent (staff-focused)
 */

import { Settings, Play, Unlink, X, Wifi, WifiOff, Edit2, Check } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePadMqtt, usePosConnection } from '../providers/PadMqttProvider';
import { DemoBanner, isDemoMode } from '../components/DemoBanner';
import { unpairDevice, getPairingInfo, updatePadName } from '../services/pairingService';
import { useTransactionNavigation } from '../hooks/useTransactionNavigation';
import type { ActiveTransaction } from '../types';

// Demo transaction for testing
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
  const { setCurrentScreen, setActiveTransaction, connectionStatus } = usePadMqtt();
  const posConnection = usePosConnection();
  const [padName, setPadName] = useState<string>('Mango Pad');
  const [stationName, setStationName] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isDemo, setIsDemo] = useState(() => isDemoMode());

  // Auto-navigate when activeTransaction.step changes
  useTransactionNavigation({ skipInitialNavigation: true });

  // Re-check demo mode after mount (picks up localStorage changes from pairing)
  useEffect(() => {
    setIsDemo(isDemoMode());
  }, []);

  // Load pairing info
  useEffect(() => {
    const pairing = getPairingInfo();
    if (pairing?.padName) {
      setPadName(pairing.padName);
    }
    if (pairing?.stationName) {
      setStationName(pairing.stationName);
    }
  }, []);

  // Update current screen for heartbeat
  useEffect(() => {
    if (!isDemo) {
      setCurrentScreen('waiting');
    }
  }, [setCurrentScreen, isDemo]);

  // Demo mode handler
  const handleStartDemo = useCallback(() => {
    const demoTransaction: ActiveTransaction = {
      ...DEMO_TRANSACTION,
      transactionId: `demo-${Date.now()}`,
      startedAt: new Date().toISOString(),
    };
    setActiveTransaction(demoTransaction);
    navigate('/receipt');
  }, [setActiveTransaction, navigate]);

  // Handle unpair
  const handleUnpair = useCallback(async () => {
    setIsUnpairing(true);
    try {
      await unpairDevice();
      navigate('/welcome');
    } catch (error) {
      console.error('[WaitingPage] Unpair error:', error);
      setIsUnpairing(false);
    }
  }, [navigate]);

  // Handle name edit
  const handleStartEditName = useCallback(() => {
    setEditedName(padName);
    setIsEditingName(true);
  }, [padName]);

  const handleSaveName = useCallback(async () => {
    if (editedName.trim()) {
      await updatePadName(editedName.trim());
      setPadName(editedName.trim());
    }
    setIsEditingName(false);
  }, [editedName]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Connection status - show "Ready" when MQTT is connected (not just when Store App sends heartbeats)
  // MQTT connection is sufficient for receiving transactions; Store App heartbeats are optional
  const isMqttConnected = connectionStatus === 'connected';
  const isConnected = isMqttConnected || posConnection.isConnected || isDemo;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f7] to-[#f5f3f0] flex flex-col relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Demo banner */}
      <DemoBanner />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Connection status pill - top */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute top-8 left-1/2 -translate-x-1/2"
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              isConnected
                ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-700'
                : 'bg-amber-50/80 border-amber-200/60 text-amber-700'
            }`}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-sm font-medium">
              {isDemo ? 'Demo Mode' : isConnected ? 'Ready' : 'Connecting...'}
            </span>
          </div>
        </motion.div>

        {/* Central content */}
        <div className="flex flex-col items-center max-w-md w-full">
          {/* Mango logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="relative">
              {/* Soft glow behind logo */}
              <div className="absolute inset-0 bg-[#1a5f4a]/10 rounded-full blur-2xl scale-150" />

              {/* Logo container */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#1a5f4a] to-[#0d3d2e] flex items-center justify-center shadow-xl shadow-[#1a5f4a]/20">
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 text-white/95"
                  fill="currentColor"
                >
                  <path d="M17.75 4.09L15.22 6.03L16.13 9.09L13.5 7.28L10.87 9.09L11.78 6.03L9.25 4.09L12.44 4L13.5 1L14.56 4L17.75 4.09M21.25 11L19.61 12.25L20.2 14.23L18.5 13.06L16.8 14.23L17.39 12.25L15.75 11L17.81 10.95L18.5 9L19.19 10.95L21.25 11M18.97 15.95C19.8 15.87 20.69 17.05 20.16 17.8C19.84 18.25 19.5 18.67 19.08 19.07C15.17 23 8.84 23 4.94 19.07C1.03 15.17 1.03 8.83 4.94 4.93C5.34 4.53 5.76 4.17 6.21 3.85C6.96 3.32 8.14 4.21 8.06 5.04C7.79 7.9 8.75 10.87 10.95 13.06C13.14 15.26 16.1 16.22 18.97 15.95Z" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Pad name - prominent display */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-semibold text-gray-800 tracking-tight mb-1">
              {padName}
            </h1>
            {stationName && (
              <p className="text-base text-gray-400">
                {stationName}
              </p>
            )}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8"
          />

          {/* Welcome message card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100/80 shadow-sm">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-xl bg-[#1a5f4a]/5 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7 text-[#1a5f4a]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6" />
                    <path d="M9 16h6" />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800 mb-2">
                  Ready for Checkout
                </h2>
                <p className="text-gray-500 leading-relaxed">
                  Your receipt will appear here when your service is complete
                </p>
              </div>
            </div>
          </motion.div>

          {/* Demo mode button */}
          {isDemo && (
            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              onClick={handleStartDemo}
              className="mt-6 flex items-center gap-2.5 px-6 py-3.5 bg-[#1a5f4a] hover:bg-[#154d3c] text-white font-medium rounded-xl shadow-lg shadow-[#1a5f4a]/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Play className="w-4 h-4" />
              Start Demo
            </motion.button>
          )}
        </div>
      </div>

      {/* Footer area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 pb-8 pt-4"
      >
        {/* Powered by Mango */}
        <div className="text-center">
          <span className="text-xs text-gray-300 tracking-wide">
            Powered by Mango
          </span>
        </div>
      </motion.div>

      {/* Settings button - bottom right, subtle but visible */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        onClick={() => setShowSettings(true)}
        className="absolute bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm text-gray-400 hover:text-gray-600 hover:bg-white shadow-sm border border-gray-200/60 transition-all duration-200 flex items-center justify-center"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Pad Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-5">
                {/* Device Info Card */}
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  {/* Pad Name Row */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                          Pad Name
                        </p>
                        {isEditingName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="flex-1 text-base font-medium text-gray-800 bg-white border border-[#1a5f4a] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]/20"
                              autoFocus
                              placeholder="Enter pad name"
                            />
                            <button
                              onClick={handleSaveName}
                              className="w-8 h-8 rounded-lg bg-[#1a5f4a] text-white flex items-center justify-center hover:bg-[#154d3c] transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-base font-medium text-gray-800">{padName}</p>
                        )}
                      </div>
                      {!isEditingName && (
                        <button
                          onClick={handleStartEditName}
                          className="w-9 h-9 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Connection Status Row */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Wifi className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-amber-500" />
                      )}
                      <p className="text-base font-medium text-gray-800">
                        {isDemo ? 'Demo Mode' : isConnected ? 'Connected' : 'Connecting...'}
                      </p>
                    </div>
                  </div>

                  {/* Paired Station Row */}
                  {stationName && (
                    <div className="px-4 py-4">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                        Paired To
                      </p>
                      <p className="text-base font-medium text-gray-800">{stationName}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {/* All Settings Link */}
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-500" />
                    <span className="text-base font-medium text-gray-700">All Settings</span>
                  </button>

                  {/* Disconnect Button */}
                  {!isDemo && (
                    <button
                      onClick={handleUnpair}
                      disabled={isUnpairing}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Unlink className="w-5 h-5" />
                      <span className="text-base font-medium">
                        {isUnpairing ? 'Disconnecting...' : 'Disconnect from Store'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom safe area */}
              <div className="h-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
