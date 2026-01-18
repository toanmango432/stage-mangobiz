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

import { Layers, AlertTriangle, Tablet, Printer, CreditCard, Settings } from 'lucide-react';
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
} from '@/store/slices/settingsSlice';
import { usePadHeartbeat, usePosHeartbeat } from '@/services/mqtt/hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DeviceStatusRow } from './DeviceStatusRow';
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
            relative p-2 rounded-lg transition-all duration-200
            hover:bg-gray-100 focus:outline-none focus-visible:ring-2
            focus-visible:ring-gray-400 focus-visible:ring-offset-2
          `}
          aria-label={getTooltip()}
          title={getTooltip()}
        >
          {hasErrors ? (
            <AlertTriangle
              className="w-5 h-5 text-gray-600"
              strokeWidth={2}
            />
          ) : (
            <Layers
              className="w-5 h-5 text-gray-600"
              strokeWidth={2}
            />
          )}
          {/* Status dot indicator */}
          {hasAnyDevice && (
            <span
              className={`
                absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full
                border-2 border-white
                ${hasErrors ? 'bg-amber-500' : hasAnyConnected ? 'bg-green-500' : 'bg-gray-400'}
              `}
            />
          )}
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
          {/* Show connected devices or empty state */}
          {totalConnected === 0 ? (
            <div className="px-4 py-8 text-center">
              <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">No devices connected</p>
              <p className="text-xs text-gray-400">Set up devices to see them here</p>
            </div>
          ) : (
            <>
              {/* Section 1: Mango Pad */}
              {connectedPads.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2">
                    <Tablet className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Mango Pad
                    </span>
                    <span className="text-xs text-gray-400">({connectedPads.length})</span>
                  </div>
                  <div>
                    {connectedPads.map((device) => (
                      <DeviceStatusRow
                        key={device.id}
                        name={device.name}
                        status="connected"
                        type="pad"
                        lastSeen={device.lastSeen}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Hardware */}
              {connectedHardware.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Hardware
                    </span>
                    <span className="text-xs text-gray-400">({connectedHardware.length})</span>
                  </div>
                  <div>
                    {connectedHardware.map((device) => (
                      <DeviceStatusRow
                        key={device.id}
                        name={device.name}
                        status="connected"
                        type={device.type === 'printer' ? 'printer' : device.type === 'scanner' ? 'scanner' : 'cash_drawer'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Payment Terminals */}
              {connectedTerminals.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50/50 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Payment Terminals
                    </span>
                    <span className="text-xs text-gray-400">({connectedTerminals.length})</span>
                  </div>
                  <div>
                    {connectedTerminals.map((terminal) => (
                      <DeviceStatusRow
                        key={terminal.id}
                        name={terminal.name}
                        status="connected"
                        type="terminal"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
