/**
 * DeviceConnectionIndicator Component
 * Shows device connection status in the header with dropdown for details
 * Supports multiple device types: Mango Pad, Hardware, Payment Terminals
 *
 * Originally: PadConnectionIndicator (US-005)
 * Renamed: US-003 - General device manager
 * US-004: Smart compact/expanded display based on device errors
 */

import { Layers, ChevronDown, Circle, AlertTriangle } from 'lucide-react';
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
import { formatDistanceToNow } from 'date-fns';
import { Tablet } from 'lucide-react';

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
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const formatLastSeen = (lastSeen: string) => {
    try {
      return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getScreenLabel = (screen?: string) => {
    switch (screen) {
      case 'idle':
        return 'Idle';
      case 'checkout':
        return 'Checkout';
      case 'tip':
        return 'Tip Selection';
      case 'signature':
        return 'Signature';
      case 'receipt':
        return 'Receipt';
      case 'complete':
        return 'Complete';
      default:
        return 'Unknown';
    }
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

        <div className="max-h-64 overflow-y-auto">
          {allPadDevices.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Tablet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No Mango Pad detected</p>
              <p className="text-xs text-gray-400 mt-1">
                Pads will appear here when connected
              </p>
            </div>
          ) : (
            <div className="py-2">
              {allPadDevices.map((device) => (
                <div
                  key={device.id}
                  className="px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        device.status === 'online'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Tablet
                        className={`w-4 h-4 ${
                          device.status === 'online'
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {device.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            device.status === 'online'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Circle
                            className={`w-1.5 h-1.5 ${
                              device.status === 'online'
                                ? 'fill-green-500 text-green-500'
                                : 'fill-gray-400 text-gray-400'
                            }`}
                          />
                          {device.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {device.screen && device.status === 'online' && (
                          <span className="text-[10px] text-gray-500">
                            Screen: {getScreenLabel(device.screen)}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {formatLastSeen(device.lastSeen)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DeviceConnectionIndicator;
