/**
 * Settings Page (US-014)
 *
 * Allows staff to view pairing info and unpair the device.
 * Accessed via gear icon on WaitingPage.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Unlink, AlertTriangle } from 'lucide-react';
import { getPairingInfo, unpairDevice } from '../services/pairingService';
import type { PairingInfo } from '../types';

export function SettingsPage() {
  const navigate = useNavigate();
  const [pairing] = useState<PairingInfo | null>(() => getPairingInfo());
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleUnpair = useCallback(async () => {
    setIsUnpairing(true);
    try {
      await unpairDevice();
      // Navigate to welcome page after unpair
      navigate('/welcome', { replace: true });
    } catch (err) {
      console.error('[SettingsPage] Error unpairing:', err);
      setIsUnpairing(false);
      setShowConfirm(false);
    }
  }, [navigate]);

  // If not paired, redirect to welcome
  if (!pairing) {
    navigate('/welcome', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Pairing Info Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Pairing Info
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase">
                Station Name
              </label>
              <p className="text-lg font-medium text-gray-800 mt-1">
                {pairing.stationName}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase">
                Salon ID
              </label>
              <p className="text-sm font-mono text-gray-600 mt-1">
                {pairing.salonId}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase">
                Device ID
              </label>
              <p className="text-sm font-mono text-gray-600 mt-1">
                {pairing.deviceId}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase">
                Paired At
              </label>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(pairing.pairedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Unpair Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Device Management
          </h2>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg border border-red-200 transition-colors"
          >
            <Unlink className="w-5 h-5" />
            <span>Unpair Device</span>
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Unpairing will disconnect this device from the store. You'll need to
            pair again to use it.
          </p>
        </section>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Unpair from {pairing.stationName}?
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              This device will be disconnected from the store. You'll need to
              enter the pairing code again to reconnect.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isUnpairing}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpair}
                disabled={isUnpairing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUnpairing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Unpairing...</span>
                  </>
                ) : (
                  <span>Unpair</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
