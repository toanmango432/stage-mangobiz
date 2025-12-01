/**
 * Offline Indicator
 *
 * Shows sync status and offline mode information.
 * Updated for opt-in offline mode.
 */

import { useEffect, useState } from 'react';
import { useModeAwareSync } from '../hooks/useSync';
import { getDBStats } from '../db/database';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check } from 'lucide-react';

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    syncEnabled,
    deviceMode,
    pendingOperations: reduxPendingOps,
    lastSyncAt: reduxLastSyncAt,
    statusMessage,
    canWorkOffline,
    syncNow,
  } = useModeAwareSync();

  const [showDetails, setShowDetails] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);

  // Poll DB stats every 5 seconds (only if sync is enabled)
  useEffect(() => {
    if (!syncEnabled) {
      setPendingOps(0);
      return;
    }

    const updateStats = async () => {
      try {
        const stats = await getDBStats();
        setPendingOps(stats.pendingSync);
      } catch {
        // Database might not be initialized in online-only mode
        setPendingOps(reduxPendingOps);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [syncEnabled, reduxPendingOps]);

  const handleSyncNow = async () => {
    await syncNow();
  };

  const formatLastSync = (timestamp: Date | null) => {
    if (!timestamp) return 'Never';

    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Determine what to show based on mode
  const getIndicatorConfig = () => {
    // Online-only mode - show minimal indicator or nothing
    if (deviceMode === 'online-only' || !syncEnabled) {
      if (!isOnline) {
        // Critical: Online-only device is offline
        return {
          show: true,
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          dotColor: 'bg-red-500',
          title: 'No Connection',
          subtitle: 'Internet required to continue',
        };
      }
      // Online-only and connected - don't show indicator
      return { show: false };
    }

    // Offline-enabled mode
    if (!isOnline) {
      return {
        show: true,
        icon: CloudOff,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        dotColor: 'bg-amber-500',
        title: 'Offline Mode',
        subtitle: pendingOps > 0 ? `${pendingOps} changes pending` : 'Working offline',
      };
    }

    if (isSyncing) {
      return {
        show: true,
        icon: RefreshCw,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        dotColor: 'bg-blue-500',
        title: 'Syncing...',
        subtitle: `${pendingOps} changes`,
        animate: true,
      };
    }

    if (pendingOps > 0) {
      return {
        show: true,
        icon: Cloud,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        dotColor: 'bg-yellow-500',
        title: 'Pending Sync',
        subtitle: `${pendingOps} changes to sync`,
      };
    }

    // All synced - don't show
    return { show: false };
  };

  const config = getIndicatorConfig();

  if (!config.show) {
    return null;
  }

  const Icon = config.icon!;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`rounded-lg shadow-lg p-4 cursor-pointer transition-all ${config.bgColor} border ${config.borderColor}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Compact View */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${config.dotColor} ${config.animate ? '' : 'animate-pulse'}`} />
          <Icon className={`w-4 h-4 text-gray-600 ${config.animate ? 'animate-spin' : ''}`} />
          <div>
            <div className="font-semibold text-sm text-gray-900">{config.title}</div>
            {config.subtitle && (
              <div className="text-xs text-gray-600">{config.subtitle}</div>
            )}
          </div>
          <button
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Connection:</span>
                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Device Mode:</span>
                <span className="font-medium text-gray-900">
                  {deviceMode === 'offline-enabled' ? 'Offline-Enabled' : 'Online-Only'}
                </span>
              </div>
              {syncEnabled && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium">{pendingOps} changes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium">{formatLastSync(reduxLastSyncAt)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Sync button */}
            {syncEnabled && isOnline && pendingOps > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSyncNow();
                }}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
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

            {/* Status messages */}
            {!isOnline && canWorkOffline && (
              <div className="p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Working Offline</strong>
                  <br />
                  Changes are saved locally and will sync when connection is restored.
                </p>
              </div>
            )}

            {!isOnline && !canWorkOffline && (
              <div className="p-3 bg-red-100 rounded-lg">
                <p className="text-xs text-red-800">
                  <strong>Connection Required</strong>
                  <br />
                  This device requires internet to operate. Please check your connection.
                </p>
              </div>
            )}

            {isOnline && pendingOps === 0 && syncEnabled && (
              <div className="p-3 bg-green-100 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-800 font-medium">All changes synced</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
