/**
 * DeviceConnectionIndicator Component
 * Shows device connection status in the header with dropdown for details
 * Supports multiple device types: Mango Pad, Hardware, Payment Terminals
 *
 * Originally: PadConnectionIndicator (US-005)
 * Renamed: US-003 - General device manager
 * US-004: Smart compact/expanded display based on device errors
 * US-006: Device dropdown with equal sections for Pad/Hardware/Terminals
 * Last updated: 2026-01-17
 */

import { Layers, ChevronDown, AlertTriangle, Tablet, Printer, CreditCard, Circle, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  getConnectedPads,
  selectAllPadDevices,
  selectOfflinePads,
} from '@/store/slices/padDevicesSlice';
import {
  selectConnectedHardwareDevices,
  selectConnectedPaymentTerminals,
  selectHardwareDevicesWithErrors,
  selectPaymentTerminalsWithErrors,
  selectHardwareDevices,
  selectPaymentTerminals,
} from '@/store/slices/settingsSlice';
import { usePadHeartbeat, usePosHeartbeat } from '@/services/mqtt/hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DeviceStatusRow } from './DeviceStatusRow';
import type { DeviceStatusRowStatus } from './DeviceStatusRow';
import { QuickDeviceSetupModal } from './QuickDeviceSetupModal';

