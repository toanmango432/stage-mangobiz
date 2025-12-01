/**
 * Device Mode Indicator
 *
 * Shows the current device mode (online-only or offline-enabled)
 * in the header or status bar.
 */

import { useState } from 'react';
import { Cloud, CloudOff, Monitor, RefreshCw, AlertTriangle } from 'lucide-react';
import { useModeAwareSync } from '@/hooks/useSync';

interface DeviceModeIndicatorProps {
  /** Show compact version (just icon) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function DeviceModeIndicator({ compact = false, className = '' }: DeviceModeIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const {
    isOnline,
    isSyncing,
    syncEnabled,
    deviceMode,
    pendingOperations,
    statusMessage,
    canWorkOffline,
    syncNow,
  } = useModeAwareSync();

  // Determine icon and color based on state
  const getStatusConfig = () => {
    if (!isOnline && !canWorkOffline) {
      // Offline and can't work offline - critical
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'No Connection',
      };
    }

    if (!isOnline && canWorkOffline) {
      // Offline but can work offline
      return {
        icon: CloudOff,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: 'Offline Mode',
      };
    }

    if (isSyncing) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Syncing',
        animate: true,
      };
    }

    if (deviceMode === 'online-only') {
      return {
        icon: Cloud,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Online',
      };
    }

    // Offline-enabled and online
    return {
      icon: Monitor,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      label: 'Offline-Enabled',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Compact view - just icon
  if (compact) {
    return (
      <div
        className={`relative cursor-pointer ${className}`}
        onClick={() => setShowDetails(!showDetails)}
        title={statusMessage}
      >
        <Icon
          className={`w-5 h-5 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
        {pendingOperations > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {pendingOperations > 9 ? '9+' : pendingOperations}
          </span>
        )}

        {/* Dropdown details */}
        {showDetails && (
          <div
            className={`absolute top-full right-0 mt-2 w-64 p-4 rounded-lg shadow-lg border ${config.bgColor} ${config.borderColor} z-50`}
            onClick={(e) => e.stopPropagation()}
          >
            <DeviceModeDetails
              config={config}
              isOnline={isOnline}
              isSyncing={isSyncing}
              syncEnabled={syncEnabled}
              deviceMode={deviceMode}
              pendingOperations={pendingOperations}
              statusMessage={statusMessage}
              onSyncNow={syncNow}
            />
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer ${config.bgColor} border ${config.borderColor} ${className}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <Icon
        className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
      />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
      {pendingOperations > 0 && (
        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
          {pendingOperations}
        </span>
      )}

      {/* Dropdown details */}
      {showDetails && (
        <div
          className={`absolute top-full right-0 mt-2 w-72 p-4 rounded-lg shadow-lg border bg-white z-50`}
          onClick={(e) => e.stopPropagation()}
        >
          <DeviceModeDetails
            config={config}
            isOnline={isOnline}
            isSyncing={isSyncing}
            syncEnabled={syncEnabled}
            deviceMode={deviceMode}
            pendingOperations={pendingOperations}
            statusMessage={statusMessage}
            onSyncNow={syncNow}
          />
        </div>
      )}
    </div>
  );
}

// Details dropdown content
interface DeviceModeDetailsProps {
  config: {
    icon: any;
    color: string;
    label: string;
  };
  isOnline: boolean;
  isSyncing: boolean;
  syncEnabled: boolean;
  deviceMode: string | null;
  pendingOperations: number;
  statusMessage: string;
  onSyncNow: () => Promise<any>;
}

function DeviceModeDetails({
  config,
  isOnline,
  isSyncing,
  syncEnabled,
  deviceMode,
  pendingOperations,
  statusMessage,
  onSyncNow,
}: DeviceModeDetailsProps) {
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className="font-semibold text-gray-900">{config.label}</span>
      </div>

      {/* Status message */}
      <p className="text-sm text-gray-600">{statusMessage}</p>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Device Mode:</span>
          <span className="font-medium text-gray-900">
            {deviceMode === 'offline-enabled' ? 'Offline-Enabled' : 'Online-Only'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Connection:</span>
          <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {syncEnabled && (
          <div className="flex justify-between">
            <span className="text-gray-500">Pending Sync:</span>
            <span className="font-medium text-gray-900">
              {pendingOperations} {pendingOperations === 1 ? 'change' : 'changes'}
            </span>
          </div>
        )}
      </div>

      {/* Sync button */}
      {syncEnabled && isOnline && pendingOperations > 0 && (
        <button
          onClick={() => onSyncNow()}
          disabled={isSyncing}
          className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </>
          )}
        </button>
      )}

      {/* Mode explanation */}
      <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
        {deviceMode === 'offline-enabled' ? (
          <p>This device stores data locally and syncs when online.</p>
        ) : (
          <p>This device requires an internet connection to operate.</p>
        )}
      </div>
    </div>
  );
}

export default DeviceModeIndicator;
