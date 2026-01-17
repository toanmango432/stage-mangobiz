/**
 * DeviceStatusRow Component
 * Displays individual device status in the DeviceConnectionIndicator dropdown
 * Reusable across all device types: Mango Pad, Hardware, Payment Terminals
 *
 * Created: US-005 - Reusable device status row
 */

import { Circle, Tablet, Printer, CreditCard, ScanLine, Box } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type DeviceStatusRowStatus = 'connected' | 'disconnected' | 'error';
export type DeviceStatusRowType = 'pad' | 'printer' | 'scanner' | 'cash_drawer' | 'terminal';

export interface DeviceStatusRowProps {
  name: string;
  status: DeviceStatusRowStatus;
  type: DeviceStatusRowType;
  lastSeen?: string;
}

const getDeviceIcon = (type: DeviceStatusRowType) => {
  switch (type) {
    case 'pad':
      return Tablet;
    case 'printer':
      return Printer;
    case 'scanner':
      return ScanLine;
    case 'cash_drawer':
      return Box;
    case 'terminal':
      return CreditCard;
    default:
      return Box;
  }
};

const getStatusConfig = (status: DeviceStatusRowStatus) => {
  switch (status) {
    case 'connected':
      return {
        label: 'Connected',
        dotColor: 'fill-green-500 text-green-500',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
        badgeBg: 'bg-green-100',
      };
    case 'disconnected':
      return {
        label: 'Offline',
        dotColor: 'fill-gray-400 text-gray-400',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-500',
        iconColor: 'text-gray-400',
        badgeBg: 'bg-gray-100',
      };
    case 'error':
      return {
        label: 'Error',
        dotColor: 'fill-red-500 text-red-500',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
        badgeBg: 'bg-red-100',
      };
    default:
      return {
        label: 'Unknown',
        dotColor: 'fill-gray-400 text-gray-400',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-500',
        iconColor: 'text-gray-400',
        badgeBg: 'bg-gray-100',
      };
  }
};

const formatLastSeen = (lastSeen: string): string => {
  try {
    return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

export function DeviceStatusRow({ name, status, type, lastSeen }: DeviceStatusRowProps) {
  const Icon = getDeviceIcon(type);
  const config = getStatusConfig(status);
  const showLastSeen = (status === 'disconnected' || status === 'error') && lastSeen;

  return (
    <div className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Device icon in colored background */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}
        >
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>

        {/* Device info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {name}
            </span>
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.badgeBg} ${config.textColor}`}
            >
              <Circle className={`w-1.5 h-1.5 ${config.dotColor}`} />
              {config.label}
            </span>
          </div>

          {/* Last seen for offline/error devices */}
          {showLastSeen && (
            <div className="mt-0.5">
              <span className="text-[10px] text-gray-400">
                Last seen {formatLastSeen(lastSeen)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceStatusRow;
