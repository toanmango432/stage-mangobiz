/**
 * Device Manager
 * Clean, focused interface for managing device offline/online mode.
 * Follows progressive disclosure - shows what's needed, when needed.
 */

import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  Check,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  MoreHorizontal,
  Clock,
} from 'lucide-react';
import { storeAuthManager } from '../../services/storeAuthManager';
import type { DeviceMode } from '@/types/device';

interface StoreDevice {
  id: string;
  name?: string;
  deviceFingerprint: string;
  deviceMode: DeviceMode;
  status: 'active' | 'inactive' | 'blocked';
  lastSeenAt: Date;
  platform?: string;
  isCurrentDevice?: boolean;
}

interface DeviceSettingsProps {
  onBack?: () => void;
}

export function DeviceSettings({ onBack }: DeviceSettingsProps) {
  const [currentMode, setCurrentMode] = useState<DeviceMode>('online-only');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [devices, setDevices] = useState<StoreDevice[]>([]);
  const [showOtherDevices, setShowOtherDevices] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const mode = storeAuthManager.getDeviceMode();
    setCurrentMode(mode);
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const allDevices = await storeAuthManager.getStoreDevices();
      const currentFingerprint = storeAuthManager.getCurrentDeviceFingerprint();

      const devicesWithCurrent = allDevices.map(d => ({
        ...d,
        isCurrentDevice: d.deviceFingerprint === currentFingerprint || d.id === 'current',
      }));

      setDevices(devicesWithCurrent);
    } catch {
      setDevices([{
        id: 'current',
        name: 'This Device',
        deviceFingerprint: 'current',
        deviceMode: currentMode,
        status: 'active',
        lastSeenAt: new Date(),
        platform: navigator.platform,
        isCurrentDevice: true,
      }]);
    }
  };

  const handleModeToggle = async () => {
    const newMode: DeviceMode = currentMode === 'online-only' ? 'offline-enabled' : 'online-only';

    setIsLoading(true);
    try {
      await storeAuthManager.updateDeviceMode(newMode);
      setCurrentMode(newMode);
      setShowSuccess(true);

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch {
      setIsLoading(false);
    }
  };

  const handleToggleOtherDeviceMode = async (device: StoreDevice) => {
    const newMode: DeviceMode = device.deviceMode === 'offline-enabled' ? 'online-only' : 'offline-enabled';
    try {
      await storeAuthManager.updateRemoteDeviceMode(device.id, newMode);
      await loadDevices();
      setActiveMenu(null);
    } catch (error) {
      console.error('Failed to update device mode:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const isOffline = currentMode === 'offline-enabled';
  const otherDevices = devices.filter(d => !d.isCurrentDevice);

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Device Manager</h1>
            <p className="text-sm text-gray-500">
              {storeAuthManager.getState().store?.storeName || 'Your Store'}
            </p>
          </div>
        </div>

        {/* Main Mode Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* Status Display */}
          <div className="p-6 text-center border-b border-gray-100">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-colors ${
              isOffline ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              {isOffline ? (
                <CloudOff className="w-8 h-8 text-amber-600" />
              ) : (
                <Cloud className="w-8 h-8 text-blue-600" />
              )}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {isOffline ? 'Offline Mode' : 'Online Mode'}
            </h2>
            <p className="text-sm text-gray-500">
              {isOffline
                ? 'Data is stored locally and syncs when online'
                : 'Requires internet connection to operate'
              }
            </p>
          </div>

          {/* Toggle Button */}
          <div className="p-4">
            {showSuccess ? (
              <div className="flex items-center justify-center gap-2 py-3 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Mode updated! Reloading...</span>
              </div>
            ) : (
              <button
                onClick={handleModeToggle}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isOffline
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    {isOffline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                    <span>Switch to {isOffline ? 'Online Mode' : 'Offline Mode'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mode Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`p-4 rounded-xl border-2 transition-colors ${
            !isOffline ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
          }`}>
            <Cloud className={`w-5 h-5 mb-2 ${!isOffline ? 'text-blue-600' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${!isOffline ? 'text-blue-900' : 'text-gray-700'}`}>
              Online
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Real-time sync
            </p>
          </div>
          <div className={`p-4 rounded-xl border-2 transition-colors ${
            isOffline ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
          }`}>
            <CloudOff className={`w-5 h-5 mb-2 ${isOffline ? 'text-amber-600' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${isOffline ? 'text-amber-900' : 'text-gray-700'}`}>
              Offline
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Works anywhere
            </p>
          </div>
        </div>

        {/* Devices Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* This Device */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">This Device</p>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-500 text-white rounded">
                  YOU
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{navigator.platform}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isOffline ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>

          {/* Other Devices Toggle */}
          {otherDevices.length > 0 && (
            <>
              <button
                onClick={() => setShowOtherDevices(!showOtherDevices)}
                className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">Other Devices</p>
                  <p className="text-xs text-gray-500">
                    {otherDevices.length} device{otherDevices.length > 1 ? 's' : ''} registered
                  </p>
                </div>
                {showOtherDevices ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Other Devices List */}
              {showOtherDevices && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {otherDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        device.deviceMode === 'offline-enabled' ? 'bg-amber-100' : 'bg-blue-100'
                      }`}>
                        {device.deviceMode === 'offline-enabled' ? (
                          <CloudOff className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Cloud className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {device.name || `Device ${device.id.slice(0, 6)}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(device.lastSeenAt)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            device.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : device.status === 'blocked'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {device.status}
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === device.id ? null : device.id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>

                        {activeMenu === device.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                              <button
                                onClick={() => handleToggleOtherDeviceMode(device)}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                {device.deviceMode === 'offline-enabled' ? (
                                  <>
                                    <Cloud className="w-4 h-4 text-blue-600" />
                                    <span>Switch to Online</span>
                                  </>
                                ) : (
                                  <>
                                    <CloudOff className="w-4 h-4 text-amber-600" />
                                    <span>Enable Offline</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-400 text-center mt-6 px-4">
          {isOffline
            ? 'Your data is stored locally and will sync automatically when you reconnect.'
            : 'Enable offline mode to continue working without an internet connection.'
          }
        </p>

      </div>
    </div>
  );
}

export default DeviceSettings;
