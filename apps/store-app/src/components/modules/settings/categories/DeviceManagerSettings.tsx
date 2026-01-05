/**
 * Device Manager Settings Category
 * Registered devices, printers, card readers, and hardware management
 */

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Monitor, 
  Printer,
  Smartphone,
  Tablet,
  Laptop,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  MoreVertical,
  Zap
} from 'lucide-react';
import type { AppDispatch } from '@/store';
import {
  selectPaymentTerminals,
  selectHardwareDevices,
  removePaymentTerminal,
  removeHardwareDevice,
  updateTerminalStatus,
  updateDeviceStatus,
} from '@/store/slices/settingsSlice';
import type { PaymentTerminal, HardwareDevice } from '@/types/settings';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SettingsSection({ 
  title, 
  icon, 
  children,
  action
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-600">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'connected' | 'disconnected' | 'error' }) {
  const config = {
    connected: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Connected' },
    disconnected: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Disconnected' },
    error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Error' },
  };
  const { icon: Icon, color, bg, label } = config[status];
  
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', bg, color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function DeviceIcon({ type }: { type: string }) {
  switch (type) {
    case 'ipad':
    case 'android_tablet':
      return <Tablet className="w-5 h-5" />;
    case 'desktop':
      return <Laptop className="w-5 h-5" />;
    case 'printer':
      return <Printer className="w-5 h-5" />;
    default:
      return <Smartphone className="w-5 h-5" />;
  }
}

// =============================================================================
// MOCK DATA (would come from device registry in production)
// =============================================================================

const MOCK_REGISTERED_DEVICES = [
  { 
    id: '1', 
    name: 'Front Desk iPad', 
    type: 'ipad', 
    status: 'active' as const, 
    mode: 'offline-enabled' as const, 
    lastActive: new Date().toISOString(),
    deviceId: 'MANGO-FD-001',
    osVersion: 'iPadOS 17.2',
    appVersion: '2.1.0'
  },
  { 
    id: '2', 
    name: 'Station 2 Tablet', 
    type: 'android_tablet', 
    status: 'active' as const, 
    mode: 'online-only' as const, 
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    deviceId: 'MANGO-ST2-002',
    osVersion: 'Android 14',
    appVersion: '2.1.0'
  },
  { 
    id: '3', 
    name: 'Manager Desktop', 
    type: 'desktop', 
    status: 'inactive' as const, 
    mode: 'online-only' as const, 
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    deviceId: 'MANGO-MGR-003',
    osVersion: 'macOS 14.2',
    appVersion: '2.0.8'
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DeviceManagerSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const terminals = useSelector(selectPaymentTerminals);
  const hardwareDevices = useSelector(selectHardwareDevices);
  // State for add modals (to be implemented)
  const [, setShowAddTerminal] = useState(false);
  const [, setShowAddDevice] = useState(false);

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const handleTestTerminal = (terminalId: string) => {
    dispatch(updateTerminalStatus({ id: terminalId, status: 'connected' }));
  };

  const handleRemoveTerminal = (terminalId: string) => {
    if (confirm('Are you sure you want to remove this terminal?')) {
      dispatch(removePaymentTerminal(terminalId));
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    if (confirm('Are you sure you want to remove this device?')) {
      dispatch(removeHardwareDevice(deviceId));
    }
  };

  return (
    <div>
      {/* Registered POS Devices */}
      <SettingsSection 
        title="Registered POS Devices" 
        icon={<Monitor className="w-5 h-5" />}
        action={
          <span className="text-sm text-gray-500">
            {MOCK_REGISTERED_DEVICES.length} devices
          </span>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Devices authorized to access this store. Manage device access and offline capabilities.
        </p>
        
        <div className="space-y-3">
          {MOCK_REGISTERED_DEVICES.map((device) => (
            <div 
              key={device.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center',
                  device.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                )}>
                  <DeviceIcon type={device.type} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{device.name}</p>
                    {device.mode === 'offline-enabled' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        <Wifi className="w-3 h-3" />
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {device.deviceId} • {device.osVersion} • v{device.appVersion}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last active: {formatLastActive(device.lastActive)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  device.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {device.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Device Limit:</strong> Your current plan allows up to 3 devices. 
            <a href="#" className="underline ml-1">Upgrade</a> for more.
          </p>
        </div>
      </SettingsSection>

      {/* Payment Terminals */}
      <SettingsSection 
        title="Payment Terminals" 
        icon={<Zap className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowAddTerminal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Terminal
          </button>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Card readers and payment terminals connected to this store.
        </p>

        {terminals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No payment terminals configured</p>
            <p className="text-sm">Add a terminal to accept card payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {terminals.map((terminal: PaymentTerminal) => (
              <div 
                key={terminal.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    terminal.connectionStatus === 'connected' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  )}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{terminal.name}</p>
                    <p className="text-sm text-gray-500">
                      {terminal.type.replace(/_/g, ' ').toUpperCase()} 
                      {terminal.terminalId && ` • ${terminal.terminalId}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={terminal.connectionStatus} />
                  <button
                    onClick={() => handleTestTerminal(terminal.id)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Test connection"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleRemoveTerminal(terminal.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove terminal"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Hardware Devices (Printers, Scanners, etc.) */}
      <SettingsSection 
        title="Hardware Devices" 
        icon={<Printer className="w-5 h-5" />}
        action={
          <button
            onClick={() => setShowAddDevice(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Printers, barcode scanners, cash drawers, and other hardware.
        </p>

        {hardwareDevices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Printer className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No hardware devices configured</p>
            <p className="text-sm">Add printers, scanners, or cash drawers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hardwareDevices.map((device: HardwareDevice) => (
              <div 
                key={device.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    device.connectionStatus === 'connected' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  )}>
                    {device.type === 'printer' && <Printer className="w-5 h-5" />}
                    {device.type === 'cash_drawer' && <Settings className="w-5 h-5" />}
                    {device.type === 'scanner' && <Settings className="w-5 h-5" />}
                    {device.type === 'card_reader' && <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{device.name}</p>
                    <p className="text-sm text-gray-500">
                      {device.type.replace(/_/g, ' ')} • {device.connectionType}
                      {device.model && ` • ${device.model}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={device.connectionStatus} />
                  <button
                    onClick={() => dispatch(updateDeviceStatus({ id: device.id, status: 'connected' }))}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Test connection"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove device"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Device Mode Settings */}
      <SettingsSection title="Device Mode" icon={<Wifi className="w-5 h-5" />}>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Wifi className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Offline-Enabled Mode</p>
              <p className="text-sm text-blue-700 mt-1">
                Data is stored locally and syncs when online. Ideal for primary POS devices.
                Requires initial data download (~5-30 seconds).
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <WifiOff className="w-6 h-6 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Online-Only Mode</p>
              <p className="text-sm text-gray-600 mt-1">
                All data fetched from server in real-time. Faster login but requires constant internet.
                Best for secondary devices or staff personal devices.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Device mode is set during device registration. Contact support to change mode for existing devices.
        </p>
      </SettingsSection>
    </div>
  );
}

export default DeviceManagerSettings;