export function DeviceConnectionIndicator() {
  // Subscribe to incoming Pad heartbeats
  usePadHeartbeat();
  // Publish POS heartbeats so Pad knows we're connected
  usePosHeartbeat();

  // Pad devices
  const connectedPads = useAppSelector(getConnectedPads);
  const allPadDevices = useAppSelector(selectAllPadDevices);
  const offlinePads = useAppSelector(selectOfflinePads);

  // Hardware devices
  const connectedHardware = useAppSelector(selectConnectedHardwareDevices);
  const hardwareWithErrors = useAppSelector(selectHardwareDevicesWithErrors);

  // Payment terminals
  const connectedTerminals = useAppSelector(selectConnectedPaymentTerminals);
  const terminalsWithErrors = useAppSelector(selectPaymentTerminalsWithErrors);

  // All devices (for listing in dropdown)
  const allHardwareDevices = useAppSelector(selectHardwareDevices);
  const allPaymentTerminals = useAppSelector(selectPaymentTerminals);

  // Calculate aggregated status
  const totalConnected = connectedPads.length + connectedHardware.length + connectedTerminals.length;
  const totalErrors = offlinePads.length + hardwareWithErrors.length + terminalsWithErrors.length;
  const hasErrors = totalErrors > 0;
  const hasAnyDevice = allPadDevices.length > 0 || connectedHardware.length + hardwareWithErrors.length > 0 || connectedTerminals.length + terminalsWithErrors.length > 0;
  const hasAnyConnected = totalConnected > 0;

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  // Helper to map pad status to DeviceStatusRow status
  const getPadStatus = (status: 'online' | 'offline'): DeviceStatusRowStatus => {
    return status === 'online' ? 'connected' : 'disconnected';
  };

  // Helper to map hardware/terminal connectionStatus to DeviceStatusRow status
  const getDeviceStatus = (connectionStatus: string): DeviceStatusRowStatus => {
    if (connectionStatus === 'connected') return 'connected';
    if (connectionStatus === 'error') return 'error';
    return 'disconnected';
  };

  // Determine button styling based on status
  const getButtonStyles = () => {
    if (hasErrors) {
      // Error state: amber/red expanded button
      return {
        container: 'bg-amber-50/80 hover:bg-amber-100/80 border border-amber-300/60',
        icon: 'text-amber-600',
        dot: 'text-amber-500 fill-amber-500',
        text: 'text-amber-700',
        chevron: 'text-amber-500',
        ring: 'focus-visible:ring-amber-400',
      };
    }
    if (hasAnyConnected) {
      // Connected state: green
      return {
        container: 'bg-green-50/80 hover:bg-green-100/80 border border-green-200/60',
        icon: 'text-green-600',
        dot: 'text-green-500 fill-green-500',
        text: 'text-green-700',
        chevron: 'text-green-500',
        ring: 'focus-visible:ring-green-400',
      };
    }
    // No devices or all disconnected: gray (not an error if no devices configured)
    return {
      container: 'bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60',
      icon: 'text-gray-400',
      dot: 'text-gray-400 fill-gray-400',
      text: 'text-gray-500',
      chevron: 'text-gray-400',
      ring: 'focus-visible:ring-gray-400',
    };
  };

  const styles = getButtonStyles();

  // Generate tooltip
  const getTooltip = () => {
    if (hasErrors) {
      return `${totalErrors} device${totalErrors > 1 ? 's' : ''} with issues`;
    }
    if (hasAnyConnected) {
      return `${totalConnected} device${totalConnected > 1 ? 's' : ''} connected`;
    }
    if (!hasAnyDevice) {
      return 'No devices configured';
    }
    return 'All devices offline';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`
            relative flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1.5
            rounded-lg transition-all duration-200
            ${styles.container}
            focus:outline-none focus-visible:ring-2 ${styles.ring} focus-visible:ring-offset-2
          `}
          title={getTooltip()}
        >
          <div className="relative">
            {hasErrors ? (
              <AlertTriangle
                className={`w-4 h-4 ${styles.icon}`}
                strokeWidth={2}
              />
            ) : (
              <Layers
                className={`w-4 h-4 ${styles.icon}`}
                strokeWidth={2}
              />
            )}
            <Circle
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${styles.dot}`}
            />
          </div>
          {/* Compact mode: icon only on mobile, expanded on error */}
          {hasErrors ? (
            <span className={`text-xs font-medium ${styles.text}`}>
              {totalErrors} Issue{totalErrors > 1 ? 's' : ''}
            </span>
          ) : (
            <span className={`hidden lg:inline text-xs font-medium ${styles.text}`}>
              {hasAnyConnected ? 'Devices' : 'Devices'}
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              isOpen ? 'rotate-180' : ''
            } ${styles.chevron}`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-0 bg-white/95 backdrop-blur-lg border-gray-200"
        sideOffset={8}
      >
        <div className={`px-4 py-3 border-b border-gray-100 ${
          hasErrors
            ? 'bg-gradient-to-r from-amber-50 to-orange-50'
            : 'bg-gradient-to-r from-green-50 to-emerald-50'
        }`}>
          <div className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Layers className="w-5 h-5 text-green-600" />
            )}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                Connected Devices
              </h4>
              <p className="text-xs text-gray-500">
                {totalConnected > 0 && `${totalConnected} online`}
                {totalConnected > 0 && totalErrors > 0 && ' • '}
                {totalErrors > 0 && (
                  <span className="text-amber-600 font-medium">{totalErrors} issue{totalErrors > 1 ? 's' : ''}</span>
                )}
                {totalConnected === 0 && totalErrors === 0 && 'No devices configured'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {/* Section 1: Mango Pad */}
          <div className="border-b border-gray-100">
            <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2">
              <Tablet className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Mango Pad
              </span>
              <span className="text-xs text-gray-400">({allPadDevices.length})</span>
            </div>
            {allPadDevices.length === 0 ? (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400">No devices configured</p>
              </div>
            ) : (
              <div>
                {allPadDevices.map((device) => {
                  const status = getPadStatus(device.status);
                  const hasError = status === 'disconnected' || status === 'error';
                  return (
                    <div key={device.id} className={hasError ? 'bg-amber-50/50' : ''}>
                      <DeviceStatusRow
                        name={device.name}
                        status={status}
                        type="pad"
                        lastSeen={device.lastSeen}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Hardware */}
          <div className="border-b border-gray-100">
            <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2">
              <Printer className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Hardware
              </span>
              <span className="text-xs text-gray-400">({allHardwareDevices.length})</span>
            </div>
            {allHardwareDevices.length === 0 ? (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400">No devices configured</p>
              </div>
            ) : (
              <div>
                {allHardwareDevices.map((device) => {
                  const status = getDeviceStatus(device.connectionStatus);
                  const hasError = status === 'disconnected' || status === 'error';
                  return (
                    <div key={device.id} className={hasError ? 'bg-amber-50/50' : ''}>
                      <DeviceStatusRow
                        name={device.name}
                        status={status}
                        type={device.type === 'printer' ? 'printer' : device.type === 'scanner' ? 'scanner' : 'cash_drawer'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Payment Terminals */}
          <div>
            <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Payment Terminals
              </span>
              <span className="text-xs text-gray-400">({allPaymentTerminals.length})</span>
            </div>
            {allPaymentTerminals.length === 0 ? (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-gray-400">No devices configured</p>
              </div>
            ) : (
              <div>
                {allPaymentTerminals.map((terminal) => {
                  const status = getDeviceStatus(terminal.connectionStatus);
                  const hasError = status === 'disconnected' || status === 'error';
                  return (
                    <div key={terminal.id} className={hasError ? 'bg-amber-50/50' : ''}>
                      <DeviceStatusRow
                        name={terminal.name}
                        status={status}
                        type="terminal"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Quick Setup and More Settings */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 space-y-2">
          <button
            onClick={() => {
              setIsOpen(false);
              setIsModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Quick Setup
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(
                new CustomEvent('navigate-to-module', {
                  detail: { module: 'settings', category: 'devices' },
                })
              );
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            More Settings
          </button>
        </div>
      </PopoverContent>

      {/* Quick Device Setup Modal */}
      <QuickDeviceSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Popover>
  );
}

export default DeviceConnectionIndicator;
