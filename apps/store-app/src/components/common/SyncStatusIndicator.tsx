/**
 * Sync Status Indicator
 *
 * Displays the current sync status in a compact indicator.
 * Shows online/offline state, sync progress, and errors.
 */

import { useState } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';

interface SyncStatusIndicatorProps {
  /** Show detailed popup on click */
  showDetails?: boolean;
  /** Compact mode - just icon */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function SyncStatusIndicator({
  showDetails = true,
  compact = false,
  className = '',
}: SyncStatusIndicatorProps) {
  const { isSyncing, isOnline, syncNow, lastSyncAt, error } = useSupabaseSync();
  const [showPopup, setShowPopup] = useState(false);

  // Determine status icon and color
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        label: 'Offline',
      };
    }

    if (isSyncing) {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        label: 'Syncing...',
      };
    }

    if (error) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        label: 'Sync Error',
      };
    }

    return {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      label: 'Synced',
    };
  };

  const status = getStatusDisplay();

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSyncAt) return 'Never';
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Compact mode - just the icon
  if (compact) {
    return (
      <button
        onClick={() => showDetails && setShowPopup(!showPopup)}
        className={`relative p-1 rounded-full ${status.bgColor} ${status.color} ${className}`}
        title={status.label}
      >
        {status.icon}
        {showPopup && showDetails && (
          <SyncPopup
            status={status}
            isOnline={isOnline}
            isSyncing={isSyncing}
            lastSyncAt={formatLastSync()}
            error={error}
            onSync={syncNow}
            onClose={() => setShowPopup(false)}
          />
        )}
      </button>
    );
  }

  // Full mode - icon with label
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => showDetails && setShowPopup(!showPopup)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.color} text-sm font-medium transition-colors hover:opacity-80`}
      >
        {status.icon}
        <span>{status.label}</span>
      </button>

      {showPopup && showDetails && (
        <SyncPopup
          status={status}
          isOnline={isOnline}
          isSyncing={isSyncing}
          lastSyncAt={formatLastSync()}
          error={error}
          onSync={syncNow}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

// Popup component for detailed sync info
interface SyncPopupProps {
  status: { icon: React.ReactNode; color: string; bgColor: string; label: string };
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string;
  error: string | null;
  onSync: () => void;
  onClose: () => void;
}

function SyncPopup({ status, isOnline, isSyncing, lastSyncAt, error, onSync, onClose }: SyncPopupProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 ${status.bgColor} border-b border-gray-100`}>
          <div className="flex items-center gap-2">
            <div className={status.color}>{status.icon}</div>
            <span className={`font-semibold ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Connection status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Connection</span>
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {/* Last sync */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last sync</span>
            <span className="text-gray-900">{lastSyncAt}</span>
          </div>

          {/* Cloud status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cloud</span>
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
              {isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
              <span>{isOnline ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-2 bg-red-50 rounded-md border border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => {
              onSync();
              onClose();
            }}
            disabled={!isOnline || isSyncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default SyncStatusIndicator;
