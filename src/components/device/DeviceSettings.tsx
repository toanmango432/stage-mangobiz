/**
 * Device Settings Page
 * Allows users to view and change device mode settings after login.
 */

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Cloud,
  CloudOff,
  AlertTriangle,
  Check,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { storeAuthManager } from '../../services/storeAuthManager';
import { DeviceModeSelector } from './DeviceModeSelector';
import type { DeviceMode } from '@/types/device';

interface DeviceSettingsProps {
  onBack?: () => void;
}

export function DeviceSettings({ onBack }: DeviceSettingsProps) {
  const [currentMode, setCurrentMode] = useState<DeviceMode>('online-only');
  const [selectedMode, setSelectedMode] = useState<DeviceMode>('online-only');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    const mode = storeAuthManager.getDeviceMode();
    setCurrentMode(mode);
    setSelectedMode(mode);
  }, []);

  const handleModeChange = (mode: DeviceMode) => {
    setSelectedMode(mode);
    if (mode !== currentMode) {
      setShowConfirmation(true);
    } else {
      setShowConfirmation(false);
    }
  };

  const handleSaveMode = async () => {
    if (selectedMode === currentMode) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await storeAuthManager.updateDeviceMode(selectedMode);
      setCurrentMode(selectedMode);
      setShowConfirmation(false);

      if (selectedMode === 'offline-enabled') {
        setMessage({
          type: 'success',
          text: 'Offline mode enabled! Reloading app to initialize local database...',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Switched to online-only mode! Reloading app...',
        });
      }

      // Auto-reload the app after a brief delay to show the success message
      // This ensures the database is properly initialized for the new mode
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update device mode. Please try again.',
      });
      setIsLoading(false);
    }
    // Note: Don't set isLoading to false on success since we're reloading
  };

  const handleCancel = () => {
    setSelectedMode(currentMode);
    setShowConfirmation(false);
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Device Settings</h1>
            <p className="text-gray-600">Manage how this device operates</p>
          </div>
        </div>

        {/* Current Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentMode === 'offline-enabled' ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              {currentMode === 'offline-enabled' ? (
                <CloudOff className="w-6 h-6 text-amber-600" />
              ) : (
                <Cloud className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Current Mode: {currentMode === 'offline-enabled' ? 'Offline-Enabled' : 'Online-Only'}
              </h2>
              <p className="text-sm text-gray-500">
                {currentMode === 'offline-enabled'
                  ? 'This device can work without internet'
                  : 'This device requires internet to operate'}
              </p>
            </div>
          </div>

          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Store</p>
              <p className="text-sm font-medium text-gray-900">
                {storeAuthManager.getState().store?.storeName || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {storeAuthManager.getState().status === 'active' ? 'Active' : 'Offline Grace'}
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Device Mode</h3>

          <DeviceModeSelector
            value={selectedMode}
            onChange={handleModeChange}
            disabled={isLoading}
            showDescriptions={true}
          />

          {/* Confirmation Section */}
          {showConfirmation && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Are you sure you want to change device mode?
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {selectedMode === 'offline-enabled'
                      ? 'Enabling offline mode will start storing data locally. This uses device storage.'
                      : 'Switching to online-only will stop local data storage. You will need internet to use the app.'}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveMode}
                      disabled={isLoading}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirm Change
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' :
              message.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : message.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' :
                message.type === 'warning' ? 'text-amber-800' :
                'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-800">About Device Modes</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Online-Only:</strong> Requires internet. Data is not stored locally.</li>
                <li>• <strong>Offline-Enabled:</strong> Works without internet. Data syncs when online.</li>
                <li>• The app will automatically reload when you change modes.</li>
                <li>• No logout required - your session will be preserved.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceSettings;
