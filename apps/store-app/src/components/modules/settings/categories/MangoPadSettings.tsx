/**
 * Mango Pad Settings
 * Configuration UI for managing Mango Pad connections
 *
 * Part of: Mango Pad Integration (US-012)
 * Updated: Device Pairing System (US-003, US-004)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Tablet,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Server,
  Hash,
  Clock,
  QrCode,
  Copy,
  Monitor,
  Maximize2,
  X,
  Unlink,
  Pencil,
  Check,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { selectStoreId, selectStoreName } from '@/store/slices/authSlice';
import {
  registerDevice,
  formatPairingCode,
  getOrCreateDeviceId,
  getPairedDevices,
  unpairDevice,
  updateStationName,
  type DeviceRegistrationResult,
} from '@/services/deviceRegistration';
import type { SalonDeviceRow } from '@/services/supabase/types';
import {
  selectAllPadDevices,
  selectHasConnectedPad,
  getConnectedPads,
} from '@/store/slices/padDevicesSlice';
import { getCloudBrokerUrl, isMqttEnabled } from '@/services/mqtt/featureFlags';
import { getMqttClient } from '@/services/mqtt/MqttClient';
import { buildTopic, TOPIC_PATTERNS } from '@/services/mqtt/topics';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SettingsSection({
  title,
  icon,
  children,
  action,
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
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'online' | 'offline' | 'testing' }) {
  const config = {
    online: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Online',
    },
    offline: {
      icon: XCircle,
      color: 'text-gray-500',
      bg: 'bg-gray-100',
      label: 'Offline',
    },
    testing: {
      icon: RefreshCw,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      label: 'Testing...',
    },
  };
  const { icon: Icon, color, bg, label } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        bg,
        color
      )}
    >
      <Icon className={cn('w-3 h-3', status === 'testing' && 'animate-spin')} />
      {label}
    </span>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MangoPadSettings() {
  const reduxStoreId = useSelector(selectStoreId);
  const storeName = useSelector(selectStoreName);

  // In dev mode, ALWAYS use VITE_STORE_ID (demo-salon) for consistent pairing with Mango Pad
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
  const envStoreId = import.meta.env.VITE_STORE_ID;
  const storeId = (isDevMode && envStoreId) ? envStoreId : (reduxStoreId || envStoreId || null);
  const allPadDevices = useSelector(selectAllPadDevices);
  const hasConnectedPad = useSelector(selectHasConnectedPad);
  const connectedPads = useSelector(getConnectedPads);

  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  // Device registration state (US-003)
  const [deviceRegistration, setDeviceRegistration] = useState<DeviceRegistrationResult | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // QR code fullscreen modal state (US-004)
  const [showQrFullscreen, setShowQrFullscreen] = useState(false);

  // Paired devices state (US-008, US-011)
  const [pairedDevices, setPairedDevices] = useState<SalonDeviceRow[]>([]);
  const [pairedDevicesLoading, setPairedDevicesLoading] = useState(false);

  // Unpair confirmation modal state (US-012)
  const [deviceToUnpair, setDeviceToUnpair] = useState<SalonDeviceRow | null>(null);
  const [unpairLoading, setUnpairLoading] = useState(false);

  // Editable station name state (US-017)
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false);
  const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);

  // Merge Supabase paired devices with real-time Redux heartbeat status (US-011)
  const pairedDevicesWithRealTimeStatus = useMemo(() => {
    return pairedDevices.map((device) => {
      // Find matching device in Redux state by device_fingerprint (which matches deviceId from heartbeats)
      const reduxDevice = allPadDevices.find((d) => d.id === device.device_fingerprint);

      if (reduxDevice) {
        // Use real-time status from Redux (heartbeats)
        return {
          ...device,
          is_online: reduxDevice.status === 'online',
          last_seen_at: reduxDevice.lastSeen,
          _reduxScreen: reduxDevice.screen, // Add screen info from real-time data
        };
      }

      // No heartbeat received yet - use Supabase data as-is
      return device;
    });
  }, [pairedDevices, allPadDevices]);

  const mqttEnabled = isMqttEnabled();
  const brokerUrl = getCloudBrokerUrl();

  // Generate QR code payload (US-004)
  const qrPayload = useMemo(() => {
    if (!deviceRegistration?.success || !storeId) return null;
    return JSON.stringify({
      type: 'mango-pad-pairing',
      stationId: deviceRegistration.deviceId,
      pairingCode: deviceRegistration.pairingCode,
      salonId: storeId,
      brokerUrl: brokerUrl,
    });
  }, [deviceRegistration, storeId, brokerUrl]);

  // Register this station on mount (US-003)
  useEffect(() => {
    if (storeId && !deviceRegistration) {
      setRegistrationLoading(true);
      registerDevice(storeId)
        .then((result) => {
          setDeviceRegistration(result);
          if (!result.success) {
            console.error('[MangoPadSettings] Device registration failed:', result.error);
          }
        })
        .catch((error) => {
          console.error('[MangoPadSettings] Device registration error:', error);
        })
        .finally(() => {
          setRegistrationLoading(false);
        });
    }
  }, [storeId, deviceRegistration]);

  // Fetch paired devices on mount/storeId change (US-008)
  useEffect(() => {
    if (storeId) {
      setPairedDevicesLoading(true);
      getPairedDevices(storeId)
        .then((devices) => {
          setPairedDevices(devices);
        })
        .catch((error) => {
          console.error('[MangoPadSettings] Failed to fetch paired devices:', error);
        })
        .finally(() => {
          setPairedDevicesLoading(false);
        });
    }
  }, [storeId]);

  // Copy pairing code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!deviceRegistration?.pairingCode) return;

    try {
      await navigator.clipboard.writeText(deviceRegistration.pairingCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('[MangoPadSettings] Failed to copy code:', error);
    }
  }, [deviceRegistration?.pairingCode]);

  const handleTestConnection = useCallback(async () => {
    if (!storeId) {
      setTestStatus('error');
      setTestMessage('No store ID configured');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Sending test message...');

    try {
      const client = getMqttClient();

      if (!client.isConnected()) {
        setTestStatus('error');
        setTestMessage('MQTT client not connected. Check broker URL and try again.');
        return;
      }

      // Get device ID for heartbeat topic
      const deviceId = await getOrCreateDeviceId();
      const testTopic = buildTopic(TOPIC_PATTERNS.DEVICE_HEARTBEAT, { storeId, deviceId });
      await client.publish(testTopic, {
        storeId,
        storeName: storeName || 'Test Store',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        test: true,
      });

      setTestStatus('success');
      setTestMessage('Test message sent successfully! Mango Pad devices should receive it.');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
      }, 5000);
    } catch (error) {
      setTestStatus('error');
      setTestMessage(
        error instanceof Error ? error.message : 'Failed to send test message'
      );
    }
  }, [storeId, storeName]);

  const formatLastSeen = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getScreenLabel = (screen?: string): string => {
    switch (screen) {
      case 'idle':
        return 'Ready';
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

  // Handle unpair device (US-012)
  const handleUnpair = useCallback(async () => {
    if (!deviceToUnpair || !storeId) return;

    setUnpairLoading(true);

    try {
      // 1. Update Supabase to remove pairing
      const result = await unpairDevice(storeId, deviceToUnpair.device_fingerprint);

      if (!result.success) {
        console.error('[MangoPadSettings] Failed to unpair device:', result.error);
        return;
      }

      // 2. Send MQTT notification to the Pad
      try {
        const client = getMqttClient();
        if (client.isConnected()) {
          const unpairTopic = buildTopic(TOPIC_PATTERNS.PAD_UNPAIRED, {
            storeId,
            deviceId: deviceToUnpair.device_fingerprint,
          });
          await client.publish(unpairTopic, {
            stationId: deviceRegistration?.deviceId,
            timestamp: new Date().toISOString(),
            message: 'Device unpaired by store',
          });
          console.log('[MangoPadSettings] Sent unpair notification to Pad');
        }
      } catch (mqttError) {
        // Log but don't fail - MQTT notification is best-effort
        console.warn('[MangoPadSettings] Failed to send unpair notification:', mqttError);
      }

      // 3. Remove device from local state immediately
      setPairedDevices((prev) =>
        prev.filter((d) => d.device_fingerprint !== deviceToUnpair.device_fingerprint)
      );

      console.log('[MangoPadSettings] Successfully unpaired device:', deviceToUnpair.device_fingerprint);
    } catch (error) {
      console.error('[MangoPadSettings] Error unpairing device:', error);
    } finally {
      setUnpairLoading(false);
      setDeviceToUnpair(null);
    }
  }, [deviceToUnpair, storeId, deviceRegistration?.deviceId]);

  // Start editing station name (US-017)
  const handleStartEditName = useCallback(() => {
    setEditedName(deviceRegistration?.stationName || '');
    setIsEditingName(true);
  }, [deviceRegistration?.stationName]);

  // Cancel editing station name (US-017)
  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditedName('');
  }, []);

  // Save station name (US-017)
  const handleSaveStationName = useCallback(async () => {
    if (!storeId) return;

    // Validation: required and max 50 characters
    const trimmedName = editedName.trim();
    if (!trimmedName) {
      return; // Name is required
    }
    if (trimmedName.length > 50) {
      return; // Max 50 characters
    }

    setNameUpdateLoading(true);

    try {
      const result = await updateStationName(storeId, trimmedName);

      if (result.success) {
        // Update local state
        setDeviceRegistration((prev) =>
          prev ? { ...prev, stationName: trimmedName } : prev
        );
        setIsEditingName(false);
        setEditedName('');

        // Show success toast
        setNameUpdateSuccess(true);
        setTimeout(() => setNameUpdateSuccess(false), 3000);

        console.log('[MangoPadSettings] Station name updated to:', trimmedName);
      } else {
        console.error('[MangoPadSettings] Failed to update station name:', result.error);
      }
    } catch (error) {
      console.error('[MangoPadSettings] Error updating station name:', error);
    } finally {
      setNameUpdateLoading(false);
    }
  }, [storeId, editedName]);

  return (
    <div>
      {/* Station Pairing Info (US-003) */}
      <SettingsSection
        title="This Station"
        icon={<Monitor className="w-5 h-5" />}
        action={
          deviceRegistration?.success ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Registered
            </span>
          ) : registrationLoading ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Registering...
            </span>
          ) : null
        }
      >
        <p className="text-sm text-gray-500 mb-6">
          Your station's pairing code for connecting Mango Pad devices.
        </p>

        {registrationLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : deviceRegistration?.success ? (
          <div className="space-y-6">
            {/* Station Name (US-017 - Editable) */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">Station Name</p>
                  {!isEditingName && (
                    <button
                      onClick={handleStartEditName}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Edit station name"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEditingName ? (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter station name"
                      maxLength={50}
                      className={cn(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
                        editedName.trim() === '' ? 'border-red-300' : 'border-gray-300'
                      )}
                      autoFocus
                      disabled={nameUpdateLoading}
                    />
                    {editedName.trim() === '' && (
                      <p className="text-xs text-red-500 mt-1">Station name is required</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {editedName.length}/50 characters
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleSaveStationName}
                        disabled={nameUpdateLoading || editedName.trim() === '' || editedName.length > 50}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                          nameUpdateLoading || editedName.trim() === '' || editedName.length > 50
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        )}
                      >
                        {nameUpdateLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={nameUpdateLoading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 mt-1">
                    {deviceRegistration.stationName}
                  </p>
                )}
              </div>
            </div>

            {/* Success Toast (US-017) */}
            {nameUpdateSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Station name updated</span>
              </div>
            )}

            {/* Pairing Code - Large and Prominent */}
            <div className="p-6 bg-amber-50 rounded-xl border-2 border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Pairing Code</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    codeCopied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-white text-amber-700 hover:bg-amber-100 border border-amber-300'
                  )}
                >
                  {codeCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="text-center py-4">
                <span className="text-5xl font-mono font-bold text-amber-800 tracking-wider">
                  {formatPairingCode(deviceRegistration.pairingCode)}
                </span>
              </div>
              <p className="text-sm text-amber-700 text-center">
                Enter this code on Mango Pad to pair with this station
              </p>
            </div>

            {/* QR Code Section (US-004) */}
            {qrPayload && (
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">QR Code</span>
                  </div>
                  <button
                    onClick={() => setShowQrFullscreen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Full Screen
                  </button>
                </div>
                <div className="flex justify-center py-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <QRCodeSVG
                      value={qrPayload}
                      size={180}
                      level="M"
                      includeMargin={false}
                      bgColor="#FFFFFF"
                      fgColor="#1F2937"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Scan this QR code with Mango Pad for quick pairing
                </p>
              </div>
            )}

            {/* Device ID */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                <Hash className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Device ID</p>
                <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                  {deviceRegistration.deviceId}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-300" />
            <p className="font-medium text-red-600">Registration Failed</p>
            <p className="text-sm mt-1">
              {deviceRegistration?.error || 'Unable to register this station'}
            </p>
          </div>
        )}
      </SettingsSection>

      {/* Paired Devices Section (US-008, US-011) */}
      <SettingsSection
        title="Paired Devices"
        icon={<Tablet className="w-5 h-5" />}
        action={
          pairedDevices.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {pairedDevicesWithRealTimeStatus.filter((d) => d.is_online).length}/{pairedDevices.length} Online
            </span>
          ) : null
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Mango Pad devices that have been paired to this station via pairing code.
          Status updates in real-time via heartbeats.
        </p>

        {pairedDevicesLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : pairedDevices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tablet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No devices paired yet</p>
            <p className="text-sm mt-1">
              Use the pairing code or QR code above to pair Mango Pad devices
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pairedDevicesWithRealTimeStatus.map((device) => {
              const isOnline = device.is_online;
              const screen = '_reduxScreen' in device ? (device as { _reduxScreen?: string })._reduxScreen : undefined;
              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Device Icon with status indicator dot (US-011) */}
                    <div className="relative">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center',
                          isOnline
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        <Tablet className="w-6 h-6" />
                      </div>
                      {/* Status dot indicator - green for online, gray for offline */}
                      <span
                        className={cn(
                          'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                          isOnline ? 'bg-green-500' : 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {device.device_name || 'Mango Pad'}
                        </p>
                        {/* Show current screen if online (US-011) */}
                        {screen && isOnline && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {getScreenLabel(screen)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        ID: ...{device.device_fingerprint.slice(-8)}
                      </p>
                      {/* Show "Last seen: X minutes ago" for offline devices (US-011) */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {isOnline ? (
                          <span className="text-green-600">Connected now</span>
                        ) : (
                          <span>Last seen: {formatLastSeen(device.last_seen_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={isOnline ? 'online' : 'offline'} />
                    {/* Unpair button (US-012) */}
                    <button
                      onClick={() => setDeviceToUnpair(device)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                      title="Unpair this device"
                    >
                      <Unlink className="w-4 h-4" />
                      Unpair
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SettingsSection>

      {/* Mango Pad Connection Settings */}
      <SettingsSection
        title="Mango Pad"
        icon={<Tablet className="w-5 h-5" />}
        action={
          <span className="text-sm text-gray-500">
            {connectedPads.length} connected
          </span>
        }
      >
        <p className="text-sm text-gray-500 mb-6">
          Configure connection settings for Mango Pad customer-facing displays.
        </p>

        {/* Connection Configuration */}
        <div className="space-y-4 mb-6">
          {/* MQTT Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  mqttEnabled
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {mqttEnabled ? (
                  <Wifi className="w-5 h-5" />
                ) : (
                  <WifiOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">MQTT Status</p>
                <p className="text-sm text-gray-500">
                  {mqttEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <StatusBadge status={mqttEnabled ? 'online' : 'offline'} />
          </div>

          {/* Broker URL */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
              <Server className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">MQTT Broker URL</p>
              <p className="text-sm text-gray-500 break-all font-mono mt-1">
                {brokerUrl}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Change via VITE_MQTT_CLOUD_URL environment variable (requires restart)
              </p>
            </div>
          </div>

          {/* Store/Salon ID */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
              <Hash className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">Store ID</p>
              <p className="text-sm text-gray-500 font-mono mt-1">
                {storeId || 'Not configured'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Used for MQTT topic routing: salon/{storeId || '{storeId}'}/pad/*
              </p>
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Test Connection</p>
              <p className="text-sm text-gray-500">
                Send a test message to verify MQTT communication
              </p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !mqttEnabled}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                testStatus === 'testing'
                  ? 'bg-amber-100 text-amber-700 cursor-wait'
                  : mqttEnabled
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Test Result */}
          {testMessage && (
            <div
              className={cn(
                'mt-4 p-3 rounded-lg flex items-start gap-2',
                testStatus === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : testStatus === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              )}
            >
              {testStatus === 'success' ? (
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : testStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />
              )}
              <span className="text-sm">{testMessage}</span>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Connected Pad Devices */}
      <SettingsSection
        title="Connected Pad Devices"
        icon={<Tablet className="w-5 h-5" />}
        action={
          hasConnectedPad ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              {connectedPads.length} Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              <WifiOff className="w-3 h-3" />
              None Connected
            </span>
          )
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Mango Pad devices that have connected to this store.
        </p>

        {allPadDevices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tablet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No Mango Pad devices detected</p>
            <p className="text-sm mt-1">
              Ensure Mango Pad is running and connected to the same MQTT broker
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allPadDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      device.status === 'online'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    <Tablet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{device.name}</p>
                      {device.screen && device.status === 'online' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {getScreenLabel(device.screen)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Device ID: {device.id.slice(-8)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3" />
                      Last seen: {formatLastSeen(device.lastSeen)}
                    </div>
                  </div>
                </div>
                <StatusBadge status={device.status} />
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Devices are automatically detected when they send
            heartbeat messages. A device is marked offline after 30 seconds without
            a heartbeat.
          </p>
        </div>
      </SettingsSection>

      {/* QR Code Fullscreen Modal (US-004) */}
      {showQrFullscreen && qrPayload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowQrFullscreen(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQrFullscreen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Scan to Pair</h2>
              <p className="text-sm text-gray-500 mt-1">
                Point your Mango Pad camera at this QR code
              </p>
            </div>

            {/* Large QR Code */}
            <div className="flex justify-center py-6">
              <div className="p-6 bg-white rounded-xl border-2 border-gray-200 shadow-inner">
                <QRCodeSVG
                  value={qrPayload}
                  size={280}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#1F2937"
                />
              </div>
            </div>

            {/* Pairing Code Fallback */}
            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Or enter this code manually:
              </p>
              <span className="text-2xl font-mono font-bold text-amber-700 tracking-wider">
                {deviceRegistration?.pairingCode
                  ? formatPairingCode(deviceRegistration.pairingCode)
                  : '---'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Unpair Confirmation Modal (US-012) */}
      {deviceToUnpair && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => !unpairLoading && setDeviceToUnpair(null)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Unpair {deviceToUnpair.device_name || 'Mango Pad'}?
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                The device will need to be paired again using the pairing code.
              </p>
            </div>

            {/* Device Info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                  <Tablet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {deviceToUnpair.device_name || 'Mango Pad'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: ...{deviceToUnpair.device_fingerprint.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeviceToUnpair(null)}
                disabled={unpairLoading}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpair}
                disabled={unpairLoading}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {unpairLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Unpairing...
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4" />
                    Unpair Device
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MangoPadSettings;
