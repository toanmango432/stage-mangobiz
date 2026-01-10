/**
 * Mango Pad Settings
 * Configuration UI for managing Mango Pad connections
 * 
 * Part of: Mango Pad Integration (US-012)
 */

import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { selectStoreId, selectStoreName } from '@/store/slices/authSlice';
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
  const storeId = useSelector(selectStoreId);
  const storeName = useSelector(selectStoreName);
  const allPadDevices = useSelector(selectAllPadDevices);
  const hasConnectedPad = useSelector(selectHasConnectedPad);
  const connectedPads = useSelector(getConnectedPads);

  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  const mqttEnabled = isMqttEnabled();
  const brokerUrl = getCloudBrokerUrl();

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

      const testTopic = buildTopic(TOPIC_PATTERNS.POS_HEARTBEAT, { storeId });
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

  return (
    <div>
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
    </div>
  );
}

export default MangoPadSettings;
