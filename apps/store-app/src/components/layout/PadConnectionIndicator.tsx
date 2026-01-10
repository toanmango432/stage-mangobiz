/**
 * PadConnectionIndicator Component
 * Shows Mango Pad connection status in the header with dropdown for details
 *
 * Part of: Mango Pad Integration (US-005)
 */

import { Tablet, ChevronDown, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  getConnectedPads,
  selectAllPadDevices,
  selectHasConnectedPad,
} from '@/store/slices/padDevicesSlice';
import { usePadHeartbeat } from '@/services/mqtt/hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';

export function PadConnectionIndicator() {
  usePadHeartbeat();
  
  const hasConnectedPad = useAppSelector(selectHasConnectedPad);
  const connectedPads = useAppSelector(getConnectedPads);
  const allDevices = useAppSelector(selectAllPadDevices);
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`
            relative flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1.5
            rounded-lg transition-all duration-200
            ${hasConnectedPad
              ? 'bg-green-50/80 hover:bg-green-100/80 border border-green-200/60'
              : 'bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60'
            }
            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2
          `}
          title={hasConnectedPad ? 'Mango Pad connected' : 'No Mango Pad connected'}
        >
          <div className="relative">
            <Tablet
              className={`w-4 h-4 ${hasConnectedPad ? 'text-green-600' : 'text-gray-400'}`}
              strokeWidth={2}
            />
            <Circle
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${
                hasConnectedPad
                  ? 'text-green-500 fill-green-500'
                  : 'text-gray-400 fill-gray-400'
              }`}
            />
          </div>
          <span
            className={`hidden lg:inline text-xs font-medium ${
              hasConnectedPad ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            {hasConnectedPad ? 'Pad Connected' : 'No Pad'}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              isOpen ? 'rotate-180' : ''
            } ${hasConnectedPad ? 'text-green-500' : 'text-gray-400'}`}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-0 bg-white/95 backdrop-blur-lg border-gray-200"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <Tablet className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                Mango Pad Devices
              </h4>
              <p className="text-xs text-gray-500">
                {connectedPads.length} online
                {allDevices.length > connectedPads.length &&
                  ` • ${allDevices.length - connectedPads.length} offline`}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {allDevices.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Tablet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No Mango Pad detected</p>
              <p className="text-xs text-gray-400 mt-1">
                Pads will appear here when connected
              </p>
            </div>
          ) : (
            <div className="py-2">
              {allDevices.map((device) => (
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

export default PadConnectionIndicator;
